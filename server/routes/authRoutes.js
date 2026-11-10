const express = require("express");
const { register, login, getMe } = require("../controllers/authController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

// Public authentication routes
router.post("/register", register);
router.post("/login", login);

// Protected route returning the current logged-in user
router.get("/me", protect, getMe);

module.exports = router;

