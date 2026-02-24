import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import {
  uploadEvaluation,
  getEvaluationResults,
  getLecturerEvaluationPDF,
} from '../controller/evaluation.controller.js';
//import { protect, authorizeRoles } from '../middleware/auth.middleware.js';

const router = express.Router();

// Configure multer for Excel file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/evaluations/';
    // Ensure directory exists
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    // Sanitize filename: extract only extension from basename
    const safeName = path.basename(file.originalname);
    const ext = path.extname(safeName).toLowerCase();
    // Only allow .xlsx or .xls extensions
    const allowedExts = ['.xlsx', '.xls'];
    const safeExt = allowedExts.includes(ext) ? ext : '.xlsx';
    cb(null, `evaluation-${uniqueSuffix}${safeExt}`);
  },
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    // Accept Excel files only
    if (
      file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
      file.mimetype === 'application/vnd.ms-excel' ||
      file.originalname.match(/\.(xlsx|xls)$/)
    ) {
      cb(null, true);
    } else {
      cb(new Error('Only Excel files (.xlsx, .xls) are allowed'));
    }
  },
});

// Protect routes - only admin can upload evaluations
// router.use(protect, authorizeRoles('admin'));

router.get('/:evaluationId/lecturer/:lecturerId/pdf', getLecturerEvaluationPDF);
router.get('/:evaluationId/results', getEvaluationResults);
router.post('/upload', upload.single('file'), uploadEvaluation);

export default router;
