// routes/authRoutes.js - /api/auth/...
const express = require("express");
const { authenticate } = require("../middleware/auth");
const { register, login, refresh, logout, getMe } = require("../controllers/authController");
const { githubLogin, githubCallback } = require("../controllers/githubController");

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/refresh", refresh);
router.post("/logout", logout);
router.get("/me", authenticate, getMe); // protected

// login with GitHub
router.get("/github", githubLogin);
router.get("/github/callback", githubCallback);

module.exports = router;
