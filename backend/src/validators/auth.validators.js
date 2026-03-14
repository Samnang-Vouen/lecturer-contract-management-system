import { z } from 'zod';

export const ForgotPasswordSchema = z.object({
  email: z.string().trim().email('Invalid email address'),
});

export const ResetPasswordSchema = z.object({
  token: z.string().trim().min(1, 'token is required'),
  newPassword: z.string().min(6, 'Password must be at least 6 characters'),
});
