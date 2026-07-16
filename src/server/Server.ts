import express from "express";
import { MiddlewareConfig } from "./Middleware";
import { Database } from "../config/DataBase";
import { AppConfig } from "../config/Config";
import { Server as HttpServer } from 'http';

export class AppServer {
    private app: express.Application
    private Server?: HttpServer;
    private config: AppConfig;
    private database: Database;
    private middlewareConfig: MiddlewareConfig;
    private isShuttingDown: boolean = false;

    constructor() {
        this.app = express();
        this.config = AppConfig.getInstance();
        this.database = Database.getInstance();
        this.middlewareConfig = new MiddlewareConfig(this.app);
    }

    public async initialize(): Promise<void> {
        try {
            this.middlewareConfig.initialize();
            this.configureErrorHandlers();
            const dbConnected = await this.database.connect(5);
            if (!dbConnected) {
                throw new Error('DatBase connection failed')
            }
        } catch (error) {
            console.error('sever initialization', error)
            throw error;
        }
    }

    private configureErrorHandlers(): void {
        // Global error handler
        this.app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
            console.error('Unhandled error:', err);

            res.status(500).json({
                error: 'Internal server error',
                message: err.message
            });
        });
    }

    public async start(): Promise<void> {
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
        } catch (error) {
            console.error('Failed to start server;', error);
            process.exit(1);
        }
    }

    private setupGracefulShutdown(): void {
        const shutdown = async (signal: string) => {
            if (this.isShuttingDown) return;
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