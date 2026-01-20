import express from 'express';
import { getUniversities, createUniversity } from '../controller/university.controller.js';

const router = express.Router();

// GET /api/universities - Get all universities
router.get('/', getUniversities);

// POST /api/universities - Create a new university
router.post('/', createUniversity);

export default router;
