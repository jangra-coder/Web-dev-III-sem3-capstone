// models/User.js - normal users and admins of the app
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, "Name is required"], trim: true },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please enter a valid email"],
    },
    // bcrypt hash of the password (users who sign in with GitHub don't have one)
    passwordHash: { type: String },
    // only filled when the user logs in with GitHub
    githubId: { type: String },
    role: { type: String, enum: ["user", "admin"], default: "user" },
    // the refresh token we gave at login, saved so that logout can cancel it
    refreshToken: { type: String },
  },
  {
    timestamps: true, // adds createdAt and updatedAt
    toJSON: {
      // runs every time a user is sent with res.json(), so these never leave the server
      transform: (doc, ret) => {
        delete ret.passwordHash;
        delete ret.refreshToken;
        delete ret.__v;
        return ret;
      },
    },
  }
);

module.exports = mongoose.model("User", userSchema);
