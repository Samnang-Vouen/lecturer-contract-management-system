import { HTTP_STATUS } from '../config/constants.js';
import { sendResponse } from '../utils/response.js';
import {
  backfillSchedules,
  listCourseMappingRecords,
  listCourseMappingAcademicYearsRecords,
  createCourseMappingRecord,
  updateCourseMappingRecord,
  deleteCourseMappingRecord,
  generateCourseMappingExcel,
} from '../services/courseMapping.service.js';

export const backfillCourseMappingSchedules = async (req, res, next) => {
  try {
    const data = await backfillSchedules({ role: req.user?.role, department_name: req.user?.department_name });
    return sendResponse(res, data);
  } catch (err) {
    return next(err);
  }
};

export const listCourseMappings = async (req, res, next) => {
  try {
    const data = await listCourseMappingRecords({ role: req.user?.role, department_name: req.user?.department_name, query: req.query });
    return sendResponse(res, data);
  } catch (err) {
    return next(err);
  }
};

export const listCourseMappingAcademicYears = async (req, res, next) => {
  try {
    const years = await listCourseMappingAcademicYearsRecords({ role: req.user?.role, department_name: req.user?.department_name });
    return sendResponse(res, { data: years });
  } catch (err) {
    return next(err);
  }
};

export const createCourseMapping = async (req, res, next) => {
  try {
    const data = await createCourseMappingRecord({ body: req.body, role: req.user?.role, department_name: req.user?.department_name });
    return sendResponse(res, data, HTTP_STATUS.CREATED);
  } catch (err) {
    return next(err);
  }
};

export const updateCourseMapping = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    const data = await updateCourseMappingRecord({ id, body: req.body, role: req.user?.role, department_name: req.user?.department_name });
    return sendResponse(res, data);
  } catch (err) {
    return next(err);
  }
};

export const deleteCourseMapping = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    const data = await deleteCourseMappingRecord({ id, idsParam: req.query?.ids, role: req.user?.role, department_name: req.user?.department_name });
    return sendResponse(res, data);
  } catch (err) {
    return next(err);
  }
};

export const exportCourseMappings = async (req, res, next) => {
  try {
    const { buffer, fileName } = await generateCourseMappingExcel({
      academicYear: (req.query.academic_year || '').trim(),
      termStart: (req.query.term_start || '').trim(),
      termEnd: (req.query.term_end || '').trim(),
      role: req.user?.role,
      department_name: req.user?.department_name,
    });
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    return res.send(buffer);
  } catch (err) {
    return next(err);
  }
};
