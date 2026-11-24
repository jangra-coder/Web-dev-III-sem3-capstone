// server.js - load .env, connect to MongoDB, then start the server
require("dotenv").config({ quiet: true }); // must be first, the other files read process.env
const http = require("http");
const app = require("./app");
const connectDB = require("./config/db");

const PORT = process.env.PORT || 3000;
const server = http.createServer(app);

connectDB().then(() => {
  server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
});
