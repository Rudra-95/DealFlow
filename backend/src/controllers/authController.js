const { registerUser, loginUser, getUserById } = require("../services/authService");

// ─── POST /api/auth/register ──────────────────────────────────────────────────

async function register(req, res) {
  const { name, email, password, role } = req.body;

  // Basic field validation
  if (!name || !email || !password || !role) {
    return res.status(400).json({
      success: false,
      message: "name, email, password and role are all required",
    });
  }

  if (password.length < 6) {
    return res.status(400).json({
      success: false,
      message: "Password must be at least 6 characters",
    });
  }

  try {
    const user = await registerUser({ name, email, password, role });

    return res.status(201).json({
      success: true,
      message: "User registered successfully",
      user,
    });
  } catch (err) {
    return res.status(err.status || 500).json({
      success: false,
      message: err.message || "Registration failed",
    });
  }
}

// ─── POST /api/auth/login ─────────────────────────────────────────────────────

async function login(req, res) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: "email and password are required",
    });
  }

  try {
    const { token, user } = await loginUser({ email, password });

    return res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user,
    });
  } catch (err) {
    return res.status(err.status || 500).json({
      success: false,
      message: err.message || "Login failed",
    });
  }
}

// ─── GET /api/me ──────────────────────────────────────────────────────────────
// authMiddleware runs first, populates req.user from the verified JWT.

async function getMe(req, res) {
  try {
    // Re-query the DB so we always return fresh data (not stale JWT payload)
    const user = await getUserById(req.user.id);

    return res.status(200).json({
      success: true,
      user,
    });
  } catch (err) {
    return res.status(err.status || 500).json({
      success: false,
      message: err.message || "Could not retrieve user",
    });
  }
}

module.exports = { register, login, getMe };
