import { sendResponse } from '../utils/response.js';
import { HTTP_STATUS } from '../config/constants.js';
import { getUniversitiesData, createUniversityData } from '../services/university.service.js';
export { findOrCreateUniversities } from '../services/university.service.js';

export const getUniversities = async (_req, res, next) => {
  try {
    return sendResponse(res, await getUniversitiesData());
  } catch (err) {
    return next(err);
  }
};

export const createUniversity = async (req, res, next) => {
  try {
    return sendResponse(res, await createUniversityData(req.body?.name), HTTP_STATUS.CREATED);
  } catch (err) {
    return next(err);
  }
};
