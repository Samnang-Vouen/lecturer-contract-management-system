import { HTTP_STATUS } from '../config/constants.js';
import { sendResponse } from '../utils/response.js';
import {
  listCoursesRecords,
  createCourseRecord,
  updateCourseRecord,
  deleteCourseRecord,
} from '../services/course.service.js';

export const listCourses = async (req, res, next) => {
  try {
    const data = await listCoursesRecords({
      role: req.user.role,
      department_name: req.user.department_name,
      query: req.query,
    });
    return sendResponse(res, data);
  } catch (err) {
    return next(err);
  }
};

export const createCourse = async (req, res, next) => {
  try {
    const course = await createCourseRecord({
      body: req.body,
      role: req.user.role,
      department_name: req.user.department_name,
    });
    return sendResponse(res, { message: 'Course created', course }, HTTP_STATUS.CREATED);
  } catch (err) {
    return next(err);
  }
};

export const updateCourse = async (req, res, next) => {
  try {
    const course = await updateCourseRecord({ id: req.params.id, body: req.body });
    return sendResponse(res, { message: 'Course updated', course });
  } catch (err) {
    return next(err);
  }
};

export const deleteCourse = async (req, res, next) => {
  try {
    await deleteCourseRecord({ id: req.params.id });
    return sendResponse(res, { message: 'Course deleted' });
  } catch (err) {
    return next(err);
  }
};
