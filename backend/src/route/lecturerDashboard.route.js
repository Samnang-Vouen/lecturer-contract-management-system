import { Router } from 'express';
import { protect, authorizeRoles } from '../middleware/auth.middleware.js';
import {
  getLecturerDashboardSummary,
  getLecturerRealtime,
  getLecturerActivities,
  getLecturerSalaryAnalysis,
} from '../controller/lecturerDashboard.controller.js';

const router = Router();

router.use(protect);

router.get('/summary',
  authorizeRoles(['lecturer', 'admin', 'management', 'superadmin']),
  getLecturerDashboardSummary
);

router.get('/realtime',
  authorizeRoles(['lecturer', 'admin', 'management', 'superadmin']),
  getLecturerRealtime
);

router.get('/activities',
  authorizeRoles(['lecturer', 'admin', 'management', 'superadmin']),
  getLecturerActivities
);

router.get('/salary-analysis',
  authorizeRoles(['lecturer', 'admin', 'management', 'superadmin']),
  getLecturerSalaryAnalysis
);

export default router;
