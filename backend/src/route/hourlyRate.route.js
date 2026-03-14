import { Router } from 'express';
import { getHourlyRate, updateHourlyRate } from '../controller/hourlyRate.controller.js';

const router = Router();

router.get('/', getHourlyRate);
router.put('/lecturer/:lecturerId', updateHourlyRate);

export default router;
