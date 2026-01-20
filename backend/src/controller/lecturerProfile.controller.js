import fs from 'fs';
import path from 'path';
import { fn, col, where } from 'sequelize';
import { LecturerProfile, User, Department } from '../model/index.js';
import Candidate from '../model/candidate.model.js';
import Course from '../model/course.model.js';
import LecturerCourse from '../model/lecturerCourse.model.js';

const LECTURER_PROFILE_EDITABLE_FIELDS = [
  'title',
  'gender',
  'full_name_english',
  'full_name_khmer',
  'personal_email',
  'phone_number',
  'place',
  'latest_degree',
  'degree_year',
  'major',
  'university',
  'country',
  'qualifications',
  'research_fields',
  'short_bio',
  'bank_name',
  'account_name',
  'account_number',
];

const toResponse = (p, user, departments = [], courses = []) => ({
  id: p.id,
  user_id: p.user_id,
  employee_id: p.employee_id,
  title: p.title,
  gender: p.gender,
  full_name_english: p.full_name_english,
  full_name_khmer: p.full_name_khmer,
  personal_email: p.personal_email,
  phone_number: p.phone_number,
  occupation: p.occupation,
  place: p.place,
  latest_degree: p.latest_degree,
  degree_year: p.degree_year,
  major: p.major,
  university: p.university,
  country: p.country,
  first_name: p.first_name,
  last_name: p.last_name,
  position: p.position,
  join_date: p.join_date,
  status: p.status,
  cv_uploaded: p.cv_uploaded,
  cv_file_path: p.cv_file_path || null,
  qualifications: p.qualifications,
  research_fields: p.research_fields,
  short_bio: p.short_bio,
  course_syllabus: p.course_syllabus,
  upload_syllabus: p.upload_syllabus,
  bank_name: p.bank_name,
  account_name: p.account_name,
  account_number: p.account_number,
  pay_roll_in_riel: p.pay_roll_in_riel,
  onboarding_complete: p.onboarding_complete,
  user_email: user?.email || null,
  user_display_name: user?.display_name || null,
  department_name: user?.department_name || null,
  departments: departments.map((d) => ({ id: d.id, name: d.dept_name })),
  courses: courses.map((c) => ({
    id: c.Course?.id || c.id,
    name: c.Course?.course_name || c.course_name,
    code: c.Course?.course_code || c.course_code,
  })),
});

export const getMyLecturerProfile = async (req, res) => {
  try {
    const profile = await LecturerProfile.findOne({ where: { user_id: req.user.id } });
    if (!profile) return res.status(404).json({ message: 'Lecturer profile not found' });
    const user = await User.findByPk(req.user.id);
    // Eager load departments via many-to-many and courses via LecturerCourse mapping
    const departments = (await profile.getDepartments?.()) || [];
    // Fetch LecturerCourse rows with joined Course for names
    const lecturerCourses = await LecturerCourse.findAll({
      where: { lecturer_profile_id: profile.id },
      include: [{ model: Course }],
    });
    // Lookup hourly rate from Candidate:
    // 1) Try matching by cleaned full name (strip titles), 2) fallback to email
    let hourlyRateThisYear = null;
    try {
      const titleRegex = /^(mr\.?|ms\.?|mrs\.?|dr\.?|prof\.?|professor|miss)\s+/i;
      const normalizeName = (s = '') =>
        String(s).trim().replace(titleRegex, '').replace(/\s+/g, ' ').trim();
      const rawName = profile.full_name_english || user?.display_name || '';
      const cleanedName = normalizeName(rawName);

      let cand = null;
      if (cleanedName) {
        const cleanedLower = cleanedName.toLowerCase();
        cand = await Candidate.findOne({
          where: where(fn('LOWER', fn('TRIM', col('fullName'))), cleanedLower),
        });
      }
      if (!cand && user?.email) {
        cand = await Candidate.findOne({ where: { email: user.email } });
      }
      if (cand && cand.hourlyRate != null) {
        hourlyRateThisYear = String(cand.hourlyRate);
      }
    } catch (err) {
      console.warn('[getMyLecturerProfile] candidate lookup failed:', err.message);
    }
    if (String(req.query.debug || '') === '1') {
      return res.json({
        raw: { ...toResponse(profile, user, departments, lecturerCourses), hourlyRateThisYear },
        deptCount: departments.length,
        courseLinkCount: lecturerCourses.length,
      });
    }
    return res.json({
      ...toResponse(profile, user, departments, lecturerCourses),
      hourlyRateThisYear,
    });
  } catch (e) {
    console.error('getMyLecturerProfile error', e);
    return res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/lecturer-profile/me/candidate-contact
// Returns phone and personal email from the Candidate row matched to the logged-in lecturer
export const getMyCandidateContact = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });
    const profile = await LecturerProfile.findOne({ where: { user_id: userId } });
    const user = await User.findByPk(userId);
    if (!profile || !user) return res.status(404).json({ message: 'Lecturer profile not found' });

    // Try to find Candidate by normalized full name (without titles), fallback to user email
    const titleRegex = /^(mr\.?|ms\.?|mrs\.?|dr\.?|prof\.?|professor|miss)\s+/i;
    const normalizeName = (s = '') =>
      String(s).trim().replace(titleRegex, '').replace(/\s+/g, ' ').trim();
    const rawName = profile.full_name_english || user.display_name || '';
    const cleanedLower = normalizeName(rawName).toLowerCase();

    let cand = null;
    try {
      if (cleanedLower) {
        cand = await Candidate.findOne({
          where: where(fn('LOWER', fn('TRIM', col('fullName'))), cleanedLower),
        });
      }
      if (!cand && user.email) {
        cand = await Candidate.findOne({ where: { email: user.email } });
      }
    } catch (e) {
      console.warn('[getMyCandidateContact] candidate lookup error:', e.message);
    }

    if (!cand) return res.status(404).json({ message: 'Candidate not found for this lecturer' });

    return res.json({
      phone: cand.phone || null,
      personalEmail: cand.email || null,
      candidateId: cand.id,
    });
  } catch (e) {
    console.error('getMyCandidateContact error', e);
    return res.status(500).json({ message: 'Server error' });
  }
};

export const updateMyLecturerProfile = async (req, res) => {
  try {
    const profile = await LecturerProfile.findOne({ where: { user_id: req.user.id } });
    if (!profile) return res.status(404).json({ message: 'Lecturer profile not found' });

    const body = req.body || {};
    const update = {};
    for (const f of LECTURER_PROFILE_EDITABLE_FIELDS) {
      if (Object.prototype.hasOwnProperty.call(body, f)) update[f] = body[f];
    }

    // research_fields: allow array -> comma string
    if (Array.isArray(update.research_fields)) {
      update.research_fields = update.research_fields.join(',');
    }

    await profile.update(update);

    // Optional departments & courses update
    let deptChanged = false,
      courseChanged = false;
    const normalize = (s = '') =>
      s
        .toLowerCase()
        .replace(/&/g, 'and')
        .replace(/[^a-z0-9]/g, '');
    let unmatchedDepartments = [],
      unmatchedCourses = [];
    try {
      if (body.departments) {
        const deptNamesRaw = Array.isArray(body.departments)
          ? body.departments
          : String(body.departments).split(',');
        const deptNames = deptNamesRaw.map((s) => s.trim()).filter(Boolean);
        if (deptNames.length) {
          const all = await Department.findAll();
          const map = new Map();
          all.forEach((d) => map.set(normalize(d.dept_name), d));
          const matched = [];
          deptNames.forEach((inp) => {
            const key = normalize(inp);
            const m = map.get(key);
            if (m && !matched.find((x) => x.id === m.id)) matched.push(m);
            else if (!m) unmatchedDepartments.push(inp);
          });
          if (matched.length) {
            await profile.setDepartments(matched.map((d) => d.id));
            deptChanged = true;
          }
        }
      }
      if (body.courses) {
        const courseNamesRaw = Array.isArray(body.courses)
          ? body.courses
          : String(body.courses).split(',');
        const courseNames = courseNamesRaw.map((s) => s.trim()).filter(Boolean);
        if (courseNames.length) {
          const allC = await Course.findAll();
          const cMap = new Map();
          allC.forEach((c) => cMap.set(normalize(c.course_name), c));
          const matchedC = [];
          courseNames.forEach((inp) => {
            const key = normalize(inp);
            const m = cMap.get(key);
            if (m && !matchedC.find((x) => x.id === m.id)) matchedC.push(m);
            else if (!m) unmatchedCourses.push(inp);
          });
          if (matchedC.length) {
            await LecturerCourse.destroy({ where: { lecturer_profile_id: profile.id } });
            await LecturerCourse.bulkCreate(
              matchedC.map((c) => ({ lecturer_profile_id: profile.id, course_id: c.id }))
            );
            courseChanged = true;
          }
        }
      }
    } catch (assocErr) {
      console.warn('[updateMyLecturerProfile] association update warning', assocErr.message);
    }

    const user = await User.findByPk(req.user.id);
    const departments = (await profile.getDepartments?.()) || [];
    const lecturerCourses = await LecturerCourse.findAll({
      where: { lecturer_profile_id: profile.id },
      include: [{ model: Course }],
    });
    return res.json({
      message: 'Profile updated',
      meta: { deptChanged, courseChanged, unmatchedDepartments, unmatchedCourses },
      profile: toResponse(profile, user, departments, lecturerCourses),
    });
  } catch (e) {
    console.error('updateMyLecturerProfile error', e);
    return res.status(500).json({ message: 'Failed to update profile', error: e.message });
  }
};

export const uploadLecturerFiles = async (req, res) => {
  try {
    const profile = await LecturerProfile.findOne({ where: { user_id: req.user.id } });
    if (!profile) return res.status(404).json({ message: 'Lecturer profile not found' });

    const folderSlug =
      profile.storage_folder ||
      (profile.full_name_english || profile.first_name || `lecturer_${req.user.id}`)
        .replace(/[^a-zA-Z0-9\-_ ]/g, '')
        .replace(/\s+/g, '_')
        .substring(0, 80) ||
      `lecturer_${req.user.id}`;
    if (!profile.storage_folder) {
      await profile.update({ storage_folder: folderSlug });
    }
    const destRoot = path.join(process.cwd(), 'uploads', 'lecturers', folderSlug);
    await fs.promises.mkdir(destRoot, { recursive: true });

    const saveFile = async (file, targetName) => {
      if (!file) return null;
      const filePath = path.join(
        destRoot,
        targetName + (file.originalname ? path.extname(file.originalname) : '')
      );
      await fs.promises.writeFile(filePath, file.buffer);
      return filePath.replace(process.cwd() + path.sep, '');
    };

    const cvFile = req.files?.cv?.[0];
    const syllabusFile = req.files?.syllabus?.[0];

    const updates = {};
    if (cvFile) {
      const pth = await saveFile(cvFile, 'cv');
      updates.cv_uploaded = true;
      updates.cv_file_path = pth;
    }
    if (syllabusFile) {
      const pth = await saveFile(syllabusFile, 'syllabus');
      updates.course_syllabus = pth;
      updates.upload_syllabus = true;
    }

    if (Object.keys(updates).length) {
      await profile.update(updates);
    }
    const userFresh = await User.findByPk(req.user.id);
    const departments = (await profile.getDepartments?.()) || [];
    const lecturerCourses = await LecturerCourse.findAll({
      where: { lecturer_profile_id: profile.id },
      include: [{ model: Course }],
    });
    return res.json({
      message: 'Files uploaded',
      profile: toResponse(profile, userFresh, departments, lecturerCourses),
    });
  } catch (e) {
    console.error('uploadLecturerFiles error', e);
    return res.status(500).json({ message: 'Failed to upload files', error: e.message });
  }
};
