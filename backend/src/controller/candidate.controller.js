import { HTTP_STATUS } from '../config/constants.js';
import { sendResponse } from '../utils/response.js';
import {
  listCandidates,
  createCandidateRecord,
  updateCandidateRecord,
  deleteCandidateRecord,
} from '../services/candidate.service.js';

export const getCandidates = async (req, res, next) => {
  try {
    const result = await listCandidates({
      page: req.query.page,
      limit: req.query.limit,
      status: req.query.status,
      search: req.query.search,
      role: req.user?.role,
      department_name: req.user?.department_name,
    });
    return sendResponse(res, result);
  } catch (err) {
    return next(err);
  }
};

export const createCandidate = async (req, res, next) => {
  try {
    const { fullName, email, phone, positionAppliedFor, interviewDate } = req.body;
    const candidate = await createCandidateRecord({
      fullName, email, phone, positionAppliedFor, interviewDate,
      role: req.user?.role,
      department_name: req.user?.department_name,
    });
    return sendResponse(res, candidate, HTTP_STATUS.CREATED);
  } catch (err) {
    return next(err);
  }
};

export const updateCandidate = async (req, res, next) => {
  try {
    const candidate = await updateCandidateRecord({
      id: req.params.id,
      updates: req.body,
      role: req.user?.role,
      department_name: req.user?.department_name,
    });
    return sendResponse(res, candidate);
  } catch (err) {
    return next(err);
  }
};

export const deleteCandidate = async (req, res, next) => {
  try {
    await deleteCandidateRecord({
      id: req.params.id,
      role: req.user?.role,
      department_name: req.user?.department_name,
    });
    return sendResponse(res, { message: 'Candidate deleted' });
  } catch (err) {
    return next(err);
  }
};
