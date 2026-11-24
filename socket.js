// socket.js - the real-time part, using Socket.IO
// everyone       -> live seat count of every show
// "admins" room  -> new bookings and cancellations as they happen
// "user:<id>"    -> only that user's own updates (e.g. "your email is ready")
const jwt = require("jsonwebtoken");
const { Server } = require("socket.io");
const bookingEvents = require("./events/bookingEvents");
const User = require("./models/User");

function setupSocket(server) {
  const io = new Server(server, {
    cors: { origin: process.env.CLIENT_URL, credentials: true },
  });

  // socket middleware: runs once when a client connects
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(); // no token = guest, guests only get the public seat updates
    }
    try {
      socket.user = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET); // same check as the API
      next();
    } catch (err) {
      next(new Error("Authentication failed"));
    }
  });

  io.on("connection", (socket) => {
    if (socket.user) {
      socket.join("user:" + socket.user.id); // a private room for this user
      if (socket.user.role === "admin") {
        socket.join("admins");
      }
    }
  });

  // ---- listeners on the same EventEmitter that the booking controller uses ----

  bookingEvents.on("bookingCreated", async ({ booking, show }) => {
    // 1. everybody: new seat count
    io.emit("seatsUpdated", { showId: show._id, availableSeats: show.availableSeats });

    // 2. admins: who booked what
    try {
      const user = await User.findById(booking.user);
      io.to("admins").emit("newBooking", {
        userName: user ? user.name : "Someone",
        showTitle: show.title,
        seats: booking.seats,
        totalPrice: booking.totalPrice,
      });
    } catch (err) {
      console.error("Socket newBooking error:", err.message);
    }
  });

  bookingEvents.on("bookingCancelled", ({ booking, show }) => {
    if (show) {
      io.emit("seatsUpdated", { showId: show._id, availableSeats: show.availableSeats });
    }
    io.to("admins").emit("bookingCancelled", {
      showTitle: show ? show.title : "a deleted show",
      seats: booking.seats,
    });
  });

  // sent by events/emailListener.js after the email goes out
  bookingEvents.on("emailSent", ({ booking, userId }) => {
    io.to("user:" + userId).emit("emailSent", {
      bookingId: booking._id,
      emailPreviewUrl: booking.emailPreviewUrl,
    });
  });

  return io;
}

module.exports = setupSocket;
