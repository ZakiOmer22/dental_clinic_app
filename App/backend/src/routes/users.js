const router = require("express").Router();
const pool = require("../db/pool");
const auth = require("../middleware/auth");
const role = require("../middleware/roles");
const bcrypt = require("bcryptjs");
const { z } = require("zod");

/* ─────────────────────────────
   ZOD SCHEMAS (SINGLE SOURCE OF TRUTH)
───────────────────────────── */
const CreateUserSchema = z.object({
  full_name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  phone: z.string().optional(),
  role: z.enum(["admin", "doctor", "receptionist", "assistant", "staff"]).optional(),
});

const UpdateUserSchema = z.object({
  full_name: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  role: z.enum(["admin", "doctor", "receptionist", "assistant", "staff"]).optional(),
  is_active: z.boolean().optional(),
});

/* ─────────────────────────────
   SELECT TEMPLATE
───────────────────────────── */
const USER_SELECT = `
  SELECT 
    id,
    full_name,
    email,
    phone,
    role,
    is_active,
    clinic_id,
    last_login_at,
    created_at,
    updated_at
  FROM users
`;

/* ─────────────────────────────
   HELPERS
───────────────────────────── */
const sanitizeInt = (v, fallback) => {
  const n = parseInt(v);
  return Number.isNaN(n) ? fallback : n;
};

/* ─────────────────────────────
   GET USERS
───────────────────────────── */
router.get("/", auth, role(["admin", "doctor"]), async (req, res) => {
  try {
    const { role: qRole, status, search } = req.query;

    const page = sanitizeInt(req.query.page, 1);
    const limit = Math.min(sanitizeInt(req.query.limit, 50), 100);
    const offset = (page - 1) * limit;

    let params = [req.user.clinicId];
    let where = `WHERE clinic_id = $1`;

    if (qRole) {
      params.push(qRole);
      where += ` AND role = $${params.length}`;
    }

    if (status === "active") where += ` AND is_active = true`;
    if (status === "inactive") where += ` AND is_active = false`;

    if (search) {
      params.push(`%${search.trim()}%`);
      const p = `$${params.length}`;

      where += `
        AND (
          full_name ILIKE ${p}
          OR email ILIKE ${p}
          OR phone ILIKE ${p}
        )
      `;
    }

    const countRes = await pool.query(
      `SELECT COUNT(*) FROM users ${where}`,
      params
    );

    const total = Number(countRes.rows[0].count);
    const dataParams = [...params, limit, offset];

    const { rows } = await pool.query(
      `${USER_SELECT} ${where}
       ORDER BY created_at DESC
       LIMIT $${dataParams.length - 1}
       OFFSET $${dataParams.length}`,
      dataParams
    );

    res.json({
      data: rows.map((u) => ({
        ...u,
        status: u.is_active ? "active" : "inactive",
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    console.error("GET /users error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

/* ─────────────────────────────
   GET ME
───────────────────────────── */
router.get("/me", auth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, full_name, email, phone, role, is_active, clinic_id, created_at
       FROM users
       WHERE id = $1 AND clinic_id = $2`,
      [req.user.id, req.user.clinicId]
    );

    if (!rows[0]) return res.status(404).json({ error: "User not found" });

    res.json({
      ...rows[0],
      status: rows[0].is_active ? "active" : "inactive",
    });
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

/* ─────────────────────────────
   GET BY ID
───────────────────────────── */
router.get("/:id", auth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, full_name, email, phone, role, is_active, clinic_id, created_at, updated_at
       FROM users
       WHERE id = $1 AND clinic_id = $2`,
      [req.params.id, req.user.clinicId]
    );

    if (!rows[0]) return res.status(404).json({ error: "User not found" });

    res.json({
      ...rows[0],
      status: rows[0].is_active ? "active" : "inactive",
    });
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

/* ─────────────────────────────
   CREATE USER
───────────────────────────── */
router.post("/", auth, role(["admin"]), async (req, res) => {
  try {
    const parsed = CreateUserSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        error: parsed.error.flatten(),
      });
    }

    const { full_name, email, password, phone, role: userRole } = parsed.data;

    const exists = await pool.query(
      `SELECT id FROM users WHERE email=$1 AND clinic_id=$2`,
      [email, req.user.clinicId]
    );

    if (exists.rows.length) {
      return res.status(409).json({ error: "Email already exists" });
    }

    const hash = await bcrypt.hash(password, 12);

    const { rows } = await pool.query(
      `INSERT INTO users
       (clinic_id, full_name, email, password_hash, phone, role, is_active)
       VALUES ($1,$2,$3,$4,$5,$6,true)
       RETURNING id, full_name, email, phone, role, is_active, created_at`,
      [req.user.clinicId, full_name, email, hash, phone || null, userRole || "staff"]
    );

    res.status(201).json({
      ...rows[0],
      status: "active",
    });
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

/* ─────────────────────────────
   UPDATE USER
───────────────────────────── */
router.put("/:id", auth, role(["admin"]), async (req, res) => {
  try {
    const parsed = UpdateUserSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        error: parsed.error.flatten(),
      });
    }

    const { full_name, email, phone, role, is_active } = parsed.data;

    const { rows } = await pool.query(
      `UPDATE users SET
        full_name = COALESCE($1, full_name),
        email = COALESCE($2, email),
        phone = COALESCE($3, phone),
        role = COALESCE($4, role),
        is_active = COALESCE($5, is_active),
        updated_at = NOW()
       WHERE id = $6 AND clinic_id = $7
       RETURNING *`,
      [full_name, email, phone, role, is_active, req.params.id, req.user.clinicId]
    );

    if (!rows[0]) return res.status(404).json({ error: "User not found" });

    res.json({
      ...rows[0],
      status: rows[0].is_active ? "active" : "inactive",
    });
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

/* ─────────────────────────────
   DELETE USER
───────────────────────────── */
router.delete("/:id", auth, role(["admin"]), async (req, res) => {
  try {
    if (Number(req.params.id) === req.user.id) {
      return res.status(400).json({ error: "Cannot delete yourself" });
    }

    const result = await pool.query(
      `DELETE FROM users WHERE id=$1 AND clinic_id=$2`,
      [req.params.id, req.user.clinicId]
    );

    if (!result.rowCount) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;