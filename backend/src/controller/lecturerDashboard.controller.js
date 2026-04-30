import { sendResponse } from '../utils/response.js';
import {
  getLecturerDashboardSummaryData,
  getLecturerRealtimeData,
  getLecturerActivitiesData,
  getLecturerSalaryAnalysisData,
} from '../services/lecturerDashboard.service.js';

const userContext = (req) => ({
  role: req.user?.role?.toLowerCase(),
  selfId: req.user?.id,
  requestedId: req.query.userId,
  selfDeptName: req.user?.department_name,
});

export async function getLecturerDashboardSummary(req, res, next) {
  try {
    const data = await getLecturerDashboardSummaryData({
      ...userContext(req),
      query: req.query,
    });
    return sendResponse(res, data);
  } catch (err) {
    return next(err);
  }
}

export async function getLecturerRealtime(req, res, next) {
  try {
    const data = await getLecturerRealtimeData(userContext(req));
    return sendResponse(res, data);
  } catch (err) {
    return next(err);
  }
}

export async function getLecturerActivities(req, res, next) {
  try {
    const data = await getLecturerActivitiesData(userContext(req));
    return sendResponse(res, data);
  } catch (err) {
    return next(err);
  }
}

export async function getLecturerSalaryAnalysis(req, res, next) {
  try {
    const data = await getLecturerSalaryAnalysisData(userContext(req));
    return sendResponse(res, data);
  } catch (err) {
    return next(err);
  }
}
