import express from 'express';
import ClassController from '../controller/class.controller.js';
import { protect, authorizeRoles } from '../middleware/auth.middleware.js';

const router = express.Router();

// All class management routes require authenticated admin
router.use(protect, authorizeRoles('admin'));

router.get('/', ClassController.getAllClasses);
router.get('/:id', ClassController.getClassById);
router.post('/', ClassController.createClass);
router.put('/:id', ClassController.updateClass);
router.delete('/:id', ClassController.deleteClass);
router.put('/:id/courses', ClassController.assignCourses);

export default router;
