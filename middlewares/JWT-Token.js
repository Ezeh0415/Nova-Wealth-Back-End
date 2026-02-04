const jwt = require("jsonwebtoken");

const generateAccessToken = (userId) =>
  jwt.sign({ id: userId }, process.env.JWT_SECRET_KEY, {
    expiresIn: "7h",
  });

const generateRefreshToken = (userId) =>
  jwt.sign({ id: userId }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: "14d",
  });

module.exports = { generateAccessToken, generateRefreshToken };
