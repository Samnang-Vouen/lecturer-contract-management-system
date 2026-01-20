import { Router } from 'express';
import { protect } from '../middleware/auth.middleware.js';
import { catalogDepartments, catalogCourses } from '../controller/catalog.controller.js';

const router = Router();

// Any authenticated user (lecturer, admin, etc.) can view catalog lists for onboarding.
router.get('/departments', protect, catalogDepartments);
router.get('/courses', protect, catalogCourses);

export default router;
