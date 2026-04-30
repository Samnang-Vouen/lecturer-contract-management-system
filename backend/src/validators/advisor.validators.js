import { z } from 'zod';

export const AdvisorCreateSchema = z.object({
  fullName: z.string().trim().min(1, 'Full name is required'),
  email: z.any().optional(),
  department: z.string().trim().optional(),
  title: z.enum(['Mr', 'Ms', 'Mrs', 'Dr', 'Prof']).optional(),
  gender: z.enum(['male', 'female', 'other']).optional(),
});

export const AdvisorFromCandidateParamsSchema = z.object({
  id: z.string().trim().regex(/^\d+$/, 'Invalid candidate id'),
});

export const AdvisorFromCandidateBodySchema = z.object({
  email: z
    .string({ required_error: 'Valid CADT email is required' })
    .trim()
    .min(1, 'Valid CADT email is required')
    .regex(/^[A-Z0-9._%+-]+@cadt\.edu\.kh$/i, 'Valid CADT email is required'),
  title: z.any().optional(),
  gender: z.any().optional(),
});

export function formatAdvisorValidationErrors(error) {
  const errors = {};
  for (const issue of error.issues) {
    const key = issue.path.at(-1) || 'body';
    if (!errors[key]) {
      errors[key] = issue.message;
    }
  }
  return {
    status: 400,
    payload: { message: 'Validation failed', errors },
  };
}

export function formatAdvisorCandidateIdError() {
  return {
    status: 400,
    payload: { message: 'Invalid candidate id' },
  };
}

export function formatAdvisorCandidateEmailError() {
  return {
    status: 400,
    payload: { message: 'Valid CADT email is required' },
  };
}