// controllers/showController.js - shows CRUD (anyone can see shows, only admin can change them)
const mongoose = require("mongoose");
const Show = require("../models/Show");
const Booking = require("../models/Booking");

// GET /api/shows?search=pushpa&category=Movie
const getShows = async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.search) {
      // escape special regex characters so a search like "(" can't break the query
      const text = String(req.query.search).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      filter.title = { $regex: text, $options: "i" }; // i = ignore case
    }
    if (req.query.category) {
      filter.category = String(req.query.category);
    }
    const shows = await Show.find(filter).sort({ showTime: 1 }); // soonest show first
    res.json(shows);
  } catch (err) {
    next(err);
  }
};

// GET /api/shows/:id
const getShowById = async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid show id" });
    }
    const show = await Show.findById(req.params.id);
    if (!show) {
      return res.status(404).json({ message: "Show not found" });
    }
    res.json(show);
  } catch (err) {
    next(err);
  }
};

// POST /api/shows (admin)
const createShow = async (req, res, next) => {
  try {
    const { title, category, description, venue, showTime, price, totalSeats } = req.body;
    const show = await Show.create({
      title,
      category,
      description,
      venue,
      showTime,
      price,
      totalSeats,
      availableSeats: totalSeats, // a new show has every seat free
    });
    res.status(201).json(show);
  } catch (err) {
    next(err); // missing title, negative price etc. -> 400 from the error handler
  }
};

// PUT /api/shows/:id (admin)
const updateShow = async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid show id" });
    }
    const show = await Show.findById(req.params.id);
    if (!show) {
      return res.status(404).json({ message: "Show not found" });
    }

    // copy only the fields that were sent
    const fields = ["title", "category", "description", "venue", "showTime", "price"];
    fields.forEach((field) => {
      if (req.body[field] !== undefined) show[field] = req.body[field];
    });

    // changing total seats: keep the already booked seats booked
    if (req.body.totalSeats !== undefined) {
      const booked = show.totalSeats - show.availableSeats;
      const newTotal = Number(req.body.totalSeats);
      if (newTotal < booked) {
        return res.status(400).json({ message: `${booked} seats are already booked, total can't be less` });
      }
      show.totalSeats = newTotal;
      show.availableSeats = newTotal - booked;
    }

    await show.save(); // save() runs the schema validation again
    res.json(show);
  } catch (err) {
    next(err);
  }
};

// DELETE /api/shows/:id (admin)
const deleteShow = async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid show id" });
    }
    // don't delete a show that people have tickets for
    const confirmed = await Booking.countDocuments({ show: req.params.id, status: "confirmed" });
    if (confirmed > 0) {
      return res.status(400).json({ message: "This show has bookings, cancel them first" });
    }
    const show = await Show.findByIdAndDelete(req.params.id);
    if (!show) {
      return res.status(404).json({ message: "Show not found" });
    }
    await Booking.deleteMany({ show: req.params.id }); // old cancelled bookings of this show
    res.json({ message: "Show deleted" });
  } catch (err) {
    next(err);
  }
};

module.exports = { getShows, getShowById, createShow, updateShow, deleteShow };
