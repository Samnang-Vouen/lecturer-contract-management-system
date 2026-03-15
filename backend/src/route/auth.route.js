import express from 'express';
import {
  login,
  logout,
  checkAuth,
  forgotPassword,
  resetPassword /* , changeSuperadminPassword */,
} from '../controller/auth.controller.js';
import { protect, authorizeRoles } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { ForgotPasswordSchema, ResetPasswordSchema } from '../validators/auth.validators.js';

const router = express.Router();

// Login - open to all
router.post('/login', login);

// Logout - open to all
router.post('/logout', logout);

// Check authentication status - protected
router.get('/check' /* , protect */, checkAuth);

// Change superadmin password - protected superadmin-only
router.post(
  '/change-password',
  protect,
  authorizeRoles('superadmin') /* , changeSuperadminPassword */
);

// Forgot password - request reset link via email (public)
router.post('/forgot-password', validate(ForgotPasswordSchema, 'body'), forgotPassword);

// Reset password - submit new password with token (public)
router.post('/reset-password', validate(ResetPasswordSchema, 'body'), resetPassword);

export default router;
