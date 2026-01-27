import { Router } from 'express';
import { getResearchFields, createResearchField } from '../controller/researchField.controller.js';
import { validateString } from '../validators/validator.js';

const router = Router();

// GET /api/research-fields - Get all research fields
router.get('/', getResearchFields);

// POST /api/research-fields - Create a new research field
router.post('/',
  validateString('field_name', 1, 100),
  createResearchField
);

export default router;
