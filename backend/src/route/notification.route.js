import express from 'express';
import { protect } from '../middleware/auth.middleware.js';
import { getMyNotifications } from '../controller/notification.controller.js';

const router = express.Router();

router.use(protect);
router.get('/', getMyNotifications);

export default router;
