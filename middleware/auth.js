// middleware/auth.js
// authenticate -> is there a valid access token? (who are you)
// authorize    -> is your role allowed?            (what can you do)
const jwt = require("jsonwebtoken");

const authenticate = (req, res, next) => {
  const header = req.headers.authorization || ""; // "Bearer <token>"
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ message: "Access denied: please login" });
  }

  try {
    req.user = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET); // { id, role, iat, exp }
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

// authorize("admin") gives back a middleware that only lets admins through
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: "Forbidden: you don't have permission" });
    }
    next();
  };
};

module.exports = { authenticate, authorize };
