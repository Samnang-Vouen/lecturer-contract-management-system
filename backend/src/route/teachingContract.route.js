import { Router } from 'express';
import { protect, authorizeRoles } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { ContractCreateSchema, ContractStatusUpdateSchema } from '../validators/teachingContract.validators.js';
import {
  createDraftContract,
  getContract,
  generatePdf,
  updateStatus,
  upload,
  uploadSignature,
  listContracts,
  deleteContract,
} from '../controller/teachingContract.controller.js';
import { validateId } from '../validators/validator.js';

const router = Router();

router.use(protect);

// List contracts (admin/management can see all; lecturers see their own)
router.get('/',
  authorizeRoles(['admin', 'lecturer', 'management', 'superadmin']),
  listContracts
);

// Admin create draft
// Allow both admin and superadmin to create drafts (management cannot create drafts)
router.post('/',
  authorizeRoles(['admin', 'superadmin']),
  validate(ContractCreateSchema, 'body'),
  createDraftContract
);

// Fetch a contract (admin/lecturer/management)
router.get('/:id',
  authorizeRoles(['admin', 'lecturer', 'management', 'superadmin']),
  validateId('id'),
  getContract
);

// Generate/preview PDF
router.get('/:id/pdf',
  authorizeRoles(['admin', 'lecturer', 'management', 'superadmin']),
  validateId('id'),
  generatePdf
);

// Update status (lecturer or management)
router.patch('/:id/status',
  authorizeRoles(['admin', 'lecturer', 'management', 'superadmin']),
  validateId('id'),
  validate(ContractStatusUpdateSchema, 'body'),
  updateStatus
);

// Upload e-signature (who=lecturer|management)
router.post('/:id/signature',
  authorizeRoles(['admin', 'lecturer', 'management', 'superadmin']),
  validateId('id'),
  upload.single('file'),
  uploadSignature
);

// Delete a contract (only admin/superadmin)
router.delete('/:id',
  authorizeRoles(['admin', 'superadmin']),
  validateId('id'),
  deleteContract
);

export default router;
