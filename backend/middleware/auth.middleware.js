const jwt = require("jsonwebtoken");

const SECRET = process.env.JWT_SECRET || "reware-campuscycle-secret";

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";

  if (!token) {
    return res.status(401).json({ message: "Missing token" });
  }

  try {
    req.user = jwt.verify(token, SECRET);
    next();
  } catch (_error) {
    return res.status(401).json({ message: "Invalid token" });
  }
}

module.exports = {
  authMiddleware,
  SECRET
};
