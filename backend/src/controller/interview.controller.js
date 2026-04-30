import { sendResponse } from '../utils/response.js';
import { HTTP_STATUS } from '../config/constants.js';
import {
  listInterviewQuestions,
  addInterviewQuestion as svcAddInterviewQuestion,
  updateInterviewQuestion as svcUpdateInterviewQuestion,
  deleteInterviewQuestion as svcDeleteInterviewQuestion,
  searchInterviewQuestions as svcSearchInterviewQuestions,
  addCandidateQuestion as svcAddCandidateQuestion,
  getCandidateInterviewDetails as svcGetCandidateInterviewDetails,
} from '../services/interview.service.js';

export const getInterviewQuestions = async (req, res, next) => {
  try {
    const defaultOnly = req.query.defaultOnly === '1' || req.query.defaultOnly === 'true';
    const data = await listInterviewQuestions({ defaultOnly });
    return sendResponse(res, data);
  } catch (err) {
    return next(err);
  }
};

export const addInterviewQuestion = async (req, res, next) => {
  try {
    const data = await svcAddInterviewQuestion(req.body);
    return sendResponse(res, data, HTTP_STATUS.CREATED);
  } catch (err) {
    return next(err);
  }
};

export const updateInterviewQuestion = async (req, res, next) => {
  try {
    const data = await svcUpdateInterviewQuestion(req.params.id, req.body);
    return sendResponse(res, data);
  } catch (err) {
    return next(err);
  }
};

export const deleteInterviewQuestion = async (req, res, next) => {
  try {
    const data = await svcDeleteInterviewQuestion(req.params.id);
    return sendResponse(res, data);
  } catch (err) {
    return next(err);
  }
};

export const searchInterviewQuestions = async (req, res, next) => {
  try {
    const data = await svcSearchInterviewQuestions((req.query.query || '').trim());
    return sendResponse(res, data);
  } catch (err) {
    return next(err);
  }
};

export const addCandidateQuestion = async (req, res, next) => {
  try {
    const { data, created } = await svcAddCandidateQuestion(req.body);
    return sendResponse(res, data, created ? HTTP_STATUS.CREATED : HTTP_STATUS.OK);
  } catch (err) {
    return next(err);
  }
};

export const getCandidateInterviewDetails = async (req, res, next) => {
  try {
    const data = await svcGetCandidateInterviewDetails(req.params.id);
    return sendResponse(res, data);
  } catch (err) {
    return next(err);
  }
};

export default {
  getInterviewQuestions,
  addInterviewQuestion,
  updateInterviewQuestion,
  deleteInterviewQuestion,
  searchInterviewQuestions,
  addCandidateQuestion,
  getCandidateInterviewDetails,
};
