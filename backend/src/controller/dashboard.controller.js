import { HTTP_STATUS } from '../config/constants.js';
import { sendResponse } from '../utils/response.js';
import {
  getDashboardStatsData,
  getDashboardRealtimeData,
  getDashboardNotificationsData,
  recordPresence,
} from '../services/dashboard.service.js';

export const getDashboardStats = async (req, res, next) => {
  try {
    const data = await getDashboardStatsData({ role: req.user.role, department_name: req.user.department_name, query: req.query });
    return sendResponse(res, data);
  } catch (err) {
    return next(err);
  }
};

export const getDashboardRealtime = async (req, res, next) => {
  try {
    const data = await getDashboardRealtimeData({ role: req.user.role, department_name: req.user.department_name });
    return sendResponse(res, data);
  } catch (err) {
    return next(err);
  }
};

export const postDashboardPresence = async (req, res, next) => {
  try {
    const data = recordPresence({ userId: req.user?.id, department_name: req.user.department_name, bodyDept: req.body?.department });
    return sendResponse(res, data);
  } catch (err) {
    return next(err);
  }
};

export const getDashboardActivities = async (req, res, next) => {
  try {
    const data = await getDashboardStatsData({ role: req.user.role, department_name: req.user.department_name, query: req.query });
    return sendResponse(res, data.recentActivities || []);
  } catch (err) {
    return next(err);
  }
};

export const getDashboardNotifications = async (req, res, next) => {
  try {
    const data = await getDashboardNotificationsData({ role: req.user.role, department_name: req.user.department_name });
    return sendResponse(res, data);
  } catch (err) {
    return next(err);
  }
};
