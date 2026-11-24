// models/Show.js - a movie / event that people can book tickets for
const mongoose = require("mongoose");

const showSchema = new mongoose.Schema(
  {
    title: { type: String, required: [true, "Title is required"], trim: true },
    category: {
      type: String,
      enum: ["Movie", "Concert", "Comedy", "Sports", "Other"],
      default: "Movie",
    },
    description: { type: String, trim: true, default: "" },
    venue: { type: String, required: [true, "Venue is required"], trim: true },
    showTime: { type: Date, required: [true, "Show date and time is required"] },
    price: {
      type: Number,
      required: [true, "Ticket price is required"],
      min: [0, "Price can not be negative"],
    },
    totalSeats: {
      type: Number,
      required: [true, "Total seats are required"],
      min: [1, "A show needs at least 1 seat"],
    },
    // goes down when someone books and up again when a booking is cancelled
    availableSeats: { type: Number, min: [0, "Available seats can not be negative"] },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Show", showSchema);
