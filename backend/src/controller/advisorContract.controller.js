import { HTTP_STATUS } from '../config/constants.js';
import { sendResponse } from '../utils/response.js';
import {
  createAdvisorContractRecord,
  editAdvisorContractRecord,
  getAdvisorContractRecord,
  listAdvisorContractRecords,
  updateAdvisorContractStatus,
  uploadAdvisorContractSignatureFile,
} from '../services/advisorContract.service.js';
import {
  generateAdvisorPdfDocument,
  generateAdvisorSummaryPdfDocument,
} from '../services/advisorContractPdf.service.js';

export async function uploadAdvisorContractSignature(req, res, next) {
  try {
    const payload = await uploadAdvisorContractSignatureFile({
      user: req.user,
      contractId: parseInt(req.params.id, 10),
      body: req.body,
      file: req.file,
    });
    return sendResponse(res, payload);
  } catch (error) {
    return next(error);
  }
}

export async function createAdvisorContract(req, res, next) {
  try {
    const payload = await createAdvisorContractRecord({
      user: req.user,
      body: req.validated?.body || req.body || {},
    });
    return sendResponse(res, payload, HTTP_STATUS.CREATED);
  } catch (error) {
    return next(error);
  }
}

export async function listAdvisorContracts(req, res, next) {
  try {
    const payload = await listAdvisorContractRecords({ user: req.user, query: req.query });
    return sendResponse(res, payload);
  } catch (error) {
    return next(error);
  }
}

export async function getAdvisorContract(req, res, next) {
  try {
    const payload = await getAdvisorContractRecord({
      user: req.user,
      contractId: parseInt(req.params.id, 10),
    });
    return sendResponse(res, payload);
  } catch (error) {
    return next(error);
  }
}

export async function updateAdvisorStatus(req, res, next) {
  try {
    const payload = await updateAdvisorContractStatus({
      user: req.user,
      contractId: parseInt(req.params.id, 10),
      body: req.validated?.body || req.body || {},
    });
    return sendResponse(res, payload);
  } catch (error) {
    return next(error);
  }
}

export async function editAdvisorContract(req, res, next) {
  try {
    const payload = await editAdvisorContractRecord({
      contractId: parseInt(req.params.id, 10),
      body: req.validated?.body || req.body || {},
    });
    return sendResponse(res, payload);
  } catch (error) {
    return next(error);
  }
}

export async function generateAdvisorSummaryPdf(req, res, next) {
  try {
    const pdf = await generateAdvisorSummaryPdfDocument({ user: req.user, query: req.query });
    res.setHeader('Content-Type', pdf.contentType);
    res.setHeader('Content-Disposition', `inline; filename="${pdf.fileName}"`);
    return res.send(pdf.buffer);
  } catch (error) {
    return next(error);
  }
}

export async function generateAdvisorPdf(req, res, next) {
  try {
    const pdf = await generateAdvisorPdfDocument({
      user: req.user,
      contractId: parseInt(req.params.id, 10),
    });
    res.setHeader('Content-Type', pdf.contentType);
    res.setHeader('Content-Disposition', `inline; filename="${pdf.fileName}"`);
    return res.send(pdf.buffer);
  } catch (error) {
    return next(error);
  }
}