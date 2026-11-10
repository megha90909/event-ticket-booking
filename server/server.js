const path = require("path");
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");

const authRoutes = require("./routes/authRoutes");

// Load environment variables from server/.env
dotenv.config({ path: path.join(__dirname, ".env") });

const app = express();

// Enable Cross-Origin Resource Sharing and JSON body parsing
app.use(cors());
app.use(express.json());

// Basic health check endpoint
app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    message: "Event Ticket Booking API is running",
  });
});

// Mount authentication routes
app.use("/api/auth", authRoutes);

// Handle invalid JSON bodies cleanly
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
    return res.status(400).json({ message: "Invalid JSON payload" });
  }
  return next(err);
});

// Fallback for unknown endpoints
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
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

