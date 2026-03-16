import { z } from 'zod';

const StudentSchema = z.object({
  student_name: z.string().trim().min(1, 'student_name is required'),
  student_code: z.string().trim().optional().nullable(),
  project_title: z.string().trim().min(1, 'project_title is required'),
  company_name: z.string().trim().min(1, 'company_name is required'),
});

export const AdvisorContractCreateSchema = z
  .object({
    lecturer_user_id: z.coerce
      .number()
      .int()
      .positive({ message: 'lecturer_user_id must be an integer' }),
    academic_year: z.string().trim().min(1, 'academic_year is required'),
    role: z.enum(['ADVISOR', 'LECTURE'], { errorMap: () => ({ message: 'Invalid role' }) }),
    hourly_rate: z.coerce.number().positive('hourly_rate must be positive'),

    capstone_1: z.coerce.boolean().optional().default(false),
    capstone_2: z.coerce.boolean().optional().default(false),
    internship_1: z.coerce.boolean().optional().default(false),
    internship_2: z.coerce.boolean().optional().default(false),

    hours_per_student: z.coerce.number().int().positive('hours_per_student is required'),

    students: z.array(StudentSchema).min(1, 'at least one student is required'),

    start_date: z.string().trim().optional().nullable(),
    end_date: z.string().trim().optional().nullable(),

    duties: z.array(z.string().trim().min(1)).min(1, 'at least one duty is required'),

    join_judging_hours: z.coerce.number().int().nonnegative().optional().nullable(),
  })
  .refine(
    (v) => v.capstone_1 || v.capstone_2 || v.internship_1 || v.internship_2,
    { message: 'At least one responsibility must be selected', path: ['responsibilities'] }
  );

export const AdvisorContractStatusUpdateSchema = z.object({
  status: z.preprocess(
    (v) => {
      if (typeof v !== 'string') return v;
      return v.trim().toUpperCase().replace(/\s+/g, '_');
    },
    z.enum(['DRAFT', 'WAITING_MANAGEMENT', 'REQUEST_REDO', 'COMPLETED', 'CONTRACT_ENDED'], {
      errorMap: () => ({ message: 'Invalid status' }),
    })
  ),
});

export const AdvisorContractEditSchema = z
  .object({
    role: z.enum(['ADVISOR', 'LECTURE']).optional(),
    hourly_rate: z.coerce.number().positive().optional(),
    capstone_1: z.coerce.boolean().optional(),
    capstone_2: z.coerce.boolean().optional(),
    internship_1: z.coerce.boolean().optional(),
    internship_2: z.coerce.boolean().optional(),
    hours_per_student: z.coerce.number().int().positive().optional(),
    students: z.array(StudentSchema).min(1).optional(),
    start_date: z.string().trim().optional().nullable(),
    end_date: z.string().trim().optional().nullable(),
    duties: z.array(z.string().trim().min(1)).min(1).optional(),
    join_judging_hours: z.coerce.number().int().nonnegative().optional().nullable(),
  })
  .refine(
    (v) =>
      'role' in v ||
      'hourly_rate' in v ||
      'capstone_1' in v ||
      'capstone_2' in v ||
      'internship_1' in v ||
      'internship_2' in v ||
      'hours_per_student' in v ||
      'students' in v ||
      'start_date' in v ||
      'end_date' in v ||
      'duties' in v ||
      'join_judging_hours' in v,
    { message: 'At least one field must be provided' }
  )
  .refine(
    (v) => {
      const hasAnyResp =
        v.capstone_1 === undefined &&
        v.capstone_2 === undefined &&
        v.internship_1 === undefined &&
        v.internship_2 === undefined;
      if (hasAnyResp) return true;
      return !!v.capstone_1 || !!v.capstone_2 || !!v.internship_1 || !!v.internship_2;
    },
    { message: 'At least one responsibility must be selected', path: ['responsibilities'] }
  );
