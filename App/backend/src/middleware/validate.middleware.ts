import { ZodSchema } from "zod";

export const validate =
  (schema: ZodSchema) => (req: any, res: any, next: any) => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      return res.status(400).json({
        message: "Validation error",
        errors: result.error.flatten(),
      });
    }

    req.body = result.data; // clean validated data
    next();
  };