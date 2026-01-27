import { Router } from 'express';
import { protect, authorizeRoles } from '../middleware/auth.middleware.js';
import {
  getAllUsers,
  createUser,
  updateUser,
  toggleUserStatus,
  deleteUser,
  resetUserPassword,
} from '../controller/user.controller.js';
import { validateId, validateEmail, validateName, validatePassword, validateEnum } from '../validators/validator.js';

const router = Router();

// All /users routes require authentication
router.use(protect);

// List & query users (admin + superadmin + management can view)
router.get('/',
  authorizeRoles(['admin', 'superadmin', 'management']),
  getAllUsers
);

// Create user (superadmin only)
router.post('/',
  authorizeRoles(['superadmin']),
  validateEmail('email'),
  validateName('name'),
  validatePassword('password'),
  validateEnum('role', ['admin', 'lecturer', 'management', 'superadmin']),
  createUser
);

// Update user (admin + superadmin)
router.put('/:id',
  authorizeRoles(['admin', 'superadmin']),
  validateId('id'),
  validateEmail('email', false),
  validateName('name', false),
  updateUser
);

// Toggle status (admin + superadmin)
router.patch('/:id/status',
  authorizeRoles(['admin', 'superadmin']),
  validateId('id'),
  validateEnum('status', ['active', 'inactive']),
  toggleUserStatus
);

// Delete user (superadmin only)
router.delete('/:id',
  authorizeRoles(['superadmin']),
  validateId('id'),
  deleteUser
);

// Reset user password (admin + superadmin)
router.post('/reset-password',
  authorizeRoles(['admin', 'superadmin']),
  validateEmail('email'),
  validatePassword('newPassword'),
  resetUserPassword
);

export default router;
