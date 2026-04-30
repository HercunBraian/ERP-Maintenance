import { z } from 'zod';

const role = z.enum(['admin', 'technician']);

export const userCreateSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6, 'Password debe tener al menos 6 caracteres'),
  full_name: z.string().trim().min(1).max(200),
  role: role.default('technician'),
  dept: z.string().trim().max(200).optional(),
  phone: z.string().trim().max(40).optional(),
  avatar: z.string().trim().max(2).optional(),
});

export const userUpdateSchema = z.object({
  full_name: z.string().trim().min(1).max(200).optional(),
  role: role.optional(),
  dept: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  avatar: z.string().max(2).nullable().optional(),
});

export const resetPasswordSchema = z.object({
  password: z.string().min(6),
});

export const userListQuerySchema = z.object({
  search: z.string().trim().optional(),
  role: role.optional(),
  limit: z.coerce.number().int().min(1).max(200).default(100),
  offset: z.coerce.number().int().min(0).default(0),
});

export const idParamSchema = z.object({ id: z.string().uuid() });

export type UserCreate = z.infer<typeof userCreateSchema>;
export type UserUpdate = z.infer<typeof userUpdateSchema>;
export type ResetPassword = z.infer<typeof resetPasswordSchema>;
export type UserListQuery = z.infer<typeof userListQuerySchema>;
