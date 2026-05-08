import { sendResponse } from '../utils/response.js';
import {
  getHourlyRateData,
  getHourlyRateReportData,
  updateHourlyRateData,
  updateHourlyRateReportData,
} from '../services/hourlyRate.service.js';

// GET /api/hourly-rates
export const getHourlyRate = async (_req, res, next) => {
  try {
    const data = await getHourlyRateData();
    return sendResponse(res, data);
  } catch (err) {
    return next(err);
  }
};

// GET /api/hourly-rates/report
export const getHourlyRateReport = async (req, res, next) => {
  try {
    const data = await getHourlyRateReportData({
      academicYear: req.query.academicYear,
      role: req.user?.role,
      departmentName: req.user?.department_name,
    });
    return sendResponse(res, data);
  } catch (err) {
    return next(err);
  }
};

// PUT /api/hourly-rates/lecturer/:lecturerId
export const updateHourlyRate = async (req, res, next) => {
  try {
    const data = await updateHourlyRateData(req.params.lecturerId, req.body);
    return sendResponse(res, data);
  } catch (err) {
    return next(err);
  }
};

// PUT /api/hourly-rates/report/:lecturerId
export const updateHourlyRateReport = async (req, res, next) => {
  try {
    const data = await updateHourlyRateReportData(req.params.lecturerId, req.body, {
      role: req.user?.role,
      departmentName: req.user?.department_name,
    });
    return sendResponse(res, data);
  } catch (err) {
    return next(err);
  }
};
