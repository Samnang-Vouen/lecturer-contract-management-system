import express from 'express';
import { protect, authorizeRoles } from '../middleware/auth.middleware.js';
import { getMyCourses, getMyCourseMappings } from '../controller/lecturerSelf.controller.js';

const router = express.Router();

// Lecturers and advisors can access these endpoints
router.use(protect, authorizeRoles(['lecturer', 'advisor']));

router.get('/courses', getMyCourses);
router.get('/course-mappings', getMyCourseMappings);

export default router;
