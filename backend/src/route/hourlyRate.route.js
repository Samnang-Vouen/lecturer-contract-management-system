import { Router } from 'express';
import { protect, authorizeRoles } from '../middleware/auth.middleware.js';
import {
	getHourlyRate,
	getHourlyRateReport,
	updateHourlyRate,
	updateHourlyRateReport,
} from '../controller/hourlyRate.controller.js';

const router = Router();

router.get('/', protect, authorizeRoles('admin'), getHourlyRate);
router.get('/report', protect, authorizeRoles('admin'), getHourlyRateReport);
router.put('/lecturer/:lecturerId', protect, authorizeRoles('admin'), updateHourlyRate);
router.put('/report/:lecturerId', protect, authorizeRoles('admin'), updateHourlyRateReport);

export default router;
