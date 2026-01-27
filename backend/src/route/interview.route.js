import { Router } from 'express';
import { protect, authorizeRoles } from '../middleware/auth.middleware.js';
import {
  getInterviewQuestions,
  addInterviewQuestion,
  updateInterviewQuestion,
  searchInterviewQuestions,
  addCandidateQuestion,
  getCandidateInterviewDetails,
} from '../controller/interview.controller.js';
import { validateId, validateString, validateNumber } from '../validators/validator.js';

const router = Router();

// Apply auth & role only to the defined interview endpoints, avoiding unintended interception of other /api/* paths
router.get('/',
  protect,
  authorizeRoles(['admin']),
  getInterviewQuestions
);

router.post('/',
  protect,
  authorizeRoles(['admin']),
  validateString('question_text', 1, 500),
  addInterviewQuestion
);

router.put('/:id',
  protect,
  authorizeRoles(['admin']),
  validateId('id'),
  validateString('question_text', 1, 500, false),
  updateInterviewQuestion
);

router.get('/search',
  protect,
  authorizeRoles(['admin']),
  searchInterviewQuestions
);

router.post('/candidate-questions',
  protect,
  authorizeRoles(['admin']),
  addCandidateQuestion
);

router.get('/candidates/:id/interview-details',
  protect,
  authorizeRoles(['admin']),
  validateId('id'),
  getCandidateInterviewDetails
);

export default router;
