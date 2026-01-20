import express from 'express';
import { protect, authorizeRoles } from '../middleware/auth.middleware.js';
import { getMyProfile, getMyActivity, changeMyPassword } from '../controller/profile.controller.js';

const router = express.Router();

router.use(protect);
// Allow admins and superadmins for now (extend if other roles need profile page)
router.use(authorizeRoles(['admin', 'superadmin', 'lecturer', 'management']));

router.get('/me', getMyProfile);
router.get('/activity', getMyActivity);
router.post('/change-password', changeMyPassword);

export default router;
