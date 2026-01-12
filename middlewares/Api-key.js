require("dotenv").config(); // Load env variables

const Require_Api_key = (req, res, next) => {
  // Allow API key from query, headers, or body
  const apiKey = req.query.key || req.header("x-api-key") || req.body?.key;

  if (!apiKey) {
    return res.status(401).json({
      error: "API key is required",
      message: "Provide API key in query (?key=), body, or header (x-api-key)",
    });
  }

  if (apiKey !== process.env.API_KEY) {
    return res.status(403).json({
      error: "Invalid API key",
      message: "The provided API key is incorrect",
    });
  }

  // Key is valid → continue
  next();
};

module.exports = Require_Api_key;
