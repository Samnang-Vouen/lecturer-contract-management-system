import express from 'express';
import { protect, authorizeRoles } from '../middleware/auth.middleware.js';
import { createContract, getContractById } from '../controller/contracts.controller.js';

const router = express.Router();

router.use(protect);

// Create a simple itemized contract
router.post('/', authorizeRoles(['admin', 'management', 'superadmin']), createContract);

// Fetch a simple itemized contract
router.get(
  '/:id',
  authorizeRoles(['admin', 'management', 'superadmin', 'lecturer']),
  getContractById
);

export default router;
