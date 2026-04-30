import { createAdvisorFromCandidateAccount } from '../services/advisor.service.js';
import { createUserAccount } from '../services/user.service.js';
import { sendResponse } from '../utils/response.js';

/**
 * Create a new advisor user (admin only)
 * @route POST /api/advisors
 */
export const createAdvisor = async (req, res, next) => {
  try {
    const advisor = await createUserAccount({
      ...(req.validated?.body || req.body || {}),
      role: 'advisor',
      position: 'Advisor',
      actorDepartmentName: req.user?.department_name,
    });
    return sendResponse(res, advisor, 201);
  } catch (error) {
    return next(error);
  }
};

/**
 * Create a new advisor from an accepted candidate
 * @route POST /api/advisors/from-candidate/:id
 */
export const createAdvisorFromCandidate = async (req, res, next) => {
  try {
    const candidateId = parseInt(req.validated?.params?.id || req.params.id, 10);
    const advisor = await createAdvisorFromCandidateAccount({
      candidateId,
      ...(req.validated?.body || req.body || {}),
      actorDepartmentName: req.user?.department_name,
    });
    return sendResponse(res, advisor, 201);
  } catch (error) {
    return next(error);
  }
};
