import fs from 'fs';
import path from 'path';
import multer from 'multer';
import { LecturerProfile, User, Department } from '../model/index.js';
import Course from '../model/course.model.js';
import LecturerCourse from '../model/lecturerCourse.model.js';
import { findOrCreateResearchFields } from './researchField.controller.js';
import { findOrCreateUniversities } from './university.controller.js';
import { findOrCreateMajors } from './major.controller.js';

// Allow configuring max upload size from environment. Default to 25 MB per file.
const MAX_UPLOAD_FILE_SIZE = parseInt(
  process.env.MAX_UPLOAD_FILE_SIZE || String(25 * 1024 * 1024),
  10
);
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_UPLOAD_FILE_SIZE },
});
export const onboardingUploadMiddleware = upload.fields([
  { name: 'cv', maxCount: 1 },
  { name: 'syllabus', maxCount: 1 },
  { name: 'payroll', maxCount: 1 },
]);

export const submitOnboarding = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findByPk(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const existing = await LecturerProfile.findOne({ where: { user_id: userId } });
    if (existing && existing.onboarding_complete) {
      return res.status(400).json({ message: 'Onboarding already completed' });
    }

    const body = req.body;
    // Determine stable folder name: prefer existing profile.storage_folder; else sanitize full English name; fallback to lecturer_<id>
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

    const cvFile = req.files?.cv?.[0];
    const syllabusFile = req.files?.syllabus?.[0];
    const payrollFile = req.files?.payroll?.[0];

    const cv_path = await saveFile(
      cvFile,
      'cv' + (cvFile?.originalname ? path.extname(cvFile.originalname) : '.pdf')
    );
    const course_syllabus = await saveFile(
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
      // Preserve existing position set by admin; only use provided body.position or default when creating new
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
      // research_fields may come as comma separated or array
      research_fields: Array.isArray(body.research_fields)
        ? body.research_fields.join(',')
        : body.research_fields || null,
      short_bio: body.short_bio || null,
      course_syllabus: course_syllabus || null,
      upload_syllabus: !!course_syllabus,
      bank_name: body.bank_name || null,
      account_name: body.account_name || null,
      account_number: body.account_number || null,
      pay_roll_in_riel: pay_roll_in_riel || null,
      onboarding_complete: true,
      storage_folder: folderSlug,
    };

    let profile;
    if (existing) {
      // Avoid overwriting position unless explicitly provided in body
      const { position, ...rest } = profilePayload;
      const updatePayload = { ...rest };
      if (typeof body.position === 'string' && body.position.trim()) {
        updatePayload.position = body.position.trim();
      }
      await existing.update(updatePayload);
      profile = existing;
    } else {
      profile = await LecturerProfile.create(profilePayload);
    }

    // Handle research fields
    if (body.research_fields) {
      let fieldNames = [];

      if (Array.isArray(body.research_fields)) {
        fieldNames = body.research_fields.map((s) => String(s).trim()).filter(Boolean);
      } else if (typeof body.research_fields === 'string') {
        fieldNames = body.research_fields
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean);
      }

      if (fieldNames.length > 0) {
        // Ensure all research fields exist in the database
        await findOrCreateResearchFields(fieldNames);
      }
    }

    // Handle university
    if (body.university && typeof body.university === 'string' && body.university.trim()) {
      // Ensure university exists in the database
      await findOrCreateUniversities([body.university.trim()]);
    }

    // Handle major
    if (body.major && typeof body.major === 'string' && body.major.trim()) {
      // Ensure major exists in the database
      await findOrCreateMajors([body.major.trim()]);
    }

    // Persist departments and courses with normalization (case/space tolerant)
    let persistedDepartments = [];
    let persistedCourses = [];
    let unmatchedDepartments = [];
    let unmatchedCourses = [];
    try {
      const normalize = (s = '') =>
        s
          .toLowerCase()
          .replace(/&/g, 'and')
          .replace(/[^a-z0-9]/g, '');

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
      // New preferred path: explicit course_ids (comma list or array of numbers) to avoid fuzzy name mismatches
      let courseIds = [];
      if (body.course_ids) {
        const raw = Array.isArray(body.course_ids)
          ? body.course_ids
          : String(body.course_ids).split(',');
        courseIds = raw
          .map((s) => parseInt(String(s).trim(), 10))
          .filter((n) => Number.isInteger(n));
      }
      if (courseIds.length) {
        const allCourses = await Course.findAll({ where: { id: courseIds } });
        // Restrict to selected departments if departments were provided & matched
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
        // Detect any ids that did not resolve
        const foundIdSet = new Set(filteredCourses.map((c) => c.id));
        const unresolved = courseIds.filter((id) => !foundIdSet.has(id));
        if (unresolved.length) {
          unmatchedCourses.push(...unresolved.map((id) => 'id:' + id));
        }
      } else if (body.courses) {
        // Backward compatible name-based matching
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
    return res.status(201).json({
      message: 'Onboarding complete',
      profile: {
        id: profile.id,
        user_id: profile.user_id,
        departments: persistedDepartments.map((d) => ({ id: d.id, name: d.dept_name })),
        courses: persistedCourses.map((c) => ({
          id: c.id,
          name: c.course_name,
          code: c.course_code,
        })),
        unmatched_departments: unmatchedDepartments,
        unmatched_courses: unmatchedCourses,
      },
    });
  } catch (e) {
    console.error('[onboarding] error', e);
    return res.status(500).json({ message: 'Failed to complete onboarding', error: e.message });
  }
};

export const checkOnboarding = async (req, res) => {
  try {
    const profile = await LecturerProfile.findOne({ where: { user_id: req.user.id } });
    return res.json({ exists: !!profile, complete: !!profile?.onboarding_complete });
  } catch (e) {
    return res.status(500).json({ message: 'Error checking onboarding', error: e.message });
  }
};
