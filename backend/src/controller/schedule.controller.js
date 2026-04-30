import { sendResponse } from '../utils/response.js';
import { HTTP_STATUS } from '../config/constants.js';
import {
  getSchedulesData,
  getScheduleByIdData,
  createScheduleData,
  updateScheduleData,
  deleteScheduleData,
  generateFilteredSchedulePDFData,
  generateFilteredScheduleHTMLData,
  generateSchedulePDFFromSavedHTMLData,
} from '../services/schedule.service.js';

export const getSchedules = async (req, res, next) => {
  try {
    const data = await getSchedulesData({
      userId: req.user?.id,
      userRole: req.user?.role,
      query: { ...req.query, _adminDeptName: req.user?.department_name },
    });
    return res.status(HTTP_STATUS.OK).json(data);
  } catch (err) {
    return next(err);
  }
};

export const getScheduleById = async (req, res, next) => {
  try {
    const data = await getScheduleByIdData({
      id: req.params.id,
      userRole: req.user?.role,
      departmentName: req.user?.department_name,
    });
    return res.status(HTTP_STATUS.OK).json(data);
  } catch (err) {
    return next(err);
  }
};

export const createSchedule = async (req, res, next) => {
  try {
    const data = await createScheduleData(req.body);
    return res.status(HTTP_STATUS.CREATED).json(data);
  } catch (err) {
    return next(err);
  }
};

export const updateSchedule = async (req, res, next) => {
  try {
    const data = await updateScheduleData({ id: req.params.id, ...req.body });
    return sendResponse(res, data);
  } catch (err) {
    return next(err);
  }
};

export const deleteSchedule = async (req, res, next) => {
  try {
    const data = await deleteScheduleData(req.params.id);
    return sendResponse(res, data);
  } catch (err) {
    return next(err);
  }
};

export const generateFilteredSchedulePDF = async (req, res, next) => {
  try {
    const { pdfBuffer } = await generateFilteredSchedulePDFData(req.query);
    res.setHeader('Content-Type', 'application/pdf');
    return res.send(pdfBuffer);
  } catch (err) {
    return next(err);
  }
};

export const generateFilteredScheduleHTML = async (req, res, next) => {
  try {
    const data = await generateFilteredScheduleHTMLData({
      body: req.body,
      userRole: req.user?.role,
      departmentName: req.user?.department_name,
    });
    return res.status(HTTP_STATUS.OK).json(data);
  } catch (err) {
    return next(err);
  }
};

export const generateSchedulePDFFromSavedHTML = async (req, res, next) => {
  try {
    const { pdfBuffer } = await generateSchedulePDFFromSavedHTMLData({ file: req.query?.file });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="all-schedules.pdf"');
    return res.send(pdfBuffer);
  } catch (err) {
    return next(err);
  }
};
