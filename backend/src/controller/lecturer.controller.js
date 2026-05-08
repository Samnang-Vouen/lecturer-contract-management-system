<<<<<<< samnang
import { sendResponse } from '../utils/response.js';
import {
  listLecturers,
  getLecturerDetailData,
  updateLecturerCoursesData,
  updateLecturerProfileData,
  uploadLecturerPayrollData,
  importLecturersFromExcelData,
} from '../services/lecturer.service.js';

const isAdmin = (req) => String(req.user?.role || '').toLowerCase() === 'admin';

// GET /api/lecturers
export const getLecturers = async (req, res, next) => {
=======
import { Op, Sequelize } from 'sequelize';
import fs from 'fs';
import path from 'path';
import sequelize from '../config/db.js';
import { LecturerProfile, User, Department, Role, UserRole, DepartmentProfile } from '../model/index.js';
import Candidate from '../model/candidate.model.js';
import LecturerCourse from '../model/lecturerCourse.model.js';
import Course from '../model/course.model.js';
import { findOrCreateResearchFields } from './researchField.controller.js';
import { findOrCreateUniversities } from './university.controller.js';
import { findOrCreateMajors } from './major.controller.js';
import xlsx from 'xlsx';
import bcrypt from 'bcrypt';
import { getNotificationSocket } from '../socket/index.js';

const TEMP_PASSWORD_LENGTH = 10;

const generateTempPassword = () => {
  let tempPassword = '';
  while (tempPassword.length < TEMP_PASSWORD_LENGTH) {
    tempPassword += Math.random().toString(36).slice(2);
  }
  return tempPassword.slice(0, TEMP_PASSWORD_LENGTH);
};

const normalizeImportedRoleAndPosition = (value) => {
  const raw = String(value || '').trim();
  if (!raw) {
    return { roleType: 'lecturer', position: 'Lecturer', occupation: 'Lecturer' };
  }

  if (/\b(advisor|adviser)\b/i.test(raw) || /អ្នក\s*ប្រឹក្សា/.test(raw)) {
    return { roleType: 'advisor', position: 'Advisor', occupation: 'Advisor' };
  }

  if (/\b(assistant\s+lecturer|teaching\s+assistant|assistant|ta)\b/i.test(raw)) {
    return {
      roleType: 'lecturer',
      position: 'Assistant Lecturer',
      occupation: 'Assistant Lecturer',
    };
  }

  return { roleType: 'lecturer', position: 'Lecturer', occupation: 'Lecturer' };
};

const buildImportedCredentialsWorkbook = (rows) => {
  const worksheet = xlsx.utils.json_to_sheet(rows, {
    header: ['email', 'tempPassword'],
  });
  const workbook = xlsx.utils.book_new();
  xlsx.utils.book_append_sheet(workbook, worksheet, 'Credentials');
  return xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });
};

const normalizeImportedTitle = (value) => {
  const raw = String(value || '').trim().replace(/\./g, '');
  if (!raw) return null;
  const normalized = raw.toLowerCase();
  if (normalized === 'mr') return 'Mr';
  if (normalized === 'ms' || normalized === 'miss') return 'Ms';
  if (normalized === 'mrs') return 'Mrs';
  if (normalized === 'dr') return 'Dr';
  if (normalized === 'prof' || normalized === 'professor') return 'Prof';
  return null;
};

const importedTitlePrefixRegex = /^(mr\.?|ms\.?|mrs\.?|dr\.?|prof\.?|professor|miss)\s+/i;

const stripImportedTitleFromName = (value) =>
  String(value || '')
    .trim()
    .replace(importedTitlePrefixRegex, '')
    .replace(/\s+/g, ' ')
    .trim();

const inferImportedTitle = ({ titleInput, fullName, genderInput }) => {
  const explicitTitle = normalizeImportedTitle(titleInput);
  if (String(titleInput || '').trim()) return explicitTitle;

  const inferredFromName = normalizeImportedTitle(String(fullName || '').trim().split(/\s+/)[0]);
  if (inferredFromName) return inferredFromName;

  const gender = normalizeImportedGender(genderInput);
  if (gender === 'male') return 'Mr';
  if (gender === 'female') return 'Ms';
  return null;
};

const normalizeImportedGender = (value) => {
  const raw = String(value || '').trim().toLowerCase();
  if (!raw) return null;
  if (['male', 'female', 'other'].includes(raw)) return raw;
  return null;
};

const normalizeImportedHourlyRate = (value) => {
  if (value === null || value === undefined || value === '') return null;
  const parsed = Number.parseFloat(String(value).replace(/[^0-9.-]/g, ''));
  if (!Number.isFinite(parsed) || parsed <= 0) return null;
  return parsed;
};

const isImportedWorksheetRowEmpty = (row) => {
  if (!row || typeof row !== 'object') return true;
  return Object.values(row).every((value) => {
    if (value === null || value === undefined) return true;
    if (typeof value === 'string') return value.trim() === '';
    return false;
  });
};

const sanitizeDisplayName = (name) => {
  const base = path.basename(String(name || '')).trim();
  if (!base) return 'syllabus.pdf';
  const cleaned = base
    .replace(/[\u0000-\u001f\u007f]/g, '')
    .replace(/\s+/g, ' ')
    .slice(0, 120)
    .trim();
  return cleaned || 'syllabus.pdf';
};

const syllabusManifestPath = (folderSlug) =>
  path.join(process.cwd(), 'uploads', 'lecturers', folderSlug, 'syllabus', '_manifest.json');

const readSyllabusManifest = async (folderSlug) => {
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
};

const listSyllabusFilesWithNames = async (folderSlug, legacySinglePath = null) => {
  const legacy = legacySinglePath ? String(legacySinglePath).replace(/\\/g, '/').replace(/^\//, '') : null;
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
};

/**
 * GET /api/lecturers
 * Returns lecturers sourced directly from Lecturer_Profiles + joined User.
 * Query params: page (1-based), limit (default 10), search
 */
export const getLecturers = async (req, res) => {
>>>>>>> main
  try {
    const data = await listLecturers({
      page: req.query.page,
      limit: req.query.limit,
      search: req.query.search,
      statusFilter: req.query.status,
      departmentFilter: req.query.department,
      roleQuery: req.query.role,
      isAdmin: isAdmin(req),
      adminDeptName: req.user?.department_name,
    });
    return sendResponse(res, data);
  } catch (err) {
    return next(err);
  }
};

// GET /api/lecturers/:id/detail
export const getLecturerDetail = async (req, res, next) => {
  try {
    const data = await getLecturerDetailData({
      userId: parseInt(req.params.id, 10),
      isAdmin: isAdmin(req),
      adminDeptName: req.user?.department_name,
      skipDeptCourseAccessCheck: Boolean(req.skipDeptCourseAccessCheck),
    });
    return sendResponse(res, data);
  } catch (err) {
    return next(err);
  }
};

// PUT /api/lecturers/:id/courses
export const updateLecturerCourses = async (req, res, next) => {
  try {
<<<<<<< samnang
    const data = await updateLecturerCoursesData({
      userId: parseInt(req.params.id, 10),
      courseIdsRaw: req.body.course_ids,
      isAdmin: isAdmin(req),
      adminDeptName: req.user?.department_name,
=======
    const userId = parseInt(req.params.id, 10);
    const courseIdsRaw = req.body.course_ids;
    if (!Array.isArray(courseIdsRaw))
      return res.status(400).json({ message: 'course_ids array required' });
    const courseIds = courseIdsRaw.map((n) => parseInt(n, 10)).filter((n) => Number.isInteger(n));
    if (!courseIds.length) {
      return res.status(400).json({ message: 'At least one course id required' });
    }

    const profile = await LecturerProfile.findOne({ where: { user_id: userId } });
    if (!profile) return res.status(404).json({ message: 'Lecturer not found' });

    // For department admins, validate that all courses belong to their department
    let coursesWhere = { id: courseIds };
    if (req.user?.role === 'admin' && req.user.department_name) {
      const dept = await Department.findOne({ where: { dept_name: req.user.department_name } });
      if (!dept) {
        return res.status(400).json({ message: 'Your department not found' });
      }
      coursesWhere.dept_id = dept.id;
    }

    const courses = await Course.findAll({ where: coursesWhere });

    // Validate that all requested courses were found (and belong to admin's department if applicable)
    if (courses.length !== courseIds.length) {
      const foundIds = courses.map((c) => c.id);
      const missingIds = courseIds.filter((id) => !foundIds.includes(id));
      return res.status(400).json({
        message:
          req.user?.role === 'admin'
            ? 'Some courses not found in your department or do not exist'
            : 'Some courses not found',
        missingIds,
      });
    }

    // For department admins, only destroy courses from their own department
    // This allows lecturers to have courses from multiple departments simultaneously
    if (req.user?.role === 'admin' && req.user.department_name) {
      const dept = await Department.findOne({ where: { dept_name: req.user.department_name } });
      if (dept) {
        // Only destroy LecturerCourse entries for courses in this admin's department
        const existingCoursesInDept = await LecturerCourse.findAll({
          where: { lecturer_profile_id: profile.id },
          include: [
            {
              model: Course,
              where: { dept_id: dept.id },
              attributes: ['id'],
            },
          ],
        });
        const existingIds = existingCoursesInDept.map((lc) => lc.id);
        if (existingIds.length > 0) {
          await LecturerCourse.destroy({ where: { id: existingIds } });
        }
      }
    } else {
      // Superadmins can destroy all lecturer courses
      await LecturerCourse.destroy({ where: { lecturer_profile_id: profile.id } });
    }

    await LecturerCourse.bulkCreate(
      courses.map((c) => ({ lecturer_profile_id: profile.id, course_id: c.id }))
    );

    try {
      const notificationSocket = getNotificationSocket();
      if (notificationSocket) {
        const courseNames = courses.map((c) => c.course_name || `Course #${c.id}`).join(', ');
        await notificationSocket.notifyLecturer({
          user_id: userId,
          type: 'course_assigned',
          message: `Your course assignments have been updated: ${courseNames}`,
          data: { course_ids: courses.map((c) => c.id) },
        });
      }
    } catch (notifErr) {
      console.error('[updateLecturerCourses] notification failed:', notifErr.message);
    }

    return res.json({
      message: 'Courses updated',
      count: courses.length,
      course_ids: courses.map((c) => c.id),
>>>>>>> main
    });
    return sendResponse(res, data);
  } catch (err) {
    return next(err);
  }
};

// PATCH /api/lecturers/:id/profile
export const updateLecturerProfile = async (req, res, next) => {
  try {
    const data = await updateLecturerProfileData(parseInt(req.params.id, 10), req.body);
    return sendResponse(res, data);
  } catch (err) {
    return next(err);
  }
};

// POST /api/lecturers/:id/payroll
export const uploadLecturerPayroll = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Missing payroll file' });
    }
    const data = await uploadLecturerPayrollData(parseInt(req.params.id, 10), req.file);
    return sendResponse(res, data);
  } catch (err) {
    return next(err);
  }
};

// POST /api/lecturers/import/excel
export const importLecturersFromExcel = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Excel file required' });
    }
    const data = await importLecturersFromExcelData(
      req.file.buffer,
      String(req.user?.department_name || '').trim()
    );
    return sendResponse(res, data);
  } catch (err) {
    return next(err);
  }
};
