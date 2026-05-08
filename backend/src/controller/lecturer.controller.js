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
    const data = await updateLecturerCoursesData({
      userId: parseInt(req.params.id, 10),
      courseIdsRaw: req.body.course_ids,
      isAdmin: isAdmin(req),
      adminDeptName: req.user?.department_name,
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
