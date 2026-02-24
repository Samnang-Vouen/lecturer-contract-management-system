import express from 'express';
import SpecializationController from '../controller/specialization.controller.js';
import { protect, authorizeRoles } from '../middleware/auth.middleware.js';

const router = express.Router();

router.use(protect, authorizeRoles('admin', 'superadmin'));

router.get('/', SpecializationController.list);

export default router;
