import { sendResponse } from '../utils/response.js';
import { HTTP_STATUS } from '../config/constants.js';
import {
  getScheduleData,
  createScheduleEntryData,
  createBulkScheduleEntriesData,
  editScheduleEntryData,
  deleteScheduleEntryData,
} from '../services/scheduleEntry.service.js';

export const getSchedule = async (req, res, next) => {
  try {
    const data = await getScheduleData({ userId: req.user?.id, userRole: req.user?.role, query: req.query });
    return res.status(HTTP_STATUS.OK).json(data);
  } catch (err) {
    return next(err);
  }
};

export const createSchedule = async (req, res, next) => {
  try {
    const data = await createScheduleEntryData(req.body);
    return res.status(HTTP_STATUS.CREATED).json(data);
  } catch (err) {
    return next(err);
  }
};

export const createBulkSchedule = async (req, res, next) => {
  try {
    const data = await createBulkScheduleEntriesData(req.body);
    return res.status(HTTP_STATUS.CREATED).json(data);
  } catch (err) {
    return next(err);
  }
};

export const editSchedule = async (req, res, next) => {
  try {
    const data = await editScheduleEntryData(req.params.id, req.body);
    return sendResponse(res, data);
  } catch (err) {
    return next(err);
  }
};

export const deleteSchedule = async (req, res, next) => {
  try {
    const data = await deleteScheduleEntryData(req.params.id);
    return sendResponse(res, data);
  } catch (err) {
    return next(err);
  }
};
