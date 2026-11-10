const mongoose = require("mongoose");

/**
 * Validate that a value is a 24-character hexadecimal MongoDB ObjectId.
 */
const isValidObjectId = (value) =>
  typeof value === "string" &&
  /^[a-fA-F0-9]{24}$/.test(value) &&
  mongoose.Types.ObjectId.isValid(value);

/**
 * Parse a finite number from a number or non-empty numeric string.
 * Returns null for booleans, null, undefined, objects, or non-numeric strings.
 */
const parseFiniteNumber = (value) => {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
};

/**
 * Escape special regular expression characters so user input is matched literally.
 */
const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * Handle Mongoose validation/cast errors cleanly with 400 responses, falling back to 500.
 */
const handleControllerError = (res, error, context) => {
  if (error.name === "ValidationError") {
    const firstMessage =
      Object.values(error.errors)[0]?.message || "Invalid input";
    return res.status(400).json({ message: firstMessage });
  }
  if (error.name === "CastError") {
    return res.status(400).json({ message: "Invalid identifier or value format" });
  }

  console.error(`${context}:`, error.message);
  return res.status(500).json({ message: `Server error during ${context}` });
};

module.exports = {
  isValidObjectId,
  parseFiniteNumber,
  escapeRegex,
  handleControllerError,
};

