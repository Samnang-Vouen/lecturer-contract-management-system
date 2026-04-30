import { sendResponse } from '../utils/response.js';
import { HTTP_STATUS } from '../config/constants.js';
import { getResearchFieldsData, createResearchFieldData } from '../services/researchField.service.js';
export { findOrCreateResearchFields } from '../services/researchField.service.js';

export const getResearchFields = async (_req, res, next) => {
  try {
    return sendResponse(res, await getResearchFieldsData());
  } catch (err) {
    return next(err);
  }
};

export const createResearchField = async (req, res, next) => {
  try {
    return sendResponse(res, await createResearchFieldData(req.body?.name), HTTP_STATUS.CREATED);
  } catch (err) {
    return next(err);
  }
};
