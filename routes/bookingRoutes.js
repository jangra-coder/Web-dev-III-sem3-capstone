// routes/bookingRoutes.js - /api/bookings/...
const express = require("express");
const { authenticate, authorize } = require("../middleware/auth");
const {
  createBooking,
  getMyBookings,
  cancelBooking,
  getAllBookings,
} = require("../controllers/bookingController");

const router = express.Router();

router.use(authenticate); // every booking route needs login

router.post("/", createBooking);
router.get("/my", getMyBookings);
router.patch("/:id/cancel", cancelBooking);
router.get("/", authorize("admin"), getAllBookings); // admin only

module.exports = router;
