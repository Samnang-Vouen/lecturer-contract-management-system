import { z } from 'zod';

export const CourseCreateSchema = z.object({
  course_code: z.string().trim().min(1, 'course_code required'),
  course_name: z.string().trim().min(1, 'course_name required'),
  description: z.string().trim().optional().nullable(),
  hours: z.coerce.number().int().positive().optional().nullable(),
  credits: z.coerce.number().int().positive().optional().nullable(),
  // superadmin may provide dept via id or name
  dept_id: z.coerce.number().int().positive().optional(),
  dept_name: z.string().trim().optional(),
});

export const CourseUpdateSchema = z
  .object({
    course_code: z.string().trim().min(1, 'course_code required').optional(),
    course_name: z.string().trim().min(1, 'course_name required').optional(),
    description: z.string().trim().optional().nullable(),
    hours: z.coerce.number().int().positive().optional().nullable(),
    credits: z.coerce.number().int().positive().optional().nullable(),
  })
  .refine((obj) => Object.keys(obj).length > 0, {
    message: 'No fields to update',
    path: ['body'],
  });
