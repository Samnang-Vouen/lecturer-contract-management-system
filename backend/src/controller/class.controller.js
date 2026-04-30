import { sendResponse } from '../utils/response.js';
import { HTTP_STATUS } from '../config/constants.js';
import {
  listClasses,
  getClass,
  createClassRecord,
  updateClassRecord,
  deleteClassRecord,
  assignCoursesToClass,
  upgradeClassRecord,
} from '../services/class.service.js';

const ClassController = {
  async getAllClasses(req, res, next) {
    try {
      const data = await listClasses({
        role: req.user?.role,
        department_name: req.user?.department_name,
        page: req.query.page,
        limit: req.query.limit,
      });
      return sendResponse(res, data);
    } catch (err) {
      return next(err);
    }
  },

  async getClassById(req, res, next) {
    try {
      const data = await getClass({
        id: req.params.id,
        role: req.user?.role,
        department_name: req.user?.department_name,
      });
      return sendResponse(res, data);
    } catch (err) {
      return next(err);
    }
  },

  async createClass(req, res, next) {
    try {
      const data = await createClassRecord({
        payload: req.body,
        role: req.user?.role,
        department_name: req.user?.department_name,
      });
      return sendResponse(res, data, HTTP_STATUS.CREATED);
    } catch (err) {
      return next(err);
    }
  },

  async updateClass(req, res, next) {
    try {
      const data = await updateClassRecord({
        id: req.params.id,
        body: req.body,
        role: req.user?.role,
        department_name: req.user?.department_name,
      });
      return sendResponse(res, data);
    } catch (err) {
      return next(err);
    }
  },

  async deleteClass(req, res, next) {
    try {
      await deleteClassRecord({
        id: req.params.id,
        role: req.user?.role,
        department_name: req.user?.department_name,
      });
      return sendResponse(res, { success: true });
    } catch (err) {
      return next(err);
    }
  },

  async assignCourses(req, res, next) {
    try {
      const data = await assignCoursesToClass({
        id: req.params.id,
        courses: req.body.courses,
        role: req.user?.role,
        department_name: req.user?.department_name,
      });
      return sendResponse(res, data);
    } catch (err) {
      return next(err);
    }
  },

  async upgradeClass(req, res, next) {
    try {
      const data = await upgradeClassRecord({
        id: req.params.id,
        payload: req.body,
        role: req.user?.role,
        department_name: req.user?.department_name,
      });
      return sendResponse(res, data, HTTP_STATUS.CREATED);
    } catch (err) {
      return next(err);
    }
  },
};

export default ClassController;
