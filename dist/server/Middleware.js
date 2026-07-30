"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MiddlewareConfig = void 0;
const express_1 = __importDefault(require("express"));
const Config_1 = require("../config/Config");
const Route_1 = __importDefault(require("../Router/Route"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const cors_1 = __importDefault(require("cors"));
class MiddlewareConfig {
    constructor(app) {
        this.app = app;
        this.config = Config_1.AppConfig.getInstance();
    }
    initialize() {
        this.configureBodyParser();
    }
    configureBodyParser() {
        const allowedOrigins = [
            // Production frontend URLs
            "https://nova-wealth-weld.vercel.app",
            "https://alth-world-front-end-fm6m-bzcajeud9-ezeh0415s-projects.vercel.app",
            // Your backend URL (if needed for self-calls)
            "https://nova-wealth-back-end.onrender.com",
            // Development URLs
            "http://localhost:5173",
            "http://localhost:5174",
            "http://localhost:5175",
            "http://localhost:3000",
            "http://localhost:8080",
            // Environment variable (set in Render)
            process.env.FRONTEND_URL,
        ].filter(Boolean); // Remove undefined values
        this.app.use(express_1.default.json());
        this.app.use(express_1.default.urlencoded({ extended: true }));
        this.app.use((0, cors_1.default)({
            origin: function (origin, callback) {
                // Allow requests with no origin (mobile apps, curl, server-to-server)
                if (!origin)
                    return callback(null, true);
                // Check if the requesting origin is in the allowed list
                if (allowedOrigins.indexOf(origin) !== -1) {
                    callback(null, true); // Allow the request
                }
                else {
                    callback(new Error("Not allowed by CORS")); // Block the request
                }
            },
            credentials: true, // Allow cookies and authentication headers
            methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"], // Allowed HTTP methods
            allowedHeaders: ["Content-Type", "Authorization", 'x-refresh-token', "x-api-key"], // Allowed headers
            exposedHeaders: ["Content-Range", "X-Content-Range"], // Headers exposed to client
            maxAge: 86400, // Cache preflight requests for 24 hours
        }));
        this.app.use("/api", (0, express_rate_limit_1.default)({
            windowMs: 15 * 60 * 1000, // Time window: 15 minutes
            max: 200, // Maximum 200 requests per window per IP
            standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
            legacyHeaders: false, // Disable `X-RateLimit-*` headers
            skip: (req) => req.method === "OPTIONS", // Skip rate limiting for OPTIONS (preflight)
            message: {
                // Custom message when rate limit is exceeded
                message: "Too many requests, please try again later.",
            },
        }));
        this.app.use("/api", Route_1.default);
        console.log("body parsers configured");
    }
}
exports.MiddlewareConfig = MiddlewareConfig;
