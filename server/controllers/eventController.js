const Event = require("../models/Event");
const {
  isValidObjectId,
  parseFiniteNumber,
  escapeRegex,
  handleControllerError,
} = require("../utils/validation");

const REQUIRED_TEXT_FIELDS = ["title", "description", "category", "venue"];

// Parse a valid Date from an ISO string, timestamp number, or Date instance
const parseValidDate = (value) => {
  if (
    typeof value !== "string" &&
    typeof value !== "number" &&
    !(value instanceof Date)
  ) {
    return null;
  }
  if (typeof value === "string" && !value.trim()) {
    return null;
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

// Validate and normalize text fields during event creation or partial updates
const applyTextFields = (target, payload, requireAll) => {
  for (const field of REQUIRED_TEXT_FIELDS) {
    const value = payload[field];
    if (value === undefined) {
      if (requireAll) {
        return `${field.charAt(0).toUpperCase() + field.slice(1)} is required`;
      }
      continue;
    }
    if (typeof value !== "string" || !value.trim()) {
      return `${field.charAt(0).toUpperCase() + field.slice(1)} must be a non-empty string`;
    }
    target[field] = value.trim();
  }

  if (payload.imageUrl !== undefined) {
    if (typeof payload.imageUrl !== "string") {
      return "imageUrl must be a string";
    }
    target.imageUrl = payload.imageUrl.trim();
  }

  return null;
};

// @desc    Get all events with optional ?search= and ?category= filters
// @route   GET /api/events
// @access  Public
const getEvents = async (req, res) => {
  try {
    const { search, category } = req.query;
    const filter = {};

    if (typeof search === "string" && search.trim()) {
      const searchRegex = new RegExp(escapeRegex(search.trim()), "i");
      filter.$or = [
        { title: searchRegex },
        { description: searchRegex },
        { venue: searchRegex },
      ];
    }

    if (typeof category === "string" && category.trim()) {
      filter.category = new RegExp(`^${escapeRegex(category.trim())}$`, "i");
    }

    const events = await Event.find(filter).sort({ date: 1 });
    return res.status(200).json({ events });
  } catch (error) {
    return handleControllerError(res, error, "fetching events");
  }
};

// @desc    Get a single event by ID
// @route   GET /api/events/:id
// @access  Public
const getEventById = async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid event ID" });
    }

    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    return res.status(200).json({ event });
  } catch (error) {
    return handleControllerError(res, error, "fetching event");
  }
};

// Validate and normalize event fields for creation (existingEvent = null) or updates
const buildEventPayload = (payload, existingEvent = null) => {
  const isCreate = !existingEvent;
  const data = {};

  const textError = applyTextFields(data, payload, isCreate);
  if (textError) {
    return { error: textError };
  }

  if (payload.date !== undefined && payload.date !== null) {
    const parsedDate = parseValidDate(payload.date);
    if (!parsedDate) {
      return { error: "Please provide a valid event date" };
    }
    data.date = parsedDate;
  } else if (isCreate) {
    return { error: "Event date is required" };
  }

  if (payload.price !== undefined || isCreate) {
    const parsedPrice = parseFiniteNumber(payload.price);
    if (parsedPrice === null || parsedPrice < 0) {
      return { error: "Price must be a non-negative number" };
    }
    data.price = parsedPrice;
  }

  let nextTotal = existingEvent ? existingEvent.totalTickets : undefined;
  if (payload.totalTickets !== undefined || isCreate) {
    const parsedTotal = parseFiniteNumber(payload.totalTickets);
    if (
      parsedTotal === null ||
      !Number.isInteger(parsedTotal) ||
      parsedTotal < 1
    ) {
      return { error: "totalTickets must be a whole number of at least 1" };
    }
    nextTotal = parsedTotal;
    data.totalTickets = parsedTotal;
  }

  if (payload.availableTickets !== undefined) {
    const parsedAvailable = parseFiniteNumber(payload.availableTickets);
    if (
      parsedAvailable === null ||
      !Number.isInteger(parsedAvailable) ||
      parsedAvailable < 0 ||
      parsedAvailable > nextTotal
    ) {
      return {
        error:
          "availableTickets must be a whole number between 0 and totalTickets",
      };
    }
    data.availableTickets = parsedAvailable;
  } else if (isCreate) {
    data.availableTickets = nextTotal;
  } else if (payload.totalTickets !== undefined) {
    // Shift availableTickets by the capacity delta while protecting sold tickets
    const soldTickets = existingEvent.totalTickets - existingEvent.availableTickets;
    if (nextTotal < soldTickets) {
      return {
        error: `totalTickets cannot be less than the ${soldTickets} ticket(s) already sold`,
      };
    }
    data.availableTickets = nextTotal - soldTickets;
  }

  return { data };
};

// @desc    Create a new event
// @route   POST /api/events
// @access  Private/Admin
const createEvent = async (req, res) => {
  try {
    const { data, error } = buildEventPayload(req.body || {});
    if (error) {
      return res.status(400).json({ message: error });
    }

    const event = await Event.create(data);
    return res.status(201).json({ event });
  } catch (err) {
    return handleControllerError(res, err, "creating event");
  }
};

// @desc    Update an existing event
// @route   PUT /api/events/:id
// @access  Private/Admin
const updateEvent = async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid event ID" });
    }

    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    const { data, error } = buildEventPayload(req.body || {}, event);
    if (error) {
      return res.status(400).json({ message: error });
    }

    Object.assign(event, data);
    await event.save();
    return res.status(200).json({ event });
  } catch (err) {
    return handleControllerError(res, err, "updating event");
  }
};

// @desc    Delete an event
// @route   DELETE /api/events/:id
// @access  Private/Admin
const deleteEvent = async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid event ID" });
    }

    const event = await Event.findByIdAndDelete(req.params.id);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    return res.status(200).json({ message: "Event deleted successfully" });
  } catch (error) {
    return handleControllerError(res, error, "deleting event");
  }
};

module.exports = {
  getEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
};
