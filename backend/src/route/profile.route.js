import { Router } from 'express';
import { protect, authorizeRoles } from '../middleware/auth.middleware.js';
import { getMyProfile, getMyActivity, changeMyPassword } from '../controller/profile.controller.js';
import { validatePassword } from '../validators/validator.js';

const router = Router();

router.use(protect);
// Allow admins and superadmins for now (extend if other roles need profile page)
router.use(authorizeRoles(['admin', 'superadmin', 'lecturer', 'management']));

router.get('/me', getMyProfile);

router.get('/activity', getMyActivity);

router.post('/change-password',
  validatePassword('oldPassword'),
  validatePassword('newPassword'),
  changeMyPassword
);

export default router;
