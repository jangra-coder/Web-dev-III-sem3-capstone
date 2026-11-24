// controllers/authController.js - register, login, refresh, logout, me
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

// access token: short life (15 min), has the id and role
const createAccessToken = (user) =>
  jwt.sign({ id: user._id, role: user.role }, process.env.ACCESS_TOKEN_SECRET, {
    expiresIn: "15m",
  });

// refresh token: long life (7 days), only has the id
const createRefreshToken = (user) =>
  jwt.sign({ id: user._id }, process.env.REFRESH_TOKEN_SECRET, { expiresIn: "7d" });

const cookieOptions = {
  httpOnly: true, // JavaScript in the browser can't read it
  secure: process.env.NODE_ENV === "production", // only over https on the live site
  sameSite: "lax",
};
const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000; // in milliseconds

// used by normal login and GitHub login:
// saves a new refresh token, puts it in a cookie and returns a new access token
const startSession = async (user, res) => {
  const refreshToken = createRefreshToken(user);
  user.refreshToken = refreshToken; // saved so that logout can cancel it
  await user.save();
  res.cookie("refreshToken", refreshToken, { ...cookieOptions, maxAge: SEVEN_DAYS });
  return createAccessToken(user);
};

// POST /api/auth/register
const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    if (!password || password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    const passwordHash = await bcrypt.hash(password, 10); // never save the real password
    // role is not taken from req.body, so nobody can register as admin
    const user = await User.create({ name, email, passwordHash });

    res.status(201).json(user); // toJSON in the model hides passwordHash
  } catch (err) {
    next(err); // bad email / missing name / duplicate email -> error handler in app.js
  }
};

// POST /api/auth/login
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    // GitHub users have no passwordHash, so they can't login with a password
    const ok = user && user.passwordHash && (await bcrypt.compare(password, user.passwordHash));
    if (!ok) {
      // same message for wrong email and wrong password
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const accessToken = await startSession(user, res);
    res.json({ accessToken, user });
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/refresh - new access token from the refresh token cookie (no password)
const refresh = async (req, res, next) => {
  try {
    const token = req.cookies.refreshToken;
    if (!token) {
      return res.status(401).json({ message: "Please login" });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);
    } catch (err) {
      return res.status(403).json({ message: "Invalid or expired refresh token" });
    }

    const user = await User.findById(decoded.id);
    // it must be the same token we saved at login (logout removes it)
    if (!user || user.refreshToken !== token) {
      return res.status(403).json({ message: "Refresh token is not valid any more" });
    }

    res.json({ accessToken: createAccessToken(user), user });
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/logout
const logout = async (req, res, next) => {
  try {
    const token = req.cookies.refreshToken;
    if (token) {
      await User.updateOne({ refreshToken: token }, { $unset: { refreshToken: 1 } });
    }
    res.clearCookie("refreshToken", cookieOptions); // no maxAge here, or the cookie is not deleted
    res.json({ message: "Logged out" });
  } catch (err) {
    next(err);
  }
};

// GET /api/auth/me - protected route, the id comes from the verified token
const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(user);
  } catch (err) {
    next(err);
  }
};

module.exports = { register, login, refresh, logout, getMe, startSession };
