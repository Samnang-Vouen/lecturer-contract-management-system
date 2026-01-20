import express from 'express';
import {
  getDashboardStats,
  getDashboardRealtime,
  getDashboardActivities,
  getDashboardNotifications,
  postDashboardPresence,
} from '../controller/dashboard.controller.js';
import { superAdminDashboardDataHandler } from '../dashboarddata/superadmindashboarddata.js';
import { adminDashboardDataHandler } from '../dashboarddata/admindashboarddata.js';
import { protect, authorizeRoles } from '../middleware/auth.middleware.js';

const router = express.Router();

// Protect all dashboard routes - require authentication
router.use(protect);

// Presence heartbeat is allowed for any authenticated user
router.post('/presence', postDashboardPresence);

// Allow both superadmin and admin to view dashboard stats (extend as needed)
router.use(authorizeRoles(['superadmin', 'admin']));

// GET /api/dashboard/stats
router.get('/stats', getDashboardStats);

// GET /api/dashboard/realtime
router.get('/realtime', getDashboardRealtime);

// GET /api/dashboard/activities
router.get('/activities', getDashboardActivities);

// GET /api/dashboard/notifications
router.get('/notifications', getDashboardNotifications);

// GET /api/dashboard/superadmin/summary
// Restrict to superadmin only for system-wide totals
router.get('/superadmin/summary', authorizeRoles(['superadmin']), superAdminDashboardDataHandler);

// GET /api/dashboard/admin/summary
// Restrict to admin/management; returns department-scoped numeric totals
router.get('/admin/summary', authorizeRoles(['admin', 'management']), adminDashboardDataHandler);

export default router;
