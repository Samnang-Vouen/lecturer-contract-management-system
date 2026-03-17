import express from 'express';
import multer from 'multer';
import { protect, authorizeRoles } from '../middleware/auth.middleware.js';
import {
  onboardingUploadMiddleware,
  submitOnboarding,
  checkOnboarding,
} from '../controller/onboarding.controller.js';

const router = express.Router();

router.use(protect, authorizeRoles(['advisor']));

router.get('/status', checkOnboarding);

const uploadHandler = (req, res, next) => {
  onboardingUploadMiddleware(req, res, (err) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        console.warn('[advisor-onboarding] multer error', err.code, err.message);
        return res.status(413).json({ message: 'Uploaded file too large', code: err.code });
      }
      console.error('[advisor-onboarding] upload middleware error', err);
      return res.status(400).json({ message: 'Upload failed', error: err.message });
    }
    next();
  });
};

router.post('/', uploadHandler, submitOnboarding);

export default router;