import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import { config, prisma } from './config/index.js';
import { logger, httpLogStream } from './utils/logger.js';
import { errorHandler, notFoundHandler, globalRateLimiter } from './middleware/index.js';
import routes from './routes/index.js';

const app = express();

// Trust proxy (for rate limiting behind nginx/docker)
app.set('trust proxy', 1);

// Security middlewares
app.use(helmet({
    contentSecurityPolicy: config.isProd,
}));

// CORS
app.use(cors({
    origin: config.isDev
        ? '*'
        : [config.server.frontendUrl],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-TOTP-Verified'],
}));

// Compression
app.use(compression());

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// HTTP logging
app.use(morgan(config.isDev ? 'dev' : 'combined', {
    stream: httpLogStream,
    skip: (req) => req.path === '/api/health',
}));

// Rate limiting
app.use(globalRateLimiter);

// API routes
app.use('/api', routes);

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

// Server startup
const startServer = async () => {
    try {
        // Test database connection
        await prisma.$connect();
        logger.info('Database connected successfully');

        // Start HTTP server
        const server = app.listen(config.server.port, () => {
            logger.info(`
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║   🚗 SprintSale API Server                                    ║
║                                                               ║
║   Status:  Running                                            ║
║   Port:    ${config.server.port}                                            ║
║   Mode:    ${config.isDev ? 'Development' : 'Production'}                                     ║
║   API:     ${config.server.apiUrl}/api                        ║
║   Health:  ${config.server.apiUrl}/api/health                 ║
║                                                               ║
║   Created by monx                                             ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
      `);
        });

        // Graceful shutdown
        const shutdown = async (signal: string) => {
            logger.info(`${signal} received, closing server...`);

            server.close(async () => {
                logger.info('HTTP server closed');
                await prisma.$disconnect();
                logger.info('Database disconnected');
                process.exit(0);
            });

            // Force shutdown after 10 seconds
            setTimeout(() => {
                logger.error('Could not close connections in time, forcefully shutting down');
                process.exit(1);
            }, 10000);
        };

        process.on('SIGTERM', () => shutdown('SIGTERM'));
        process.on('SIGINT', () => shutdown('SIGINT'));

    } catch (error) {
        logger.error('Failed to start server:', error);
        process.exit(1);
    }
};

startServer();

export default app;
