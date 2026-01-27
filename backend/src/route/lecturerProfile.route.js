import { Router } from 'express';
import multer from 'multer';
import { protect, authorizeRoles } from '../middleware/auth.middleware.js';
import {
  getMyLecturerProfile,
  updateMyLecturerProfile,
  uploadLecturerFiles,
  getMyCandidateContact,
} from '../controller/lecturerProfile.controller.js';

const router = Router();

router.use(protect, authorizeRoles(['lecturer', 'admin', 'superadmin']));

router.get('/me', getMyLecturerProfile);
router.put('/me', updateMyLecturerProfile);
router.get('/me/candidate-contact', getMyCandidateContact);

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });
router.post(
  '/me/files',
  upload.fields([
    { name: 'cv', maxCount: 1 },
    { name: 'syllabus', maxCount: 1 },
  ]),
  uploadLecturerFiles
);

export default router;
