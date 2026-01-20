import express from 'express';
import {
  getCandidates,
  createCandidate,
  updateCandidate,
  deleteCandidate,
} from '../controller/candidate.controller.js';
import { getCandidateInterviewDetails } from '../controller/interview.controller.js';
import { protect, authorizeRoles } from '../middleware/auth.middleware.js';

const router = express.Router();

// Only admin can manage recruitment
router.use(protect, authorizeRoles('admin'));

router.get('/', getCandidates);
router.post('/', createCandidate);
// Interview details (ratings & notes) for a specific candidate
router.get('/:id/interview-details', getCandidateInterviewDetails);
router.patch('/:id', updateCandidate);
router.delete('/:id', deleteCandidate);

export default router;
