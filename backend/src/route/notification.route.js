import express from 'express';
import { protect } from '../middleware/auth.middleware.js';
import { getMyNotifications, markNotificationsRead } from '../controller/notification.controller.js';

const router = express.Router();

router.use(protect);
router.get('/', getMyNotifications);
router.patch('/mark-read', markNotificationsRead);

export default router;
