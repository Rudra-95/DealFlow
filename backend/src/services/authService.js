const bcrypt = require("bcryptjs");
const jwt    = require("jsonwebtoken");
const pool   = require("../config/db");

const ALLOWED_ROLES = [
  "ADMIN",
  "SALES_REP",
  "SALES_MANAGER",
  "FINANCE",
  "CUSTOMER",
];

// ─── Register ────────────────────────────────────────────────────────────────

async function registerUser({ name, email, password, role }) {
  // 1. Validate role
  if (!ALLOWED_ROLES.includes(role)) {
    const err = new Error(`Invalid role. Must be one of: ${ALLOWED_ROLES.join(", ")}`);
    err.status = 400;
    throw err;
  }

  // 2. Check duplicate email (parameterized — never interpolate user input)
  const [existing] = await pool.query(
    "SELECT id FROM users WHERE email = ?",
    [email]
  );
  if (existing.length > 0) {
    const err = new Error("An account with this email already exists");
    err.status = 409;
    throw err;
  }

  // 3. Hash password — never store plain text
  const passwordHash = await bcrypt.hash(password, 10);

  // 4. Insert user
  const [result] = await pool.query(
    `INSERT INTO users (name, email, password_hash, role)
     VALUES (?, ?, ?, ?)`,
    [name, email, passwordHash, role]
  );

  // 5. Return safe user object (no password_hash)
  return {
    id:    result.insertId,
    name,
    email,
    role,
  };
}

// ─── Login ───────────────────────────────────────────────────────────────────

async function loginUser({ email, password }) {
  // 1. Find user by email
  const [rows] = await pool.query(
    `SELECT id, name, email, password_hash, role
     FROM users
     WHERE email = ?`,
    [email]
  );

  if (rows.length === 0) {
    // Generic message — don't reveal whether email or password was wrong
    const err = new Error("Invalid email or password");
    err.status = 401;
    throw err;
  }

  const user = rows[0];

  // 2. Verify password against stored bcrypt hash
  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) {
    const err = new Error("Invalid email or password");
    err.status = 401;
    throw err;
  }

  // 3. Generate JWT — payload carries id, email, role
  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "1d" }
  );

  // 4. Return token + safe user (no password_hash)
  return {
    token,
    user: {
      id:    user.id,
      name:  user.name,
      email: user.email,
      role:  user.role,
    },
  };
}

// ─── Get user by ID (used by /api/me) ────────────────────────────────────────

async function getUserById(id) {
  const [rows] = await pool.query(
    `SELECT id, name, email, role, created_at
     FROM users
     WHERE id = ?`,
    [id]
  );

  if (rows.length === 0) {
    const err = new Error("User not found");
    err.status = 404;
    throw err;
  }

  return rows[0];
}

module.exports = { registerUser, loginUser, getUserById };
