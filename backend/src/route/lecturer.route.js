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

const router = express.Router();

// All lecturer management routes require admin
router.use(protect, authorizeRoles(['admin']));

// List lecturers (directly from LecturerProfile)
router.get('/', getLecturers);
router.get('/:id/detail', getLecturerDetail);
router.put('/:id/courses', updateLecturerCourses);
router.patch('/:id/profile', updateLecturerProfile);
// Payroll upload (single file, field name 'payroll')
const upload = multer({ storage: multer.memoryStorage() });
router.post('/:id/payroll', upload.single('payroll'), uploadLecturerPayroll);

// Create lecturer (force role lecturer)
router.post(
  '/',
  (req, res, next) => {
    req.body.role = 'lecturer';
    /* department inferred in controller from creating admin */ next();
  },
  createUser
);

// Create lecturer from candidate id (auto populate fields & mark candidate done)
router.post('/from-candidate/:id', createLecturerFromCandidate);

// Update lecturer (force role lecturer on update)
router.put(
  '/:id',
  (req, res, next) => {
    req.body.role = 'lecturer';
    /* do not override department unless explicitly provided */ next();
  },
  updateUser
);

// Toggle status
router.patch('/:id/status', toggleUserStatus);

// Delete lecturer
router.delete('/:id', deleteUser);

export default router;
