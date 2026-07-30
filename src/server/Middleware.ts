import express from "express";
import { AppConfig } from "../config/Config";
import router from '../Router/Route';
import rateLimit from "express-rate-limit";
import cors from 'cors';

export class MiddlewareConfig {
    private app: express.Application;
    private config: AppConfig;

    constructor(app: express.Application) {
        this.app = app;
        this.config = AppConfig.getInstance();
    }

    public initialize(): void {
        this.configureBodyParser();
    }


    private configureBodyParser(): void {

        // Allow all your Vercel domains using a pattern
const isAllowedVercelDomain = (origin: string): boolean => {
    return /^https?:\/\/nova-wealth-.*\.vercel\.app$/.test(origin);
};

// Explicit allowed origins (for non-Vercel domains)
const explicitAllowedOrigins: string[] = [
    "https://alth-world-front-end-fm6m-bzcajeud9-ezeh0415s-projects.vercel.app",
    "https://nova-wealth-back-end.onrender.com",
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:5175",
    "http://localhost:3000",
    "http://localhost:8080",
    process.env.FRONTEND_URL,
].filter(Boolean) as string[];

// Log configuration
console.log('🔒 CORS Configuration:');
console.log('📋 Explicit origins:', explicitAllowedOrigins);
console.log('🌐 Vercel pattern: nova-wealth-*.vercel.app');

this.app.use(cors({
    origin: function (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void): void {
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


        this.app.use(express.json());
        this.app.use(express.urlencoded({ extended: true }));
        
        this.app.use("/api", rateLimit({
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
        this.app.use("/api", router);
        console.log("body parsers configured");
    }
}