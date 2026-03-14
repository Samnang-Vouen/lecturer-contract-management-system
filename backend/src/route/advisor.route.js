import express from 'express';
import multer from 'multer';
import { protect, authorizeRoles } from '../middleware/auth.middleware.js';
import { createAdvisor, createAdvisorFromCandidate } from '../controller/advisor.controller.js';
import {
	getLecturers,
	getLecturerDetail,
	updateLecturerCourses,
	updateLecturerProfile,
	uploadLecturerPayroll,
} from '../controller/lecturer.controller.js';
import { updateUser, toggleUserStatus, deleteUser } from '../controller/user.controller.js';
import { ensureUserHasRoleParam } from '../middleware/ensureUserRoleParam.middleware.js';

const router = express.Router();

// Advisor management routes require admin
router.use(protect, authorizeRoles(['admin']));

// Create advisor (force role advisor)
router.post('/', createAdvisor);

// Create advisor from candidate (accepted only)
router.post('/from-candidate/:id', createAdvisorFromCandidate);

// List advisors (same shape as /api/lecturers but role-filtered)
router.get('/', (req, _res, next) => {
	req.query.role = 'advisor';
	next();
}, getLecturers);

// Advisor detail / profile management (admin)
router.use((req, _res, next) => {
	// Advisor profiles are managed by admins and may not have teaching courses in the
	// admin's department; skip course-based department access restriction in reused handlers.
	req.skipDeptCourseAccessCheck = true;
	next();
});

router.get('/:id/detail', ensureUserHasRoleParam('advisor'), getLecturerDetail);
router.put('/:id/courses', ensureUserHasRoleParam('advisor'), updateLecturerCourses);
router.patch('/:id/profile', ensureUserHasRoleParam('advisor'), updateLecturerProfile);

// Payroll upload (single file, field name 'payroll')
const upload = multer({ storage: multer.memoryStorage() });
router.post(
	'/:id/payroll',
	ensureUserHasRoleParam('advisor'),
	upload.single('payroll'),
	uploadLecturerPayroll
);

// Update advisor (force role advisor, position Advisor)
router.put(
	'/:id',
	ensureUserHasRoleParam('advisor'),
	(req, _res, next) => {
		req.body.role = 'advisor';
		req.body.position = 'Advisor';
		next();
	},
	updateUser
);

// Toggle status
router.patch('/:id/status', ensureUserHasRoleParam('advisor'), toggleUserStatus);

// Delete advisor
router.delete('/:id', ensureUserHasRoleParam('advisor'), deleteUser);

export default router;
