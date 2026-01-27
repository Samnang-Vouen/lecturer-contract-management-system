import { Router } from 'express';
import {
  getCandidates,
  createCandidate,
  updateCandidate,
  deleteCandidate,
} from '../controller/candidate.controller.js';
import { getCandidateInterviewDetails } from '../controller/interview.controller.js';
import { protect, authorizeRoles } from '../middleware/auth.middleware.js';
import { validateId } from '../validators/validator.js';
import {
  validateCandidateCreate,
  validateCandidateUpdate,
} from '../validators/candidate.validators.js';

const router = Router();

// Only admin can manage recruitment
router.use(protect, authorizeRoles('admin'));

// Public routes for candidates
router.get('/', getCandidates);

router.post('/', ...validateCandidateCreate(), createCandidate);

// Interview details (ratings & notes) for a specific candidate
router.get('/:id/interview-details', validateId('id'), getCandidateInterviewDetails);

router.patch('/:id', validateId('id'), ...validateCandidateUpdate(), updateCandidate);

router.delete('/:id', validateId('id'), deleteCandidate);

export default router;
