import { getSchedule, generateSchedulePDF, createSchedule, editSchedule, deleteSchedule } from "../controller/schedule.controller.js";
import { protect, authorizeRoles } from '../middleware/auth.middleware.js';
import express from 'express';

const router = express.Router();

router.get('/', getSchedule);
router.get('/pdf', generateSchedulePDF);
router.post('/', createSchedule);
router.put('/:id', editSchedule);
router.delete('/:id', deleteSchedule);

export default router;