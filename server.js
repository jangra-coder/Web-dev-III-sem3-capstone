// server.js - load .env, connect to MongoDB, then start the server
require("dotenv").config({ quiet: true }); // must be first, the other files read process.env
const http = require("http");
const app = require("./app");
const connectDB = require("./config/db");
const setupSocket = require("./socket");
require("./events/emailListener"); // registers the "send confirmation email" listener

const PORT = process.env.PORT || 3000;

// Socket.IO needs the plain http server, so Express is wrapped in one
// (and server.listen is used, not app.listen)
const server = http.createServer(app);
setupSocket(server);

connectDB().then(() => {
  server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
});
