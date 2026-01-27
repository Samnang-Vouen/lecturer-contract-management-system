import { Router } from 'express';
import {
  login,
  logout,
  checkAuth /* , changeSuperadminPassword */,
} from '../controller/auth.controller.js';
import { protect, authorizeRoles } from '../middleware/auth.middleware.js';
import { validateEmail, validatePassword } from '../validators/validator.js';

const router = Router();

// Login - open to all
router.post('/login',
  validateEmail('email'),
  validatePassword('password'),
  login
);

// Logout - open to all
router.post('/logout', logout);

// Check authentication status - protected
router.get('/check' /* , protect */, checkAuth);

// Change superadmin password - protected superadmin-only
router.post('/change-password',
  protect,
  authorizeRoles('superadmin'),
  validatePassword('oldPassword'),
  validatePassword('newPassword')
  /* , changeSuperadminPassword */
);

export default router;
