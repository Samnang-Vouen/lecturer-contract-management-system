import { sendResponse } from '../utils/response.js';
import { HTTP_STATUS } from '../config/constants.js';
import {
  getEvaluationSummaryData,
  getEvaluationResultsData,
  uploadEvaluationData,
  getLecturerEvaluationPDFBuffer,
} from '../services/evaluation.service.js';

// GET /api/evaluations/summary/list
export const getEvaluationSummary = async (_req, res, next) => {
  try {
    const data = await getEvaluationSummaryData();
    return sendResponse(res, data);
  } catch (err) {
    return next(err);
  }
};

// GET /api/evaluations/:evaluationId/results
export const getEvaluationResults = async (req, res, next) => {
  try {
    const data = await getEvaluationResultsData(req.params.evaluationId);
    return sendResponse(res, data);
  } catch (err) {
    return next(err);
  }
};

// POST /api/evaluations/upload
export const uploadEvaluation = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        message: 'No file uploaded',
        error: 'Please upload an Excel file',
      });
    }
    const data = await uploadEvaluationData(req.file.path, req.body);
    return sendResponse(res, data, HTTP_STATUS.CREATED);
  } catch (err) {
    return next(err);
  }
};

// GET /api/evaluations/:evaluationId/lecturer/:lecturerId/pdf
export const getLecturerEvaluationPDF = async (req, res, next) => {
  try {
    const { evaluationId, lecturerId } = req.params;
    const pdfBuffer = await getLecturerEvaluationPDFBuffer(evaluationId, lecturerId);
    res.setHeader('Content-Type', 'application/pdf');
    return res.send(pdfBuffer);
  } catch (err) {
    return next(err);
  }
};
