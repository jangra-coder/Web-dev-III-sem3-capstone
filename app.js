// app.js - builds the Express app (no listen here, server.js starts it)
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const path = require("path");
const authRoutes = require("./routes/authRoutes");
const showRoutes = require("./routes/showRoutes");
const bookingRoutes = require("./routes/bookingRoutes");

const app = express();

app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
app.use(express.json()); // JSON body -> req.body
app.use(cookieParser()); // Cookie header -> req.cookies
app.use(express.static(path.join(__dirname, "public"))); // the HTML pages

// base route, just to check the API is up
app.get("/api", (req, res) => {
  res.json({ message: "Book My Show API is running" });
});

app.use("/api/auth", authRoutes);
app.use("/api/shows", showRoutes);
app.use("/api/bookings", bookingRoutes);

// any route that did not match above
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

// error handler - 4 parameters so Express knows it is for errors
app.use((err, req, res, next) => {
  if (err.name === "ValidationError") {
    // mongoose validation, e.g. "Title is required"
    const message = Object.values(err.errors).map((e) => e.message).join(", ");
    return res.status(400).json({ message });
  }
  if (err.name === "CastError") {
    return res.status(400).json({ message: "Invalid id" });
  }
  if (err.code === 11000) {
    return res.status(409).json({ message: "Email already registered" });
  }
  console.error(err);
  res.status(500).json({ message: "Server error" });
});

module.exports = app;
