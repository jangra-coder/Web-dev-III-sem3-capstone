// events/emailListener.js - listens for "bookingCreated" and sends the confirmation email
const bookingEvents = require("./bookingEvents");
const User = require("../models/User");
const { sendMail } = require("../config/mailer");

bookingEvents.on("bookingCreated", async ({ booking, show, userId }) => {
  // try/catch here: if the email fails, the booking is still fine
  try {
    const user = await User.findById(userId);
    const time = new Date(show.showTime).toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: "Asia/Kolkata",
    });

    const html = `
      <h2>Booking confirmed!</h2>
      <p>Hi ${user.name}, your tickets are booked.</p>
      <p>
        <b>Show:</b> ${show.title}<br>
        <b>Venue:</b> ${show.venue}<br>
        <b>Date & time:</b> ${time}<br>
        <b>Seats:</b> ${booking.seats}<br>
        <b>Total paid:</b> Rs. ${booking.totalPrice}<br>
        <b>Booking id:</b> ${booking._id}
      </p>
      <p>Enjoy the show!</p>`;

    const previewUrl = await sendMail(user.email, `Booking confirmed - ${show.title}`, html);

    // save the link so it shows on the "My Bookings" page
    booking.emailPreviewUrl = previewUrl;
    await booking.save();
    console.log("Confirmation email sent:", previewUrl);

    // the real-time part (socket.js) listens for this and tells the user
    bookingEvents.emit("emailSent", { booking, userId });
  } catch (err) {
    console.error("Could not send booking email:", err.message);
  }
});
