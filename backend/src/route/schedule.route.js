import {
  getSchedules,
  getScheduleById,
  createSchedule,
  updateSchedule,
  deleteSchedule,
  generateFilteredSchedulePDF,
  generateFilteredScheduleHTML,
  generateSchedulePDFFromSavedHTML,
} from '../controller/schedule.controller.js';
import { protect, authorizeRoles } from '../middleware/auth.middleware.js';
import express from 'express';

const router = express.Router();

// IMPORTANT: /pdf must come before /:id to avoid route conflicts
// HTML generation / conversion endpoints must also come before /:id
router.get('/pdf', protect, authorizeRoles('admin', 'superadmin'), generateFilteredSchedulePDF);
router.post('/generate-html', protect, authorizeRoles('admin', 'superadmin'), generateFilteredScheduleHTML);
router.get('/generated-pdf', protect, authorizeRoles('admin', 'superadmin'), generateSchedulePDFFromSavedHTML);
router.get('/', getSchedules);
router.get('/:id', getScheduleById);
router.post('/', createSchedule);
router.put('/:id', updateSchedule);
router.delete('/:id', deleteSchedule);

export default router;
