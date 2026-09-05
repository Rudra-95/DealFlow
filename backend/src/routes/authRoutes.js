const express  = require("express");
const router   = express.Router();

const { register, login } = require("../controllers/authController");

// POST /api/auth/register  — create demo / test users
// NOTE: for the final demo, this endpoint is used manually to seed accounts.
// It is NOT exposed in the customer-facing UI.
router.post("/register", register);

// POST /api/auth/login  — returns JWT on success
router.post("/login", login);

module.exports = router;
