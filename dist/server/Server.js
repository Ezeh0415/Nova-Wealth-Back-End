"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppServer = void 0;
const express_1 = __importDefault(require("express"));
const Middleware_1 = require("./Middleware");
const DataBase_1 = require("../config/DataBase");
const Config_1 = require("../config/Config");
class AppServer {
    constructor() {
        this.isShuttingDown = false;
        this.app = (0, express_1.default)();
        this.config = Config_1.AppConfig.getInstance();
        this.database = DataBase_1.Database.getInstance();
        this.middlewareConfig = new Middleware_1.MiddlewareConfig(this.app);
    }
    async initialize() {
        try {
            this.middlewareConfig.initialize();
            this.configureErrorHandlers();
            const dbConnected = await this.database.connect(5);
            if (!dbConnected) {
                throw new Error('DatBase connection failed');
            }
        }
        catch (error) {
            console.error('sever initialization', error);
            throw error;
        }
    }
    configureErrorHandlers() {
        // Global error handler
        this.app.use((err, req, res, next) => {
            console.error('Unhandled error:', err);
            res.status(500).json({
                error: 'Internal server error',
                message: err.message
            });
        });
    }
    async start() {
        try {
            await this.initialize();
            this.Server = this.app.listen(this.config.port, () => {
                console.log(`

                Server Started Successfully!
                Port:      ${String(this.config.port).padEnd(32)}
                Database:  ${this.database.getConnectionStatus() ? 'Connected' : 'Disconnected'.padEnd(32)}

                `);
            });
            this.setupGracefulShutdown();
        }
        catch (error) {
            console.error('Failed to start server;', error);
            process.exit(1);
        }
    }
    setupGracefulShutdown() {
        const shutdown = async (signal) => {
            if (this.isShuttingDown)
                return;
            this.isShuttingDown = true;
            console.log(`\n Received ${signal}. Shutting down gracefully...`);
            // Close server
            if (this.Server) {
                await new Promise((resolve) => this.Server?.close(resolve));
                console.log(' HTTP server closed');
            }
            // Close database connection
            await this.database.disconnect();
            console.log(' Shutdown complete');
            process.exit(0);
        };
        process.on('SIGTERM', () => shutdown('SIGTERM'));
        process.on('SIGINT', () => shutdown('SIGINT'));
    }
}
exports.AppServer = AppServer;
