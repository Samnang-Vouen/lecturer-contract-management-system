import fs from 'fs';
import path from 'path';
import { LecturerProfile, User, Department } from '../model/index.js';
import Course from '../model/course.model.js';
import LecturerCourse from '../model/lecturerCourse.model.js';
import { findOrCreateResearchFields } from '../services/researchField.service.js';
import { findOrCreateUniversities } from '../services/university.service.js';
import { findOrCreateMajors } from './major.service.js';

// ---------------------------------------------------------------------------
// Service: submitOnboardingData
// ---------------------------------------------------------------------------

export async function submitOnboardingData(userId, { body, files, role }) {
  const isAdvisor = String(role || '').toLowerCase() === 'advisor';

  const user = await User.findByPk(userId);
  if (!user) {
    const { NotFoundError } = await import('../utils/errors.js');
    throw new NotFoundError('User not found', { payload: { message: 'User not found' } });
  }

  const existing = await LecturerProfile.findOne({ where: { user_id: userId } });
  if (existing && existing.onboarding_complete) {
    return {
      alreadyCompleted: true,
      message: 'Onboarding already completed',
      profile: {
        id: existing.id,
        user_id: existing.user_id,
        departments: [],
        courses: [],
        unmatched_departments: [],
        unmatched_courses: [],
      },
    };
  }

  const folderSlug =
    existing?.storage_folder ||
    (body.full_name_english || user.display_name || user.email.split('@')[0])
      .replace(/[^a-zA-Z0-9\-_ ]/g, '')
      .replace(/\s+/g, '_')
      .substring(0, 80) ||
    `lecturer_${userId}`;

  const destRoot = path.join(process.cwd(), 'uploads', 'lecturers', folderSlug);
  await fs.promises.mkdir(destRoot, { recursive: true });

  const saveFile = async (file, targetName) => {
    if (!file) return null;
    const filePath = path.join(destRoot, targetName);
    await fs.promises.writeFile(filePath, file.buffer);
    return filePath.replace(process.cwd() + path.sep, '');
  };

  const cvFile = files?.cv?.[0];
  const syllabusFile = isAdvisor ? null : files?.syllabus?.[0];
  const payrollFile = files?.payroll?.[0];

  const cv_path = await saveFile(
    cvFile,
    'cv' + (cvFile?.originalname ? path.extname(cvFile.originalname) : '.pdf')
  );
  const course_syllabus = isAdvisor
    ? null
    : await saveFile(
        syllabusFile,
        'syllabus' + (syllabusFile?.originalname ? path.extname(syllabusFile.originalname) : '.pdf')
      );
  const pay_roll_in_riel = await saveFile(
    payrollFile,
    'payroll' + (payrollFile?.originalname ? path.extname(payrollFile.originalname) : '.pdf')
  );

  const profilePayload = {
    user_id: userId,
    employee_id: existing?.employee_id || `EMP${Date.now().toString().slice(-6)}`,
    first_name: body.first_name || body.full_name_english?.split(' ')[0] || 'Unknown',
    last_name: body.last_name || body.full_name_english?.split(' ').slice(1).join(' ') || '',
    position: existing?.position || body.position || 'Lecturer',
    join_date: new Date(),
    status: 'active',
    cv_uploaded: !!cv_path,
    cv_file_path: cv_path || '',
    qualifications: body.qualifications || '',
    full_name_english: body.full_name_english || null,
    full_name_khmer: body.full_name_khmer || null,
    personal_email: body.personal_email || null,
    phone_number: body.phone_number || null,
    occupation: body.occupation || null,
    place: body.place || null,
    latest_degree: body.latest_degree || null,
    degree_year: body.degree_year || null,
    major: body.major || null,
    university: body.university || null,
    country: body.country || null,
    research_fields: Array.isArray(body.research_fields)
      ? body.research_fields.join(',')
      : body.research_fields || null,
    short_bio: body.short_bio || null,
    course_syllabus: isAdvisor ? null : course_syllabus || null,
    upload_syllabus: isAdvisor ? false : !!course_syllabus,
    bank_name: body.bank_name || null,
    account_name: body.account_name || null,
    account_number: body.account_number || null,
    pay_roll_in_riel: pay_roll_in_riel || null,
    onboarding_complete: true,
    storage_folder: folderSlug,
  };

  let profile;
  if (existing) {
    const updatePayload = { ...profilePayload };
    delete updatePayload.position;
    if (typeof body.position === 'string' && body.position.trim()) {
      updatePayload.position = body.position.trim();
    }
    await existing.update(updatePayload);
    profile = existing;
  } else {
    profile = await LecturerProfile.create(profilePayload);
  }

  // Research fields
  if (body.research_fields) {
    let fieldNames = [];
    if (Array.isArray(body.research_fields)) {
      fieldNames = body.research_fields.map((s) => String(s).trim()).filter(Boolean);
    } else if (typeof body.research_fields === 'string') {
      fieldNames = body.research_fields.split(',').map((s) => s.trim()).filter(Boolean);
    }
    if (fieldNames.length) await findOrCreateResearchFields(fieldNames);
  }

  // University
  if (body.university && typeof body.university === 'string' && body.university.trim()) {
    await findOrCreateUniversities([body.university.trim()]);
  }

  // Major
  if (body.major && typeof body.major === 'string' && body.major.trim()) {
    await findOrCreateMajors([body.major.trim()]);
  }

  // Departments and courses
  let persistedDepartments = [];
  let persistedCourses = [];
  const unmatchedDepartments = [];
  const unmatchedCourses = [];

  try {
    const normalize = (s = '') =>
      s.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]/g, '');

    if (body.departments) {
      const deptNamesRaw = Array.isArray(body.departments)
        ? body.departments
        : body.departments.split(',');
      const deptNames = deptNamesRaw.map((s) => s.trim()).filter(Boolean);
      if (deptNames.length) {
        const allDepts = await Department.findAll();
        const map = new Map();
        allDepts.forEach((d) => map.set(normalize(d.dept_name), d));
        const matched = [];
        deptNames.forEach((inp) => {
          const key = normalize(inp);
          const m = map.get(key);
          if (m && !matched.find((x) => x.id === m.id)) matched.push(m);
          else if (!m) unmatchedDepartments.push(inp);
        });
        if (matched.length) {
          await profile.setDepartments(matched.map((d) => d.id));
          persistedDepartments = matched;
        }
      }
    }

    let courseIds = [];
    if (body.course_ids) {
      const raw = Array.isArray(body.course_ids)
        ? body.course_ids
        : String(body.course_ids).split(',');
      courseIds = raw.map((s) => parseInt(String(s).trim(), 10)).filter((n) => Number.isInteger(n));
    }

    if (courseIds.length) {
      const allCourses = await Course.findAll({ where: { id: courseIds } });
      const deptIdSet = new Set(persistedDepartments.map((d) => d.id));
      const filteredCourses = deptIdSet.size
        ? allCourses.filter((c) => deptIdSet.has(c.dept_id))
        : allCourses;
      if (filteredCourses.length) {
        await LecturerCourse.destroy({ where: { lecturer_profile_id: profile.id } });
        await LecturerCourse.bulkCreate(
          filteredCourses.map((c) => ({ lecturer_profile_id: profile.id, course_id: c.id }))
        );
        persistedCourses = filteredCourses;
      }
      const foundIdSet = new Set(filteredCourses.map((c) => c.id));
      const unresolved = courseIds.filter((id) => !foundIdSet.has(id));
      if (unresolved.length) unmatchedCourses.push(...unresolved.map((id) => 'id:' + id));
    } else if (body.courses) {
      const courseNamesRaw = Array.isArray(body.courses) ? body.courses : body.courses.split(',');
      const courseNames = courseNamesRaw.map((s) => s.trim()).filter(Boolean);
      if (courseNames.length) {
        const allCourses = await Course.findAll();
        const cMap = new Map();
        allCourses.forEach((c) => cMap.set(normalize(c.course_name), c));
        const matchedCourses = [];
        courseNames.forEach((inp) => {
          const key = normalize(inp);
          const m = cMap.get(key);
          if (m && !matchedCourses.find((x) => x.id === m.id)) matchedCourses.push(m);
          else if (!m) unmatchedCourses.push(inp);
        });
        if (matchedCourses.length) {
          await LecturerCourse.destroy({ where: { lecturer_profile_id: profile.id } });
          await LecturerCourse.bulkCreate(
            matchedCourses.map((c) => ({ lecturer_profile_id: profile.id, course_id: c.id }))
          );
          persistedCourses = matchedCourses;
        }
      }
    }
  } catch (assocErr) {
    console.warn('[onboarding] association persistence warning', assocErr.message);
  }

  if (user.status !== 'active') await user.update({ status: 'active' });

  return {
    message: 'Onboarding complete',
    profile: {
      id: profile.id,
      user_id: profile.user_id,
      departments: persistedDepartments.map((d) => ({ id: d.id, name: d.dept_name })),
      courses: persistedCourses.map((c) => ({ id: c.id, name: c.course_name, code: c.course_code })),
      unmatched_departments: unmatchedDepartments,
      unmatched_courses: unmatchedCourses,
    },
  };
}

// ---------------------------------------------------------------------------
// Service: checkOnboardingData
// ---------------------------------------------------------------------------

export async function checkOnboardingData(userId) {
  const profile = await LecturerProfile.findOne({ where: { user_id: userId } });
  return { exists: !!profile, complete: !!profile?.onboarding_complete };
}
