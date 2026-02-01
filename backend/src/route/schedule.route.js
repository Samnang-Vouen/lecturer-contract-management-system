import { getSchedule, generateSchedulePDF } from "../controller/schedule.controller.js";
import { protect, authorizeRoles } from '../middleware/auth.middleware.js';
import express from 'express';

const router = express.Router();

router.get('/', protect, authorizeRoles('admin'), getSchedule);
router.get('/pdf', protect, authorizeRoles('admin'), generateSchedulePDF);

export default router;