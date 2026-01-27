import {
  validateName,
  validateEmail,
  validatePhone,
  validateString,
  validateDate,
  validateNumber,
  validateEnum,
} from './validator.js';

/**
 * Validate candidate creation
 */
export const validateCandidateCreate = () => {
  return [
    validateName('fullName', true),
    validateEmail('email', true),
    validatePhone('phone', false),
    validateString('positionAppliedFor', 2, 100, false),
    validateDate('interviewDate', false),
  ];
};

/**
 * Validate candidate update
 */
export const validateCandidateUpdate = () => {
  return [
    validateName('fullName', false),
    validateEmail('email', false),
    validatePhone('phone', false),
    validateString('positionAppliedFor', 2, 100, false),
    validateDate('interviewDate', false),
    validateEnum('status', ['pending', 'scheduled', 'interviewed', 'accepted', 'rejected'], false),
    validateNumber('interviewScore', 0, 100, false),
    validateString('rejectionReason', 0, 500, false),
    validateNumber('hourlyRate', 0, 999999, false),
    validateString('rateReason', 0, 500, false),
    validateString('evaluator', 2, 100, false),
  ];
};
