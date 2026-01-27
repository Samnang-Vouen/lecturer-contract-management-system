import { Router } from 'express';
import ClassController from '../controller/class.controller.js';
import { protect, authorizeRoles } from '../middleware/auth.middleware.js';
import { validateId, validateString, validateNumber } from '../validators/validator.js';

const router = Router();

// All class management routes require authenticated admin
router.use(protect, authorizeRoles('admin'));

router.get('/', ClassController.getAllClasses);

router.get('/:id',
  validateId('id'),
  ClassController.getClassById
);

router.post('/',
  validateString('class_name', 1, 100),
  ClassController.createClass
);

router.put('/:id',
  validateId('id'),
  validateString('class_name', 1, 100, false),
  ClassController.updateClass
);

router.delete('/:id',
  validateId('id'),
  ClassController.deleteClass
);

router.put('/:id/courses',
  validateId('id'),
  ClassController.assignCourses
);

export default router;
