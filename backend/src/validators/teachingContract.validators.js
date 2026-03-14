import { z } from 'zod';
import { CONTRACT_ALLOWED_STATUSES } from '../config/constants.js';

const CourseItemSchema = z.object({
  course_id: z.coerce.number().int().positive().optional(),
  class_id: z.coerce.number().int().positive().optional().nullable(),
  course_name: z.string().trim().optional(),
  year_level: z.coerce.number().int().positive().optional().nullable(),
  term: z.coerce.number().int().optional().nullable(),
  academic_year: z.string().trim().optional(),
  hours: z.coerce.number().int().positive().optional().nullable(),
});

export const ContractCreateSchema = z.object({
  lecturer_user_id: z.coerce.number().int().positive({ message: 'lecturer_user_id must be an integer' }),
  academic_year: z.string().trim().min(1, 'academic_year is required'),
  term: z.coerce.number().int({ message: 'term is required' }),
  year_level: z.coerce.number().int().optional().nullable(),
  start_date: z.string().trim().optional(),
  end_date: z.string().trim().optional(),
  courses: z.array(CourseItemSchema).min(1, 'at least one course is required'),
  items: z.union([
    z.array(z.string().trim()).optional(),
    z.string().trim().optional(),
  ]).optional(),
});

export const ContractStatusUpdateSchema = z.object({
  status: z.enum(CONTRACT_ALLOWED_STATUSES, {
    errorMap: () => ({ message: 'Invalid status' }),
  }),
  remarks: z.string().trim().max(2000).optional(),
});

export const ContractEditSchema = z
  .object({
    academic_year: z.string().trim().min(1).optional(),
    term: z.coerce.number().int().optional(),
    year_level: z.coerce.number().int().optional().nullable(),
    start_date: z.string().trim().optional().nullable(),
    end_date: z.string().trim().optional().nullable(),
    courses: z.array(CourseItemSchema).min(1).optional(),
    items: z
      .union([z.array(z.string().trim()).optional(), z.string().trim().optional()])
      .optional(),
  })
  .refine(
    (v) =>
      v.academic_year !== undefined ||
      v.term !== undefined ||
      'year_level' in v ||
      'start_date' in v ||
      'end_date' in v ||
      v.courses !== undefined ||
      v.items !== undefined,
    { message: 'At least one field must be provided' }
  );

export const RedoRequestCreateSchema = z.object({
  message: z.string().trim().min(1, 'message is required').max(2000),
});

export const RedoRequestStatusSchema = z.object({
  resolved: z.coerce.boolean(),
});
