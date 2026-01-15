const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const helmet = require("helmet");
const connectDB = require("./src/config/connectDb");
const Routes = require("./src/Router/Router");
const PORT = process.env.PORT || 8080;

const app = express();
dotenv.config();

//  CORS (FIRST)
// Specific origin configuration
const allowedOrigins = ["http://localhost:3000", "http://localhost:8080"];

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "x-api-key"],
  exposedHeaders: ["Content-Range", "X-Content-Range"],
  maxAge: 86400, // 24 hours
};

app.use(cors(corsOptions));

// Or if you need more control:
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "http://localhost:3000","http://localhost:8080");
  res.header("Access-Control-Allow-Credentials", "true");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization, x-api-key"
  );

  // Handle preflight requests
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }
  next();
});

//  Body parsers (for Base64 images)
app.use(express.json({ limit: "70mb" }));
app.use(express.urlencoded({ extended: true, limit: "70mb" }));

app.use(helmet());
//  Rate limiter (skip OPTIONS)
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.method === "OPTIONS",
  message: {
    message: "Too many requests, please try again later.",
  },
});

//  Apply limiter only where needed
app.use("/api", apiLimiter);

// db connection
connectDB();
// Routes
app.use("/api", Routes);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
