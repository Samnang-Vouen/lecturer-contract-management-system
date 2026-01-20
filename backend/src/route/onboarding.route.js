import express from 'express';
import { protect, authorizeRoles } from '../middleware/auth.middleware.js';
import {
  onboardingUploadMiddleware,
  submitOnboarding,
  checkOnboarding,
} from '../controller/onboarding.controller.js';

const router = express.Router();

router.use(protect, authorizeRoles(['lecturer']));

router.get('/status', checkOnboarding);

// Wrap upload middleware to catch Multer errors (like file too large) and return 413
const uploadHandler = (req, res, next) => {
  onboardingUploadMiddleware(req, res, (err) => {
    if (err) {
      // Multer file size or other Multer-specific errors
      if (err instanceof multer.MulterError) {
        console.warn('[onboarding] multer error', err.code, err.message);
        return res.status(413).json({ message: 'Uploaded file too large', code: err.code });
      }
      console.error('[onboarding] upload middleware error', err);
      return res.status(400).json({ message: 'Upload failed', error: err.message });
    }
    next();
  });
};

router.post('/', uploadHandler, submitOnboarding);

export default router;
