import multer from 'multer';
import { sendResponse } from '../utils/response.js';
import { HTTP_STATUS } from '../config/constants.js';
import { submitOnboardingData, checkOnboardingData } from '../services/onboarding.service.js';

const MAX_UPLOAD_FILE_SIZE = parseInt(
  process.env.MAX_UPLOAD_FILE_SIZE || String(25 * 1024 * 1024),
  10
);
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_UPLOAD_FILE_SIZE },
});
export const onboardingUploadMiddleware = upload.fields([
  { name: 'cv', maxCount: 1 },
  { name: 'syllabus', maxCount: 1 },
  { name: 'payroll', maxCount: 1 },
]);

export const submitOnboarding = async (req, res, next) => {
  try {
    const result = await submitOnboardingData(req.user.id, {
      body: req.body,
      files: req.files,
      role: req.user?.role,
    });
    const status = result.alreadyCompleted ? HTTP_STATUS.OK : HTTP_STATUS.CREATED;
    return sendResponse(res, result, status);
  } catch (err) {
    return next(err);
  }
};

export const checkOnboarding = async (req, res, next) => {
  try {
    const data = await checkOnboardingData(req.user.id);
    return sendResponse(res, data);
  } catch (err) {
    return next(err);
  }
};
