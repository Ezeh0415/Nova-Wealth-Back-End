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

       const allowedOrigins: string[] = [
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
].filter(Boolean) as string[]; // Remove undefined values

        this.app.use(express.json());
        this.app.use(express.urlencoded({ extended: true }));
        this.app.use(cors(
            {
                origin: function (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void): void {
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
                allowedHeaders: ["Content-Type", "Authorization", 'x-refresh-token', "x-api-key"], // Allowed headers
                exposedHeaders: ["Content-Range", "X-Content-Range"], // Headers exposed to client
                maxAge: 86400, // Cache preflight requests for 24 hours
            }
        ))
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