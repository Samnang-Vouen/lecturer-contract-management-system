import { getSchedule, generateSchedulePDF } from "../controller/schedule.controller.js";
import express from 'express';

const router = express.Router();

router.get('/', getSchedule);
router.get('/pdf', generateSchedulePDF);

export default router;