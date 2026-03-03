import {
  getSchedules,
  getScheduleById,
  createSchedule,
  updateSchedule,
  deleteSchedule,
  generateFilteredSchedulePDF,
} from '../controller/schedule.controller.js';
import { protect, authorizeRoles } from '../middleware/auth.middleware.js';
import express from 'express';

const router = express.Router();

// IMPORTANT: /pdf must come before /:id to avoid route conflicts
router.get('/pdf', generateFilteredSchedulePDF);
router.get('/', getSchedules);
router.get('/:id', getScheduleById);
router.post('/', createSchedule);
router.put('/:id', updateSchedule);
router.delete('/:id', deleteSchedule);

export default router;
