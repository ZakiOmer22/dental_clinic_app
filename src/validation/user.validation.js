const { z } = require("zod");

const createUserSchema = z.object({
  full_name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  phone: z.string().optional(),
  role: z.enum(["admin", "doctor", "receptionist", "assistant"]),
});

const updateUserSchema = z.object({
  full_name: z.string().min(2).optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  role: z.enum(["admin", "doctor", "receptionist", "assistant"]).optional(),
  is_active: z.boolean().optional(),
});

module.exports = {
  createUserSchema,
  updateUserSchema,
};