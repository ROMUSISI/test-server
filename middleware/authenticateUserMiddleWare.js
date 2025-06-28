const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const { sendYoolaSMS } = require('../reusables/sendYoolaSMS');
const { sequelize } = require('../databaseConnection/db');
const { QueryTypes, Sequelize } = require('sequelize');
dotenv.config();

const authenticateUser = (req, res, next) => {
  const secret = process.env.JWT_SECRET;

  // Get token from "Authorization" header
  const authHeader = req.headers['authorization']; // Format: "Bearer <token>"

 // console.log('Authorization header:', authHeader);

  const token = authHeader && authHeader.split(' ')[1]; // Extract the token part
  console.log('Token extracted from Authorization header:', token);

  if (!token) {
    return res.status(401).send('No token provided. Please log in.');
  }

  jwt.verify(token, secret, (err, decodedUserData) => {
    if (err) {
      console.error('Token verification failed:', err.message);
      return res.status(403).send('Invalid token. Please login again.');
    }

    //console.log('User successfully authenticated inside middle ware:', decodedUserData);
    req.user = decodedUserData; // Attach decoded user to request object
    next();
  });
};

const checkTokenStatus = async (req, res, next) => {
  const { userId: id, phone } = req.user;

  sendYoolaSMS('+256774290644', 'Verifying token in middle ware');

  try {
    // Fetch token details from the database
    const [user] = await sequelize.query(
      `
        SELECT token, tokenVerified, tokenCreatedAt
        FROM user
        WHERE id = :id
      `,
      {
        type: QueryTypes.SELECT,
        replacements: { id },
      }
    );

    // If user/token not found
    if (!user) {
      return res.status(404).json({ tokenStatus: 'invalidOrMissing' });
    }

    const { token, tokenVerified, tokenCreatedAt } = user;
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
    const tokenDate = new Date(tokenCreatedAt);

    // Token is valid and verified
    if (token && tokenVerified && tokenDate >= tenMinutesAgo) {
      return next(); // Proceed to the next middleware/handler
    }

    // Token exists but is not yet verified
    if (token && !tokenVerified && tokenDate >= tenMinutesAgo) {
      return res.status(200).json({ tokenStatus: 'validNotVerified' });
    }

    // Token is missing, expired, or invalid
    return res.status(200).json({ tokenStatus: 'invalidOrMissing' });

  } catch (error) {
    console.error('Error verifying token:', error);
    return res.status(500).json({ tokenStatus: 'invalidOrMissing' });
  }
};

module.exports = {
  authenticateUser,
  checkTokenStatus
};