const mongoose = require("mongoose");

// Schema defining a ticketed event managed by admins
const eventSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
    },
    description: {
      type: String,
      required: [true, "Description is required"],
      trim: true,
    },
    category: {
      type: String,
      required: [true, "Category is required"],
      trim: true,
    },
    date: {
      type: Date,
      required: [true, "Event date is required"],
    },
    venue: {
      type: String,
      required: [true, "Venue is required"],
      trim: true,
    },
    price: {
      type: Number,
      required: [true, "Price is required"],
      min: [0, "Price cannot be negative"],
    },
    totalTickets: {
      type: Number,
      required: [true, "Total tickets is required"],
      min: [1, "Total tickets must be at least 1"],
      validate: {
        validator: Number.isInteger,
        message: "Total tickets must be a whole number",
      },
    },
    availableTickets: {
      type: Number,
      required: [true, "Available tickets is required"],
      min: [0, "Available tickets cannot be negative"],
      validate: [
        {
          validator: Number.isInteger,
          message: "Available tickets must be a whole number",
        },
        {
          validator: function (value) {
            return this.totalTickets === undefined || value <= this.totalTickets;
          },
          message: "Available tickets cannot exceed total tickets",
        },
      ],
    },
    imageUrl: {
      type: String,
      trim: true,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

// Default availableTickets to totalTickets when creating a new event
eventSchema.pre("validate", function () {
  if (
    this.isNew &&
    this.availableTickets === undefined &&
    this.totalTickets !== undefined
  ) {
    this.availableTickets = this.totalTickets;
  }
});

module.exports = mongoose.model("Event", eventSchema);

