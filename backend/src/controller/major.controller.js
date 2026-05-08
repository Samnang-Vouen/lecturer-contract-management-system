import { sendResponse } from '../utils/response.js';
import { HTTP_STATUS } from '../config/constants.js';
import { getMajorsData, createMajorData } from '../services/major.service.js';
export { findOrCreateMajors } from '../services/major.service.js';

export const getMajors = async (_req, res, next) => {
  try {
    const data = await getMajorsData();
    return sendResponse(res, data);
  } catch (err) {
    return next(err);
  }
};

export const createMajor = async (req, res, next) => {
  try {
    const data = await createMajorData(req.body?.name);
    return sendResponse(res, data, HTTP_STATUS.CREATED);
  } catch (err) {
    return next(err);
  }
};
