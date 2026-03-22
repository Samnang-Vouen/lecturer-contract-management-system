import {
  getSchedule,
  createSchedule,
  createBulkSchedule,
  editSchedule,
  deleteSchedule,
} from '../controller/scheduleEntry.controller.js';
import { protect, authorizeRoles } from '../middleware/auth.middleware.js';
import express from 'express';

const router = express.Router();

router.get('/', protect, authorizeRoles(['admin', 'lecturer', 'advisor']), getSchedule);
router.post('/bulk', createBulkSchedule);
router.post('/', createSchedule);
router.put('/:id', editSchedule);
router.delete('/:id', deleteSchedule);

export default router;
