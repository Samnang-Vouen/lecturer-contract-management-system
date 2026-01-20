import { Router } from 'express';
import { protect, authorizeRoles } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { CourseCreateSchema, CourseUpdateSchema } from '../validators/course.validators.js';
import {
  listCourses,
  createCourse,
  updateCourse,
  deleteCourse,
} from '../controller/course.controller.js';

const router = Router();

// Dynamic courses CRUD
router.get('/', protect, authorizeRoles('admin', 'superadmin'), listCourses);
router.post(
  '/',
  protect,
  authorizeRoles('admin', 'superadmin'),
  validate(CourseCreateSchema, 'body'),
  createCourse
);
router.put(
  '/:id',
  protect,
  authorizeRoles('admin', 'superadmin'),
  validate(CourseUpdateSchema, 'body'),
  updateCourse
);
router.delete('/:id', protect, authorizeRoles('admin', 'superadmin'), deleteCourse);

export default router;
