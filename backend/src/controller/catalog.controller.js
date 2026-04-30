import { sendResponse } from '../utils/response.js';
import { listDepartments, listCourses } from '../services/catalog.service.js';

export const catalogDepartments = async (req, res, next) => {
  try {
    const data = await listDepartments();
    return sendResponse(res, data);
  } catch (err) {
    return next(err);
  }
};

export const catalogCourses = async (req, res, next) => {
  try {
    const data = await listCourses({
      role: req.user?.role,
      department_name: req.user?.department_name,
    });
    return sendResponse(res, data);
  } catch (err) {
    return next(err);
  }
};
