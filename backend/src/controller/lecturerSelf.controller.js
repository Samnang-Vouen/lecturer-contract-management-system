import { sendResponse } from '../utils/response.js';
import { UnauthorizedError } from '../utils/errors.js';
import { getMyCoursesData, getMyCourseMappingsData } from '../services/lecturerSelf.service.js';

export async function getMyCourses(req, res, next) {
  try {
    if (!req.user?.id) {
      throw new UnauthorizedError('Unauthorized', { payload: { message: 'Unauthorized' } });
    }
    const data = await getMyCoursesData(req.user.id, req.query);
    return sendResponse(res, data);
  } catch (err) {
    return next(err);
  }
}

export async function getMyCourseMappings(req, res, next) {
  try {
    if (!req.user?.id) {
      throw new UnauthorizedError('Unauthorized', { payload: { message: 'Unauthorized' } });
    }
    const data = await getMyCourseMappingsData(req.user.id, req.query);
    return sendResponse(res, data);
  } catch (err) {
    return next(err);
  }
}
