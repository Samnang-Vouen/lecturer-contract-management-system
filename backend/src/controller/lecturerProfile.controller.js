import { sendResponse } from '../utils/response.js';
import {
  getMyLecturerProfileData,
  getMyCandidateContactData,
  updateMyLecturerProfileData,
  uploadLecturerFilesData,
  getCandidatesDoneSinceLoginData,
  getCandidatesDoneSinceLoginOptimizedData,
} from '../services/lecturerProfile.service.js';

export const getMyLecturerProfile = async (req, res, next) => {
  try {
    const data = await getMyLecturerProfileData(req.user.id, {
      debug: String(req.query.debug || '') === '1',
    });
    return sendResponse(res, data);
  } catch (err) {
    return next(err);
  }
};

export const getMyCandidateContact = async (req, res, next) => {
  try {
    const data = await getMyCandidateContactData(req.user.id);
    return sendResponse(res, data);
  } catch (err) {
    return next(err);
  }
};

export const updateMyLecturerProfile = async (req, res, next) => {
  try {
    const data = await updateMyLecturerProfileData(req.user.id, req.body || {});
    return sendResponse(res, data);
  } catch (err) {
    return next(err);
  }
};

export const uploadLecturerFiles = async (req, res, next) => {
  try {
    const data = await uploadLecturerFilesData(req.user.id, req.files);
    return sendResponse(res, data);
  } catch (err) {
    return next(err);
  }
};

export const getCandidatesDoneSinceLogin = async (_req, res, next) => {
  try {
    const data = await getCandidatesDoneSinceLoginData();
    return sendResponse(res, data);
  } catch (err) {
    return next(err);
  }
};

export const getCandidatesDoneSinceLoginOptimized = async (_req, res, next) => {
  try {
    const data = await getCandidatesDoneSinceLoginOptimizedData();
    return sendResponse(res, data);
  } catch (err) {
    return next(err);
  }
};
