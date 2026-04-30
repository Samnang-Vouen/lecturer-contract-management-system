import { sendResponse } from '../utils/response.js';
import { HTTP_STATUS } from '../config/constants.js';
import {
  listGroups,
  createGroup as createGroupService,
  updateGroup,
  deleteGroup as deleteGroupService,
} from '../services/group.service.js';

// GET /api/groups
export const getGroup = async (req, res, next) => {
  try {
    const { class_id, class_name, dept_name, specialization } = req.query;
    const isAdmin = String(req.user?.role || '').toLowerCase() === 'admin';
    const data = await listGroups({
      class_id,
      class_name,
      dept_name,
      specialization,
      isAdmin,
      adminDeptName: req.user?.department_name,
    });
    return sendResponse(res, data);
  } catch (err) {
    return next(err);
  }
};

// POST /api/groups
export const createGroup = async (req, res, next) => {
  try {
    const data = await createGroupService(req.body);
    return sendResponse(res, data, HTTP_STATUS.CREATED);
  } catch (err) {
    return next(err);
  }
};

// PUT /api/groups/:id
export const editGroup = async (req, res, next) => {
  try {
    const data = await updateGroup(req.params.id, req.body);
    return sendResponse(res, data);
  } catch (err) {
    return next(err);
  }
};

// DELETE /api/groups/:id
export const deleteGroup = async (req, res, next) => {
  try {
    const data = await deleteGroupService(req.params.id);
    return sendResponse(res, data);
  } catch (err) {
    return next(err);
  }
};
