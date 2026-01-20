import express from 'express';
import { getResearchFields, createResearchField } from '../controller/researchField.controller.js';

const router = express.Router();

// GET /api/research-fields - Get all research fields
router.get('/', getResearchFields);

// POST /api/research-fields - Create a new research field
router.post('/', createResearchField);

export default router;
