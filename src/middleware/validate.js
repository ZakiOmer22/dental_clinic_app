const { ZodError } = require("zod");

module.exports = (schema) => {
  return (req, res, next) => {
    try {
      const parsed = schema.parse(req.body);
      req.body = parsed; // overwrite clean data
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        return res.status(400).json({
          error: "Validation error",
          details: err.errors,
        });
      }

      return res.status(500).json({ error: "Server error" });
    }
  };
};