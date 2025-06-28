// middleware/authMiddleware.js
const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
  const token = req.cookies?.token; // assuming the cookie is called "token"

  if (!token) return res.status(401).json({ message: 'No token found' });

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET); // use your secret
    req.user = payload; // attach user info (like id, role, etc.)
    next();
  } catch (err) {
    return res.status(403).json({ message: 'Invalid or expired token' });
  }
};

module.exports = authMiddleware;