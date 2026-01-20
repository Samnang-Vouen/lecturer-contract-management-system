import express from 'express';
import {
  login,
  logout,
  checkAuth /* , changeSuperadminPassword */,
} from '../controller/auth.controller.js';
import { protect, authorizeRoles } from '../middleware/auth.middleware.js';

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

export default router;
