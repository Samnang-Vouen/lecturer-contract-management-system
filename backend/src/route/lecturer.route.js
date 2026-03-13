import express from 'express';
import multer from 'multer';
import { protect, authorizeRoles } from '../middleware/auth.middleware.js';
import {
  getAllUsers,
  createUser,
  updateUser,
  toggleUserStatus,
  deleteUser,
  createLecturerFromCandidate,
} from '../controller/user.controller.js';
import {
  getLecturers,
  getLecturerDetail,
  updateLecturerCourses,
  updateLecturerProfile,
  uploadLecturerPayroll,
} from '../controller/lecturer.controller.js';
import { ensureUserHasRoleParam } from '../middleware/ensureUserRoleParam.middleware.js';

const router = express.Router();

// All lecturer management routes require admin
router.use(protect, authorizeRoles(['admin']));

// List lecturers (directly from LecturerProfile)
router.get('/', getLecturers);
router.get('/:id/detail', ensureUserHasRoleParam('lecturer'), getLecturerDetail);
router.put('/:id/courses', ensureUserHasRoleParam('lecturer'), updateLecturerCourses);
router.patch('/:id/profile', ensureUserHasRoleParam('lecturer'), updateLecturerProfile);
// Payroll upload (single file, field name 'payroll')
const upload = multer({ storage: multer.memoryStorage() });
router.post(
  '/:id/payroll',
  ensureUserHasRoleParam('lecturer'),
  upload.single('payroll'),
  uploadLecturerPayroll
);

// Create lecturer (force role lecturer)
router.post(
  '/',
  (req, res, next) => {
    req.body.role = 'lecturer';
    // Enforce separation: advisor users must be created via /api/advisors
    if (String(req.body?.position || '').trim().toLowerCase() === 'advisor') {
      return res.status(400).json({
        message: "Advisor accounts must be created via /api/advisors (advisor role is different from lecturer)",
      });
    }
    /* department inferred in controller from creating admin */ next();
  },
  createUser
);

// Create lecturer from candidate id (auto populate fields & mark candidate done)
router.post('/from-candidate/:id', createLecturerFromCandidate);

// Update lecturer (force role lecturer on update)
router.put(
  '/:id',
  ensureUserHasRoleParam('lecturer'),
  (req, res, next) => {
    req.body.role = 'lecturer';
    /* do not override department unless explicitly provided */ next();
  },
  updateUser
);

// Toggle status
router.patch('/:id/status', ensureUserHasRoleParam('lecturer'), toggleUserStatus);

// Delete lecturer
router.delete('/:id', ensureUserHasRoleParam('lecturer'), deleteUser);

export default router;
