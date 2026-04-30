import { sendResponse } from '../utils/response.js';
import { HTTP_STATUS } from '../config/constants.js';
import {
  getAllUsersData,
  createUserAccount,
  createLecturerFromCandidateData,
  updateUserData,
  toggleUserStatusData,
  deleteUserData,
  resetUserPasswordData,
} from '../services/user.service.js';

export const getAllUsers = async (req, res, next) => {
  try {
    const data = await getAllUsersData({
      page: req.query.page,
      limit: req.query.limit,
      roleFilter: req.query.role,
      deptFilter: req.query.department,
      search: req.query.search,
      actorRole: req.user?.role,
      actorDepartmentName: req.user?.department_name,
    });
    return res.status(HTTP_STATUS.OK).json(data);
  } catch (err) {
    return next(err);
  }
};

export const createUser = async (req, res, next) => {
  try {
    const responseData = await createUserAccount({ ...(req.body || {}), actorDepartmentName: req.user?.department_name });
    return sendResponse(res, responseData, HTTP_STATUS.CREATED);
  } catch (err) {
    return next(err);
  }
};

export const createLecturerFromCandidate = async (req, res, next) => {
  try {
    const data = await createLecturerFromCandidateData({
      candId: parseInt(req.params.id, 10),
      actorDepartmentName: req.user?.department_name,
      email: req.body?.email,
      title: req.body?.title,
      gender: req.body?.gender,
    });
    return res.status(HTTP_STATUS.CREATED).json(data);
  } catch (err) {
    return next(err);
  }
};

export const updateUser = async (req, res, next) => {
  try {
    const data = await updateUserData({ id: req.params.id, ...req.body });
    return sendResponse(res, data);
  } catch (err) {
    return next(err);
  }
};

export const toggleUserStatus = async (req, res, next) => {
  try {
    return sendResponse(res, await toggleUserStatusData(req.params.id));
  } catch (err) {
    return next(err);
  }
};

export const deleteUser = async (req, res, next) => {
  try {
    return sendResponse(res, await deleteUserData(req.params.id));
  } catch (err) {
    return next(err);
  }
};

export const resetUserPassword = async (req, res, next) => {
  try {
    const data = await resetUserPasswordData({
      email: req.body?.email,
      newPassword: req.body?.newPassword,
      actorRole: req.user?.role,
    });
    return sendResponse(res, data);
  } catch (err) {
    return next(err);
  }
};
