import express from 'express';
import { protect, authorizeRoles } from '../middleware/auth.middleware.js';
import {
  getAllUsers,
  createUser,
  updateUser,
  toggleUserStatus,
  deleteUser,
  resetUserPassword,
} from '../controller/user.controller.js';

const router = express.Router();

// All /users routes require authentication
router.use(protect);

// List & query users (admin + superadmin + management can view)
router.get('/', authorizeRoles(['admin', 'superadmin', 'management']), getAllUsers);

// Create user (superadmin only)
router.post('/', authorizeRoles(['superadmin']), createUser);

// Update user (admin + superadmin)
router.put('/:id', authorizeRoles(['admin', 'superadmin']), updateUser);

// Toggle status (admin + superadmin)
router.patch('/:id/status', authorizeRoles(['admin', 'superadmin']), toggleUserStatus);

// Delete user (superadmin only)
router.delete('/:id', authorizeRoles(['superadmin']), deleteUser);

// Reset user password (admin + superadmin)
router.post('/reset-password', authorizeRoles(['admin', 'superadmin']), resetUserPassword);

export default router;
