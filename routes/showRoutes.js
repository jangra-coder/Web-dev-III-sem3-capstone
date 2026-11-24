// routes/showRoutes.js - /api/shows/...
const express = require("express");
const { authenticate, authorize } = require("../middleware/auth");
const {
  getShows,
  getShowById,
  createShow,
  updateShow,
  deleteShow,
} = require("../controllers/showController");

const router = express.Router();

// anyone can see shows
router.get("/", getShows);
router.get("/:id", getShowById);

// only admin can add, edit, delete -> authenticate first, then check the role
router.post("/", authenticate, authorize("admin"), createShow);
router.put("/:id", authenticate, authorize("admin"), updateShow);
router.delete("/:id", authenticate, authorize("admin"), deleteShow);

module.exports = router;
