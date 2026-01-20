import express from 'express';
import { getMajors, createMajor } from '../controller/major.controller.js';

const router = express.Router();

// GET /api/majors - Get all majors
router.get('/', getMajors);

// POST /api/majors - Create a new major
router.post('/', createMajor);

export default router;
