// controllers/bookingController.js - book tickets, see bookings, cancel
const mongoose = require("mongoose");
const Show = require("../models/Show");
const Booking = require("../models/Booking");
const bookingEvents = require("../events/bookingEvents");

// POST /api/bookings   body: { showId, seats }
const createBooking = async (req, res, next) => {
  try {
    const { showId } = req.body;
    const seats = Number(req.body.seats);

    if (!mongoose.isValidObjectId(showId)) {
      return res.status(400).json({ message: "Invalid show id" });
    }
    if (!Number.isInteger(seats) || seats < 1 || seats > 10) {
      return res.status(400).json({ message: "You can book 1 to 10 seats" });
    }

    // take the seats only if enough are left and the show has not started.
    // check ($gte) and update ($inc) happen in ONE query, so two people
    // booking the last seats at the same time can't both get them
    const show = await Show.findOneAndUpdate(
      { _id: showId, availableSeats: { $gte: seats }, showTime: { $gt: new Date() } },
      { $inc: { availableSeats: -seats } },
      { returnDocument: "after" } // give back the show after the update
    );

    if (!show) {
      // find out why it failed, to send a clear message
      const found = await Show.findById(showId);
      if (!found) {
        return res.status(404).json({ message: "Show not found" });
      }
      if (found.showTime <= new Date()) {
        return res.status(400).json({ message: "This show has already started" });
      }
      return res.status(400).json({ message: `Only ${found.availableSeats} seats left` });
    }

    const booking = await Booking.create({
      user: req.user.id,
      show: show._id,
      seats: seats,
      totalPrice: seats * show.price,
    });

    // tell the rest of the app: the email and live updates listen for this
    bookingEvents.emit("bookingCreated", { booking, show, userId: req.user.id });

    res.status(201).json(booking);
  } catch (err) {
    next(err);
  }
};

// GET /api/bookings/my
const getMyBookings = async (req, res, next) => {
  try {
    const bookings = await Booking.find({ user: req.user.id })
      .populate("show", "title venue showTime price") // fill in the show details
      .sort({ createdAt: -1 }); // newest first
    res.json(bookings);
  } catch (err) {
    next(err);
  }
};

// PATCH /api/bookings/:id/cancel
const cancelBooking = async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid booking id" });
    }
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    // only the person who booked it, or an admin, can cancel
    if (booking.user.toString() !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({ message: "You can only cancel your own bookings" });
    }
    if (booking.status === "cancelled") {
      return res.status(400).json({ message: "Booking is already cancelled" });
    }
    const oldShow = await Show.findById(booking.show);
    if (oldShow && oldShow.showTime <= new Date()) {
      return res.status(400).json({ message: "Show has already started, can't cancel" });
    }

    booking.status = "cancelled";
    await booking.save();

    // give the seats back
    const show = await Show.findByIdAndUpdate(
      booking.show,
      { $inc: { availableSeats: booking.seats } },
      { returnDocument: "after" }
    );

    bookingEvents.emit("bookingCancelled", { booking, show, userId: req.user.id });

    res.json(booking);
  } catch (err) {
    next(err);
  }
};

// GET /api/bookings (admin) - every booking with user and show details
const getAllBookings = async (req, res, next) => {
  try {
    const bookings = await Booking.find()
      .populate("user", "name email")
      .populate("show", "title showTime")
      .sort({ createdAt: -1 });
    res.json(bookings);
  } catch (err) {
    next(err);
  }
};

module.exports = { createBooking, getMyBookings, cancelBooking, getAllBookings };
