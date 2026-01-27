import { Router } from 'express';
import { protect, authorizeRoles } from '../middleware/auth.middleware.js';
import {
  listCourseMappings,
  createCourseMapping,
  updateCourseMapping,
  deleteCourseMapping,
  exportCourseMappings,
} from '../controller/courseMapping.controller.js';
import { validateId } from '../validators/validator.js';

const router = Router();

router.use(protect, authorizeRoles('admin'));

router.get('/', listCourseMappings);

router.get('/export', exportCourseMappings);

router.post('/', createCourseMapping);

router.put('/:id',
  validateId('id'),
  updateCourseMapping
);

router.delete('/:id',
  validateId('id'),
  deleteCourseMapping
);

export default router;
