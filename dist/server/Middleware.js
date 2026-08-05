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
        // Allow all your Vercel domains using a pattern
        const isAllowedVercelDomain = (origin) => {
            return /^https?:\/\/nova-wealth-.*\.vercel\.app$/.test(origin);
        };
        // Explicit allowed origins (for non-Vercel domains)
        const explicitAllowedOrigins = [
            "https://alth-world-front-end-fm6m-bzcajeud9-ezeh0415s-projects.vercel.app",
            "https://nova-wealth-back-end.onrender.com",
            "https://nova-wealth-dbo2.onrender.com",
            "http://localhost:5173",
            "http://localhost:5174",
            "http://localhost:5175",
            "http://localhost:3000",
            "http://localhost:8080",
            process.env.FRONTEND_URL,
        ].filter(Boolean);
        // Log configuration
        console.log('🔒 CORS Configuration:');
        console.log('📋 Explicit origins:', explicitAllowedOrigins);
        console.log('🌐 Vercel pattern: nova-wealth-*.vercel.app');
        this.app.use((0, cors_1.default)({
            origin: function (origin, callback) {
                // Allow requests with no origin (mobile apps, curl, server-to-server)
                if (!origin) {
                    console.log('🔓 No origin - allowing');
                    return callback(null, true);
                }
                // Check if it matches your Vercel pattern
                if (isAllowedVercelDomain(origin)) {
                    console.log(`✅ Vercel domain allowed: ${origin}`);
                    return callback(null, true);
                }
                // Check if in explicit allowed list
                if (explicitAllowedOrigins.indexOf(origin) !== -1) {
                    console.log(`✅ Explicitly allowed: ${origin}`);
                    return callback(null, true);
                }
                // Block all other origins
                console.log(`❌ Blocked: ${origin}`);
                callback(new Error(`Origin ${origin} not allowed by CORS`));
            },
            credentials: true,
            methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
            allowedHeaders: ["Content-Type", "Authorization", 'x-refresh-token', "x-api-key"],
            exposedHeaders: ["Content-Range", "X-Content-Range"],
            maxAge: 86400,
        }));
        this.app.use(express_1.default.json());
        this.app.use(express_1.default.urlencoded({ extended: true }));
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
