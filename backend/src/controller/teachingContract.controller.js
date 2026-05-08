import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { HTTP_STATUS } from '../config/constants.js';
import {
  createDraftContractData,
  getContractData,
  listContractsData,
  generatePdfData,
  generateLecturerSummaryPdfData,
  updateStatusData,
  listRedoRequestsData,
  createRedoRequestData,
  updateRedoRequestStatusData,
  editContractData,
  deleteContractData,
  uploadSignatureData,
} from '../services/teachingContract.service.js';

// ---------------------------------------------------------------------------
// Multer middleware (stays in controller — not business logic)
// ---------------------------------------------------------------------------

const storage = multer.diskStorage({
  destination(_req, _file, cb) {
    const dir = path.join(process.cwd(), 'uploads', 'signatures', 'tmp');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename(_req, file, cb) {
    const ext = path.extname(file.originalname) || '.png';
    cb(null, `sig-${Date.now()}${ext}`);
  },
});

export const upload = multer({ storage });

// ---------------------------------------------------------------------------
// Handlers
// ---------------------------------------------------------------------------

export const createDraftContract = async (req, res, next) => {
  try {
    const data = await createDraftContractData({
      body: req.body,
      userId: req.user?.id,
      userRole: req.user?.role,
      departmentName: req.user?.department_name,
    });
    return res.status(HTTP_STATUS.CREATED).json(data);
  } catch (err) {
    return next(err);
  }
};

export const getContract = async (req, res, next) => {
  try {
    const data = await getContractData({
      id: req.params.id,
      userId: req.user?.id,
      role: req.user?.role,
      departmentName: req.user?.department_name,
    });
    return res.status(HTTP_STATUS.OK).json(data);
  } catch (err) {
    return next(err);
  }
};

export const listContracts = async (req, res, next) => {
  try {
    const data = await listContractsData({
      query: req.query,
      userId: req.user?.id,
      userRole: req.user?.role,
      departmentName: req.user?.department_name,
    });
    return res.status(HTTP_STATUS.OK).json(data);
  } catch (err) {
    return next(err);
  }
};

export const generatePdf = async (req, res, next) => {
  try {
    const { pdfBuffer, filename } = await generatePdfData({
      id: req.params.id,
      userId: req.user?.id,
      role: req.user?.role,
      departmentName: req.user?.department_name,
    });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return res.send(pdfBuffer);
  } catch (err) {
    return next(err);
  }
};

export const generateLecturerSummaryPdf = async (req, res, next) => {
  try {
    const { pdfBuffer, filename } = await generateLecturerSummaryPdfData({
      query: req.query,
      role: req.user?.role,
      departmentName: req.user?.department_name,
    });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return res.send(pdfBuffer);
  } catch (err) {
    return next(err);
  }
};

export const updateStatus = async (req, res, next) => {
  try {
    const data = await updateStatusData({
      id: req.params.id,
      body: req.body,
      userId: req.user?.id,
      role: req.user?.role,
    });
    return res.status(HTTP_STATUS.OK).json(data);
  } catch (err) {
    return next(err);
  }
};

export const listRedoRequests = async (req, res, next) => {
  try {
    const data = await listRedoRequestsData({
      id: req.params.id,
      userId: req.user?.id,
      role: req.user?.role,
      departmentName: req.user?.department_name,
    });
    return res.status(HTTP_STATUS.OK).json(data);
  } catch (err) {
    return next(err);
  }
};

export const createRedoRequest = async (req, res, next) => {
  try {
    const data = await createRedoRequestData({
      id: req.params.id,
      body: req.body,
      userId: req.user?.id,
      role: req.user?.role,
      departmentName: req.user?.department_name,
    });
    return res.status(HTTP_STATUS.CREATED).json(data);
  } catch (err) {
    return next(err);
  }
};

export const updateRedoRequestStatus = async (req, res, next) => {
  try {
    const data = await updateRedoRequestStatusData({
      contractId: req.params.id,
      requestId: req.params.requestId,
      body: req.body,
      userId: req.user?.id,
      role: req.user?.role,
      departmentName: req.user?.department_name,
    });
    return res.status(HTTP_STATUS.OK).json(data);
  } catch (err) {
    return next(err);
  }
};

export const editContract = async (req, res, next) => {
  try {
    const data = await editContractData({
      id: req.params.id,
      body: req.body,
      userId: req.user?.id,
      role: req.user?.role,
      departmentName: req.user?.department_name,
    });
    return res.status(HTTP_STATUS.OK).json(data);
  } catch (err) {
    return next(err);
  }
};

export const deleteContract = async (req, res, next) => {
  try {
    const data = await deleteContractData(req.params.id);
    return res.status(HTTP_STATUS.OK).json(data);
  } catch (err) {
    return next(err);
  }
};

export const uploadSignature = async (req, res, next) => {
  try {
    const data = await uploadSignatureData({
      id: req.params.id,
      who: req.query.who || req.body.who || 'lecturer',
      file: req.file,
      userId: req.user?.id,
      role: req.user?.role,
    });
    return res.status(HTTP_STATUS.OK).json(data);
  } catch (err) {
    return next(err);
  }
};
