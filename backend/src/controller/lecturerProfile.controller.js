import fs from 'fs';
import path from 'path';
import { fn, col, where, Op } from 'sequelize';
import sequelize from '../config/db.js';
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
    // 1) Try matching by email first (most reliable), 2) fallback to cleaned full name
    let hourlyRateThisYear = null;
    try {
      let cand = null;
      
      // Primary: Try email match first (most reliable)
      if (user?.email) {
        cand = await Candidate.findOne({ 
          where: { email: user.email },
          attributes: ['id', 'fullName', 'email', 'hourlyRate']
        });
        console.log(`[getMyLecturerProfile] Email lookup for ${user.email}:`, cand ? `Found (hourlyRate: ${cand.hourlyRate})` : 'Not found');
      }
      
      // Fallback: Try name matching with title normalization
      if (!cand && (profile.full_name_english || user?.display_name)) {
        const rawName = profile.full_name_english || user?.display_name || '';
        
        if (rawName) {
          // Try exact match first (case-insensitive)
          cand = await Candidate.findOne({
            where: where(fn('LOWER', fn('TRIM', col('fullName'))), fn('LOWER', rawName.trim())),
            attributes: ['id', 'fullName', 'email', 'hourlyRate']
          });
          
          // If no exact match, try fuzzy matching by removing titles from both sides
          if (!cand) {
            const allCandidates = await Candidate.findAll({
              attributes: ['id', 'fullName', 'email', 'hourlyRate']
            });
            
            const titleRegex = /^(mr\.?|ms\.?|mrs\.?|dr\.?|prof\.?|professor|miss)\s+/i;
            const normalizeName = (s = '') =>
              String(s).trim().replace(titleRegex, '').replace(/\s+/g, ' ').trim().toLowerCase();
            
            const targetNormalized = normalizeName(rawName);
            cand = allCandidates.find(c => normalizeName(c.fullName) === targetNormalized);
          }
          
          console.log(`[getMyLecturerProfile] Name lookup for "${rawName}":`, cand ? `Found (id: ${cand.id}, hourlyRate: ${cand.hourlyRate})` : 'Not found');
        }
      }
      
      if (cand && cand.hourlyRate != null) {
        hourlyRateThisYear = String(cand.hourlyRate);
      } else if (cand) {
        console.warn(`[getMyLecturerProfile] Candidate found but hourlyRate is null for user ${user?.email}`);
      } else {
        console.warn(`[getMyLecturerProfile] No candidate record found for user ${user?.email} / ${profile.full_name_english}`);
      }
    } catch (err) {
      console.error('[getMyLecturerProfile] candidate lookup failed:', err.message);
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
    
    const user = await User.findByPk(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    let cand = null;
    try {
      // First try matching by email (most reliable)
      if (user.email) {
        cand = await Candidate.findOne({ where: { email: user.email } });
      }
      
      // If not found by email, try matching by name using raw SQL to normalize both sides
      if (!cand) {
        const profile = await LecturerProfile.findOne({ where: { user_id: userId } });
        const rawName = profile?.full_name_english || user.display_name || '';
        
        if (rawName) {
          // Use raw SQL to strip titles from both the candidate name and search term
          // MySQL 8.0 REGEXP_REPLACE syntax: REGEXP_REPLACE(str, pattern, replacement, position, occurrence, match_type)
          const [results] = await sequelize.query(`
            SELECT * FROM Candidates 
            WHERE LOWER(TRIM(REGEXP_REPLACE(fullName, '^(mr\\.?|ms\\.?|mrs\\.?|dr\\.?|prof\\.?|professor|miss)\\\\s+', '', 1, 0, 'i')))
            = LOWER(TRIM(REGEXP_REPLACE(?, '^(mr\\.?|ms\\.?|mrs\\.?|dr\\.?|prof\\.?|professor|miss)\\\\s+', '', 1, 0, 'i')))
            LIMIT 1
          `, {
            replacements: [rawName],
            type: sequelize.QueryTypes.SELECT
          });
          
          if (results) {
            cand = results;
          }
        }
      }
    } catch (e) {
      console.warn('[getMyCandidateContact] candidate lookup error:', e.message);
    }

    // Return null values if no candidate found (lecturer may not have been recruited through candidate system)
    return res.json({
      phone: cand?.phone || null,
      personalEmail: cand?.email || null,
      candidateId: cand?.id || null,
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

/**
 * GET /api/lecturer-profile/candidates-done-since-login
 * Query candidates whose status changed to 'done' since they last logged in.
 * This finds candidates who:
 * 1. Have status = 'done'
 * 2. Have a matching user account (by email)
 * 3. Their status was updated (updated_at) after their last login time
 */
export const getCandidatesDoneSinceLogin = async (req, res) => {
  try {
    // Find all candidates with status 'done'
    const doneCandidates = await Candidate.findAll({
      where: { status: 'done' },
      raw: true,
    });

    if (!doneCandidates.length) {
      return res.json({
        message: 'No candidates with status "done" found',
        count: 0,
        candidates: [],
      });
    }

    // For each candidate, find their user account and check if status changed after last login
    const results = [];
    
    for (const candidate of doneCandidates) {
      try {
        // Find user by matching email
        const user = await User.findOne({
          where: { email: candidate.email },
          raw: true,
        });

        if (!user) {
          // Candidate doesn't have a user account yet, skip
          continue;
        }

        // Check if status was updated after last login
        const lastLogin = user.last_login ? new Date(user.last_login) : null;
        const statusUpdated = new Date(candidate.updated_at);

        // If user has never logged in, or status was updated after last login
        if (!lastLogin || statusUpdated > lastLogin) {
          results.push({
            candidateId: candidate.id,
            fullName: candidate.fullName,
            email: candidate.email,
            phone: candidate.phone,
            positionAppliedFor: candidate.positionAppliedFor,
            status: candidate.status,
            hourlyRate: candidate.hourlyRate,
            statusUpdatedAt: candidate.updated_at,
            lastLogin: user.last_login,
            userId: user.id,
            displayName: user.display_name,
            statusChangedSinceLogin: !lastLogin ? 'never_logged_in' : 'changed_after_login',
          });
        }
      } catch (userErr) {
        console.warn(`[getCandidatesDoneSinceLogin] Error processing candidate ${candidate.id}:`, userErr.message);
      }
    }

    return res.json({
      message: 'Candidates with status "done" since last login',
      count: results.length,
      totalDoneCandidates: doneCandidates.length,
      candidates: results,
    });
  } catch (e) {
    console.error('getCandidatesDoneSinceLogin error', e);
    return res.status(500).json({ 
      message: 'Server error', 
      error: e.message 
    });
  }
};

/**
 * GET /api/lecturer-profile/candidates-done-since-login-optimized
 * Optimized version using a single database query with raw SQL.
 * More efficient for large datasets.
 */
export const getCandidatesDoneSinceLoginOptimized = async (req, res) => {
  try {
    const [results] = await sequelize.query(`
      SELECT 
        c.id as candidateId,
        c.fullName,
        c.email,
        c.phone,
        c.positionAppliedFor,
        c.status,
        c.hourlyRate,
        c.updated_at as statusUpdatedAt,
        u.id as userId,
        u.display_name as displayName,
        u.last_login as lastLogin,
        CASE 
          WHEN u.last_login IS NULL THEN 'never_logged_in'
          WHEN c.updated_at > u.last_login THEN 'changed_after_login'
          ELSE 'no_change'
        END as statusChangedSinceLogin
      FROM Candidates c
      INNER JOIN users u ON c.email = u.email
      WHERE c.status = 'done'
        AND (u.last_login IS NULL OR c.updated_at > u.last_login)
      ORDER BY c.updated_at DESC
    `);

    return res.json({
      message: 'Candidates with status "done" since last login (optimized)',
      count: results.length,
      candidates: results,
    });
  } catch (e) {
    console.error('getCandidatesDoneSinceLoginOptimized error', e);
    return res.status(500).json({ 
      message: 'Server error', 
      error: e.message 
    });
  }
};
