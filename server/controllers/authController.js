const jwt = require("jsonwebtoken");
const User = require("../models/User");

// Create a signed JWT containing the user's id and role
const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
  );
};

// Return only safe user fields in API responses
const formatUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
});

// @desc    Register a new user account
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res) => {
  try {
    const { name, email, password } = req.body || {};

    if (
      typeof name !== "string" ||
      typeof email !== "string" ||
      typeof password !== "string" ||
      !name.trim() ||
      !email.trim() ||
      !password
    ) {
      return res
        .status(400)
        .json({ message: "Please provide name, email, and password" });
    }

    if (password.length < 6) {
      return res
        .status(400)
        .json({ message: "Password must be at least 6 characters" });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Prevent duplicate registrations for the same email
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res
        .status(400)
        .json({ message: "An account with this email already exists" });
    }

    // Always force role to "user" on public registration
    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password,
      role: "user",
    });

    return res.status(201).json({
      token: generateToken(user),
      user: formatUser(user),
    });
  } catch (error) {
    if (error.name === "ValidationError") {
      const firstMessage = Object.values(error.errors)[0]?.message || "Invalid input";
      return res.status(400).json({ message: firstMessage });
    }
    if (error.code === 11000) {
      return res
        .status(400)
        .json({ message: "An account with this email already exists" });
    }

    console.error("Register error:", error.message);
    return res.status(500).json({ message: "Server error during registration" });
  }
};

// @desc    Authenticate user and return a JWT
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
  try {
    const { email, password } = req.body || {};

    if (
      typeof email !== "string" ||
      typeof password !== "string" ||
      !email.trim() ||
      !password
    ) {
      return res
        .status(400)
        .json({ message: "Please provide email and password" });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Explicitly include password because User schema hides it by default
    const user = await User.findOne({ email: normalizedEmail }).select("+password");
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    return res.status(200).json({
      token: generateToken(user),
      user: formatUser(user),
    });
  } catch (error) {
    console.error("Login error:", error.message);
    return res.status(500).json({ message: "Server error during login" });
  }
};

// @desc    Get the currently logged-in user's profile
// @route   GET /api/auth/me
// @access  Private (requires valid JWT)
const getMe = (req, res) => {
  return res.status(200).json({ user: formatUser(req.user) });
};

module.exports = { register, login, getMe };

