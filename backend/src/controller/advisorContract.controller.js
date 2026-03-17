import fs from 'fs';
import path from 'path';
import puppeteer from 'puppeteer';
import multer from 'multer';
import Sequelize from 'sequelize';
import { AdvisorContract, LecturerProfile, Role, User, UserRole } from '../model/index.js';
import sequelize from '../config/db.js';
import { HTTP_STATUS, PAGINATION_DEFAULT_LIMIT, PAGINATION_MAX_LIMIT } from '../config/constants.js';

async function ensureUserHasRole(userId, roleName, { transaction } = {}) {
  const normalized = String(roleName || '').trim().toLowerCase();
  if (!normalized) return;

  // Business rule: only Lecturer/Assistant Lecturer positions can be promoted to advisor.
  // Advisor-position users can still have advisor role (already advisor).
  if (normalized === 'advisor') {
    const profile = await LecturerProfile.findOne({
      where: { user_id: userId },
      attributes: ['id', 'position'],
      transaction,
    });
    const posNorm = String(profile?.position || '')
      .trim()
      .toLowerCase()
      .replace(/\s+/g, ' ');
    const isAdvisorPosition = posNorm === 'advisor';
    const isPromotableLecturerPosition = posNorm === 'lecturer' || posNorm === 'assistant lecturer';

    if (!isAdvisorPosition && !isPromotableLecturerPosition) {
      const err = new Error(
        "Only users with position 'Lecturer' or 'Assistant Lecturer' can be promoted to the 'advisor' role"
      );
      err.status = HTTP_STATUS.BAD_REQUEST;
      throw err;
    }
  }

  const roles = await Role.findAll({ transaction });
  let role = roles.find((r) => String(r?.role_type || '').trim().toLowerCase() === normalized) || null;
  if (!role) {
    role = await Role.create({ role_type: normalized }, { transaction });
  }

  const existing = await UserRole.findOne({
    where: { user_id: userId, role_id: role.id },
    transaction,
  });

  if (!existing) {
    await UserRole.create({ user_id: userId, role_id: role.id }, { transaction });
  }
}

function toKhmerDigits(str) {
  const map = ['០', '១', '២', '៣', '៤', '៥', '៦', '៧', '៨', '៩'];
  return String(str).replace(/[0-9]/g, (d) => map[d]);
}

function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, (ch) => {
    if (ch === '&') return '&amp;';
    if (ch === '<') return '&lt;';
    if (ch === '>') return '&gt;';
    if (ch === '"') return '&quot;';
    return '&#39;';
  });
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
  if (!base64) return html;
  const dataUri = `data:image/png;base64,${base64}`;
  // Replace ALL occurrences, regardless of quote style
  return html.replace(/src=(['"])cadt_logo\.png\1/g, `src="${dataUri}"`);
}

// Convert an image file to an <img> tag HTML or empty string if missing
function signatureTag(filePath) {
  try {
    if (!filePath) return '';
    if (!fs.existsSync(filePath)) return '';
    const ext = path.extname(filePath).toLowerCase();
    const mime = ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg' : 'image/png';
    const base64 = fs.readFileSync(filePath, 'base64');
    return `<img src="data:${mime};base64,${base64}" style="max-height:70px; max-width:220px;" />`;
  } catch {
    return '';
  }
}

function ordinalSuffix(n) {
  const v = n % 100;
  if (v >= 11 && v <= 13) return 'th';
  switch (n % 10) {
    case 1:
      return 'st';
    case 2:
      return 'nd';
    case 3:
      return 'rd';
    default:
      return 'th';
  }
}

function formatDateEnWithSup(dateOnlyStr) {
  if (!dateOnlyStr) return '—';
  const d = new Date(dateOnlyStr);
  if (isNaN(d.getTime())) return '—';
  const day = d.getDate();
  const day2 = String(day).padStart(2, '0');
  const month = d.toLocaleString('en-GB', { month: 'long' });
  const year = d.getFullYear();
  return `${day2}<sup>${ordinalSuffix(day)}</sup> ${month} ${year}`;
}

function formatDateKh(dateOnlyStr) {
  if (!dateOnlyStr) return '';
  const d = new Date(dateOnlyStr);
  if (isNaN(d.getTime())) return '';
  const khMonths = [
    'មករា',
    'កុម្ភៈ',
    'មីនា',
    'មេសា',
    'ឧសភា',
    'មិថុនា',
    'កក្កដា',
    'សីហា',
    'កញ្ញា',
    'តុលា',
    'វិច្ឆិកា',
    'ធ្នូ',
  ];
  const day = toKhmerDigits(String(d.getDate()).padStart(2, '0'));
  const monthName = khMonths[d.getMonth()] || '';
  const year = toKhmerDigits(d.getFullYear());
  return `${day} ខែ${monthName} ឆ្នាំ${year}`;
}

function toNum(v) {
  if (v === null || v === undefined || v === '') return 0;
  const n = parseFloat(String(v).replace(/[^0-9.-]/g, ''));
  return Number.isFinite(n) ? n : 0;
}

function toDateOnly(v) {
  if (!v) return null;
  try {
    const d = new Date(v);
    if (isNaN(d.getTime())) return null;
    return d.toISOString().slice(0, 10);
  } catch {
    return null;
  }
}

async function requireOwnedAdvisorContract(req, res, contractId, options = {}) {
  const contract = await AdvisorContract.findByPk(contractId, options);
  if (!contract) {
    res.status(HTTP_STATUS.NOT_FOUND).json({ message: 'Not found' });
    return null;
  }

  if (Number(contract.lecturer_user_id) !== Number(req.user?.id)) {
    res.status(HTTP_STATUS.FORBIDDEN).json({ message: 'Access denied' });
    return null;
  }

  return contract;
}

async function requireAdvisorContractViewAccess(req, res, contractId, options = {}) {
  const contract = await AdvisorContract.findByPk(contractId, options);
  if (!contract) {
    res.status(HTTP_STATUS.NOT_FOUND).json({ message: 'Not found' });
    return null;
  }

  const role = String(req.user?.role || '').toLowerCase();
  if (Number(contract.lecturer_user_id) === Number(req.user?.id)) {
    return contract;
  }
  if (role === 'superadmin') {
    return contract;
  }
  if (role === 'admin' || role === 'management') {
    const owner = await User.findByPk(contract.lecturer_user_id, {
      attributes: ['department_name'],
    });
    if (String(owner?.department_name || '') === String(req.user?.department_name || '')) {
      return contract;
    }
  }

  res.status(HTTP_STATUS.FORBIDDEN).json({ message: 'Access denied' });
  return null;
}

// Signature upload (multipart). Mirrors teaching contract signature handling.
const advisorSignatureStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const outDir = path.join(process.cwd(), 'uploads', 'signatures');
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
    cb(null, outDir);
  },
  filename: function (req, file, cb) {
    const id = parseInt(req.params.id, 10);
    const who = String(req.body.who || 'advisor').toLowerCase();
    const ext = path.extname(file.originalname || '') || '.png';
    cb(null, `advisor_contract_${id}_${who}_${Date.now()}${ext}`);
  },
});

export const uploadAdvisorSignature = multer({ storage: advisorSignatureStorage });

export async function uploadAdvisorContractSignature(req, res) {
  try {
    const id = parseInt(req.params.id, 10);
    const whoRaw = String(req.body.who || 'advisor').toLowerCase();
    // Advisors are lecturers in this system; accept 'lecturer' as an alias.
    const who = whoRaw === 'lecturer' ? 'advisor' : whoRaw;
    if (who !== 'advisor' && who !== 'management') {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({ message: "Invalid 'who' (must be advisor|management)" });
    }

    // Advisors must own the contract to sign it; management/admin can sign if they
    // have department-scoped access similar to requireAdvisorContractViewAccess.
    const found =
      who === 'advisor'
        ? await requireOwnedAdvisorContract(req, res, id)
        : await requireAdvisorContractViewAccess(req, res, id);
    if (!found) return;
    if (!req.file) return res.status(HTTP_STATUS.BAD_REQUEST).json({ message: 'No file uploaded' });

    // Move file into person-specific folder
    let ownerName = 'unknown';
    try {
      if (who === 'advisor') {
        const u = found.lecturer || (await User.findByPk(found.lecturer_user_id, { attributes: ['display_name', 'email'] }));
        ownerName = u?.display_name || u?.email || 'unknown';
      } else {
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
    const unique = `advisor_contract_${id}_${who}_${Date.now()}${ext}`;
    const targetPath = path.join(targetDir, unique);

    try {
      fs.renameSync(req.file.path, targetPath);
    } catch {
      try {
        fs.copyFileSync(req.file.path, targetPath);
        fs.unlinkSync(req.file.path);
      } catch {}
    }

    const filePath = targetPath;
    const now = new Date();

    if (who === 'advisor') {
      const nextStatus = found.management_signed_at ? 'COMPLETED' : 'WAITING_MANAGEMENT';
      await found.update({
        advisor_signature_path: filePath,
        advisor_signed_at: now,
        status: nextStatus,
      });
    } else {
      const nextStatus = found.advisor_signed_at ? 'COMPLETED' : 'DRAFT';
      await found.update({
        management_signature_path: filePath,
        management_signed_at: now,
        status: nextStatus,
      });
    }

    return res.json({ message: 'Signature uploaded', path: filePath, status: found.status });
  } catch (e) {
    console.error('[uploadAdvisorContractSignature]', e);
    return res
      .status(HTTP_STATUS.SERVER_ERROR)
      .json({ message: 'Failed to upload signature', error: e.message });
  }
}

export async function createAdvisorContract(req, res) {
  const tx = await sequelize.transaction();
  try {
    const body = req.validated?.body || req.body || {};

    const actorRole = String(req.user?.role || '').toLowerCase();
    if (['admin', 'management'].includes(actorRole)) {
      const actorDept = req.user?.department_name || null;
      if (!actorDept) {
        await tx.rollback();
        return res.status(HTTP_STATUS.FORBIDDEN).json({ message: 'Your account is missing a department' });
      }
      const lecturer = await User.findByPk(body.lecturer_user_id, {
        attributes: ['id', 'department_name'],
        transaction: tx,
      });
      if (!lecturer) {
        await tx.rollback();
        return res.status(HTTP_STATUS.BAD_REQUEST).json({ message: 'Invalid lecturer_user_id' });
      }
      if (String(lecturer.department_name || '') !== String(actorDept)) {
        await tx.rollback();
        return res
          .status(HTTP_STATUS.FORBIDDEN)
          .json({ message: 'You can only create advisor contracts for lecturers in your department' });
      }
    }

    // Admin UX: selecting a lecturer in Advisor contract generation implies granting advisor role.
    await ensureUserHasRole(body.lecturer_user_id, 'advisor', { transaction: tx });

    const created = await AdvisorContract.create(
      {
        lecturer_user_id: body.lecturer_user_id,
        academic_year: body.academic_year,
        role: body.role,
        hourly_rate: body.hourly_rate,
        capstone_1: !!body.capstone_1,
        capstone_2: !!body.capstone_2,
        internship_1: !!body.internship_1,
        internship_2: !!body.internship_2,
        hours_per_student: body.hours_per_student,
        students: body.students,
        start_date: toDateOnly(body.start_date),
        end_date: toDateOnly(body.end_date),
        duties: body.duties,
        join_judging_hours: body.join_judging_hours ?? null,
        status: 'DRAFT',
        created_by: req.user.id,
      },
      { transaction: tx }
    );

    await tx.commit();

    return res.status(HTTP_STATUS.CREATED).json({ id: created.id });
  } catch (e) {
    try {
      await tx.rollback();
    } catch {}
    console.error('[createAdvisorContract]', e);
    if (e?.status && Number.isInteger(e.status) && e.status >= 400 && e.status < 500) {
      return res.status(e.status).json({ message: e.message });
    }
    return res
      .status(HTTP_STATUS.SERVER_ERROR)
      .json({ message: 'Failed to create advisor contract', error: e.message });
  }
}

export async function listAdvisorContracts(req, res) {
  try {
    const page = Math.max(1, parseInt(req.query.page || '1', 10));
    const limit = Math.min(
      PAGINATION_MAX_LIMIT,
      Math.max(1, parseInt(req.query.limit || String(PAGINATION_DEFAULT_LIMIT), 10))
    );
    const offset = (page - 1) * limit;
    const { q } = req.query;
    const statusQuery = req.query.status;

    const where = {};
    const actorRole = String(req.user?.role || '').toLowerCase();
    if (actorRole === 'lecturer' || actorRole === 'advisor') {
      where.lecturer_user_id = req.user.id;
    }

    const include = [
      {
        model: User,
        as: 'lecturer',
        attributes: ['id', 'email', 'display_name', 'department_name'],
        include: [
          {
            model: LecturerProfile,
            attributes: ['title', 'full_name_english', 'full_name_khmer'],
            required: false,
          },
        ],
        required: false,
      },
    ];

    if (actorRole === 'admin' || actorRole === 'management') {
      const dept = req.user?.department_name || null;
      if (!dept) return res.json({ data: [], page, limit, total: 0 });
      include[0].required = true;
      include[0].where = { department_name: dept };
    }

    // Optional status filter (normalized). If a teaching-contract status is provided,
    // return empty instead of error to keep shared UIs simple.
    if (statusQuery != null && String(statusQuery).trim() !== '') {
      const statusNorm = String(statusQuery).trim().toUpperCase().replace(/\s+/g, '_');
      const allowed = new Set(['DRAFT', 'WAITING_MANAGEMENT', 'REQUEST_REDO', 'COMPLETED', 'CONTRACT_ENDED']);
      if (!allowed.has(statusNorm)) {
        return res.json({ data: [], page, limit, total: 0 });
      }

      if (statusNorm === 'CONTRACT_ENDED') {
        // Keep behavior consistent with client-side display status: treat past end_date as ended.
        const now = new Date();
        const todayOnly = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
          now.getDate()
        ).padStart(2, '0')}`;
        where[Sequelize.Op.or] = [
          { status: 'CONTRACT_ENDED' },
          { end_date: { [Sequelize.Op.lte]: todayOnly } },
        ];
      } else {
        where.status = statusNorm;
      }
    }

    // Text search on lecturer display_name or email.
    // Avoid raw SQL / hard-coded table aliases by filtering through the existing joined include.
    if (q) {
      const like = `%${q}%`;
      const qWhere = {
        [Sequelize.Op.or]: [
          { display_name: { [Sequelize.Op.like]: like } },
          { email: { [Sequelize.Op.like]: like } },
        ],
      };

      include[0].required = true;
      include[0].where = include[0].where
        ? { [Sequelize.Op.and]: [include[0].where, qWhere] }
        : qWhere;
    }

    const { rows, count } = await AdvisorContract.findAndCountAll({
      where,
      include,
      limit,
      offset,
      order: [['created_at', 'DESC']],
      distinct: true,
    });

    return res.json({ data: rows, page, limit, total: count });
  } catch (e) {
    console.error('[listAdvisorContracts]', e);
    return res
      .status(HTTP_STATUS.SERVER_ERROR)
      .json({ message: 'Failed to list advisor contracts', error: e.message });
  }
}

export async function getAdvisorContract(req, res) {
  try {
    const id = parseInt(req.params.id, 10);
    const allowedContract = await requireAdvisorContractViewAccess(req, res, id, {
      attributes: ['id', 'lecturer_user_id'],
    });
    if (!allowedContract) return;

    const found = await AdvisorContract.findByPk(id, {
      include: [
        {
          model: User,
          as: 'lecturer',
          attributes: ['id', 'email', 'display_name', 'department_name'],
          required: false,
        },
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'email', 'display_name', 'department_name'],
          required: false,
        },
      ],
    });
    if (!found) return res.status(HTTP_STATUS.NOT_FOUND).json({ message: 'Not found' });

    return res.json(found);
  } catch (e) {
    console.error('[getAdvisorContract]', e);
    return res
      .status(HTTP_STATUS.SERVER_ERROR)
      .json({ message: 'Failed to fetch advisor contract', error: e.message });
  }
}

async function requireAdvisorStatusUpdateAccess(req, res, contractId) {
  try {
    const currentUser = req.user;
    if (!currentUser) {
      res.status(HTTP_STATUS.UNAUTHORIZED).json({ message: 'Unauthorized' });
      return null;
    }

    const found = await AdvisorContract.findByPk(contractId, {
      include: [
        {
          model: User,
          as: 'lecturer',
          attributes: ['id', 'email', 'display_name', 'department_name'],
          required: false,
        },
      ],
    });

    if (!found) {
      res.status(HTTP_STATUS.NOT_FOUND).json({ message: 'Not found' });
      return null;
    }

    const isOwner = found.lecturer_user_id === currentUser.id;

    let privilegedRole = null;
    const elevatedRoles = ['admin', 'management', 'superadmin'];
    for (const roleName of elevatedRoles) {
      // Reuse existing role-checking helper; ignore transaction for this check.
      const hasRole = await ensureUserHasRole(currentUser.id, roleName);
      if (hasRole) {
        privilegedRole = roleName;
        break;
      }
    }

    if (!isOwner && !privilegedRole) {
      res.status(HTTP_STATUS.FORBIDDEN).json({ message: 'Forbidden' });
      return null;
    }

    if (!isOwner && privilegedRole !== 'superadmin') {
      const lecturerDept = found.lecturer ? found.lecturer.department_name : null;
      const userDept = currentUser.department_name;
      if (!lecturerDept || !userDept || lecturerDept !== userDept) {
        res.status(HTTP_STATUS.FORBIDDEN).json({ message: 'Forbidden: cross-department access denied' });
        return null;
      }
    }

    return found;
  } catch (e) {
    console.error('[requireAdvisorStatusUpdateAccess]', e);
    res
      .status(HTTP_STATUS.SERVER_ERROR)
      .json({ message: 'Failed to authorize advisor status update', error: e.message });
    return null;
  }
}

export async function updateAdvisorStatus(req, res) {
  try {
    const id = parseInt(req.params.id, 10);
    const body = req.validated?.body || req.body || {};
    const status = String(body.status || '').trim().toUpperCase().replace(/\s+/g, '_');

    const found = await requireAdvisorStatusUpdateAccess(req, res, id);
    if (!found) return;

    await found.update({ status });
    return res.json({ message: 'Updated', id, status });
  } catch (e) {
    console.error('[updateAdvisorStatus]', e);
    return res
      .status(HTTP_STATUS.SERVER_ERROR)
      .json({ message: 'Failed to update advisor status', error: e.message });
  }
}

// Edit advisor contract details. Allowed only when status=REQUEST_REDO.
// Editing resets signatures and moves the contract back to DRAFT (waiting advisor).
export async function editAdvisorContract(req, res) {
  const tx = await sequelize.transaction();
  try {
    const id = parseInt(req.params.id, 10);
    const body = req.validated?.body || req.body || {};

    const found = await AdvisorContract.findOne({
      where: { id },
      transaction: tx,
      lock: tx.LOCK.UPDATE,
    });
    if (!found) {
      await tx.rollback();
      return res.status(404).json({ message: 'Advisor contract not found' });
    }

    if (String(found.status || '').toUpperCase() !== 'REQUEST_REDO') {
      await tx.rollback();
      return res
        .status(HTTP_STATUS.CONFLICT)
        .json({ message: 'Contract can only be edited when status is REQUEST_REDO' });
    }

    const updatePayload = {
      status: 'DRAFT',
      advisor_signature_path: null,
      management_signature_path: null,
      advisor_signed_at: null,
      management_signed_at: null,
    };

    if (body.role !== undefined) updatePayload.role = body.role;
    if (body.hourly_rate !== undefined) updatePayload.hourly_rate = body.hourly_rate;
    if (body.capstone_1 !== undefined) updatePayload.capstone_1 = !!body.capstone_1;
    if (body.capstone_2 !== undefined) updatePayload.capstone_2 = !!body.capstone_2;
    if (body.internship_1 !== undefined) updatePayload.internship_1 = !!body.internship_1;
    if (body.internship_2 !== undefined) updatePayload.internship_2 = !!body.internship_2;
    if (body.hours_per_student !== undefined) updatePayload.hours_per_student = body.hours_per_student;
    if (body.students !== undefined) updatePayload.students = body.students;
    if (Object.prototype.hasOwnProperty.call(body, 'start_date')) updatePayload.start_date = toDateOnly(body.start_date);
    if (Object.prototype.hasOwnProperty.call(body, 'end_date')) updatePayload.end_date = toDateOnly(body.end_date);
    if (body.duties !== undefined) updatePayload.duties = body.duties;
    if (Object.prototype.hasOwnProperty.call(body, 'join_judging_hours')) {
      updatePayload.join_judging_hours = body.join_judging_hours ?? null;
    }

    await found.update(updatePayload, { transaction: tx });
    await tx.commit();
    return res.json({ message: 'Updated', id, status: 'DRAFT' });
  } catch (e) {
    try {
      await tx.rollback();
    } catch {}
    console.error('[editAdvisorContract]', e);
    return res
      .status(HTTP_STATUS.SERVER_ERROR)
      .json({ message: 'Failed to edit advisor contract', error: e.message });
  }
}

export async function generateAdvisorPdf(req, res) {
  try {
    const id = parseInt(req.params.id, 10);
    const allowedContract = await requireAdvisorContractViewAccess(req, res, id, {
      attributes: ['id', 'lecturer_user_id'],
    });
    if (!allowedContract) return;

    const found = await AdvisorContract.findByPk(id, {
      include: [
        {
          model: User,
          as: 'lecturer',
          attributes: ['id', 'email', 'display_name', 'department_name'],
          include: [{ model: LecturerProfile, attributes: ['title', 'full_name_khmer'], required: false }],
          required: false,
        },
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'email', 'display_name', 'department_name'],
          required: false,
        },
      ],
    });
    if (!found) return res.status(HTTP_STATUS.NOT_FOUND).json({ message: 'Not found' });

    let html = loadTemplate('Advisor_Contract.html');
    html = embedLogo(html);

    const titleRaw = found.lecturer?.LecturerProfile?.title || null;
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

    const advisorNameBase = found.lecturer?.display_name || found.lecturer?.email || 'Advisor';
    const advisorNameEn = `${enPrefix}${advisorNameBase}`.trim();
    const advisorKhBase = found.lecturer?.LecturerProfile?.full_name_khmer || advisorNameBase;
    const advisorKhName = `${khPrefix}${advisorKhBase}`.trim();

    const departmentName = found.lecturer?.department_name || '';
    const academicYear = found.academic_year || '';

    const respParts = [];
    if (found.capstone_1) respParts.push('Capstone I');
    if (found.capstone_2) respParts.push('Capstone II');
    if (found.internship_1) respParts.push('Internship I');
    if (found.internship_2) respParts.push('Internship II');
    const programLabelEn = respParts.length ? respParts.join(', ') : 'Advisor Program';

    const students = Array.isArray(found.students) ? found.students : [];
    const studentsCount = students.length;

    const hourlyRateUsd = toNum(found.hourly_rate);
    const hoursPerStudent = toNum(found.hours_per_student);
    const judgingHours = toNum(found.join_judging_hours);
    const totalHoursPerStudent = hoursPerStudent * studentsCount;
    const totalJudgingHours = judgingHours * studentsCount;
    const totalHours = totalHoursPerStudent + totalJudgingHours;

    const totalUsd = totalHours * hourlyRateUsd;
    const usdToKhr = parseFloat(process.env.USD_TO_KHR || process.env.EXCHANGE_RATE_KHR || '4100');
    const totalKhr = Math.round((Number.isFinite(totalUsd) ? totalUsd : 0) * (Number.isFinite(usdToKhr) ? usdToKhr : 4100));

    const startDateEn = formatDateEnWithSup(found.start_date);
    const startDateKh = formatDateKh(found.start_date);

    const duties = Array.isArray(found.duties) ? found.duties : [];
    const dutiesLisEn = (duties.length ? duties : ['-'])
      .map((d) => `<li>${escapeHtml(d)}</li>`)
      .join('');

    const studentsRowsEn = (students.length ? students : [{ student_name: '-', student_code: '' }])
      .map((s, idx) => {
        const name = escapeHtml(s?.student_name || '-');
        const code = escapeHtml(s?.student_code || '');
        const label = code ? `${name}, ${code}` : name;
        const topic = escapeHtml(s?.project_title || s?.topic_title || s?.project_topic_title || '-');
        const company = escapeHtml(s?.company_name || '-');
        return `
      <tr>
        <td>${idx + 1}</td>
        <td style="text-align:left;">${label}</td>
        <td style="text-align:left;">${topic}</td>
        <td style="text-align:left;">${company}</td>
      </tr>`;
      })
      .join('');

    const studentsRowsKh = (students.length ? students : [{ student_name: '-', student_code: '' }])
      .map((s, idx) => {
        const name = escapeHtml(s?.student_name || '-');
        const code = escapeHtml(s?.student_code || '');
        const label = code ? `${name}, ${code}` : name;
        const topic = escapeHtml(s?.project_title || s?.topic_title || s?.project_topic_title || '-');
        const company = escapeHtml(s?.company_name || '-');
        return `
      <tr>
        <td>${toKhmerDigits(idx + 1)}</td>
        <td style="text-align:left;">${label}</td>
        <td style="text-align:left;">${topic}</td>
        <td style="text-align:left;">${company}</td>
      </tr>`;
      })
      .join('');

    const dutiesRowsEn = `
      <tr>
        <td>1</td>
        <td>
          Advisory:<br>
          <ul class="bullet-list">
            ${dutiesLisEn}
          </ul>
        </td>
        <td><strong>${hoursPerStudent || 0}</strong></td>
        <td><strong>${studentsCount}</strong></td>
        <td><strong>${totalHoursPerStudent || 0}</strong></td>
      </tr>
      <tr>
        <td>2</td>
        <td>Join judging</td>
        <td><strong>${judgingHours || 0}</strong></td>
        <td><strong>${studentsCount}</strong></td>
        <td><strong>${totalJudgingHours || 0}</strong></td>
      </tr>`;

    const dutiesRowsKh = `
      <tr>
        <td>${toKhmerDigits(1)}</td>
        <td>
          ការដឹកនាំ:<br>
          <ul class="bullet-list">
            ${dutiesLisEn}
          </ul>
        </td>
        <td><strong>${toKhmerDigits(hoursPerStudent || 0)}</strong></td>
        <td><strong>${toKhmerDigits(studentsCount)}</strong></td>
        <td><strong>${toKhmerDigits(totalHoursPerStudent || 0)}</strong></td>
      </tr>
      <tr>
        <td>${toKhmerDigits(2)}</td>
        <td>ចូលរួមជាគណៈកម្មការ</td>
        <td><strong>${toKhmerDigits(judgingHours || 0)}</strong></td>
        <td><strong>${toKhmerDigits(studentsCount)}</strong></td>
        <td><strong>${toKhmerDigits(totalJudgingHours || 0)}</strong></td>
      </tr>`;

    html = html
      .replaceAll('{advisor_name_en}', advisorNameEn)
      .replaceAll('{advisor_name_kh}', advisorKhName)
      .replaceAll('{start_date_en}', startDateEn)
      .replaceAll('{start_date_kh}', startDateKh)
      .replaceAll('{academic_year}', escapeHtml(academicYear))
      .replaceAll('{program_label_en}', escapeHtml(programLabelEn))
      .replaceAll('{department_name}', escapeHtml(departmentName))
      .replaceAll('{management_signature_path}', signatureTag(found.management_signature_path))
      .replaceAll('{advisor_signature_path}', signatureTag(found.advisor_signature_path))
      .replaceAll('{students_rows_en}', studentsRowsEn)
      .replaceAll('{students_rows_kh}', studentsRowsKh)
      .replaceAll('{duties_rows_en}', dutiesRowsEn)
      .replaceAll('{duties_rows_kh}', dutiesRowsKh)
      .replaceAll('{total_hours}', String(totalHours || 0))
      .replaceAll('{total_hours_kh}', toKhmerDigits(String(totalHours || 0)))
      .replaceAll('{total_payment_khr_en}', totalKhr.toLocaleString('en-US'))
      .replaceAll('{total_payment_khr_kh}', toKhmerDigits(totalKhr.toLocaleString('en-US')));

    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true });
    await browser.close();

    const fileBase = String(advisorNameBase)
      .replace(/[^A-Za-z0-9]+/g, ' ')
      .trim()
      .replace(/\s+/g, '') || `AdvisorContract${id}`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${fileBase}_AdvisorContract.pdf"`);
    return res.send(pdfBuffer);
  } catch (e) {
    console.error('[generateAdvisorPdf]', e);
    return res
      .status(HTTP_STATUS.SERVER_ERROR)
      .json({ message: 'Failed to generate advisor contract PDF', error: e.message });
  }
}
