import express from 'express';
import { protect, authorizeRoles } from '../middleware/auth.middleware.js';
import {
  getInterviewQuestions,
  addInterviewQuestion,
  updateInterviewQuestion,
  searchInterviewQuestions,
  addCandidateQuestion,
  getCandidateInterviewDetails,
} from '../controller/interview.controller.js';

const router = express.Router();

// Apply auth & role only to the defined interview endpoints, avoiding unintended interception of other /api/* paths
router.get('/', protect, authorizeRoles(['admin']), getInterviewQuestions);
router.post('/', protect, authorizeRoles(['admin']), addInterviewQuestion);
router.put('/:id', protect, authorizeRoles(['admin']), updateInterviewQuestion);
router.get('/search', protect, authorizeRoles(['admin']), searchInterviewQuestions);
router.post('/candidate-questions', protect, authorizeRoles(['admin']), addCandidateQuestion);
router.get(
  '/candidates/:id/interview-details',
  protect,
  authorizeRoles(['admin']),
  getCandidateInterviewDetails
);

export default router;
