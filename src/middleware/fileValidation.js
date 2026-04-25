const allowedMimeTypes = [
  "image/jpeg",
  "image/png",
  "application/pdf",
];

const MAX_SIZE = 10 * 1024 * 1024; // 10MB

module.exports = (req, res, next) => {
  const file = req.file;

  if (!file) {
    return res.status(400).json({ error: "No file uploaded" });
  }

  // MIME check
  if (!allowedMimeTypes.includes(file.mimetype)) {
    return res.status(400).json({ error: "Invalid file type" });
  }

  // Size check
  if (file.size > MAX_SIZE) {
    return res.status(400).json({ error: "File too large (max 10MB)" });
  }

  next();
};