/**
 * User validation schemas using Zod
 * Ensures type safety and input validation
 */

import { z } from "zod";

export const UserCreateSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  full_name: z.string().min(1, "Full name is required"),
});

export const LoginSchema = z.object({
  username: z.string().email("Invalid email format"), // OAuth2 uses 'username' field
  password: z.string(),
});

export type UserCreateInput = z.infer<typeof UserCreateSchema>;
export type LoginInput = z.infer<typeof LoginSchema>;
