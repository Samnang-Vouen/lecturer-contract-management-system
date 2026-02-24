import express from 'express';
import { createGroup, deleteGroup, editGroup, getGroup } from '../controller/group.controller.js';
import { protect, authorizeRoles } from '../middleware/auth.middleware.js';

const router = express.Router();

router.use(protect, authorizeRoles('admin', 'superadmin'));

router.get("/", getGroup);
router.post("/", createGroup);
router.put("/:id", editGroup);
router.delete("/:id", deleteGroup);

export default router;