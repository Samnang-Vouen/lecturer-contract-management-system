import { Router } from 'express';
import { protect, authorizeRoles } from '../middleware/auth.middleware.js';
import { createContract, getContractById } from '../controller/contracts.controller.js';
import { validateId } from '../validators/validator.js';

const router = Router();

router.use(protect);

// Create a simple itemized contract
router.post('/',
  authorizeRoles(['admin', 'management', 'superadmin']),
  createContract
);

// Fetch a simple itemized contract
router.get('/:id',
  authorizeRoles(['admin', 'management', 'superadmin', 'lecturer']),
  validateId('id'),
  getContractById
);

export default router;
