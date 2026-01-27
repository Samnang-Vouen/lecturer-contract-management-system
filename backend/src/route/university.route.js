import { Router } from 'express';
import { getUniversities, createUniversity } from '../controller/university.controller.js';
import { validateString } from '../validators/validator.js';

const router = Router();

// GET /api/universities - Get all universities
router.get('/', getUniversities);

// POST /api/universities - Create a new university
router.post('/',
  validateString('university_name', 1, 200),
  createUniversity
);

export default router;
