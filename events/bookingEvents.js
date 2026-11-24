// events/bookingEvents.js - one EventEmitter for everything that happens to bookings
// The booking controller only says "a booking was made" (emit).
// Other files listen (on) and do their own job: send the email, send live updates.
// So the controller does not need to know about emails or sockets.
const EventEmitter = require("events");

const bookingEvents = new EventEmitter();

// if an "error" event has no listener, Node crashes the app, so always handle it
bookingEvents.on("error", (err) => {
  console.error("Booking event error:", err.message);
});

module.exports = bookingEvents;
