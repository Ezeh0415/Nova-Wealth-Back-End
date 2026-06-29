const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const helmet = require("helmet");
const { connectDB } = require("./src/config/connectDb");
const Routes = require("./src/Router/Router");
const cookieParser = require("cookie-parser");
const {
  healthCheck,
  metrics,
  status,
} = require("./middlewares/databaseHealth");

// ======================
// SERVER CONFIGURATION
// ======================

// Set port from environment variable or default to 8080
const PORT = process.env.PORT || 8080;

// Create Express application instance
const app = express();

// ======================
// MIDDLEWARE SETUP
// ======================

// 1. Cookie Parser
// Parse cookies from incoming requests
app.use(cookieParser());

// 2. Environment Variables
// Load environment variables from .env file
dotenv.config();

// ======================
// CORS CONFIGURATION (FIRST - HIGH PRIORITY)
// ======================

// Define allowed origins for CORS policy
// These are the domains that are permitted to make requests to this API
const allowedOrigins = [
  "https://althworldf.onrender.com", // Production frontend
  "https://althworldglobal.com", //live domain
  "http://localhost:5173", // Local development (Vite default)
  "http://localhost:5174", // Local development (Vite default)
  "http://localhost:5175", // Alternate local port
  "http://localhost:8080", // Local server port
    "https://api.coingecko.com/api/v3/coins/markets?" +
            "vs_currency=usd&order=market_cap_desc&per_page=100&page=1&sparkline=false", // coin gkeco
  "https://alth-world-front-end-fm6m-bzcajeud9-ezeh0415s-projects.vercel.app", // Vercel deployment
];

// Configure CORS with custom options
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, curl, server-to-server)
    if (!origin) return callback(null, true);

    // Check if the requesting origin is in the allowed list
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true); // Allow the request
    } else {
      callback(new Error("Not allowed by CORS")); // Block the request
    }
  },
  credentials: true, // Allow cookies and authentication headers
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"], // Allowed HTTP methods
  allowedHeaders: ["Content-Type", "Authorization", "x-api-key"], // Allowed headers
  exposedHeaders: ["Content-Range", "X-Content-Range"], // Headers exposed to client
  maxAge: 86400, // Cache preflight requests for 24 hours
};

// Apply CORS middleware with the configured options
app.use(cors(corsOptions));

// ======================
// MANUAL CORS HEADERS (ADDITIONAL CONTROL)
// ======================

// Alternative CORS configuration for more granular control
app.use((req, res, next) => {
  // Set allowed origins (multiple origins)
  res.header(
    "Access-Control-Allow-Origin",
    "https://althworldf.onrender.com", // Production
    "https://althworldglobal.com", //live domain
    "https://api.coingecko.com/api/v3/coins/markets?" +
            "vs_currency=usd&order=market_cap_desc&per_page=100&page=1&sparkline=false", // coin gkeco
    "http://localhost:5173", // Local dev
    "http://localhost:5174", // Local dev
    "http://localhost:5175", // Alternate local
    "http://localhost:8080", // Local server
    "https://alth-world-front-end-fm6m-bzcajeud9-ezeh0415s-projects.vercel.app", // Vercel
  );

  res.header("Access-Control-Allow-Credentials", "true"); // Allow credentials
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS"); // Allowed methods
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization, x-api-key", // Allowed headers
  );

  // Handle preflight requests (OPTIONS method)
  // Preflight requests are sent by browsers before actual requests to check CORS permissions
  if (req.method === "OPTIONS") {
    return res.status(200).end(); // Respond with 200 OK for preflight
  }
  next(); // Continue to next middleware for non-OPTIONS requests
});

// ======================
// REQUEST BODY PARSERS
// ======================

// 1. JSON Body Parser
// Parse incoming JSON requests with 70MB limit (for large payloads like Base64 images)
app.use(express.json({ limit: "70mb" }));

// 2. URL-encoded Body Parser
// Parse incoming form data with 70MB limit and extended mode for nested objects
app.use(express.urlencoded({ extended: true, limit: "70mb" }));

// ======================
// SECURITY MIDDLEWARE
// ======================

// 1. Helmet.js
// Set various HTTP headers for security
// Protects against common web vulnerabilities
app.use(helmet());

// ======================
// RATE LIMITING
// ======================

// Configure rate limiter to prevent abuse
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // Time window: 15 minutes
  max: 200, // Maximum 200 requests per window per IP
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
  skip: (req) => req.method === "OPTIONS", // Skip rate limiting for OPTIONS (preflight)
  message: {
    // Custom message when rate limit is exceeded
    message: "Too many requests, please try again later.",
  },
});


app.use("/api", apiLimiter);

// ======================
// DATABASE CONNECTION
// ======================

// Health check endpoints
app.get("/health", healthCheck);
app.get("/metrics", metrics);
app.get("/status", status);

// Connect to MongoDB database
// This establishes the connection to the database before the server starts accepting requests
// Connect to database
connectDB()
  .then(() => {
    // Start server only after successful DB connection
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(
        `📊 Health check available at http://localhost:${PORT}/health`,
      );
      console.log(`📈 Metrics available at http://localhost:${PORT}/metrics`);
    });
  })
  .catch((err) => {
    console.error("Failed to start server:", err);
    process.exit(1);
  });

// ======================
// ROUTE REGISTRATION
// ======================

// Mount all API routes under the "/api" base path
// All routes defined in Routes file will be accessible at /api/*
app.use("/api", Routes);

// ======================
// SERVER STARTUP
// ======================

// Start the Express server and listen on the specified port
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

// ======================
// KEY ARCHITECTURE NOTES:
// ======================
// 1. ORDER MATTERS: Middleware is executed in the order they are defined
// 2. CORS FIRST: CORS should be applied before other middleware
// 3. SECURITY LAYERS: Multiple security measures are implemented
//    - CORS restricts origins
//    - Helmet sets security headers
//    - Rate limiting prevents abuse
//    - Cookie parser for secure cookie handling
// 4. BODY PARSING: Large limits (70MB) accommodate Base64 image uploads
// 5. DATABASE: Connection established before routes are registered
// 6. ROUTES: All API endpoints are namespaced under /api
// 7. ERROR HANDLING: Basic error responses for CORS violations and rate limiting

// ======================
// TROUBLESHOOTING NOTES:
// ======================
// 1. CORS Issues: Check if client origin is in allowedOrigins array
// 2. Request Size: Large payloads may exceed 70MB limit
// 3. Rate Limiting: Currently disabled, enable if needed
// 4. Database: Ensure MongoDB connection string is in .env file
// 5. Port Conflicts: Check if PORT 8080 is available or use environment variable
