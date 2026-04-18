import { z } from "zod";

export function safeParse<T>(schema: z.ZodSchema<T>, data: unknown): T {
  return schema.parse(data);
}