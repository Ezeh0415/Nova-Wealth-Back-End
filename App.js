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
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

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
