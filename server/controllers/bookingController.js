const Booking = require("../models/Booking");
const Event = require("../models/Event");
const {
  isValidObjectId,
  parseFiniteNumber,
  handleControllerError,
} = require("../utils/validation");

// @desc    Book tickets for an event atomically to prevent overselling
// @route   POST /api/bookings
// @access  Private (logged-in users)
const createBooking = async (req, res) => {
  try {
    const { eventId, event: eventField, quantity } = req.body || {};
    const targetEventId = eventId ?? eventField;

    if (!isValidObjectId(targetEventId)) {
      return res.status(400).json({ message: "Please provide a valid event ID" });
    }

    const parsedQuantity = parseFiniteNumber(quantity);
    if (
      parsedQuantity === null ||
      !Number.isInteger(parsedQuantity) ||
      parsedQuantity < 1
    ) {
      return res
        .status(400)
        .json({ message: "Quantity must be a whole number of at least 1" });
    }

    // Prevent overselling with a single atomic findOneAndUpdate operation.
    //
    // Why a separate read-then-write fails:
    // If two concurrent requests read Event.findById(), check availableTickets >= quantity
    // in JavaScript, and then call save() or update(), both requests can observe the same
    // stale availableTickets count before either write commits, allowing total booked
    // tickets to exceed total available inventory.
    //
    // How a single atomic findOneAndUpdate solves this:
    // MongoDB acquires a single-document write lock while executing findOneAndUpdate, so
    // evaluating the filter ({ _id, availableTickets: { $gte: quantity } }) and applying
    // the update ({ $inc: { availableTickets: -quantity } }) occur as one indivisible step.
    // If two requests race for the last tickets, the first succeeds and decrements the
    // count, and the second automatically fails the $gte condition and receives null.
    const event = await Event.findOneAndUpdate(
      {
        _id: targetEventId,
        availableTickets: { $gte: parsedQuantity },
      },
      {
        $inc: { availableTickets: -parsedQuantity },
      },
      { new: true }
    );

    if (!event) {
      // Distinguish a missing event from insufficient remaining tickets after the atomic check
      const existingEvent = await Event.findById(targetEventId).select(
        "availableTickets"
      );
      if (!existingEvent) {
        return res.status(404).json({ message: "Event not found" });
      }
      if (existingEvent.availableTickets === 0) {
        return res.status(400).json({ message: "This event is sold out" });
      }
      return res.status(400).json({
        message: `Not enough tickets available. Only ${existingEvent.availableTickets} ticket(s) remaining`,
      });
    }

    // Always calculate totalPrice server-side from the authoritative event price
    const totalPrice = Math.round(event.price * parsedQuantity * 100) / 100;

    let booking;
    try {
      booking = await Booking.create({
        user: req.user._id,
        event: event._id,
        quantity: parsedQuantity,
        totalPrice,
        status: "confirmed",
      });
    } catch (createError) {
      // Compensate by restoring the decremented tickets if saving the booking fails
      try {
        await Event.findByIdAndUpdate(event._id, {
          $inc: { availableTickets: parsedQuantity },
        });
      } catch (rollbackError) {
        console.error(
          "Failed to restore ticket inventory after booking error:",
          rollbackError.message
        );
      }
      throw createError;
    }

    return res.status(201).json({ booking });
  } catch (error) {
    return handleControllerError(res, error, "creating booking");
  }
};

// @desc    Get all bookings for the currently logged-in user
// @route   GET /api/bookings/my
// @access  Private (logged-in users)
const getMyBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ user: req.user._id })
      .populate("event", "title category date venue price imageUrl")
      .sort({ createdAt: -1 });

    return res.status(200).json({ bookings });
  } catch (error) {
    return handleControllerError(res, error, "fetching bookings");
  }
};

module.exports = { createBooking, getMyBookings };

