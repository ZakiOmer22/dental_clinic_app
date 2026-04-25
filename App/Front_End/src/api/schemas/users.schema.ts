import { z } from "zod";

export const UserRoleSchema = z.enum([
  "super_admin",
  "admin",
  "doctor",
  "receptionist",
  "assistant",
  "patient",
]);

export const UserSchema = z.object({
  id: z.number(),
  name: z.string(),
  email: z.string().email(),
  role: UserRoleSchema,
  status: z.enum(["active", "inactive", "suspended"]),
  created_at: z.string(),
  updated_at: z.string(),
});

export const CreateUserSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  role: UserRoleSchema,
});