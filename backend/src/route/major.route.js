import { Router } from 'express';
import { getMajors, createMajor } from '../controller/major.controller.js';
import { validateString } from '../validators/validator.js';

const router = Router();

// GET /api/majors - Get all majors
router.get('/', getMajors);

// POST /api/majors - Create a new major
router.post('/',
  validateString('major_name', 1, 100),
  createMajor
);

export default router;
