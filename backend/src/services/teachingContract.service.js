import fs from 'fs';
import path from 'path';
import puppeteer from 'puppeteer';
import {
  TeachingContract,
  TeachingContractCourse,
  ContractRedoRequest,
  User,
  LecturerProfile,
  ClassModel,
  ContractItem,
  Department,
  Course,
  CourseMapping,
} from '../model/index.js';
import sequelize from '../config/db.js';
import Candidate from '../model/candidate.model.js';
import { Op, fn, col, where as seqWhere } from 'sequelize';
import {
  HTTP_STATUS,
  PAGINATION_DEFAULT_LIMIT,
  PAGINATION_MAX_LIMIT,
  CONTRACT_STATUS_ALIAS_MAP,
} from '../config/constants.js';
import { getNotificationSocket } from '../socket/index.js';
import { NotFoundError, ForbiddenError, ValidationError, ConflictError } from '../utils/errors.js';


// ---------------------------------------------------------------------------
// Pure helpers (formatting, parsing)
// ---------------------------------------------------------------------------

function toKhmerDigits(str) {
  const map = ['០', '១', '២', '៣', '៤', '៥', '៦', '៧', '៨', '៩'];
  return String(str).replace(/[0-9]/g, (d) => map[d]);
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (char) => {
    switch (char) {
      case '&': return '&amp;';
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '"': return '&quot;';
      case "'": return '&#39;';
      default: return char;
    }
  });
}

function formatMoneySummary(value) {
  const amount = Number(value || 0);
  return Number.isFinite(amount) ? amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00';
}

function formatKhmerMoneySummary(value) {
  return `${toKhmerDigits(formatMoneySummary(value))}៛`;
}

function normalizeTeachingSummaryType(value) {
  const normalized = String(value || '').trim().toUpperCase().replace(/\s+/g, '_').replace(/-/g, '_');
  const aliasMap = { CAPSTONE_I: 'CAPSTONE_1', CAPSTONE_1: 'CAPSTONE_1', CAPSTONE_II: 'CAPSTONE_2', CAPSTONE_2: 'CAPSTONE_2', INTERNSHIP_I: 'INTERNSHIP_1', INTERNSHIP_1: 'INTERNSHIP_1', INTERNSHIP_II: 'INTERNSHIP_2', INTERNSHIP_2: 'INTERNSHIP_2' };
  return aliasMap[normalized] || '';
}

function getTeachingSummaryTypeLabels(typeKey) {
  const map = { CAPSTONE_1: { en: 'Capstone I', kh: 'Capstone I' }, CAPSTONE_2: { en: 'Capstone II', kh: 'Capstone II' }, INTERNSHIP_1: { en: 'Internship I', kh: 'កម្មសិក្សាលើកទី១' }, INTERNSHIP_2: { en: 'Internship II', kh: 'កម្មសិក្សាលើកទី២' } };
  return map[typeKey] || null;
}

function extractTermNumber(value) {
  const match = String(value ?? '').match(/(1|2)/);
  return match ? Number(match[1]) : null;
}

function courseMatchesTeachingSummaryType(course, typeKey) {
  if (!typeKey) return true;
  const courseName = String(course?.course_name || '').trim().toLowerCase();
  const termNumber = extractTermNumber(course?.term);
  const wantsCapstone = typeKey.startsWith('CAPSTONE');
  const wantsInternship = typeKey.startsWith('INTERNSHIP');
  const wantsTerm = typeKey.endsWith('_2') ? 2 : 1;
  const matchesFamily = wantsCapstone ? courseName.includes('capstone') : wantsInternship ? courseName.includes('internship') : false;
  if (!matchesFamily) return false;
  if (termNumber) return termNumber === wantsTerm;
  if (wantsTerm === 1) return /(^|\s)(i|1)(\s|$)/i.test(courseName) || !/(^|\s)(ii|2)(\s|$)/i.test(courseName);
  return /(^|\s)(ii|2)(\s|$)/i.test(courseName);
}

function getKhDateParts(value) {
  const date = value ? new Date(value) : null;
  if (!date || Number.isNaN(date.getTime())) return null;
  const khMonths = ['មករា', 'កុម្ភៈ', 'មីនា', 'មេសា', 'ឧសភា', 'មិថុនា', 'កក្កដា', 'សីហា', 'កញ្ញា', 'តុលា', 'វិច្ឆិកា', 'ធ្នូ'];
  return { day: toKhmerDigits(date.getDate()), month: khMonths[date.getMonth()], year: toKhmerDigits(date.getFullYear()) };
}

function formatTeachingSummaryDateRangeKh(startDate, endDate) {
  const start = getKhDateParts(startDate);
  const end = getKhDateParts(endDate);
  if (!start || !end) return '-';
  return `ចាប់ពីថ្ងៃទី ${start.day} ខែ ${start.month} ឆ្នាំ ${start.year} ដល់ថ្ងៃទី ${end.day} ខែ ${end.month} ឆ្នាំ ${end.year}`;
}

function normalizeGenerationNumber(value) {
  if (value === null || value === undefined) return '';
  const match = String(value).match(/(\d+)/);
  return match ? String(parseInt(match[1], 10)) : '';
}

function normalizeSummaryClassNames(value) {
  if (Array.isArray(value)) return Array.from(new Set(value.map((item) => String(item || '').trim()).filter(Boolean)));
  const raw = String(value || '').trim();
  if (!raw) return [];
  return Array.from(new Set(raw.split(',').map((item) => item.trim()).filter(Boolean)));
}

function formatLecturerSummaryGenerationTitle(classNames) {
  const generations = Array.from(new Set(classNames.map((item) => normalizeGenerationNumber(item)).filter(Boolean).sort((left, right) => Number(left) - Number(right)))).map((item) => toKhmerDigits(item));
  if (!generations.length) return 'ចំណាយប្រាក់ឈ្នួលគ្រូបង្រៀនឯកជន(ភ្នាក់ងរជាតិជាប់កិច្ចសន្យា) សម្រាប់ថ្នាក់បរិញ្ញាបត្រជំនាន់ទី........';
  if (generations.length === 1) return `ចំណាយប្រាក់ឈ្នួលគ្រូបង្រៀនឯកជន(ភ្នាក់ងរជាតិជាប់កិច្ចសន្យា) សម្រាប់ថ្នាក់បរិញ្ញាបត្រជំនាន់ទី${generations[0]}`;
  if (generations.length === 2) return `ចំណាយប្រាក់ឈ្នួលគ្រូបង្រៀនឯកជន(ភ្នាក់ងរជាតិជាប់កិច្ចសន្យា) សម្រាប់ថ្នាក់បរិញ្ញាបត្រជំនាន់ទី${generations[0]} និងជំនាន់ទី${generations[1]}`;
  const firstGeneration = generations[0];
  const middleGenerations = generations.slice(1, -1).map((item) => `ទី${item}`).join(' ');
  const lastGeneration = generations[generations.length - 1];
  return `ចំណាយប្រាក់ឈ្នួលគ្រូបង្រៀនឯកជន(ភ្នាក់ងរជាតិជាប់កិច្ចសន្យា) សម្រាប់ថ្នាក់បរិញ្ញាបត្រជំនាន់ទី${firstGeneration} ${middleGenerations} និងជំនាន់ទី${lastGeneration}`;
}

function parseHoursValue(value) {
  const match = String(value || '').match(/(\d+(?:\.\d+)?)/);
  return match ? Number(match[1]) : 0;
}

function normalizeLookupText(value) {
  return String(value || '').trim().replace(/\s+/g, ' ').toLowerCase();
}

function normalizeSummaryTerm(value) {
  const termNumber = extractTermNumber(value);
  return termNumber ? String(termNumber) : normalizeLookupText(value);
}

function buildCourseMappingKey({ lecturerProfileId, courseId, classId, academicYear, term }) {
  return [String(lecturerProfileId || ''), String(courseId || ''), String(classId || ''), String(academicYear || ''), normalizeSummaryTerm(term)].join('|');
}

function buildCourseMappingNameKey({ lecturerProfileId, courseName, className, academicYear, term }) {
  return [String(lecturerProfileId || ''), normalizeLookupText(courseName), normalizeLookupText(className), String(academicYear || ''), normalizeSummaryTerm(term)].join('|');
}

function expandSummaryTermFilters(values) {
  const variants = new Set();
  for (const value of values || []) {
    const raw = String(value || '').trim();
    if (raw) variants.add(raw);
    const termNumber = extractTermNumber(value);
    if (termNumber) { variants.add(String(termNumber)); variants.add(`Term ${termNumber}`); variants.add(`term ${termNumber}`); }
  }
  return Array.from(variants);
}

function getSummaryTheoryEffectiveGroups(hours, groups, combined) {
  const normalizedHours = Number(hours) || 0;
  const normalizedGroups = Number(groups) || 0;
  if (combined && normalizedHours === 15 && normalizedGroups > 0) return 1;
  return normalizedGroups;
}

function getSummaryTheoryEffectiveTotalHours(hours, groups, combined) {
  const normalizedHours = Number(hours) || 0;
  const normalizedGroups = Number(groups) || 0;
  if (!normalizedHours || !normalizedGroups) return 0;
  if (combined && normalizedHours === 15) return normalizedHours;
  return normalizedHours * normalizedGroups;
}

function shouldInferCombinedTheory({ contractTotalHours, theoryHours, theoryGroups, practiceHours, practiceGroups, theoryCombined }) {
  if (theoryCombined) return true;
  const normalizedContractTotal = Number(contractTotalHours) || 0;
  const normalizedTheoryHours = Number(theoryHours) || 0;
  const normalizedTheoryGroups = Number(theoryGroups) || 0;
  const normalizedPracticeHours = Number(practiceHours) || 0;
  const normalizedPracticeGroups = Number(practiceGroups) || 0;
  if (normalizedContractTotal <= 0 || normalizedTheoryHours !== 15 || normalizedTheoryGroups <= 1) return false;
  const combinedTotal = normalizedTheoryHours + normalizedPracticeHours * normalizedPracticeGroups;
  const uncombinedTotal = normalizedTheoryHours * normalizedTheoryGroups + normalizedPracticeHours * normalizedPracticeGroups;
  return normalizedContractTotal === combinedTotal && normalizedContractTotal !== uncombinedTotal;
}

async function resolveSummaryHourlyRate(contract, cache) {
  const contractRate = Number(contract?.hourly_rate);
  if (Number.isFinite(contractRate) && contractRate > 0) return contractRate;

  const profile = contract?.lecturer?.LecturerProfile;
  const candidateId = profile?.candidate_id;
  if (candidateId) {
    const cacheKey = `candidate:${candidateId}`;
    if (cache.has(cacheKey)) return cache.get(cacheKey);
    const candidate = await Candidate.findByPk(candidateId);
    const candidateRate = Number(candidate?.hourlyRate);
    const resolvedRate = Number.isFinite(candidateRate) && candidateRate > 0 ? candidateRate : 0;
    cache.set(cacheKey, resolvedRate);
    return resolvedRate;
  }

  const displayName = String(contract?.lecturer?.display_name || '').trim();
  const email = String(contract?.lecturer?.email || '').trim();
  const cacheKey = `lookup:${displayName}|${email}`;
  if (cache.has(cacheKey)) return cache.get(cacheKey);

  let candidate = null;
  if (displayName) {
    const normalizedName = displayName.replace(/^(mr\.?|ms\.?|mrs\.?|dr\.?|prof\.?|professor|miss)\s+/i, '').replace(/\s+/g, ' ').trim().toLowerCase();
    if (normalizedName) {
      candidate = await Candidate.findOne({ where: seqWhere(fn('LOWER', fn('TRIM', col('fullName'))), normalizedName) });
    }
  }
  if (!candidate && email) candidate = await Candidate.findOne({ where: { email } });

  const candidateRate = Number(candidate?.hourlyRate);
  const resolvedRate = Number.isFinite(candidateRate) && candidateRate > 0 ? candidateRate : 0;
  cache.set(cacheKey, resolvedRate);
  return resolvedRate;
}

function normalizeItems(input) {
  try {
    if (!input) return [];
    if (Array.isArray(input)) return input.map((v) => String(v ?? '').trim()).filter(Boolean);
    if (typeof input === 'string') {
      const s = input.trim();
      if (!s) return [];
      try { const parsed = JSON.parse(s); return normalizeItems(parsed); } catch {}
      return s.split(/\r?\n|;|,|•|·|\u2022|\u25CF|\u25A0/).map((v) => v.trim().replace(/^[-–—]\s*/, '')).filter(Boolean);
    }
    if (typeof input === 'object') {
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
  const assets = [{ fileName: 'cadt_logo.png', mime: 'image/png' }, { fileName: 'CADT_logo_with_KH.jpg', mime: 'image/jpeg' }];
  let content = html;
  for (const asset of assets) {
    let base64 = '';
    try { base64 = fs.readFileSync(path.join(process.cwd(), 'src', 'utils', asset.fileName), 'base64'); } catch { base64 = ''; }
    content = content.replaceAll(`src="${asset.fileName}"`, `src="data:${asset.mime};base64,${base64}"`);
  }
  return content;
}

function signatureTag(filePath) {
  try {
    if (!filePath) return '';
    if (!fs.existsSync(filePath)) return '';
    const ext = path.extname(filePath).toLowerCase();
    const mime = ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg' : 'image/png';
    const base64 = fs.readFileSync(filePath, 'base64');
    return `<img src="data:${mime};base64,${base64}" style="max-height:70px; max-width:220px;" />`;
  } catch { return ''; }
}

// ---------------------------------------------------------------------------
// Access control helpers (throw errors instead of writing to res)
// ---------------------------------------------------------------------------

async function resolveManagerDeptId({ role, departmentName }) {
  try {
    const roleLc = (role || '').toLowerCase();
    if ((roleLc === 'admin' || roleLc === 'management') && departmentName) {
      const dept = await Department.findOne({ where: { dept_name: departmentName } });
      return dept ? dept.id : null;
    }
  } catch {}
  return null;
}

async function isContractInManagerDept(contractId, { role, departmentName }) {
  const deptId = await resolveManagerDeptId({ role, departmentName });
  if (!deptId) return true;
  const count = await TeachingContractCourse.count({ where: { contract_id: contractId }, include: [{ model: Course, attributes: [], required: true, where: { dept_id: deptId } }] });
  return count > 0;
}

async function requireOwnedTeachingContract(contractId, userId, options = {}) {
  const contract = await TeachingContract.findByPk(contractId, options);
  if (!contract) throw new NotFoundError('Not found', { payload: { message: 'Not found' } });
  if (Number(contract.lecturer_user_id) !== Number(userId)) throw new ForbiddenError('Access denied', { payload: { message: 'Access denied' } });
  return contract;
}

async function requireTeachingContractViewAccess(contractId, { userId, role, departmentName }, options = {}) {
  const contract = await TeachingContract.findByPk(contractId, options);
  if (!contract) throw new NotFoundError('Not found', { payload: { message: 'Not found' } });
  const roleLc = String(role || '').toLowerCase();
  if (Number(contract.lecturer_user_id) === Number(userId)) return contract;
  if (roleLc === 'superadmin') return contract;
  if (roleLc === 'admin' || roleLc === 'management') {
    const ok = await isContractInManagerDept(contract.id, { role, departmentName });
    if (ok) return contract;
  }
  throw new ForbiddenError('Access denied', { payload: { message: 'Access denied' } });
}

async function requireContractForRedoResolution(contractId, { userId, role, departmentName: _departmentName }) {
  const roleLc = String(role || '').toLowerCase();
  if (roleLc === 'lecturer') return requireOwnedTeachingContract(contractId, userId);
  if (!['management', 'admin', 'superadmin'].includes(roleLc)) throw new ForbiddenError('Forbidden', { payload: { message: 'Forbidden' } });
  const contract = await TeachingContract.findByPk(contractId);
  if (!contract) throw new NotFoundError('Teaching contract not found', { payload: { message: 'Teaching contract not found' } });
  if (roleLc === 'management') {
    const userDeptId = null;
    const contractDeptId = contract.department_id ?? contract.departmentId ?? null;
    if (userDeptId && contractDeptId && String(userDeptId) !== String(contractDeptId)) {
      throw new ForbiddenError('Forbidden: cross-department access denied', { payload: { message: 'Forbidden: cross-department access denied' } });
    }
  }
  return contract;
}

// ---------------------------------------------------------------------------
// Exported service functions
// ---------------------------------------------------------------------------

export async function createDraftContractData({ body, userId: actorId, userRole, departmentName }) {
  const { lecturer_user_id, academic_year, term, year_level, start_date, end_date } = body;
  const coursesIn = Array.isArray(body?.courses) ? body.courses : [];
  const normalizedItemsList = normalizeItems(body?.items);
  const rawRate = body?.hourly_rate;
  const hourly_rate = rawRate !== null && rawRate !== undefined ? (Number.isFinite(Number(rawRate)) ? Number(rawRate) : null) : null;

  const errors = [];
  if (!lecturer_user_id) errors.push('lecturer_user_id is required');
  if (!academic_year) errors.push('academic_year is required');
  if (!term && term !== 0) errors.push('term is required');
  if (!coursesIn.length) errors.push('at least one course is required');
  if (errors.length) throw new ValidationError('Validation error', { payload: { message: 'Validation error', errors }, statusCode: HTTP_STATUS.BAD_REQUEST });

  const courses = coursesIn.map((c) => ({
    course_id: c?.course_id ?? null, class_id: c?.class_id ?? null, course_name: c?.course_name ?? '',
    year_level: c?.year_level ?? null, term: c?.term ?? term, academic_year: c?.academic_year ?? academic_year,
    hours: Number.isFinite(Number(c?.hours)) ? Number(c.hours) : null,
  })).filter((c) => (c.course_name && c.course_id !== null && c.course_id !== undefined) || (c.course_id !== null && c.course_id !== undefined));

  if (!courses.length) throw new ValidationError('Malformed courses', { payload: { message: 'Validation error', errors: ['courses are malformed (need course_id and course_name)'] }, statusCode: HTTP_STATUS.BAD_REQUEST });

  const toDateOnly = (v) => { if (!v) return null; try { const d = new Date(v); if (isNaN(d.getTime())) return null; return d.toISOString().slice(0, 10); } catch { return null; } };
  const parsedLecturerId = parseInt(lecturer_user_id, 10);
  if (!Number.isInteger(parsedLecturerId)) throw new ValidationError('Invalid lecturer_user_id', { payload: { message: 'Validation error', errors: ['lecturer_user_id must be an integer'] }, statusCode: HTTP_STATUS.BAD_REQUEST });

  if (userRole === 'admin') {
    const deptId = await resolveManagerDeptId({ role: userRole, departmentName });
    if (!deptId) throw new ForbiddenError('Department not set', { payload: { message: 'Access denied: department not set for your account' } });
    const ids = Array.from(new Set(courses.map((c) => parseInt(c.course_id, 10)).filter((n) => Number.isInteger(n))));
    if (!ids.length) throw new ValidationError('Invalid course ids', { payload: { message: 'Validation error', errors: ['courses must reference valid course_id values'] }, statusCode: HTTP_STATUS.BAD_REQUEST });
    const okCount = await Course.count({ where: { id: ids, dept_id: deptId } });
    if (okCount !== ids.length) throw new ForbiddenError('Cross-department courses', { payload: { message: 'You can only create contracts with courses from your department' } });
  }

  const tx = await sequelize.transaction();
  try {
    const contract = await TeachingContract.create({ lecturer_user_id: parsedLecturerId, contract_type: 'TEACHING', academic_year, term, year_level: year_level || null, start_date: toDateOnly(start_date), end_date: toDateOnly(end_date), created_by: actorId, items: normalizedItemsList, hourly_rate }, { transaction: tx });
    for (const c of courses) {
      const cid = Number.isFinite(Number(c.course_id)) ? Number(c.course_id) : null;
      await TeachingContractCourse.create({ contract_id: contract.id, course_id: cid, class_id: c.class_id || null, course_name: c.course_name, year_level: c.year_level || null, term: c.term, academic_year: c.academic_year, hours: c.hours }, { transaction: tx });
    }
    if (normalizedItemsList.length) {
      await ContractItem.bulkCreate(normalizedItemsList.map((text) => ({ contract_id: contract.id, duties: text })), { transaction: tx });
    }
    await tx.commit();

    try {
      let departmentNameForNotif = null;
      try {
        const lecturerProfile = await LecturerProfile.findOne({ where: { user_id: parsedLecturerId } });
        if (lecturerProfile?.department_name) departmentNameForNotif = lecturerProfile.department_name;
      } catch {}
      const notificationSocket = getNotificationSocket();
      await notificationSocket.contractStatusChanged({ contractId: contract.id, newStatus: 'WAITING_LECTURER', recipient: parsedLecturerId });
      const mgmtPayload = { role: 'management', type: 'status_change', message: `Contract #${contract.id} created, awaiting lecturer signature`, contractId: contract.id };
      if (departmentNameForNotif) mgmtPayload.department_name = departmentNameForNotif;
      await notificationSocket.notifyRole(mgmtPayload);
      await notificationSocket.notifyRole({ role: 'admin', type: 'status_change', message: `Contract #${contract.id} created, awaiting lecturer signature`, contractId: contract.id });
    } catch {}

    return { id: contract.id };
  } catch (innerErr) {
    try { await tx.rollback(); } catch {}
    const name = innerErr?.name || '';
    const sqlMsg = innerErr?.original?.sqlMessage || innerErr?.message || '';
    if (/Sequelize(Validation|UniqueConstraint|ForeignKeyConstraint)Error/.test(name) || /FOREIGN KEY|constraint|cannot be null|duplicate/i.test(sqlMsg)) {
      throw new ValidationError('DB validation error', { payload: { message: 'Validation error', errors: [sqlMsg || name] }, statusCode: HTTP_STATUS.BAD_REQUEST });
    }
    throw innerErr;
  }
}

export async function getContractData({ id, userId, role, departmentName }) {
  await requireTeachingContractViewAccess(id, { userId, role, departmentName }, { attributes: ['id', 'lecturer_user_id'] });

  const contract = await TeachingContract.findByPk(id, {
    include: [
      { model: TeachingContractCourse, as: 'contractCourses', include: [{ model: Course, required: false, attributes: ['id', 'dept_id', 'course_code', 'course_name'], include: [{ model: Department, required: false, attributes: ['id', 'dept_name'] }] }] },
      { model: User, as: 'lecturer', attributes: ['id', 'email', 'display_name', 'department_name'], include: [{ model: LecturerProfile, attributes: ['title', 'full_name_english', 'full_name_khmer', 'position'], required: false }] },
    ],
  });
  if (!contract) throw new NotFoundError('Not found', { payload: { message: 'Not found' } });
  return contract;
}

export async function listContractsData({ query, userId, userRole: role, departmentName }) {
  const page = Math.max(parseInt(query.page, 10) || 1, 1);
  const limit = Math.min(parseInt(query.limit, 10) || PAGINATION_DEFAULT_LIMIT, PAGINATION_MAX_LIMIT);
  const offset = (page - 1) * limit;
  const { academic_year, term, status, q } = query;

  const where = {};
  const requestedType = String(query.contract_type || 'TEACHING').toUpperCase();
  where.contract_type = requestedType === 'ADVISOR' ? 'ADVISOR' : 'TEACHING';
  if (academic_year) where.academic_year = academic_year;
  if (term) where.term = term;
  if (status) { const s = String(status).toUpperCase(); where.status = CONTRACT_STATUS_ALIAS_MAP[s] || s; }

  const roleLc = String(role || '').toLowerCase();
  if (roleLc === 'lecturer') where.lecturer_user_id = userId;

  const include = [
    { model: TeachingContractCourse, as: 'contractCourses', include: [{ model: Course, required: false, attributes: ['id', 'dept_id', 'course_code', 'course_name'], include: [{ model: Department, required: false, attributes: ['id', 'dept_name'] }] }] },
    { model: User, as: 'lecturer', attributes: ['id', 'email', 'display_name', 'department_name'], include: [{ model: LecturerProfile, attributes: ['id', 'candidate_id', 'title', 'full_name_english', 'full_name_khmer', 'position'], required: false }] },
  ];

  if (roleLc === 'admin' || roleLc === 'management') {
    const deptId = await resolveManagerDeptId({ role, departmentName });
    if (!deptId) return { data: [], page, limit, total: 0 };
    include[0] = { model: TeachingContractCourse, as: 'contractCourses', required: true, include: [{ model: Course, required: true, where: { dept_id: deptId }, attributes: ['id', 'dept_id', 'course_code', 'course_name'], include: [{ model: Department, required: false, attributes: ['id', 'dept_name'] }] }] };
  }

  if (q) {
    const like = `%${q}%`;
    include[1].required = true;
    include[1].where = { [Op.or]: [{ display_name: { [Op.like]: like } }, { email: { [Op.like]: like } }] };
  }

  const { rows, count } = await TeachingContract.findAndCountAll({ where, include, limit, offset, distinct: true, subQuery: false, order: [['created_at', 'DESC']] });

  let data = rows;
  try {
    if (['admin', 'management', 'superadmin'].includes(role)) {
      const latestRedoRequesterRoleByContractId = new Map();
      const contractIds = rows.map((row) => row.id).filter(Boolean);
      if (contractIds.length) {
        const redoRows = await ContractRedoRequest.findAll({ attributes: ['contract_id', 'requester_role', 'created_at'], where: { contract_id: { [Op.in]: contractIds } }, order: [['contract_id', 'ASC'], ['created_at', 'DESC']] });
        for (const redoRow of redoRows) { if (!latestRedoRequesterRoleByContractId.has(redoRow.contract_id)) latestRedoRequesterRoleByContractId.set(redoRow.contract_id, redoRow.requester_role); }
      }

      const enriched = [];
      for (const row of rows) {
        const plain = row.toJSON();
        plain.latest_redo_requester_role = latestRedoRequesterRoleByContractId.get(plain.id) || null;
        let hourlyRateUsd = null;
        if (plain.hourly_rate !== null && plain.hourly_rate !== undefined && plain.hourly_rate !== '') {
          const contractRate = parseFloat(String(plain.hourly_rate));
          if (Number.isFinite(contractRate)) hourlyRateUsd = contractRate;
        }
        if (hourlyRateUsd === null) {
          try {
            const candidateId = plain?.lecturer?.LecturerProfile?.candidate_id;
            if (candidateId) {
              const candById = await Candidate.findByPk(candidateId);
              if (candById && candById.hourlyRate !== null && candById.hourlyRate !== undefined) { const parsed = parseFloat(String(candById.hourlyRate).replace(/[^0-9.\-]/g, '')); hourlyRateUsd = Number.isFinite(parsed) ? parsed : null; }
            }
            if (hourlyRateUsd !== null) { plain.hourlyRateThisYear = hourlyRateUsd; enriched.push(plain); continue; }

            const displayName = plain?.lecturer?.display_name || '';
            let cand = null;
            if (displayName) {
              cand = await Candidate.findOne({ where: seqWhere(fn('LOWER', fn('TRIM', col('fullName'))), displayName.toLowerCase().trim()) });
              if (!cand) {
                const titleRegex = /^(mr\.?|ms\.?|mrs\.?|dr\.?|prof\.?|professor|miss)\s+/i;
                const cleanedName = displayName.replace(titleRegex, '').replace(/\s+/g, ' ').trim();
                if (cleanedName !== displayName) cand = await Candidate.findOne({ where: seqWhere(fn('LOWER', fn('TRIM', col('fullName'))), cleanedName.toLowerCase()) });
              }
            }
            if (!cand && plain?.lecturer?.email) cand = await Candidate.findOne({ where: { email: plain.lecturer.email } });
            if (cand && cand.hourlyRate !== null && cand.hourlyRate !== undefined) { const parsed = parseFloat(String(cand.hourlyRate).replace(/[^0-9.]/g, '')); hourlyRateUsd = Number.isFinite(parsed) ? parsed : null; }
          } catch {}
        }
        plain.hourlyRateThisYear = hourlyRateUsd;
        enriched.push(plain);
      }
      data = enriched;
    }
  } catch { data = rows; }

  return { data, page, limit, total: count };
}

export async function generatePdfData({ id, userId, role, departmentName }) {
  await requireTeachingContractViewAccess(id, { userId, role, departmentName }, { attributes: ['id', 'lecturer_user_id'] });

  const contract = await TeachingContract.findByPk(id, {
    include: [
      { model: TeachingContractCourse, as: 'contractCourses', include: [{ model: ClassModel, attributes: ['name', 'year_level'], required: false }] },
      { model: User, as: 'lecturer', attributes: ['id', 'email', 'display_name', 'department_name'], include: [{ model: LecturerProfile, attributes: ['title', 'full_name_khmer', 'position'], required: false }] },
      { model: User, as: 'creator', attributes: ['id', 'email', 'display_name', 'department_name'] },
      { model: ContractItem, as: 'contractItems', required: false },
    ],
  });
  if (!contract) throw new NotFoundError('Not found', { payload: { message: 'Not found' } });

  let htmlEn = loadTemplate('lecturer_contract.html');
  let htmlKh = loadTemplate('khmer_contract.html');
  const titleRaw = contract.lecturer?.LecturerProfile?.title || null;
  const titleEnMap = { Mr: 'Mr.', Ms: 'Ms.', Mrs: 'Mrs.', Dr: 'Dr.', Prof: 'Prof.' };
  const titleKhMap = { Mr: 'លោក', Ms: 'កញ្ញា', Mrs: 'លោកស្រី', Dr: 'ឌុកទ័រ', Prof: 'សាស្ត្រាចារ្យ' };
  const enPrefix = titleRaw && titleEnMap[titleRaw] ? `${titleEnMap[titleRaw]} ` : '';
  const khPrefix = titleRaw && titleKhMap[titleRaw] ? `${titleKhMap[titleRaw]} ` : '';
  const baseName = contract.lecturer?.display_name || contract.lecturer?.email || 'Lecturer';
  const displayName = contract.lecturer?.display_name || '';
  const lecturerNameEn = displayName ? `${enPrefix}${displayName}` : baseName;
  const khFullName = contract.lecturer?.LecturerProfile?.full_name_khmer || '';
  const lecturerNameKh = khFullName ? `${khPrefix}${khFullName}` : '';
  const positionEn = contract.lecturer?.LecturerProfile?.position || 'Lecturer';
  const posNorm = String(positionEn || '').trim().toLowerCase();
  const khMap = { lecturer: 'សាស្ត្រាចារ្យ', 'assistant lecturer': 'សាស្ត្រាចារ្យជំនួយ', 'senior lecturer': 'សាស្ត្រាចារ្យជាន់ខ្ពស់', advisor: 'អ្នកប្រឹក្សា', adviser: 'អ្នកប្រឹក្សា', 'adjunct lecturer': 'សាស្ត្រាចារ្យបន្ថែម', 'visiting lecturer': 'សាស្ត្រាចារ្យអាគន្ដុកៈ', 'teaching assistant': 'សាស្ត្រាចារ្យជំនួយ', 'teaching assistant (ta)': 'សាស្ត្រាចារ្យជំនួយ', ta: 'សាស្ត្រាចារ្យជំនួយ' };
  let positionKh = khMap[posNorm];
  if (!positionKh && /teaching\s*assistant|assistant\s*lecturer|^ta$/.test(posNorm)) positionKh = 'សាស្ត្រាចារ្យជំនួយ';
  if (!positionKh) positionKh = 'សាស្ត្រាចារ្យ';

  const startDate = (contract.start_date ? new Date(contract.start_date) : new Date()).toISOString().slice(0, 10);
  const subject = contract.contractCourses[0]?.course_name || 'Course';
  const hours = contract.contractCourses.reduce((a, c) => a + (c.hours || 0), 0) || 0;

  let hourlyRateUsd = 0;
  try {
    const titleRegex = /^(mr\.?|ms\.?|mrs\.?|dr\.?|prof\.?|professor|miss)\s+/i;
    const normalizeName = (s = '') => String(s).trim().replace(titleRegex, '').replace(/\s+/g, ' ').trim();
    const rawName = contract.lecturer?.display_name || '';
    const cleanedName = normalizeName(rawName);
    let cand = null;
    if (cleanedName) cand = await Candidate.findOne({ where: seqWhere(fn('LOWER', fn('TRIM', col('fullName'))), cleanedName.toLowerCase()) });
    if (!cand && contract.lecturer?.email) cand = await Candidate.findOne({ where: { email: contract.lecturer.email } });
    if (cand && cand.hourlyRate !== null && cand.hourlyRate !== undefined) { const parsed = parseFloat(String(cand.hourlyRate).replace(/[^0-9.]/g, '')); hourlyRateUsd = Number.isFinite(parsed) ? parsed : 0; }
  } catch {}

  const totalUsd = (hours || 0) * (hourlyRateUsd || 0);
  const usdToKhr = parseFloat(process.env.USD_TO_KHR || process.env.EXCHANGE_RATE_KHR || '4100');
  const totalKhr = Math.round((Number.isFinite(totalUsd) ? totalUsd : 0) * (Number.isFinite(usdToKhr) ? usdToKhr : 4100));
  const monthlyKhr = Math.round(totalKhr / 3);

  const firstCourse = contract.contractCourses?.find((c) => c?.Class) || contract.contractCourses?.[0] || null;
  const className = firstCourse?.Class?.name || '';
  const yearLevel = firstCourse?.year_level || firstCourse?.Class?.year_level || contract.year_level || '';
  const genEn = className && yearLevel ? `${className} (${yearLevel})` : className || yearLevel || '';
  const deptName = contract?.creator?.department_name || contract?.lecturer?.department_name || '';

  let items = [];
  try {
    const itemRows = await ContractItem.findAll({ where: { contract_id: contract.id }, order: [['id', 'ASC']] });
    items = itemRows.map((r) => r.duties).filter(Boolean);
  } catch {}
  if (!items.length) items = normalizeItems(contract.items);

  const safeItem = (text) => String(text || '').replace(/[&<>]/g, (s) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[s]);
  const enRows = items.map((text, idx) => `<tr>\n  <td style="width:40px; text-align:center; color:#003366; font-weight:bold;">${idx + 1}</td>\n  <td>${safeItem(text)}</td>\n</tr>`).join('\n');
  const khRows = items.map((text, idx) => `<tr>\n  <td style="width:40px; text-align:center; color:#003366; font-weight:bold;">${toKhmerDigits(idx + 1)}</td>\n  <td>${String(text || '')}</td>\n</tr>`).join('\n');

  const lecturerSig = signatureTag(contract.lecturer_signature_path);
  const managementSig = signatureTag(contract.management_signature_path);

  htmlEn = htmlEn.replaceAll('{positionEn}', positionEn).replace(/\(The "Lecturer"\)/, `(The "${positionEn}")`);
  htmlEn = embedLogo(htmlEn).replaceAll('{lecturer_name}', lecturerNameEn).replaceAll('{start_date}', startDate).replaceAll('{salary}', monthlyKhr.toLocaleString('en-US')).replaceAll('{subject}', subject).replaceAll('{term}', contract.term).replaceAll('{gen}', genEn).replaceAll('{dept_name}', deptName).replaceAll('{items_rows}', enRows).replaceAll('{total_salary}', totalKhr.toLocaleString('en-US')).replaceAll('{sign_date}', startDate).replaceAll('{lecturer_signature}', lecturerSig).replaceAll('{management_signature}', managementSig);
  htmlKh = embedLogo(htmlKh).replaceAll('{lecturer_nameKh}', lecturerNameKh).replaceAll('{start_date}', startDate).replaceAll('{salary}', toKhmerDigits(monthlyKhr)).replaceAll('{subject}', subject).replaceAll('{term}', toKhmerDigits(contract.term)).replaceAll('{gen}', toKhmerDigits(genEn)).replaceAll('{dept_name}', deptName).replaceAll('{items_rows}', khRows).replaceAll('{total_salary}', toKhmerDigits(totalKhr)).replaceAll('{date}', toKhmerDigits(new Date().getDate())).replaceAll('{month}', toKhmerDigits(new Date().getMonth() + 1)).replaceAll('{year}', toKhmerDigits(new Date().getFullYear())).replaceAll('{lecturer_signature}', lecturerSig).replaceAll('{management_signature}', managementSig).replaceAll('{positionKh}', positionKh);

  const combined = `<html><head><style>.page-break{page-break-before:always;}</style></head><body><div>${htmlEn}</div><div class="page-break"></div><div>${htmlKh}</div></body></html>`;

  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setContent(combined, { waitUntil: 'networkidle0' });
  const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true });
  await browser.close();

  const rawLecturerName = contract.lecturer?.display_name || contract.lecturer?.email || 'Lecturer';
  const dirSafe = String(rawLecturerName).toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '') || 'lecturer';
  const fileBase = String(rawLecturerName).replace(/[^A-Za-z0-9]+/g, ' ').trim().replace(/\s+/g, '');
  const outDir = path.join(process.cwd(), 'uploads', 'contracts', dirSafe);
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  const filePath = path.join(outDir, `${fileBase || 'Contract'}_Contract.pdf`);
  fs.writeFileSync(filePath, pdfBuffer);
  await contract.update({ pdf_path: filePath });

  return { pdfBuffer, filename: `${fileBase || 'Contract'}_Contract.pdf` };
}

export async function generateLecturerSummaryPdfData({ query, role, departmentName }) {
  if (role !== 'admin') throw new ForbiddenError('Only department admins can generate lecturer contract summaries', { payload: { message: 'Only department admins can generate lecturer contract summaries' } });

  const departmentId = await resolveManagerDeptId({ role, departmentName });
  if (!departmentName || !departmentId) throw new ForbiddenError('Department not set', { payload: { message: 'Your account is not assigned to a department' } });

  const academicYear = String(query.academic_year || '').trim();
  const requestedType = normalizeTeachingSummaryType(query.type);
  const classNames = normalizeSummaryClassNames(query.class_name || query.className || query.class_names || query.classNames);
  if (!academicYear || !classNames.length) throw new ValidationError('Missing params', { payload: { message: 'academic_year and at least one class_name are required' }, statusCode: HTTP_STATUS.BAD_REQUEST });

  const contracts = await TeachingContract.findAll({
    where: { academic_year: academicYear, contract_type: 'TEACHING' },
    include: [
      { model: TeachingContractCourse, as: 'contractCourses', required: true, include: [{ model: ClassModel, attributes: ['id', 'name', 'year_level'], required: true, where: { name: classNames.length === 1 ? classNames[0] : { [Op.in]: classNames } } }, { model: Course, attributes: ['id', 'dept_id', 'course_name'], required: true, where: { dept_id: departmentId } }] },
      { model: User, as: 'lecturer', attributes: ['id', 'email', 'display_name'], required: true, include: [{ model: LecturerProfile, attributes: ['id', 'candidate_id', 'full_name_english', 'full_name_khmer', 'bank_name', 'account_number'], required: false }] },
    ],
    order: [[{ model: User, as: 'lecturer' }, 'display_name', 'ASC'], ['id', 'ASC']],
  });

  const matchedContracts = contracts.map((contract) => {
    const matchingCourses = (contract.contractCourses || []).filter((course) => courseMatchesTeachingSummaryType(course, requestedType));
    return matchingCourses.length ? { contract, matchingCourses } : null;
  }).filter(Boolean);

  if (!matchedContracts.length) {
    const msg = requestedType ? 'No lecturer contracts found for the selected academic year, type, and class' : 'No lecturer contracts found for the selected academic year and class';
    throw new NotFoundError(msg, { payload: { message: msg } });
  }

  const dateKeys = Array.from(new Set(matchedContracts.map(({ contract }) => {
    const start = contract.start_date ? new Date(contract.start_date).toISOString().slice(0, 10) : '';
    const end = contract.end_date ? new Date(contract.end_date).toISOString().slice(0, 10) : '';
    return `${start}|${end}`;
  })));
  if (dateKeys.length !== 1) throw new ConflictError('Date range mismatch', { payload: { message: 'Selected lecturer contracts do not share a single start and end date range' } });

  const [startDate, endDate] = dateKeys[0].split('|');
  const department = await Department.findByPk(departmentId, { attributes: ['dept_name_khmer'] });
  const departmentNameKhmer = department?.dept_name_khmer || departmentName;
  const typeLabels = requestedType ? getTeachingSummaryTypeLabels(requestedType) : null;
  const exchangeRate = Number.parseFloat(process.env.USD_TO_KHR || process.env.EXCHANGE_RATE_KHR || '4100') || 4100;

  const mappingTerms = Array.from(new Set(matchedContracts.flatMap(({ matchingCourses }) => matchingCourses.map((course) => String(course.term || '').trim())).filter(Boolean)));
  const mappingTermFilters = expandSummaryTermFilters(mappingTerms);
  const mappingLecturerProfileIds = Array.from(new Set(matchedContracts.map(({ contract }) => contract.lecturer?.LecturerProfile?.id).filter(Boolean)));

  const courseMappings = await CourseMapping.findAll({
    where: { academic_year: academicYear, ...(mappingTermFilters.length ? { term: { [Op.in]: mappingTermFilters } } : {}), ...(mappingLecturerProfileIds.length ? { [Op.or]: [{ lecturer_profile_id: { [Op.in]: mappingLecturerProfileIds } }, { lecturer_profile_id: null }] } : {}) },
    attributes: ['lecturer_profile_id', 'course_id', 'class_id', 'academic_year', 'term', 'theory_hours', 'theory_groups', 'theory_15h_combined', 'lab_hours', 'lab_groups'],
    include: [{ model: ClassModel, attributes: ['id', 'name'], required: true, where: { name: classNames.length === 1 ? classNames[0] : { [Op.in]: classNames } } }, { model: Course, attributes: ['id', 'course_name', 'dept_id'], required: true, where: { dept_id: departmentId } }],
  });

  const mappingByIdKey = new Map();
  const mappingByNameKey = new Map();
  const processedMappingFingerprints = new Set();
  for (const mapping of courseMappings) {
    const mappingFingerprint = [String(mapping.lecturer_profile_id || ''), String(mapping.course_id || ''), String(mapping.class_id || ''), String(mapping.academic_year || ''), normalizeSummaryTerm(mapping.term), String(mapping.theory_hours || ''), String(mapping.theory_groups || 0), String(Boolean(mapping.theory_15h_combined)), String(mapping.lab_hours || ''), String(mapping.lab_groups || 0)].join('|');
    if (processedMappingFingerprints.has(mappingFingerprint)) continue;
    processedMappingFingerprints.add(mappingFingerprint);
    const idKey = buildCourseMappingKey({ lecturerProfileId: mapping.lecturer_profile_id, courseId: mapping.course_id, classId: mapping.class_id, academicYear: mapping.academic_year, term: mapping.term });
    const nameKey = buildCourseMappingNameKey({ lecturerProfileId: mapping.lecturer_profile_id, courseName: mapping.Course?.course_name, className: mapping.Class?.name, academicYear: mapping.academic_year, term: mapping.term });
    const current = mappingByIdKey.get(idKey) || mappingByNameKey.get(nameKey) || { theoryHours: 0, theoryGroups: 0, theoryCombined: false, practiceHours: 0, practiceGroups: 0 };
    current.theoryHours = Math.max(current.theoryHours, parseHoursValue(mapping.theory_hours));
    current.theoryGroups += Number(mapping.theory_groups || 0);
    current.theoryCombined = current.theoryCombined || Boolean(mapping.theory_15h_combined);
    current.practiceHours = Math.max(current.practiceHours, parseHoursValue(mapping.lab_hours));
    current.practiceGroups += Number(mapping.lab_groups || 0);
    mappingByIdKey.set(idKey, current);
    mappingByNameKey.set(nameKey, current);
    const idKeyNoLecturer = buildCourseMappingKey({ lecturerProfileId: '', courseId: mapping.course_id, classId: mapping.class_id, academicYear: mapping.academic_year, term: mapping.term });
    const nameKeyNoLecturer = buildCourseMappingNameKey({ lecturerProfileId: '', courseName: mapping.Course?.course_name, className: mapping.Class?.name, academicYear: mapping.academic_year, term: mapping.term });
    if (!mappingByIdKey.has(idKeyNoLecturer)) mappingByIdKey.set(idKeyNoLecturer, current);
    if (!mappingByNameKey.has(nameKeyNoLecturer)) mappingByNameKey.set(nameKeyNoLecturer, current);
  }

  let totalUsd = 0;
  let totalKhr = 0;
  const hourlyRateCache = new Map();
  const summaryRowEntries = [];

  for (const { contract, matchingCourses } of matchedContracts) {
    const profile = contract.lecturer?.LecturerProfile;
    const lecturerNameEn = profile?.full_name_english || contract.lecturer?.display_name || contract.lecturer?.email || '-';
    const lecturerNameKh = profile?.full_name_khmer || '-';
    const hourlyRate = await resolveSummaryHourlyRate(contract, hourlyRateCache);

    for (const course of matchingCourses) {
      const mappingKey = buildCourseMappingKey({ lecturerProfileId: profile?.id, courseId: course.course_id, classId: course.class_id, academicYear, term: course.term });
      const mappingKeyNoLecturer = buildCourseMappingKey({ lecturerProfileId: '', courseId: course.course_id, classId: course.class_id, academicYear, term: course.term });
      const mappingNameKey = buildCourseMappingNameKey({ lecturerProfileId: profile?.id, courseName: course.course_name, className: course.Class?.name, academicYear, term: course.term });
      const mappingNameKeyNoLecturer = buildCourseMappingNameKey({ lecturerProfileId: '', courseName: course.course_name, className: course.Class?.name, academicYear, term: course.term });
      const courseMapping = mappingByIdKey.get(mappingKey) || mappingByIdKey.get(mappingKeyNoLecturer) || mappingByNameKey.get(mappingNameKey) || mappingByNameKey.get(mappingNameKeyNoLecturer);

      const theoryHours = courseMapping?.theoryHours || 0;
      const theoryGroups = courseMapping?.theoryGroups || (theoryHours > 0 ? 1 : 0);
      const theoryCombined = shouldInferCombinedTheory({ contractTotalHours: course.hours, theoryHours, theoryGroups, practiceHours: courseMapping?.practiceHours || 0, practiceGroups: courseMapping?.practiceGroups || 0, theoryCombined: Boolean(courseMapping?.theoryCombined) });
      const practiceHours = courseMapping?.practiceHours || 0;
      const practiceGroups = courseMapping?.practiceGroups || 0;
      const fallbackTotalHours = Number(course.hours) || 0;
      const fallbackTheoryHours = !courseMapping && fallbackTotalHours > 0 ? fallbackTotalHours : theoryHours;
      const fallbackTheoryGroups = !courseMapping && fallbackTotalHours > 0 ? 1 : theoryGroups;
      const effectiveTheoryGroups = getSummaryTheoryEffectiveGroups(fallbackTheoryHours, fallbackTheoryGroups, theoryCombined);
      const effectiveTheoryTotalHours = getSummaryTheoryEffectiveTotalHours(fallbackTheoryHours, fallbackTheoryGroups, theoryCombined);
      const effectivePracticeTotalHours = practiceGroups * practiceHours;
      const mappedTotalHours = effectiveTheoryTotalHours + effectivePracticeTotalHours;
      const totalHours = fallbackTotalHours > 0 ? fallbackTotalHours : mappedTotalHours;
      const lineTotalUsd = totalHours * hourlyRate;
      const lineTotalKhr = Math.round(lineTotalUsd * exchangeRate);
      const twoMonthsUsd = (lineTotalUsd / 3) * 2;
      const twoMonthsKhr = Math.round(twoMonthsUsd * exchangeRate);
      const oneMonthUsd = lineTotalUsd / 3;
      const oneMonthKhr = Math.round(oneMonthUsd * exchangeRate);
      totalUsd += lineTotalUsd;
      totalKhr += lineTotalKhr;
      summaryRowEntries.push({ subject: course.course_name || typeLabels?.en || '-', lecturerNameEn, lecturerNameKh, accountNumber: profile?.account_number || '-', bankName: profile?.bank_name || '-', hourlyRate, theoryCombined, displayTheoryGroups: theoryCombined && Number(fallbackTheoryHours) === 15 && Number(fallbackTheoryGroups) > 0 ? 1 : effectiveTheoryGroups, theoryGroups: effectiveTheoryGroups, theoryHours: fallbackTheoryHours, practiceGroups, practiceHours, totalHours, totalUsd: lineTotalUsd, totalKhr: lineTotalKhr, twoMonthsUsd, twoMonthsKhr, oneMonthUsd, oneMonthKhr, classLabel: course.Class?.name || classNames[0] || '-', studyYear: course.year_level || course.Class?.year_level || contract.year_level || '-' });
    }
  }

  const summaryRows = summaryRowEntries.map((row, index) => `<tr>
        <td class="nowrap">${toKhmerDigits(index + 1)}</td>
        <td class="subject-name">${escapeHtml(row.subject)}</td>
        <td class="nowrap">${escapeHtml(row.lecturerNameEn)}</td>
        <td class="nowrap">${escapeHtml(row.lecturerNameKh)}</td>
        <td class="nowrap">${escapeHtml(row.accountNumber)}</td>
        <td class="nowrap">${escapeHtml(row.bankName)}</td>
        <td class="money-cell nowrap">$${formatMoneySummary(row.hourlyRate)}</td>
        <td class="nowrap">${toKhmerDigits(row.displayTheoryGroups)}</td>
        <td class="nowrap">${toKhmerDigits(row.theoryHours)}</td>
        <td class="nowrap">${toKhmerDigits(row.practiceGroups)}</td>
        <td class="nowrap">${toKhmerDigits(row.practiceHours)}</td>
        <td class="nowrap">${toKhmerDigits(row.totalHours)}</td>
        <td class="money-cell nowrap">$${formatMoneySummary(row.totalUsd)}</td>
        <td class="money-cell nowrap">${formatKhmerMoneySummary(row.totalKhr)}</td>
        <td class="money-cell nowrap">$${formatMoneySummary(row.twoMonthsUsd)}</td>
        <td class="money-cell nowrap">${formatKhmerMoneySummary(row.twoMonthsKhr)}</td>
        <td class="money-cell nowrap">$${formatMoneySummary(row.oneMonthUsd)}</td>
        <td class="money-cell nowrap">${formatKhmerMoneySummary(row.oneMonthKhr)}</td>
        <td class="nowrap">${escapeHtml(row.classLabel)}</td>
        <td class="nowrap">${escapeHtml(String(row.studyYear))}</td>
      </tr>`).join('');

  const totalTwoMonthsUsd = (totalUsd * 2) / 3;
  const totalTwoMonthsKhr = Math.round(totalTwoMonthsUsd * exchangeRate);
  const totalOneMonthUsd = totalUsd / 3;
  const totalOneMonthKhr = Math.round(totalOneMonthUsd * exchangeRate);

  let html = loadTemplate('Lecturer_Contract_Summary_V2.html');
  html = embedLogo(html).replaceAll('{dept_name_khmer}', escapeHtml(departmentNameKhmer)).replaceAll('{summary_title_line_1}', escapeHtml(formatLecturerSummaryGenerationTitle(classNames))).replaceAll('{summary_title_line_2}', 'នៃបណ្ឌិតសភាបច្ចេកវិទ្យាឌីជីថលកម្ពុជា').replaceAll('{summary_date_range_kh}', escapeHtml(formatTeachingSummaryDateRangeKh(startDate, endDate))).replaceAll('{summary_rows}', summaryRows).replaceAll('{summary_total_usd}', `$${formatMoneySummary(totalUsd)}`).replaceAll('{summary_total_khr}', formatKhmerMoneySummary(totalKhr)).replaceAll('{summary_total_2months_usd}', `$${formatMoneySummary(totalTwoMonthsUsd)}`).replaceAll('{summary_total_2months_khr}', formatKhmerMoneySummary(totalTwoMonthsKhr)).replaceAll('{summary_total_1month_usd}', `$${formatMoneySummary(totalOneMonthUsd)}`).replaceAll('{summary_total_1month_khr}', formatKhmerMoneySummary(totalOneMonthKhr));

  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: 'networkidle0' });
  const pdfBuffer = await page.pdf({ format: 'A4', landscape: true, printBackground: true });
  await browser.close();

  const safeType = (typeLabels?.en || 'lecturer-summary').replace(/[^a-z0-9]+/gi, '-').toLowerCase();
  const safeClass = classNames.length === 1 ? classNames[0].replace(/[^a-z0-9]+/gi, '-').toLowerCase() : `${classNames.length}-classes`;
  return { pdfBuffer, filename: `${safeType}-${safeClass}-${academicYear}.pdf` };
}

export async function updateStatusData({ id, body, userId, role }) {
  const statusRaw = body.status;
  const status = CONTRACT_STATUS_ALIAS_MAP[String(statusRaw || '').trim().toUpperCase()] || String(statusRaw || '').trim();
  const { remarks } = body;
  const roleLc = String(role || '').toLowerCase();

  let contract;
  if (roleLc === 'lecturer') {
    contract = await requireOwnedTeachingContract(id, userId);
  } else {
    contract = await TeachingContract.findByPk(id);
    if (!contract) throw new NotFoundError('Teaching contract not found', { payload: { message: 'Teaching contract not found' } });
  }

  if (contract.status === 'COMPLETED' && status !== 'COMPLETED') throw new ValidationError('Immutable status', { payload: { message: 'Completed contracts cannot change status' }, statusCode: HTTP_STATUS.BAD_REQUEST });

  if (status === 'REQUEST_REDO') {
    const isLecturerSideRole = roleLc === 'lecturer' || roleLc === 'advisor';
    const isManagementSideRole = roleLc === 'admin' || roleLc === 'management' || roleLc === 'superadmin';
    if (!isLecturerSideRole && !isManagementSideRole) throw new ForbiddenError('Access denied', { payload: { message: 'Access denied' } });
    if (!String(remarks || '').trim()) throw new ValidationError('Remarks required', { payload: { message: 'remarks is required when requesting redo' }, statusCode: HTTP_STATUS.BAD_REQUEST });
    if (!['WAITING_LECTURER', 'WAITING_MANAGEMENT', 'REQUEST_REDO'].includes(contract.status)) throw new ValidationError('Invalid transition', { payload: { message: 'Invalid status transition' }, statusCode: HTTP_STATUS.BAD_REQUEST });

    const tx = await sequelize.transaction();
    try {
      await ContractRedoRequest.create({ contract_id: contract.id, requester_user_id: userId, requester_role: isLecturerSideRole ? 'LECTURER' : 'MANAGEMENT', message: String(remarks).trim() }, { transaction: tx });
      await contract.update({ status: 'REQUEST_REDO', management_remarks: String(remarks).trim(), lecturer_signature_path: null, management_signature_path: null, lecturer_signed_at: null, management_signed_at: null, pdf_path: null }, { transaction: tx });
      await tx.commit();
      return { message: 'Updated', status: 'REQUEST_REDO' };
    } catch (innerErr) {
      try { await tx.rollback(); } catch {}
      throw new ValidationError('Failed to request redo', { payload: { message: 'Failed to request redo', error: innerErr?.message || 'Unknown error' }, statusCode: HTTP_STATUS.BAD_REQUEST });
    }
  }

  if (status === 'WAITING_MANAGEMENT' && !contract.lecturer_signed_at) throw new ValidationError('Signature required', { payload: { message: 'Lecturer signature is required before waiting management' }, statusCode: HTTP_STATUS.BAD_REQUEST });
  if (status === 'COMPLETED' && (!contract.lecturer_signed_at || !contract.management_signed_at)) throw new ValidationError('Both signatures required', { payload: { message: 'Both signatures are required before completing' }, statusCode: HTTP_STATUS.BAD_REQUEST });

  await contract.update({ status });

  try {
    const notificationSocket = getNotificationSocket();
    await notificationSocket.contractStatusChanged({ contractId: contract.id, newStatus: status, recipient: contract.lecturer_user_id, changedBy: userId || null });
  } catch {}

  return { message: 'Updated' };
}

export async function listRedoRequestsData({ id, userId, role, departmentName }) {
  await requireTeachingContractViewAccess(id, { userId, role, departmentName }, { attributes: ['id', 'lecturer_user_id'] });
  const rows = await ContractRedoRequest.findAll({ where: { contract_id: id }, include: [{ model: User, as: 'requester', attributes: ['id', 'email', 'display_name'] }], order: [['created_at', 'DESC']] });
  return { data: rows };
}

export async function createRedoRequestData({ id, body, userId, role, departmentName }) {
  const message = String(body.message || '').trim();
  await requireTeachingContractViewAccess(id, { userId, role, departmentName }, { attributes: ['id', 'lecturer_user_id'] });
  const contract = await TeachingContract.findByPk(id, { attributes: ['id', 'lecturer_user_id'] });

  const roleLc = String(role || '').toLowerCase();
  const isLecturerSideRole = roleLc === 'lecturer' || roleLc === 'advisor';
  const requesterRole = isLecturerSideRole ? 'LECTURER' : 'MANAGEMENT';

  const tx = await sequelize.transaction();
  try {
    const reqRow = await ContractRedoRequest.create({ contract_id: id, requester_user_id: userId, requester_role: requesterRole, message }, { transaction: tx });
    await contract.update({ status: 'REQUEST_REDO', management_remarks: message || null, lecturer_signature_path: null, management_signature_path: null, lecturer_signed_at: null, management_signed_at: null, pdf_path: null }, { transaction: tx });
    await tx.commit();
    return { id: reqRow.id };
  } catch (innerErr) {
    try { await tx.rollback(); } catch {}
    throw new ValidationError('Failed to create redo request', { payload: { message: 'Failed to create redo request', error: innerErr?.message || 'Unknown error' }, statusCode: HTTP_STATUS.BAD_REQUEST });
  }
}

export async function updateRedoRequestStatusData({ contractId, requestId, body, userId, role, departmentName }) {
  const { resolved } = body;
  const contract = await requireContractForRedoResolution(contractId, { userId, role, departmentName });
  if (!contract) throw new NotFoundError('Not found');
  const row = await ContractRedoRequest.findOne({ where: { id: requestId, contract_id: contractId } });
  if (!row) throw new NotFoundError('Redo request not found', { payload: { message: 'Redo request not found' } });
  await row.update({ resolved_at: resolved ? new Date() : null, resolved_by_user_id: resolved ? userId : null });
  return { message: 'Updated', resolved: !!resolved };
}

export async function editContractData({ id, body, userId, role, departmentName }) {
  const roleLc = String(role || '').toLowerCase();
  let contract;
  if (roleLc === 'admin') {
    contract = await TeachingContract.findByPk(id);
    if (!contract) throw new NotFoundError('Contract not found', { payload: { message: 'Contract not found' } });
  } else {
    contract = await requireOwnedTeachingContract(id, userId);
  }
  if (contract.status !== 'REQUEST_REDO') throw new ConflictError('Wrong status', { payload: { message: 'Contract can only be edited when status is REQUEST_REDO' } });

  const toDateOnly = (v) => { if (v === null || v === undefined || v === '') return null; try { const d = new Date(v); if (isNaN(d.getTime())) return null; return d.toISOString().slice(0, 10); } catch { return null; } };
  const normalizedItemsList = Object.prototype.hasOwnProperty.call(body, 'items') ? normalizeItems(body.items) : null;
  const coursesIn = Array.isArray(body?.courses) ? body.courses : null;

  if (coursesIn && roleLc === 'admin') {
    const deptId = await resolveManagerDeptId({ role, departmentName });
    if (!deptId) throw new ForbiddenError('Department not set', { payload: { message: 'Access denied: department not set for your account' } });
    const ids = Array.from(new Set(coursesIn.map((c) => parseInt(c?.course_id, 10)).filter((n) => Number.isInteger(n) && n > 0)));
    if (!ids.length) throw new ValidationError('Invalid course ids', { payload: { message: 'Validation error', errors: ['courses must reference valid course_id values'] }, statusCode: HTTP_STATUS.BAD_REQUEST });
    const okCount = await Course.count({ where: { id: ids, dept_id: deptId } });
    if (okCount !== ids.length) throw new ForbiddenError('Cross-department courses', { payload: { message: 'You can only use courses from your department' } });
  }

  const tx = await sequelize.transaction();
  try {
    const updatePayload = { status: 'WAITING_LECTURER', lecturer_signature_path: null, management_signature_path: null, lecturer_signed_at: null, management_signed_at: null, pdf_path: null };
    if (body.academic_year !== undefined) updatePayload.academic_year = body.academic_year;
    if (body.term !== undefined) updatePayload.term = String(body.term);
    if (Object.prototype.hasOwnProperty.call(body, 'year_level')) updatePayload.year_level = body.year_level ?? null;
    if (Object.prototype.hasOwnProperty.call(body, 'start_date')) updatePayload.start_date = toDateOnly(body.start_date);
    if (Object.prototype.hasOwnProperty.call(body, 'end_date')) updatePayload.end_date = toDateOnly(body.end_date);
    if (normalizedItemsList !== null) updatePayload.items = normalizedItemsList;
    await contract.update(updatePayload, { transaction: tx });

    if (coursesIn) {
      const termFallback = body.term !== undefined ? String(body.term) : contract.term;
      const academicYearFallback = body.academic_year !== undefined ? body.academic_year : contract.academic_year;
      const courses = coursesIn.map((c) => ({ course_id: c?.course_id ?? null, class_id: c?.class_id ?? null, course_name: c?.course_name ?? '', year_level: c?.year_level ?? null, term: c?.term ?? termFallback, academic_year: c?.academic_year ?? academicYearFallback, hours: Number.isFinite(Number(c?.hours)) ? Number(c.hours) : null })).filter((c) => c.course_id !== null && c.course_id !== undefined);
      if (!courses.length) throw new ValidationError('Malformed courses', { payload: { message: 'courses are malformed (need at least course_id)' } });
      await TeachingContractCourse.destroy({ where: { contract_id: id }, transaction: tx });
      for (const c of courses) {
        const cid = Number.isFinite(Number(c.course_id)) ? Number(c.course_id) : null;
        await TeachingContractCourse.create({ contract_id: id, course_id: cid, class_id: c.class_id || null, course_name: c.course_name, year_level: c.year_level || null, term: String(c.term), academic_year: String(c.academic_year), hours: c.hours }, { transaction: tx });
      }
    }

    if (normalizedItemsList !== null) {
      await ContractItem.destroy({ where: { contract_id: id }, transaction: tx });
      if (normalizedItemsList.length) await ContractItem.bulkCreate(normalizedItemsList.map((text) => ({ contract_id: id, duties: text })), { transaction: tx });
    }

    await tx.commit();
    try { await ContractRedoRequest.update({ resolved_at: new Date(), resolved_by_user_id: userId }, { where: { contract_id: id, resolved_at: null } }); } catch {}
    return { message: 'Updated', id, status: 'WAITING_LECTURER' };
  } catch (innerErr) {
    try { await tx.rollback(); } catch {}
    throw new ValidationError('Failed to edit contract', { payload: { message: 'Failed to edit contract', error: innerErr?.message || 'Unknown error' }, statusCode: HTTP_STATUS.BAD_REQUEST });
  }
}

export async function deleteContractData(id) {
  const contract = await TeachingContract.findByPk(id);
  if (!contract) throw new NotFoundError('Contract not found', { payload: { message: 'Contract not found' } });
  if (contract.status === 'COMPLETED') throw new ValidationError('Cannot delete completed', { payload: { message: 'Completed contracts cannot be deleted' }, statusCode: HTTP_STATUS.BAD_REQUEST });
  const files = [contract.pdf_path, contract.lecturer_signature_path, contract.management_signature_path].filter(Boolean);
  for (const f of files) { try { if (fs.existsSync(f)) fs.unlinkSync(f); } catch {} }
  await TeachingContractCourse.destroy({ where: { contract_id: id } });
  await TeachingContract.destroy({ where: { id } });
  return { message: 'Deleted' };
}

export async function uploadSignatureData({ id, who, file, userId, role: _role }) {
  const whoCleaned = (who || 'lecturer').toLowerCase();
  let contract;
  if (whoCleaned === 'lecturer') {
    contract = await requireOwnedTeachingContract(id, userId);
  } else {
    contract = await TeachingContract.findByPk(id);
    if (!contract) throw new NotFoundError('Contract not found', { payload: { message: 'Contract not found' } });
  }
  if (!file) throw new ValidationError('No file uploaded', { payload: { message: 'No file uploaded' }, statusCode: HTTP_STATUS.BAD_REQUEST });

  let ownerName = 'unknown';
  try {
    if (whoCleaned === 'lecturer') {
      const user = await User.findByPk(contract.lecturer_user_id, { attributes: ['display_name', 'email'] });
      ownerName = user?.display_name || user?.email || 'unknown';
    } else {
      ownerName = file.uploaderDisplayName || file.uploaderEmail || 'management';
    }
  } catch {}

  const safeName = String(ownerName).toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '') || 'unknown';
  const targetDir = path.join(process.cwd(), 'uploads', 'signatures', safeName);
  if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });
  const ext = path.extname(file.filename || '') || '.png';
  const unique = `contract_${id}_${whoCleaned}_${Date.now()}${ext}`;
  const targetPath = path.join(targetDir, unique);
  try { fs.renameSync(file.path, targetPath); } catch { try { fs.copyFileSync(file.path, targetPath); fs.unlinkSync(file.path); } catch {} }

  const filePath = targetPath;
  const now = new Date();
  let departmentName = null;
  try { const lp = await LecturerProfile.findOne({ where: { user_id: contract.lecturer_user_id } }); if (lp?.department_name) departmentName = lp.department_name; } catch {}

  if (whoCleaned === 'lecturer') {
    const next = contract.management_signed_at ? 'COMPLETED' : 'WAITING_MANAGEMENT';
    await contract.update({ lecturer_signature_path: filePath, lecturer_signed_at: now, status: next });
    try {
      const notificationSocket = getNotificationSocket();
      await notificationSocket.notifyRole({ role: 'management', department_name: departmentName, type: 'status_change', message: `Contract #${contract.id} signed by lecturer, awaiting your signature`, contractId: contract.id });
      await notificationSocket.notifyRole({ role: 'admin', type: 'status_change', message: `Contract #${contract.id} signed by lecturer`, contractId: contract.id });
    } catch {}
  } else {
    const next = contract.lecturer_signed_at ? 'COMPLETED' : 'WAITING_LECTURER';
    await contract.update({ management_signature_path: filePath, management_signed_at: now, status: next });
    try {
      const notificationSocket = getNotificationSocket();
      notificationSocket.notifyLecturer({ user_id: contract.lecturer_user_id, type: 'status_change', message: `Contract #${contract.id} has been completed`, contract_id: contract.id });
      await notificationSocket.notifyRole({ role: 'admin', type: 'status_change', message: `Contract #${contract.id} completed`, contractId: contract.id });
    } catch {}
  }

  return { message: 'Signature uploaded', path: filePath, status: contract.status };
}
