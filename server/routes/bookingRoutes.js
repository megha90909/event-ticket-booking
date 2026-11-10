const express = require("express");
const {
  createBooking,
  getMyBookings,
} = require("../controllers/bookingController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

// Protected routes for logged-in users
router.post("/", protect, createBooking);
router.get("/my", protect, getMyBookings);

module.exports = router;

