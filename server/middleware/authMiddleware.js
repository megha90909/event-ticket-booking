const jwt = require("jsonwebtoken");
const User = require("../models/User");

// Verify JWT from the Authorization header and attach the user to req.user
const protect = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  // Expect header in the format: "Bearer <token>"
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Not authorized, no token provided" });
  }

  const token = authHeader.split(" ")[1];
  if (!token) {
    return res.status(401).json({ message: "Not authorized, no token provided" });
  }

  try {
    // Verify the token signature and decode its payload
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Load the user without the password field
    const user = await User.findById(decoded.id).select("-password");
    if (!user) {
      return res.status(401).json({ message: "Not authorized, user not found" });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Not authorized, invalid or expired token" });
  }
};

// Allow access only to admin users (use after protect middleware)
const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    return next();
  }

  return res.status(403).json({ message: "Access denied: admins only" });
};

module.exports = { protect, adminOnly };

