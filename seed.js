// seed.js - puts sample data in the database: 1 admin, 1 user and 6 shows
// run with: npm run seed   (old shows and bookings are deleted first)
require("dotenv").config({ quiet: true });
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const User = require("./models/User");
const Show = require("./models/Show");
const Booking = require("./models/Booking");

// a date some days from today, at the given hour
const daysFromNow = (days, hour, minute = 0) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(hour, minute, 0, 0);
  return d;
};

const users = [
  { name: "Admin", email: "admin@bookmyshow.com", password: "Admin@123", role: "admin" },
  { name: "Rahul", email: "rahul@example.com", password: "Rahul@123", role: "user" },
];

const shows = [
  {
    title: "The Last Monsoon",
    category: "Movie",
    description: "A family drama set in a small village in Haryana during the rains.",
    venue: "PVR Ambience Mall, Gurugram",
    showTime: daysFromNow(2, 18),
    price: 250,
    totalSeats: 120,
  },
  {
    title: "Galaxy Raiders 2",
    category: "Movie",
    description: "Space action movie, part two. 3D show.",
    venue: "INOX Sector 29, Gurugram",
    showTime: daysFromNow(3, 21),
    price: 300,
    totalSeats: 100,
  },
  {
    title: "Little Chef - Kids Cooking Workshop",
    category: "Other",
    description: "A 2 hour cooking workshop for kids aged 8 to 14.",
    venue: "Cyber Hub, Gurugram",
    showTime: daysFromNow(4, 11),
    price: 350,
    totalSeats: 40,
  },
  {
    title: "Sufi Night with Rang Band",
    category: "Concert",
    description: "Live sufi and folk music under the stars.",
    venue: "Leisure Valley Park, Gurugram",
    showTime: daysFromNow(5, 19, 30),
    price: 999,
    totalSeats: 200,
  },
  {
    title: "Stand-up Saturday",
    category: "Comedy",
    description: "Four new comedians, one evening. 16+ only.",
    venue: "Kingdom of Dreams, Gurugram",
    showTime: daysFromNow(6, 20),
    price: 499,
    totalSeats: 80,
  },
  {
    title: "Gurugram Premier League Final",
    category: "Sports",
    description: "T20 cricket final between local clubs.",
    venue: "Tau Devi Lal Stadium, Gurugram",
    showTime: daysFromNow(8, 16),
    price: 150,
    totalSeats: 300,
  },
];

const seed = async () => {
  await mongoose.connect(process.env.MONGODB_URI);

  await Booking.deleteMany({});
  await Show.deleteMany({});

  for (const u of users) {
    const passwordHash = await bcrypt.hash(u.password, 10);
    // update the user if the email exists, otherwise create it (upsert)
    await User.findOneAndUpdate(
      { email: u.email },
      { name: u.name, passwordHash: passwordHash, role: u.role },
      { upsert: true }
    );
    console.log(`User: ${u.email} / ${u.password} (${u.role})`);
  }

  // every show starts with all seats free
  await Show.insertMany(shows.map((s) => ({ ...s, availableSeats: s.totalSeats })));
  console.log(`${shows.length} shows added`);

  await mongoose.disconnect();
};

seed().catch((err) => {
  console.error("Seeding failed:", err.message);
  process.exit(1);
});
