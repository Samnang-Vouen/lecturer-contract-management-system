import fs from 'fs';
import path from 'path';
import puppeteer from 'puppeteer';
import { fileURLToPath } from 'url';
import {
  TeachingContract,
  TeachingContractCourse,
  User,
  LecturerProfile,
  ClassModel,
  ContractItem,
  Department,
  Course,
} from '../model/index.js';
import sequelize from '../config/db.js';
import Candidate from '../model/candidate.model.js';
import multer from 'multer';
import {
  HTTP_STATUS,
  PAGINATION_DEFAULT_LIMIT,
  PAGINATION_MAX_LIMIT,
  CONTRACT_STATUS_ALIAS_MAP,
} from '../config/constants.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function toKhmerDigits(str) {
  const map = ['០', '១', '២', '៣', '៤', '៥', '៦', '៧', '៨', '៩'];
  return String(str).replace(/[0-9]/g, (d) => map[d]);
}

// Normalize various input shapes (array, JSON string, newline-separated string) into an array of non-empty strings
function normalizeItems(input) {
  try {
    if (!input) return [];
    if (Array.isArray(input)) {
      return input.map((v) => String(v ?? '').trim()).filter(Boolean);
    }
    if (typeof input === 'string') {
      const s = input.trim();
      if (!s) return [];
      // Try parsing JSON first (e.g., "[\"a\",\"b\"]")
      try {
        const parsed = JSON.parse(s);
        return normalizeItems(parsed);
      } catch {}
      // Fallback: split by newlines or common delimiters/bullets
      return s
        .split(/\r?\n|;|,|•|·|\u2022|\u25CF|\u25A0/)
        .map((v) => v.trim().replace(/^[-–—]\s*/, '')) // strip leading dashes
        .filter(Boolean);
    }
    if (typeof input === 'object') {
      // Accept { items: ... } or { duties: ... }
      if ('items' in input) return normalizeItems(input.items);
      if ('duties' in input) return normalizeItems(input.duties);
    }
  } catch {}
  return [];
}

function loadTemplate(name) {
  const filePath = path.join(process.cwd(), 'src', 'utils', name);
  return fs.readFileSync(filePath, 'utf8');
}

function embedLogo(html) {
  const logoPath = path.join(process.cwd(), 'src', 'utils', 'cadt_logo.png');
  let base64 = '';
  try {
    base64 = fs.readFileSync(logoPath, 'base64');
  } catch {
    base64 = '';
  }
  return html.replace('src="cadt_logo.png"', `src="data:image/png;base64,${base64}"`);
}

// Convert an image file to an <img> tag HTML or empty string if missing
function signatureTag(filePath) {
  try {
    if (!filePath) return '';
    if (!fs.existsSync(filePath)) return '';
    const ext = path.extname(filePath).toLowerCase();
    const mime = ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg' : 'image/png';
    const base64 = fs.readFileSync(filePath, 'base64');
    // constrain size for layout
    return `<img src="data:${mime};base64,${base64}" style="max-height:70px; max-width:220px;" />`;
  } catch {
    return '';
  }
}

// Resolve department id for admin/management user; returns null for other roles or missing department
async function resolveManagerDeptId(req) {
  try {
    const role = (req.user?.role || '').toLowerCase();
    if ((role === 'admin' || role === 'management') && req.user.department_name) {
      const dept = await Department.findOne({ where: { dept_name: req.user.department_name } });
      return dept ? dept.id : null;
    }
  } catch {}
  return null;
}

// Check if a contract belongs to the manager's department (at least one course in that department)
async function isContractInManagerDept(contractId, req) {
  const deptId = await resolveManagerDeptId(req);
  if (!deptId) return true; // not an admin or no department restriction
  const count = await TeachingContractCourse.count({
    where: { contract_id: contractId },
    include: [{ model: Course, attributes: [], required: true, where: { dept_id: deptId } }],
  });
  return count > 0;
}

export async function createDraftContract(req, res) {
  try {
    const { lecturer_user_id, academic_year, term, year_level, start_date, end_date } = req.body;
    const coursesIn = Array.isArray(req.body?.courses) ? req.body.courses : [];
    const normalizedItems = normalizeItems(req.body?.items);

    // Basic validation
    const errors = [];
    if (!lecturer_user_id) errors.push('lecturer_user_id is required');
    if (!academic_year) errors.push('academic_year is required');
    if (!term && term !== 0) errors.push('term is required');
    if (!coursesIn.length) errors.push('at least one course is required');
    if (errors.length) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({ message: 'Validation error', errors });
    }

    // Sanitize courses and ensure required fields per course
    const courses = coursesIn
      .map((c) => ({
        course_id: c?.course_id ?? null,
        class_id: c?.class_id ?? null,
        course_name: c?.course_name ?? '',
        year_level: c?.year_level ?? null,
        term: c?.term ?? term,
        academic_year: c?.academic_year ?? academic_year,
        hours: Number.isFinite(Number(c?.hours)) ? Number(c.hours) : null,
      }))
      .filter((c) => (c.course_name && c.course_id != null) || c.course_id != null);
    if (!courses.length) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        message: 'Validation error',
        errors: ['courses are malformed (need course_id and course_name)'],
      });
    }

    // Parse dates to DATEONLY (YYYY-MM-DD) if provided
    const toDateOnly = (v) => {
      if (!v) return null;
      try {
        const d = new Date(v);
        if (isNaN(d.getTime())) return null;
        return d.toISOString().slice(0, 10);
      } catch {
        return null;
      }
    };
    const parsedLecturerId = parseInt(lecturer_user_id, 10);
    if (!Number.isInteger(parsedLecturerId)) {
      return res
        .status(HTTP_STATUS.BAD_REQUEST)
        .json({ message: 'Validation error', errors: ['lecturer_user_id must be an integer'] });
    }
    // Admins: ensure all provided courses belong to their department
    if (req.user?.role === 'admin') {
      const deptId = await resolveManagerDeptId(req);
      if (!deptId)
        return res
          .status(HTTP_STATUS.FORBIDDEN)
          .json({ message: 'Access denied: department not set for your account' });
      const ids = Array.from(
        new Set(courses.map((c) => parseInt(c.course_id, 10)).filter((n) => Number.isInteger(n)))
      );
      if (!ids.length)
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          message: 'Validation error',
          errors: ['courses must reference valid course_id values'],
        });
      const okCount = await Course.count({ where: { id: ids, dept_id: deptId } });
      if (okCount !== ids.length) {
        return res
          .status(HTTP_STATUS.FORBIDDEN)
          .json({ message: 'You can only create contracts with courses from your department' });
      }
    }

    // Create everything within a transaction to avoid partial writes
    const tx = await sequelize.transaction();
    try {
      const contract = await TeachingContract.create(
        {
          lecturer_user_id: parsedLecturerId,
          academic_year,
          term,
          year_level: year_level || null,
          start_date: toDateOnly(start_date),
          end_date: toDateOnly(end_date),
          created_by: req.user.id,
          items: normalizedItems,
        },
        { transaction: tx }
      );

      for (const c of courses) {
        try {
          const cid = Number.isFinite(Number(c.course_id)) ? Number(c.course_id) : null;
          await TeachingContractCourse.create(
            {
              contract_id: contract.id,
              course_id: cid,
              class_id: c.class_id || null,
              course_name: c.course_name,
              year_level: c.year_level || null,
              term: c.term,
              academic_year: c.academic_year,
              hours: c.hours,
            },
            { transaction: tx }
          );
        } catch (rowErr) {
          console.error('[createDraftContract] course row failed', {
            contract_id: contract.id,
            row: c,
            error: rowErr?.message,
            sql: rowErr?.original?.sqlMessage,
          });
          throw rowErr;
        }
      }

      if (normalizedItems.length) {
        const rows = normalizedItems.map((text) => ({ contract_id: contract.id, duties: text }));
        await ContractItem.bulkCreate(rows, { transaction: tx });
      }

      await tx.commit();
      return res.status(HTTP_STATUS.CREATED).json({ id: contract.id });
    } catch (innerErr) {
      try {
        await tx.rollback();
      } catch {}
      // Map common Sequelize errors to 400 with details
      const name = innerErr?.name || '';
      const sqlMsg = innerErr?.original?.sqlMessage || innerErr?.message || '';
      if (
        /Sequelize(Validation|UniqueConstraint|ForeignKeyConstraint)Error/.test(name) ||
        /FOREIGN KEY|constraint|cannot be null|duplicate/i.test(sqlMsg)
      ) {
        return res
          .status(HTTP_STATUS.BAD_REQUEST)
          .json({ message: 'Validation error', errors: [sqlMsg || name] });
      }
      // Unknown error -> bubble to outer catch for 500
      throw innerErr;
    }
  } catch (e) {
    console.error('[createDraftContract]', e);
    return res
      .status(HTTP_STATUS.SERVER_ERROR)
      .json({ message: 'Failed to create draft', error: e.message });
  }
}

export async function getContract(req, res) {
  try {
    const id = parseInt(req.params.id, 10);
    const contract = await TeachingContract.findByPk(id, {
      include: [
        { 
          model: TeachingContractCourse, 
          as: 'courses',
          include: [
            {
              model: Course,
              required: false,
              attributes: ['id', 'dept_id', 'course_code', 'course_name'],
              include: [{ model: Department, required: false, attributes: ['id', 'dept_name'] }],
            },
          ],
        },
        {
          model: User,
          as: 'lecturer',
          attributes: ['id', 'email', 'display_name', 'department_name'],
          include: [{ model: LecturerProfile, attributes: ['title', 'full_name_english', 'full_name_khmer', 'position'], required: false }],
        },
      ],
    });
    if (!contract) return res.status(HTTP_STATUS.NOT_FOUND).json({ message: 'Not found' });
    // Admin/Management access control: only contracts with at least one course in their department
    if (['admin', 'management'].includes(String(req.user?.role).toLowerCase())) {
      const ok = await isContractInManagerDept(contract.id, req);
      if (!ok) return res.status(HTTP_STATUS.FORBIDDEN).json({ message: 'Access denied' });
    }
    return res.json(contract);
  } catch (e) {
    console.error('[getContract]', e);
    return res
      .status(HTTP_STATUS.SERVER_ERROR)
      .json({ message: 'Failed to get contract', error: e.message });
  }
}

// List contracts with filters and pagination
export async function listContracts(req, res) {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    // Use centralized pagination constants
    const limit = Math.min(
      parseInt(req.query.limit, 10) || PAGINATION_DEFAULT_LIMIT,
      PAGINATION_MAX_LIMIT
    );
    const offset = (page - 1) * limit;
    const { academic_year, term, status, q } = req.query;

    const where = {};
    if (academic_year) where.academic_year = academic_year;
    if (term) where.term = term;
    if (status) {
      const s = String(status).toUpperCase();
      where.status = CONTRACT_STATUS_ALIAS_MAP[s] || s;
    }

    // Role-based scoping: lecturers only see their own contracts
    const role = req.user?.role;
    if (role === 'lecturer') {
      where.lecturer_user_id = req.user.id;
    }

    // We'll use include joins for admin scoping instead of raw EXISTS to avoid alias issues
    const Sequelize = (await import('sequelize')).default;

    const include = [
      {
        model: TeachingContractCourse,
        as: 'courses',
        include: [
          {
            model: Course,
            required: false,
            attributes: ['id', 'dept_id', 'course_code', 'course_name'],
            include: [{ model: Department, required: false, attributes: ['id', 'dept_name'] }],
          },
        ],
      },
      {
        model: User,
        as: 'lecturer',
        attributes: ['id', 'email', 'display_name', 'department_name'],
        include: [{ model: LecturerProfile, attributes: ['title', 'full_name_english', 'full_name_khmer', 'position'], required: false }],
      },
    ];

    // If admin, require at least one course in their department and only return those course rows
    if (role === 'admin' || role === 'management') {
      const deptId = await resolveManagerDeptId(req);
      if (!deptId) {
        return res.json({ data: [], page, limit, total: 0 });
      }
      include[0] = {
        model: TeachingContractCourse,
        as: 'courses',
        required: true,
        include: [
          {
            model: Course,
            required: true,
            where: { dept_id: deptId },
            attributes: ['id', 'dept_id', 'course_code', 'course_name'],
            include: [{ model: Department, required: false, attributes: ['id', 'dept_name'] }],
          },
        ],
      };
    }

    // Basic text search on lecturer fields
    if (q) {
      // Keep lecturer include optional and apply where via literal on joined alias to avoid subquery complications
      include[1].required = false;
      const like = `%${q}%`;
      where[Sequelize.Op.and] = [
        ...(where[Sequelize.Op.and] || []),
        Sequelize.literal(`(
          EXISTS (
            SELECT 1 FROM Users AS lecturer
            JOIN LecturerProfiles AS LecturerProfile ON LecturerProfile.user_id = lecturer.id
            WHERE lecturer.id = Teaching_Contracts.lecturer_user_id
              AND (lecturer.display_name LIKE ${sequelize.escape(like)} OR lecturer.email LIKE ${sequelize.escape(like)})
          )
        )`),
      ];
    }

    // When using required includes, count can be inflated; use distinct
    const { rows, count } = await TeachingContract.findAndCountAll({
      where,
      include,
      limit,
      offset,
      distinct: true,
      subQuery: false,
      order: [['created_at', 'DESC']],
    });

    // For management/admin, attach hourlyRateThisYear (USD) from contract or Candidate profile
    let data = rows;
    try {
      const role2 = req.user?.role;
      if (['admin', 'management', 'superadmin'].includes(role2)) {
        const enriched = [];
        for (const row of rows) {
          const plain = row.toJSON();
          let hourlyRateUsd = null;
          
          // First, check if the contract itself has an hourly_rate
          if (plain.hourly_rate != null && plain.hourly_rate !== '') {
            const contractRate = parseFloat(String(plain.hourly_rate));
            if (Number.isFinite(contractRate)) {
              hourlyRateUsd = contractRate;
              console.log(`[listContracts enrichment] Using contract hourly_rate: ${hourlyRateUsd}`);
            }
          }
          
          // If no rate in contract, try to find from Candidate profile
          if (hourlyRateUsd === null) {
            try {
              const displayName = plain?.lecturer?.display_name || '';
              let cand = null;
              console.log(`[listContracts enrichment] Looking up rate for: "${displayName}"`);
              
              if (displayName) {
                const Sequelize2 = (await import('sequelize')).default;
                // Try first with the full display name (including title)
                cand = await Candidate.findOne({
                  where: Sequelize2.where(
                    Sequelize2.fn('LOWER', Sequelize2.fn('TRIM', Sequelize2.col('fullName'))),
                    displayName.toLowerCase().trim()
                  ),
                });
                
                // If not found, try without title
                if (!cand) {
                  const titleRegex = /^(mr\.?|ms\.?|mrs\.?|dr\.?|prof\.?|professor|miss)\s+/i;
                  const cleanedName = displayName.replace(titleRegex, '').replace(/\s+/g, ' ').trim();
                  if (cleanedName !== displayName) {
                    console.log(`[listContracts enrichment] Trying without title: "${cleanedName}"`);
                    cand = await Candidate.findOne({
                      where: Sequelize2.where(
                        Sequelize2.fn('LOWER', Sequelize2.fn('TRIM', Sequelize2.col('fullName'))),
                        cleanedName.toLowerCase()
                      ),
                    });
                  }
                }
              }
              
              if (!cand && plain?.lecturer?.email) {
                console.log(`[listContracts enrichment] Name lookup failed, trying email: ${plain.lecturer.email}`);
                cand = await Candidate.findOne({ where: { email: plain.lecturer.email } });
              }
              if (cand && cand.hourlyRate != null) {
                const parsed = parseFloat(String(cand.hourlyRate).replace(/[^0-9.]/g, ''));
                hourlyRateUsd = Number.isFinite(parsed) ? parsed : null;
                console.log(`[listContracts enrichment] Found candidate (id: ${cand.id}), hourlyRate: ${cand.hourlyRate} -> parsed: ${hourlyRateUsd}`);
              } else {
                console.log(`[listContracts enrichment] No candidate found or hourlyRate is null`);
              }
            } catch (rateErr) {
              console.error(`[listContracts enrichment] Error:`, rateErr.message);
            }
          }
          
          plain.hourlyRateThisYear = hourlyRateUsd;
          enriched.push(plain);
        }
        data = enriched;
      } else {
        console.log(`[listContracts] Skipping enrichment for role: ${role2}`);
      }
    } catch (enrichErr) {
      // If enrichment fails, fall back to raw rows
      data = rows;
    }

    return res.json({ data, page, limit, total: count });
  } catch (e) {
    console.error('[listContracts]', e);
    return res.status(HTTP_STATUS.SERVER_ERROR).json({ message: 'Failed to list contracts', error: e.message });
  }
}

export async function generatePdf(req, res) {
  try {
    const id = parseInt(req.params.id, 10);
    const contract = await TeachingContract.findByPk(id, {
      include: [
        {
          model: TeachingContractCourse,
          as: 'courses',
          include: [{ model: ClassModel, attributes: ['name', 'year_level'], required: false }],
        },
        {
          model: User,
          as: 'lecturer',
          attributes: ['id', 'email', 'display_name', 'department_name'],
          include: [
            {
              model: LecturerProfile,
              attributes: ['title', 'full_name_khmer', 'position'],
              required: false,
            },
          ],
        },
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'email', 'display_name', 'department_name'],
        },
        { model: ContractItem, as: 'contractItems', required: false },
      ],
    });
    if (!contract) return res.status(HTTP_STATUS.NOT_FOUND).json({ message: 'Not found' });
    // Admin/Management access control
    if (['admin', 'management'].includes(String(req.user?.role).toLowerCase())) {
      const ok = await isContractInManagerDept(contract.id, req);
      if (!ok) return res.status(HTTP_STATUS.FORBIDDEN).json({ message: 'Access denied' });
    }

    let htmlEn = loadTemplate('lecturer_contract.html');
    let htmlKh = loadTemplate('khmer_contract.html');
    const titleRaw = contract.lecturer?.LecturerProfile?.title || null;
    const titleEnMap = { Mr: 'Mr.', Ms: 'Ms.', Mrs: 'Mrs.', Dr: 'Dr.', Prof: 'Prof.' };
    const titleKhMap = {
      Mr: 'លោក',
      Ms: 'កញ្ញា',
      Mrs: 'លោកស្រី',
      Dr: 'ឌុកទ័រ',
      Prof: 'សាស្ត្រាចារ្យ',
    };
    const enPrefix = titleRaw && titleEnMap[titleRaw] ? `${titleEnMap[titleRaw]} ` : '';
    const khPrefix = titleRaw && titleKhMap[titleRaw] ? `${titleKhMap[titleRaw]} ` : '';
    const baseName = contract.lecturer?.display_name || contract.lecturer?.email || 'Lecturer';
    const displayName = contract.lecturer?.display_name || '';
    const lecturerNameEn = displayName ? `${enPrefix}${displayName}` : baseName;
    // Khmer name: use only Khmer full name from LecturerProfile (no fallback to English)
    const khFullName = contract.lecturer?.LecturerProfile?.full_name_khmer || '';
    const lecturerNameKh = khFullName ? `${khPrefix}${khFullName}` : '';
    // Position (EN and KH)
    const positionEn = contract.lecturer?.LecturerProfile?.position || 'Lecturer';
    const posNorm = String(positionEn || '')
      .trim()
      .toLowerCase();
    const khMap = {
      lecturer: 'សាស្ត្រាចារ្យ',
      'assistant lecturer': 'សាស្ត្រាចារ្យជំនួយ',
      'senior lecturer': 'សាស្ត្រាចារ្យជាន់ខ្ពស់',
      advisor: 'អ្នកប្រឹក្សា',
      adviser: 'អ្នកប្រឹក្សា',
      'adjunct lecturer': 'សាស្ត្រាចារ្យបន្ថែម',
      'visiting lecturer': 'សាស្ត្រាចារ្យអាគន្ដុកៈ',
      'teaching assistant': 'សាស្ត្រាចារ្យជំនួយ',
      'teaching assistant (ta)': 'សាស្ត្រាចារ្យជំនួយ',
      ta: 'សាស្ត្រាចារ្យជំនួយ',
    };
    let positionKh = khMap[posNorm];
    if (!positionKh) {
      if (/teaching\s*assistant|assistant\s*lecturer|^ta$/.test(posNorm))
        positionKh = 'សាស្ត្រាចារ្យជំនួយ';
    }
    if (!positionKh) positionKh = 'សាស្ត្រាចារ្យ';
    const startDate = (contract.start_date ? new Date(contract.start_date) : new Date())
      .toISOString()
      .slice(0, 10);
    const subject = contract.courses[0]?.course_name || 'Course';
    const hours = contract.courses.reduce((a, c) => a + (c.hours || 0), 0) || 0;

    // Lookup hourly rate (USD) from Candidate profile by name or email
    let hourlyRateUsd = 0;
    try {
      const titleRegex = /^(mr\.?|ms\.?|mrs\.?|dr\.?|prof\.?|professor|miss)\s+/i;
      const normalizeName = (s = '') =>
        String(s).trim().replace(titleRegex, '').replace(/\s+/g, ' ').trim();
      const rawName = contract.lecturer?.display_name || '';
      const cleanedName = normalizeName(rawName);
      let cand = null;
      if (cleanedName) {
        const Sequelize = (await import('sequelize')).default;
        cand = await Candidate.findOne({
          where: Sequelize.where(
            Sequelize.fn('LOWER', Sequelize.fn('TRIM', Sequelize.col('fullName'))),
            cleanedName.toLowerCase()
          ),
        });
      }
      if (!cand && contract.lecturer?.email) {
        cand = await Candidate.findOne({ where: { email: contract.lecturer.email } });
      }
      if (cand && cand.hourlyRate != null) {
        const parsed = parseFloat(String(cand.hourlyRate).replace(/[^0-9.]/g, ''));
        hourlyRateUsd = Number.isFinite(parsed) ? parsed : 0;
      }
    } catch (rateErr) {
      console.warn('[generatePdf] hourly rate lookup failed:', rateErr.message);
    }

    const totalUsd = (hours || 0) * (hourlyRateUsd || 0);
    const usdToKhr = parseFloat(process.env.USD_TO_KHR || process.env.EXCHANGE_RATE_KHR || '4100');
    const totalKhr = Math.round(
      (Number.isFinite(totalUsd) ? totalUsd : 0) * (Number.isFinite(usdToKhr) ? usdToKhr : 4100)
    );
    const monthlyKhr = Math.round(totalKhr / 3);

    // Build generation/class string: "Class Name (Year Level)"
    const firstCourse = contract.courses?.find((c) => c?.Class) || contract.courses?.[0] || null;
    const className = firstCourse?.Class?.name || '';
    const yearLevel =
      firstCourse?.year_level || firstCourse?.Class?.year_level || contract.year_level || '';
    const genEn =
      className && yearLevel ? `${className} (${yearLevel})` : className || yearLevel || '';

    const deptName =
      contract?.creator?.department_name || contract?.lecturer?.department_name || '';

    // Build dynamic items rows (EN)
    // Prefer relational items from contract_items, fallback to JSON column
    let items = [];
    try {
      const itemRows = await ContractItem.findAll({
        where: { contract_id: contract.id },
        order: [['id', 'ASC']],
      });
      items = itemRows.map((r) => r.duties).filter(Boolean);
    } catch {}
    if (!items.length) {
      items = normalizeItems(contract.items);
    }
    const enRows = (items.length ? items : [])
      .map((text, idx) => {
        const safe = String(text || '').replace(
          /[&<>]/g,
          (s) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[s]
        );
        return `<tr>\n  <td style="width:40px; text-align:center; color:#003366; font-weight:bold;">${idx + 1}</td>\n  <td>${safe}</td>\n</tr>`;
      })
      .join('\n');

    const lecturerSig = signatureTag(contract.lecturer_signature_path);
    const managementSig = signatureTag(contract.management_signature_path);

    // Replace position via placeholder if present; fallback to replacing the hardcoded label
    htmlEn = htmlEn
      .replaceAll('{positionEn}', positionEn)
      .replace(/\(The “Lecturer”\)/, `(The “${positionEn}”)`);

    htmlEn = embedLogo(htmlEn)
      .replaceAll('{lecturer_name}', lecturerNameEn)
      .replaceAll('{start_date}', startDate)
      .replaceAll('{salary}', monthlyKhr.toLocaleString('en-US'))
      .replaceAll('{subject}', subject)
      .replaceAll('{term}', contract.term)
      .replaceAll('{gen}', genEn)
      .replaceAll('{dept_name}', deptName)
      .replaceAll('{items_rows}', enRows)
      // English template label shows KHR; provide KHR amount computed from USD hourly rate
      .replaceAll('{total_salary}', totalKhr.toLocaleString('en-US'))
      .replaceAll('{sign_date}', startDate)
      .replaceAll('{lecturer_signature}', lecturerSig)
      .replaceAll('{management_signature}', managementSig);

    // Build dynamic items rows (KH)
    const khRows = (items.length ? items : [])
      .map((text, idx) => {
        const safe = String(text || '');
        return `<tr>\n  <td style=\"width:40px; text-align:center; color:#003366; font-weight:bold;\">${toKhmerDigits(idx + 1)}</td>\n  <td>${safe}</td>\n</tr>`;
      })
      .join('\n');

    htmlKh = embedLogo(htmlKh)
      .replaceAll('{lecturer_nameKh}', lecturerNameKh)
      .replaceAll('{start_date}', startDate)
      .replaceAll('{salary}', toKhmerDigits(monthlyKhr))
      .replaceAll('{subject}', subject)
      .replaceAll('{term}', toKhmerDigits(contract.term))
      .replaceAll('{gen}', toKhmerDigits(genEn))
      .replaceAll('{dept_name}', deptName)
      .replaceAll('{items_rows}', khRows)
      // Khmer version requires total salary in KHR based on current exchange rate
      .replaceAll('{total_salary}', toKhmerDigits(totalKhr))
      .replaceAll('{date}', toKhmerDigits(new Date().getDate()))
      .replaceAll('{month}', toKhmerDigits(new Date().getMonth() + 1))
      .replaceAll('{year}', toKhmerDigits(new Date().getFullYear()))
      .replaceAll('{lecturer_signature}', lecturerSig)
      .replaceAll('{management_signature}', managementSig)
      .replaceAll('{positionKh}', positionKh);

    const combined = `
      <html>
        <head><style>.page-break{page-break-before:always;}</style></head>
        <body>
          <div>${htmlEn}</div>
          <div class="page-break"></div>
          <div>${htmlKh}</div>
        </body>
      </html>`;

    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.setContent(combined, { waitUntil: 'networkidle0' });
    const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true });
    await browser.close();

    // Build lecturer-named directory and human-friendly filename
    const rawLecturerName =
      contract.lecturer?.display_name || contract.lecturer?.email || 'Lecturer';
    const dirSafe =
      String(rawLecturerName)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '') || 'lecturer';
    const fileBase = String(rawLecturerName)
      .replace(/[^A-Za-z0-9]+/g, ' ')
      .trim()
      .replace(/\s+/g, ''); // e.g., "ChanDara"
    const outDir = path.join(process.cwd(), 'uploads', 'contracts', dirSafe);
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
    const filePath = path.join(outDir, `${fileBase || 'Contract'}_Contract.pdf`);
    fs.writeFileSync(filePath, pdfBuffer);
    await contract.update({ pdf_path: filePath });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `inline; filename="${fileBase || 'Contract'}_Contract.pdf"`
    );
    return res.send(pdfBuffer);
  } catch (e) {
    console.error('[generatePdf]', e);
    return res.status(HTTP_STATUS.SERVER_ERROR).json({ message: 'Failed to generate PDF', error: e.message });
  }
}

export async function updateStatus(req, res) {
  try {
    const id = parseInt(req.params.id, 10);
    const { status } = req.body;
    // Validation handled by middleware; status is already safe
    const contract = await TeachingContract.findByPk(id);
    if (!contract) return res.status(HTTP_STATUS.NOT_FOUND).json({ message: 'Not found' });
    if (['admin', 'management'].includes(String(req.user?.role).toLowerCase())) {
      const ok = await isContractInManagerDept(contract.id, req);
      if (!ok) return res.status(HTTP_STATUS.FORBIDDEN).json({ message: 'Access denied' });
    }
    await contract.update({ status });
    return res.json({ message: 'Updated' });
  } catch (e) {
    console.error('[updateStatus]', e);
    return res.status(HTTP_STATUS.SERVER_ERROR).json({ message: 'Failed to update status', error: e.message });
  }
}

// Delete a contract (admin/superadmin). Not allowed for COMPLETED status.
export async function deleteContract(req, res) {
  try {
    const id = parseInt(req.params.id, 10);
    const contract = await TeachingContract.findByPk(id);
    if (!contract) return res.status(HTTP_STATUS.NOT_FOUND).json({ message: 'Not found' });
    if (contract.status === 'COMPLETED') {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({ message: 'Completed contracts cannot be deleted' });
    }
    if (['admin', 'management'].includes(String(req.user?.role).toLowerCase())) {
      const ok = await isContractInManagerDept(contract.id, req);
      if (!ok) return res.status(HTTP_STATUS.FORBIDDEN).json({ message: 'Access denied' });
    }

    // Clean up files if any
    const files = [
      contract.pdf_path,
      contract.lecturer_signature_path,
      contract.management_signature_path,
    ].filter(Boolean);
    for (const f of files) {
      try {
        if (fs.existsSync(f)) fs.unlinkSync(f);
      } catch {}
    }

    // Remove related courses explicitly for safety
    await TeachingContractCourse.destroy({ where: { contract_id: id } });
    await TeachingContract.destroy({ where: { id } });
    return res.json({ message: 'Deleted' });
  } catch (e) {
    console.error('[deleteContract]', e);
    return res.status(HTTP_STATUS.SERVER_ERROR).json({ message: 'Failed to delete contract', error: e.message });
  }
}

// Signature upload (base64 or multipart). Here we handle multipart via multer.
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Place initially in base signatures dir; we'll move after we know lecturer's name
    const outDir = path.join(process.cwd(), 'uploads', 'signatures');
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
    cb(null, outDir);
  },
  filename: function (req, file, cb) {
    const id = parseInt(req.params.id, 10);
    const who = (req.body.who || 'lecturer').toLowerCase();
    const ext = path.extname(file.originalname || '') || '.png';
    cb(null, `contract_${id}_${who}_${Date.now()}${ext}`);
  },
});
export const upload = multer({ storage });

export async function uploadSignature(req, res) {
  try {
    const id = parseInt(req.params.id, 10);
    const who = (req.body.who || 'lecturer').toLowerCase();
    const contract = await TeachingContract.findByPk(id);
    if (!contract) return res.status(HTTP_STATUS.NOT_FOUND).json({ message: 'Not found' });
    if (['admin', 'management'].includes(String(req.user?.role).toLowerCase())) {
      const allowed = await isContractInManagerDept(contract.id, req);
      if (!allowed) return res.status(HTTP_STATUS.FORBIDDEN).json({ message: 'Access denied' });
    }
    if (!req.file) return res.status(HTTP_STATUS.BAD_REQUEST).json({ message: 'No file uploaded' });

    // Move file into person-specific folder: lecturer's name if who=lecturer, else management user's name
    let ownerName = 'unknown';
    try {
      if (who === 'lecturer') {
        const user = await User.findByPk(contract.lecturer_user_id, {
          attributes: ['display_name', 'email'],
        });
        ownerName = user?.display_name || user?.email || 'unknown';
      } else {
        // management uploader
        const mgr = req.user || {};
        ownerName = mgr.display_name || mgr.email || 'management';
      }
    } catch {}
    const safeName =
      String(ownerName)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '') || 'unknown';
    const targetDir = path.join(process.cwd(), 'uploads', 'signatures', safeName);
    if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });
    const ext = path.extname(req.file.filename || '') || '.png';
    const unique = `contract_${id}_${who}_${Date.now()}${ext}`;
    const targetPath = path.join(targetDir, unique);
    try {
      fs.renameSync(req.file.path, targetPath);
    } catch {
      // fallback: copy then unlink
      try {
        fs.copyFileSync(req.file.path, targetPath);
        fs.unlinkSync(req.file.path);
      } catch {}
    }

    const filePath = targetPath;
    const now = new Date();
    if (who === 'lecturer') {
      // Lecturer signing moves status to WAITING_MANAGEMENT unless management already signed (then COMPLETED)
      const next = contract.management_signed_at ? 'COMPLETED' : 'WAITING_MANAGEMENT';
      await contract.update({
        lecturer_signature_path: filePath,
        lecturer_signed_at: now,
        status: next,
      });
    } else {
      // Management signing moves status to WAITING_LECTURER unless lecturer already signed (then COMPLETED)
      const next = contract.lecturer_signed_at ? 'COMPLETED' : 'WAITING_LECTURER';
      await contract.update({
        management_signature_path: filePath,
        management_signed_at: now,
        status: next,
      });
    }
    return res.json({ message: 'Signature uploaded', path: filePath, status: contract.status });
  } catch (e) {
    console.error('[uploadSignature]', e);
    return res.status(HTTP_STATUS.SERVER_ERROR).json({ message: 'Failed to upload signature', error: e.message });
  }
}
