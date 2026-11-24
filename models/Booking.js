// models/Booking.js - one booking = one user booking some seats for one show
const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema(
  {
    // references (not embedding): the user and the show live in their own collections
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    show: { type: mongoose.Schema.Types.ObjectId, ref: "Show", required: true },
    seats: {
      type: Number,
      required: [true, "Number of seats is required"],
      min: [1, "Book at least 1 seat"],
      max: [10, "You can book at most 10 seats at a time"],
    },
    totalPrice: { type: Number, required: true },
    status: { type: String, enum: ["confirmed", "cancelled"], default: "confirmed" },
    emailSent: { type: Boolean, default: false },
    // link to the confirmation email in the Ethereal test inbox (only when testing locally)
    emailPreviewUrl: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Booking", bookingSchema);
