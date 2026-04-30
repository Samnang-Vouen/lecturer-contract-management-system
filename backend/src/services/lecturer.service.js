import { Op, Sequelize } from 'sequelize';
import fs from 'fs';
import path from 'path';
import sequelize from '../config/db.js';
import { LecturerProfile, User, Department, Role, UserRole, DepartmentProfile } from '../model/index.js';
import Candidate from '../model/candidate.model.js';
import LecturerCourse from '../model/lecturerCourse.model.js';
import Course from '../model/course.model.js';
import { findOrCreateResearchFields } from '../services/researchField.service.js';
import { findOrCreateUniversities } from '../services/university.service.js';
import { findOrCreateMajors } from '../services/major.service.js';
import xlsx from 'xlsx';
import bcrypt from 'bcrypt';
import { ValidationError, NotFoundError, ForbiddenError } from '../utils/errors.js';

// ---------------------------------------------------------------------------
// Private helpers
// ---------------------------------------------------------------------------

const TEMP_PASSWORD_LENGTH = 10;

function generateTempPassword() {
  let tempPassword = '';
  while (tempPassword.length < TEMP_PASSWORD_LENGTH) {
    tempPassword += Math.random().toString(36).slice(2);
  }
  return tempPassword.slice(0, TEMP_PASSWORD_LENGTH);
}

function normalizeImportedRoleAndPosition(value) {
  const raw = String(value || '').trim();
  if (!raw) {
    return { roleType: 'lecturer', position: 'Lecturer', occupation: 'Lecturer' };
  }
  if (/\b(advisor|adviser)\b/i.test(raw) || /អ្នក\s*ប្រឹក្សា/.test(raw)) {
    return { roleType: 'advisor', position: 'Advisor', occupation: 'Advisor' };
  }
  if (/\b(assistant\s+lecturer|teaching\s+assistant|assistant|ta)\b/i.test(raw)) {
    return { roleType: 'lecturer', position: 'Assistant Lecturer', occupation: 'Assistant Lecturer' };
  }
  return { roleType: 'lecturer', position: 'Lecturer', occupation: 'Lecturer' };
}

function buildImportedCredentialsWorkbook(rows) {
  const worksheet = xlsx.utils.json_to_sheet(rows, { header: ['email', 'tempPassword'] });
  const workbook = xlsx.utils.book_new();
  xlsx.utils.book_append_sheet(workbook, worksheet, 'Credentials');
  return xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });
}

function normalizeImportedTitle(value) {
  const raw = String(value || '').trim().replace(/\./g, '');
  if (!raw) return null;
  const normalized = raw.toLowerCase();
  if (normalized === 'mr') return 'Mr';
  if (normalized === 'ms' || normalized === 'miss') return 'Ms';
  if (normalized === 'mrs') return 'Mrs';
  if (normalized === 'dr') return 'Dr';
  if (normalized === 'prof' || normalized === 'professor') return 'Prof';
  return null;
}

const importedTitlePrefixRegex = /^(mr\.?|ms\.?|mrs\.?|dr\.?|prof\.?|professor|miss)\s+/i;

function stripImportedTitleFromName(value) {
  return String(value || '')
    .trim()
    .replace(importedTitlePrefixRegex, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeImportedGender(value) {
  const raw = String(value || '').trim().toLowerCase();
  if (!raw) return null;
  if (['male', 'female', 'other'].includes(raw)) return raw;
  return null;
}

function inferImportedTitle({ titleInput, fullName, genderInput }) {
  const explicitTitle = normalizeImportedTitle(titleInput);
  if (String(titleInput || '').trim()) return explicitTitle;
  const inferredFromName = normalizeImportedTitle(String(fullName || '').trim().split(/\s+/)[0]);
  if (inferredFromName) return inferredFromName;
  const gender = normalizeImportedGender(genderInput);
  if (gender === 'male') return 'Mr';
  if (gender === 'female') return 'Ms';
  return null;
}

function normalizeImportedHourlyRate(value) {
  if (value === null || value === undefined || value === '') return null;
  const parsed = Number.parseFloat(String(value).replace(/[^0-9.-]/g, ''));
  if (!Number.isFinite(parsed) || parsed <= 0) return null;
  return parsed;
}

function isImportedWorksheetRowEmpty(row) {
  if (!row || typeof row !== 'object') return true;
  return Object.values(row).every((value) => {
    if (value === null || value === undefined) return true;
    if (typeof value === 'string') return value.trim() === '';
    return false;
  });
}

function sanitizeDisplayName(name) {
  const base = path.basename(String(name || '')).trim();
  if (!base) return 'syllabus.pdf';
  const cleaned = base
    .replace(/[\u0000-\u001f\u007f]/g, '')
    .replace(/\s+/g, ' ')
    .slice(0, 120)
    .trim();
  return cleaned || 'syllabus.pdf';
}

function syllabusManifestPath(folderSlug) {
  return path.join(process.cwd(), 'uploads', 'lecturers', folderSlug, 'syllabus', '_manifest.json');
}

async function readSyllabusManifest(folderSlug) {
  if (!folderSlug) return { files: [] };
  const manifestPath = syllabusManifestPath(folderSlug);
  try {
    const txt = await fs.promises.readFile(manifestPath, 'utf8');
    const parsed = JSON.parse(txt);
    if (!parsed || !Array.isArray(parsed.files)) return { files: [] };
    return { files: parsed.files };
  } catch {
    return { files: [] };
  }
}

async function listSyllabusFilesWithNames(folderSlug, legacySinglePath = null) {
  const legacy = legacySinglePath
    ? String(legacySinglePath).replace(/\\/g, '/').replace(/^\//, '')
    : null;
  if (!folderSlug) {
    return {
      files: legacy ? [legacy] : [],
      file_names: legacy ? { [legacy]: sanitizeDisplayName(legacy) } : {},
    };
  }

  const dir = path.join(process.cwd(), 'uploads', 'lecturers', folderSlug, 'syllabus');
  const manifest = await readSyllabusManifest(folderSlug);
  const originalByStored = new Map();
  for (const f of manifest.files) {
    if (!f || !f.stored) continue;
    originalByStored.set(String(f.stored), sanitizeDisplayName(f.original || f.stored));
  }

  try {
    const names = await fs.promises.readdir(dir);
    const pdfs = names
      .filter((n) => /\.pdf$/i.test(String(n)))
      .map((n) => String(n))
      .sort((a, b) => String(b).localeCompare(String(a)));

    const files = pdfs.map((n) =>
      path.join('uploads', 'lecturers', folderSlug, 'syllabus', n).replace(/\\/g, '/')
    );
    const file_names = {};
    for (let i = 0; i < pdfs.length; i += 1) {
      const stored = pdfs[i];
      const p = files[i];
      file_names[p] = originalByStored.get(stored) || sanitizeDisplayName(stored);
    }

    if (!files.length && legacy) {
      return { files: [legacy], file_names: { [legacy]: sanitizeDisplayName(legacy) } };
    }
    return { files, file_names };
  } catch {
    return {
      files: legacy ? [legacy] : [],
      file_names: legacy ? { [legacy]: sanitizeDisplayName(legacy) } : {},
    };
  }
}

// ---------------------------------------------------------------------------
// Service: listLecturers
// ---------------------------------------------------------------------------

export async function listLecturers({
  page: rawPage,
  limit: rawLimit,
  search: rawSearch,
  statusFilter: rawStatus,
  departmentFilter: rawDept,
  roleQuery,
  isAdmin,
  adminDeptName,
}) {
  const page = Math.max(parseInt(rawPage) || 1, 1);
  const limit = Math.min(Math.max(parseInt(rawLimit) || 10, 1), 100);
  const offset = (page - 1) * limit;
  const search = (rawSearch || '').trim();
  const statusFilter = (rawStatus || '').trim();
  const departmentFilter = (rawDept || '').trim();

  const roleFilters = (
    Array.isArray(roleQuery)
      ? roleQuery
      : typeof roleQuery === 'string'
        ? roleQuery.split(',')
        : []
  )
    .map((r) => String(r || '').trim().toLowerCase())
    .filter((r) => ['advisor', 'lecturer'].includes(r));

  const profileAnd = [];

  if (search) {
    const like = `%${search}%`;
    profileAnd.push({
      [Op.or]: [
        { full_name_english: { [Op.like]: like } },
        { full_name_khmer: { [Op.like]: like } },
        Sequelize.where(Sequelize.col('User.display_name'), { [Op.like]: like }),
        Sequelize.where(Sequelize.col('User.email'), { [Op.like]: like }),
      ],
    });
  }

  void departmentFilter;

  const where = profileAnd.length
    ? profileAnd.length === 1
      ? profileAnd[0]
      : { [Op.and]: profileAnd }
    : undefined;

  const userWhere = {};
  if (statusFilter && ['active', 'inactive'].includes(statusFilter)) {
    userWhere.status = statusFilter;
  }

  const roleExistsLiteral = roleFilters.length
    ? Sequelize.literal(`EXISTS (
        SELECT 1
        FROM user_roles ur
        INNER JOIN roles r ON ur.role_id = r.id
        WHERE ur.user_id = User.id
        AND r.name IN (${roleFilters.map((r) => `'${r}'`).join(', ')})
      )`)
    : null;

  let profileWhere = where;
  let adminDept = null;
  if (isAdmin && adminDeptName) {
    adminDept = await Department.findOne({ where: { dept_name: adminDeptName } });
    if (adminDept) {
      const deptScopeCondition = {
        [Op.or]: [
          Sequelize.literal(`EXISTS (
            SELECT 1 
            FROM Lecturer_Courses lc 
            INNER JOIN Courses c ON lc.course_id = c.id 
            WHERE lc.lecturer_profile_id = LecturerProfile.id 
            AND c.dept_id = ${parseInt(adminDept.id)}
          )`),
          Sequelize.and(
            Sequelize.literal(`EXISTS (
              SELECT 1
              FROM user_roles ur
              INNER JOIN roles r ON ur.role_id = r.id
              WHERE ur.user_id = User.id
              AND r.name = 'advisor'
            )`),
            Sequelize.where(Sequelize.col('User.department_name'), adminDeptName)
          ),
        ],
      };
      profileWhere = profileWhere
        ? { [Op.and]: [profileWhere, deptScopeCondition] }
        : deptScopeCondition;
    }
  }

  if (roleExistsLiteral) {
    const existingAnd = profileWhere?.[Op.and]
      ? profileWhere[Op.and]
      : profileWhere
        ? [profileWhere]
        : [];
    profileWhere = { [Op.and]: [...existingAnd, roleExistsLiteral] };
  }

  const { rows, count } = await LecturerProfile.findAndCountAll({
    attributes: [
      'id', 'employee_id', 'title', 'position', 'status', 'join_date',
      'cv_uploaded', 'research_fields', 'qualifications', 'full_name_english',
      'full_name_khmer', 'cv_file_path',
    ],
    include: [
      {
        model: User,
        attributes: ['id', 'email', 'status', 'last_login', 'department_name', 'display_name', 'created_at'],
        where: Object.keys(userWhere).length ? userWhere : undefined,
        required: true,
        include: [
          {
            model: Role,
            as: 'Roles',
            attributes: ['role_type'],
            through: { attributes: [] },
            required: false,
          },
        ],
      },
    ],
    where: profileWhere,
    limit,
    offset,
    distinct: true,
    order: [['id', 'DESC']],
  });

  const profileIds = rows.map((r) => r.id);
  const countsMap = new Map();
  if (profileIds.length) {
    if (adminDept) {
      const counts = await LecturerCourse.findAll({
        attributes: [
          'lecturer_profile_id',
          [Sequelize.fn('COUNT', Sequelize.col('LecturerCourse.id')), 'cnt'],
        ],
        where: { lecturer_profile_id: { [Op.in]: profileIds } },
        include: [{ model: Course, where: { dept_id: adminDept.id }, attributes: [] }],
        group: ['lecturer_profile_id'],
      });
      counts.forEach((c) => countsMap.set(c.lecturer_profile_id, parseInt(c.get('cnt'), 10) || 0));
    } else {
      const counts = await LecturerCourse.findAll({
        attributes: [
          'lecturer_profile_id',
          [Sequelize.fn('COUNT', Sequelize.col('LecturerCourse.id')), 'cnt'],
        ],
        where: { lecturer_profile_id: { [Op.in]: profileIds } },
        group: ['lecturer_profile_id'],
      });
      counts.forEach((c) => countsMap.set(c.lecturer_profile_id, parseInt(c.get('cnt'), 10) || 0));
    }
  }

  const coursesMap = new Map();
  if (profileIds.length) {
    const courseInclude = [
      { model: Course, attributes: ['id', 'course_code', 'course_name', 'dept_id'] },
    ];
    if (adminDept) {
      courseInclude[0].where = { dept_id: adminDept.id };
      courseInclude[0].required = false;
    }
    const lcRows = await LecturerCourse.findAll({
      where: { lecturer_profile_id: { [Op.in]: profileIds } },
      include: courseInclude,
      order: [['id', 'ASC']],
    });
    lcRows.forEach((lc) => {
      const pid = lc.lecturer_profile_id;
      const courseObj = lc.Course
        ? {
            id: lc.Course.id,
            course_code: lc.Course.course_code,
            course_name: lc.Course.course_name,
            dept_id: lc.Course.dept_id,
          }
        : null;
      if (!coursesMap.has(pid)) coursesMap.set(pid, []);
      if (courseObj) coursesMap.get(pid).push(courseObj);
    });
  }

  const data = rows.map((lp) => {
    const name =
      lp.full_name_english ||
      lp.full_name_khmer ||
      lp.User?.display_name ||
      (lp.User?.email ? lp.User.email.split('@')[0].replace(/\./g, ' ') : 'Unknown');

    const roleTypes = Array.isArray(lp.User?.Roles)
      ? lp.User.Roles.map((r) => r?.role_type).filter(Boolean)
      : [];

    const singleRoleFilter = roleFilters.length === 1 ? roleFilters[0] : null;
    const role =
      singleRoleFilter && roleTypes.includes(singleRoleFilter)
        ? singleRoleFilter
        : roleTypes.includes('advisor')
          ? 'advisor'
          : roleTypes.includes('lecturer')
            ? 'lecturer'
            : roleTypes[0] || 'lecturer';

    const displayDepartment =
      isAdmin && adminDeptName ? adminDeptName : lp.User?.department_name || 'General';

    const researchFields =
      lp.ResearchFields && lp.ResearchFields.length > 0
        ? lp.ResearchFields.map((rf) => rf.name)
        : lp.research_fields
          ? lp.research_fields.split(',').map((s) => s.trim()).filter(Boolean)
          : [];

    return {
      id: lp.User?.id,
      lecturerProfileId: lp.id,
      name,
      title: lp.title || null,
      email: lp.User?.email,
      role,
      roles: roleTypes,
      department: displayDepartment,
      status: lp.User?.status || 'active',
      lastLogin: lp.User?.last_login || 'Never',
      employeeId: lp.employee_id,
      position: lp.position,
      joinedAt: lp.join_date,
      cvUploaded: lp.cv_uploaded,
      coursesCount: countsMap.get(lp.id) || 0,
      courses: coursesMap.get(lp.id) || [],
      specializations: researchFields.slice(0, 5),
      researchFields,
    };
  });

  const totalPages = Math.ceil(count / limit) || 1;
  return { data, meta: { page, limit, total: count, totalPages } };
}

// ---------------------------------------------------------------------------
// Service: getLecturerDetailData
// ---------------------------------------------------------------------------

export async function getLecturerDetailData({ userId, isAdmin, adminDeptName, skipDeptCourseAccessCheck }) {
  if (!userId) {
    throw new ValidationError('Invalid id', { payload: { message: 'Invalid id' } });
  }

  const lecturerCourseInclude = [
    {
      model: Course,
      attributes: ['id', 'course_code', 'course_name', 'dept_id', 'hours', 'credits'],
    },
  ];

  if (!skipDeptCourseAccessCheck && isAdmin && adminDeptName) {
    const dept = await Department.findOne({ where: { dept_name: adminDeptName } });
    if (dept) {
      lecturerCourseInclude[0].where = { dept_id: dept.id };
      lecturerCourseInclude[0].required = false;
    }
  }

  const profile = await LecturerProfile.findOne({
    where: { user_id: userId },
    include: [
      { model: User, attributes: ['id', 'email', 'status', 'department_name', 'last_login'] },
      { model: Department, attributes: ['id', 'dept_name'], through: { attributes: [] } },
      { model: LecturerCourse, include: lecturerCourseInclude },
    ],
  });

  if (!profile) {
    throw new NotFoundError('Lecturer not found', { payload: { message: 'Lecturer not found' } });
  }

  if (!skipDeptCourseAccessCheck && isAdmin && adminDeptName) {
    const dept = await Department.findOne({ where: { dept_name: adminDeptName } });
    if (dept) {
      const hasCoursesInDepartment = await LecturerCourse.findOne({
        where: { lecturer_profile_id: profile.id },
        include: [{ model: Course, where: { dept_id: dept.id }, attributes: ['id'] }],
      });
      if (!hasCoursesInDepartment) {
        throw new ForbiddenError(
          'Access denied: lecturer does not teach in your department',
          { payload: { message: 'Access denied: lecturer does not teach in your department' } }
        );
      }
    }
  }

  const departments = profile.Departments?.map((d) => ({ id: d.id, name: d.dept_name })) || [];
  const courses =
    profile.LecturerCourses?.map((lc) => ({
      id: lc.Course?.id,
      course_id: lc.Course?.id,
      course_code: lc.Course?.course_code,
      course_name: lc.Course?.course_name,
      hours: lc.Course?.hours,
      credits: lc.Course?.credits,
      dept_id: lc.Course?.dept_id,
    })) || [];

  const displayDepartment =
    isAdmin && adminDeptName ? adminDeptName : profile.User?.department_name || 'General';

  let candidateId = null;
  let hourlyRateThisYear = null;
  try {
    let cand = null;

    if (profile.candidate_id) {
      cand = await Candidate.findByPk(profile.candidate_id, {
        attributes: ['id', 'fullName', 'email', 'hourlyRate'],
      });
    }

    if (!cand && profile.User?.email) {
      cand = await Candidate.findOne({
        where: { email: profile.User.email },
        attributes: ['id', 'fullName', 'email', 'hourlyRate'],
      });
    }

    if (!cand && (profile.full_name_english || profile.User?.display_name)) {
      const rawName = profile.full_name_english || profile.User?.display_name || '';
      if (rawName) {
        cand = await Candidate.findOne({
          where: Sequelize.where(
            Sequelize.fn('LOWER', Sequelize.fn('TRIM', Sequelize.col('fullName'))),
            Sequelize.fn('LOWER', rawName.trim())
          ),
          attributes: ['id', 'fullName', 'email', 'hourlyRate'],
        });

        if (!cand) {
          const allCandidates = await Candidate.findAll({
            attributes: ['id', 'fullName', 'email', 'hourlyRate'],
          });
          const titleRegex = /^(mr\.?|ms\.?|mrs\.?|dr\.?|prof\.?|professor|miss)\s+/i;
          const normalizeName = (s = '') =>
            String(s).trim().replace(titleRegex, '').replace(/\s+/g, ' ').trim().toLowerCase();
          const targetNormalized = normalizeName(rawName);
          cand = allCandidates.find((c) => normalizeName(c.fullName) === targetNormalized);
        }
      }
    }

    if (cand) {
      candidateId = cand.id;
      if (cand.hourlyRate !== null && cand.hourlyRate !== undefined) {
        hourlyRateThisYear = String(cand.hourlyRate);
      }
    }
  } catch (candErr) {
    console.error('[getLecturerDetail] candidate lookup failed:', candErr.message);
  }

  const { files, file_names } = await listSyllabusFilesWithNames(
    profile.storage_folder,
    profile.course_syllabus
      ? String(profile.course_syllabus).replace(/\\/g, '/').replace(/^\//, '')
      : null
  );

  return {
    id: profile.User?.id,
    lecturerProfileId: profile.id,
    name:
      profile.full_name_english ||
      profile.full_name_khmer ||
      profile.User?.display_name ||
      'Unknown',
    full_name_english: profile.full_name_english || null,
    full_name_khmer: profile.full_name_khmer || null,
    personal_email: profile.personal_email || null,
    email: profile.User?.email,
    status: profile.User?.status,
    department: displayDepartment,
    position: profile.position,
    occupation: profile.occupation || null,
    place: profile.place || null,
    phone: profile.phone_number || null,
    short_bio: profile.short_bio || null,
    country: profile.country || null,
    latest_degree: profile.latest_degree || null,
    degree_year: profile.degree_year || null,
    major: profile.major || null,
    university: profile.university || null,
    departments,
    courses,
    coursesCount: courses.length,
    candidateId,
    hourlyRateThisYear,
    education:
      profile.latest_degree || profile.university || profile.major || profile.degree_year
        ? [
            {
              id: `edu-${profile.id}`,
              degree: profile.latest_degree || null,
              institution: profile.university || null,
              major: profile.major || null,
              year: profile.degree_year || null,
            },
          ]
        : [],
    experience: [],
    qualifications: profile.qualifications || null,
    research_fields: profile.research_fields || null,
    researchFields: profile.research_fields
      ? profile.research_fields.split(',').map((s) => s.trim()).filter(Boolean)
      : [],
    cvUploaded: profile.cv_uploaded,
    cvFilePath: profile.cv_file_path
      ? String(profile.cv_file_path).replace(/\\/g, '/').replace(/^\//, '')
      : null,
    syllabusUploaded: profile.upload_syllabus || false,
    syllabusFilePath: profile.course_syllabus
      ? String(profile.course_syllabus).replace(/\\/g, '/').replace(/^\//, '')
      : null,
    course_syllabus_files: files,
    course_syllabus_file_names: file_names,
    bank_name: profile.bank_name || null,
    account_name: profile.account_name || null,
    account_number: profile.account_number || null,
    payrollPath: profile.pay_roll_in_riel
      ? String(profile.pay_roll_in_riel).replace(/\\/g, '/').replace(/^\//, '')
      : null,
    lastLogin: profile.User?.last_login || 'Never',
  };
}

// ---------------------------------------------------------------------------
// Service: updateLecturerCoursesData
// ---------------------------------------------------------------------------

export async function updateLecturerCoursesData({ userId, courseIdsRaw, isAdmin, adminDeptName }) {
  if (!Array.isArray(courseIdsRaw)) {
    throw new ValidationError('course_ids array required', {
      payload: { message: 'course_ids array required' },
    });
  }

  const courseIds = courseIdsRaw.map((n) => parseInt(n, 10)).filter((n) => Number.isInteger(n));
  if (!courseIds.length) {
    throw new ValidationError('At least one course id required', {
      payload: { message: 'At least one course id required' },
    });
  }

  const profile = await LecturerProfile.findOne({ where: { user_id: userId } });
  if (!profile) {
    throw new NotFoundError('Lecturer not found', { payload: { message: 'Lecturer not found' } });
  }

  const coursesWhere = { id: courseIds };
  let adminDept = null;
  if (isAdmin && adminDeptName) {
    adminDept = await Department.findOne({ where: { dept_name: adminDeptName } });
    if (!adminDept) {
      throw new ValidationError('Your department not found', {
        payload: { message: 'Your department not found' },
      });
    }
    coursesWhere.dept_id = adminDept.id;
  }

  const courses = await Course.findAll({ where: coursesWhere });
  if (courses.length !== courseIds.length) {
    const foundIds = courses.map((c) => c.id);
    const missingIds = courseIds.filter((id) => !foundIds.includes(id));
    const message =
      isAdmin && adminDeptName
        ? 'Some courses not found in your department or do not exist'
        : 'Some courses not found';
    throw new ValidationError(message, { payload: { message, missingIds } });
  }

  if (adminDept) {
    const existingCoursesInDept = await LecturerCourse.findAll({
      where: { lecturer_profile_id: profile.id },
      include: [{ model: Course, where: { dept_id: adminDept.id }, attributes: ['id'] }],
    });
    const existingIds = existingCoursesInDept.map((lc) => lc.id);
    if (existingIds.length > 0) {
      await LecturerCourse.destroy({ where: { id: existingIds } });
    }
  } else {
    await LecturerCourse.destroy({ where: { lecturer_profile_id: profile.id } });
  }

  await LecturerCourse.bulkCreate(
    courses.map((c) => ({ lecturer_profile_id: profile.id, course_id: c.id }))
  );

  return {
    message: 'Courses updated',
    count: courses.length,
    course_ids: courses.map((c) => c.id),
  };
}

// ---------------------------------------------------------------------------
// Service: updateLecturerProfileData
// ---------------------------------------------------------------------------

export async function updateLecturerProfileData(userId, body) {
  if (!userId) {
    throw new ValidationError('Invalid id', { payload: { message: 'Invalid id' } });
  }

  const profile = await LecturerProfile.findOne({ where: { user_id: userId } });
  if (!profile) {
    throw new NotFoundError('Lecturer not found', { payload: { message: 'Lecturer not found' } });
  }

  const {
    qualifications,
    short_bio,
    research_fields,
    phone_number,
    university,
    major,
    bank_name,
    account_name,
    account_number,
  } = body;

  const patch = {};
  if (typeof qualifications === 'string') patch.qualifications = qualifications;
  if (typeof short_bio === 'string') patch.short_bio = short_bio;
  if (typeof phone_number === 'string') patch.phone_number = phone_number.trim();
  if (typeof bank_name === 'string') patch.bank_name = bank_name.trim();
  if (typeof account_name === 'string') patch.account_name = account_name.trim();
  if (typeof account_number === 'string') patch.account_number = account_number.trim();

  if (research_fields) {
    let fieldNames = [];
    if (Array.isArray(research_fields)) {
      fieldNames = research_fields.map((s) => String(s).trim()).filter(Boolean);
    } else if (typeof research_fields === 'string') {
      fieldNames = research_fields.split(',').map((s) => s.trim()).filter(Boolean);
    }
    if (fieldNames.length > 0) {
      await findOrCreateResearchFields(fieldNames);
      patch.research_fields = fieldNames.join(', ');
    } else {
      patch.research_fields = '';
    }
  }

  if (university !== undefined) {
    if (typeof university === 'string' && university.trim()) {
      const trimmedUniversity = university.trim();
      await findOrCreateUniversities([trimmedUniversity]);
      patch.university = trimmedUniversity;
    } else {
      patch.university = null;
    }
  }

  if (major !== undefined) {
    if (typeof major === 'string' && major.trim()) {
      const trimmedMajor = major.trim();
      await findOrCreateMajors([trimmedMajor]);
      patch.major = trimmedMajor;
    } else {
      patch.major = null;
    }
  }

  if (Object.keys(patch).length === 0) {
    throw new ValidationError('No updatable fields supplied', {
      payload: { message: 'No updatable fields supplied' },
    });
  }

  await profile.update(patch);

  const currentResearchFields = profile.research_fields
    ? profile.research_fields.split(',').map((s) => s.trim()).filter(Boolean)
    : [];

  return {
    message: 'Profile updated',
    qualifications: profile.qualifications,
    short_bio: profile.short_bio,
    research_fields: profile.research_fields,
    researchFields: currentResearchFields,
    university: profile.university,
    major: profile.major,
    bank_name: profile.bank_name,
    account_name: profile.account_name,
    account_number: profile.account_number,
  };
}

// ---------------------------------------------------------------------------
// Service: uploadLecturerPayrollData
// ---------------------------------------------------------------------------

export async function uploadLecturerPayrollData(userId, file) {
  if (!userId) {
    throw new ValidationError('Invalid id', { payload: { message: 'Invalid id' } });
  }

  const profile = await LecturerProfile.findOne({
    where: { user_id: userId },
    include: [{ model: User, attributes: ['email', 'display_name'] }],
  });
  if (!profile) {
    throw new NotFoundError('Lecturer not found', { payload: { message: 'Lecturer not found' } });
  }

  const baseName =
    profile.full_name_english ||
    profile.User?.display_name ||
    (profile.User?.email ? profile.User.email.split('@')[0] : `lecturer_${userId}`);
  const folderSlug =
    (profile.storage_folder || baseName)
      .toString()
      .replace(/[^a-zA-Z0-9\-_ ]/g, '')
      .replace(/\s+/g, '_')
      .substring(0, 80) || `lecturer_${userId}`;
  const destRoot = path.join(process.cwd(), 'uploads', 'lecturers', folderSlug);
  await fs.promises.mkdir(destRoot, { recursive: true });

  const ext = file.originalname ? path.extname(file.originalname) : '.pdf';
  const target = path.join(destRoot, `payroll${ext || ''}`);
  await fs.promises.writeFile(target, file.buffer);
  const rel = target.replace(process.cwd() + path.sep, '').replace(/\\/g, '/');

  await profile.update({ pay_roll_in_riel: rel, storage_folder: folderSlug });

  return {
    message: 'Payroll uploaded',
    path: rel,
    payrollFilePath: rel,
    profile: { id: profile.id, pay_roll_in_riel: rel },
  };
}

// ---------------------------------------------------------------------------
// Service: importLecturersFromExcelData
// ---------------------------------------------------------------------------

export async function importLecturersFromExcelData(fileBuffer, adminDeptName) {
  if (!adminDeptName) {
    throw new ValidationError('Admin department is not set', {
      payload: { message: 'Admin department is not set' },
    });
  }

  const workbook = xlsx.read(fileBuffer, { type: 'buffer' });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const rawRows = xlsx.utils.sheet_to_json(worksheet, { defval: '' });
  const rows = rawRows
    .map((row, index) => ({ row, rowNumber: index + 2 }))
    .filter(({ row }) => !isImportedWorksheetRowEmpty(row));

  if (!rows.length) {
    throw new ValidationError('Excel file is empty', {
      payload: { message: 'Excel file is empty' },
    });
  }

  const results = { success: [], errors: [], total: rows.length };
  const credentialsRows = [];

  for (let i = 0; i < rows.length; i += 1) {
    const { row, rowNumber } = rows[i];

    try {
      const importedFullName = String(row.fullName || row.full_name || '').trim();
      const email = String(row.email || '').trim().toLowerCase();
      const rawHourlyRate =
        row.hourlyRate ?? row.hourly_rate ?? row['Hourly Rate'] ?? row['hourly rate'] ?? '';
      const phone = String(row.phone || row.phone_number || '').trim();
      const titleInput = row.title ?? row.Title ?? '';
      const genderInput = row.gender ?? row.Gender ?? '';
      const positionAppliedFor = String(
        row.positionAppliedFor || row.position_applied_for || row.position || ''
      ).trim();
      const interviewDateValue = row.interviewDate || row.interview_date || '';
      const fullName = stripImportedTitleFromName(importedFullName);

      const missingFields = [];
      if (!fullName) missingFields.push('fullName');
      if (!email) missingFields.push('email');
      if (rawHourlyRate === null || rawHourlyRate === undefined || String(rawHourlyRate).trim() === '') {
        missingFields.push('hourlyRate');
      }

      if (missingFields.length > 0) {
        results.errors.push({
          row: rowNumber,
          error: `Missing required fields: ${missingFields.join(', ')}`,
        });
        continue;
      }

      const hourlyRate = normalizeImportedHourlyRate(rawHourlyRate);
      if (hourlyRate === null) {
        results.errors.push({
          row: rowNumber,
          error: `Invalid hourlyRate value: ${rawHourlyRate}. Hourly Rate must be a valid positive number`,
        });
        continue;
      }

      if (!/^[A-Z0-9._%+-]+@cadt\.edu\.kh$/i.test(email)) {
        results.errors.push({
          row: rowNumber,
          error: `Email must use the CADT domain (@cadt.edu.kh): ${email}`,
        });
        continue;
      }

      const existingUser = await User.findOne({ where: { email } });
      if (existingUser) {
        results.errors.push({ row: rowNumber, error: `User with email ${email} already exists` });
        continue;
      }

      const title = inferImportedTitle({ titleInput, fullName: importedFullName, genderInput });
      if (String(titleInput || '').trim() && !title) {
        results.errors.push({
          row: rowNumber,
          error: `Invalid title value: ${titleInput}. Allowed values: Mr, Ms, Mrs, Dr, Prof`,
        });
        continue;
      }

      const gender = normalizeImportedGender(genderInput);
      if (genderInput && !gender) {
        results.errors.push({
          row: rowNumber,
          error: `Invalid gender value: ${genderInput}. Allowed values: male, female, other`,
        });
        continue;
      }

      const { roleType, position, occupation } = normalizeImportedRoleAndPosition(positionAppliedFor);

      let joinDate = new Date();
      if (interviewDateValue) {
        const parsedJoinDate = new Date(interviewDateValue);
        if (Number.isNaN(parsedJoinDate.getTime())) {
          results.errors.push({
            row: rowNumber,
            error: `Invalid interviewDate value: ${interviewDateValue}`,
          });
          continue;
        }
        joinDate = parsedJoinDate;
      }

      await sequelize.transaction(async (transaction) => {
        const [roleRow] = await Role.findOrCreate({
          where: { role_type: roleType },
          defaults: { role_type: roleType },
          transaction,
        });
        const [departmentRow] = await Department.findOrCreate({
          where: { dept_name: adminDeptName },
          defaults: { dept_name: adminDeptName },
          transaction,
        });

        const tempPassword = generateTempPassword();
        const passwordHash = await bcrypt.hash(tempPassword, 10);

        const newUser = await User.create(
          {
            email,
            password_hash: passwordHash,
            display_name: fullName,
            department_name: departmentRow.dept_name,
            status: 'active',
          },
          { transaction }
        );

        await UserRole.create({ user_id: newUser.id, role_id: roleRow.id }, { transaction });

        const candidate = await Candidate.create(
          {
            fullName,
            email,
            phone: phone || null,
            positionAppliedFor: position || positionAppliedFor || null,
            interviewDate: joinDate,
            status: 'done',
            hourlyRate,
            dept_id: departmentRow.id,
            imported_from_file: true,
          },
          { transaction }
        );

        const newProfile = await LecturerProfile.create(
          {
            user_id: newUser.id,
            candidate_id: candidate.id,
            employee_id: `EMP${String(Date.now()).slice(-6)}${String(i).padStart(2, '0')}`,
            full_name_english: fullName,
            position,
            occupation,
            join_date: joinDate,
            status: 'active',
            cv_uploaded: false,
            cv_file_path: '',
            qualifications: '',
            phone_number: phone || null,
            personal_email: email,
            title,
            gender,
          },
          { transaction }
        );

        await DepartmentProfile.create(
          { dept_id: departmentRow.id, profile_id: newProfile.id },
          { transaction }
        );

        results.success.push({
          row: rowNumber,
          id: newUser.id,
          userId: newUser.id,
          email,
          role: roleRow.role_type,
          tempPassword,
          profile: {
            position: newProfile.position,
            fullName: newProfile.full_name_english,
            title: newProfile.title,
            hourlyRate,
          },
        });
        credentialsRows.push({ email, tempPassword });
      });
    } catch (rowError) {
      console.error(`[importLecturersFromExcel] row ${rowNumber} error:`, rowError.message);
      results.errors.push({ row: rowNumber, error: rowError.message });
    }
  }

  let credentialsFileBase64 = null;
  let credentialsFileName = null;
  if (credentialsRows.length > 0) {
    const credentialsWorkbook = buildImportedCredentialsWorkbook(credentialsRows);
    credentialsFileBase64 = Buffer.from(credentialsWorkbook).toString('base64');
    credentialsFileName = `recruitment_import_credentials_${Date.now()}.xlsx`;
  }

  return {
    message: 'Import completed',
    ...results,
    credentialsFileBase64,
    credentialsFileName,
  };
}
