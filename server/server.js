const path = require("path");
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");

const authRoutes = require("./routes/authRoutes");
const eventRoutes = require("./routes/eventRoutes");
const bookingRoutes = require("./routes/bookingRoutes");

// Load environment variables from server/.env
dotenv.config({ path: path.join(__dirname, ".env") });

const app = express();

// Respect proxy headers when running behind Render's reverse proxy
app.set("trust proxy", 1);

// Parse comma-separated allowed CORS origins (strip trailing slashes)
const parseAllowedOrigins = (value = "") =>
  value
    .split(",")
    .map((origin) => origin.trim().replace(/\/+$/, ""))
    .filter(Boolean);

const corsOptions = {
  origin(origin, callback) {
    const allowedOrigins = parseAllowedOrigins(process.env.CLIENT_URL);
    if (!origin || allowedOrigins.length === 0) {
      return callback(null, true);
    }

    const normalizedOrigin = origin.replace(/\/+$/, "");
    if (allowedOrigins.includes(normalizedOrigin)) {
      return callback(null, true);
    }

    const corsError = new Error("Not allowed by CORS");
    corsError.status = 403;
    return callback(corsError);
  },
};

// Enable Cross-Origin Resource Sharing and JSON body parsing
app.use(cors(corsOptions));
app.use(express.json());

// Root status endpoint for platform uptime checks
app.get("/", (req, res) => {
  res.status(200).json({
    status: "ok",
    message: "Event Ticket Booking API",
  });
});

// Basic health check endpoint
app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    message: "Event Ticket Booking API is running",
  });
});

// Mount API routes
app.use("/api/auth", authRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/bookings", bookingRoutes);

// Fallback for unknown endpoints
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

// Handle invalid JSON payloads, CORS rejections, and unexpected errors as clean JSON
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
    return res.status(400).json({ message: "Invalid JSON payload" });
  }

  const statusCode = err.status || err.statusCode || 500;
  const message =
    statusCode >= 500 ? "Internal server error" : err.message || "Request error";

  if (statusCode >= 500) {
    console.error("Unhandled server error:", err.message);
  }

  return res.status(statusCode).json({ message });
});

// Connect to MongoDB and start the Express server
const startServer = async () => {
  if (!process.env.MONGO_URI) {
    console.error("Missing MONGO_URI in server/.env");
    process.exit(1);
  }
  if (!process.env.JWT_SECRET) {
    console.error("Missing JWT_SECRET in server/.env");
    process.exit(1);
  }

  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");

    const port = process.env.PORT || 5000;
    app.listen(port, () => {
      console.log(`Server running on http://localhost:${port}`);
    });
  } catch (error) {
    console.error("MongoDB connection failed:", error.message);
    process.exit(1);
  }
};

// Only start listening when executed directly (allows importing app in tests)
if (require.main === module) {
  startServer();
}

module.exports = { app, startServer };

