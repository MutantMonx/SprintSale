import { searchScheduler } from './jobs/search-scheduler.js';
import { playwrightManager } from './automation/playwright-manager.js';
import { logger } from './utils/logger.js';

async function startWorker(): Promise<void> {
    logger.info('🚀 Starting SprintSale Worker');

    // Start search scheduler
    await searchScheduler.start();

    logger.info('✅ Worker started successfully');
    logger.info('📅 Listening for search jobs...');
}

// Graceful shutdown
async function shutdown(): Promise<void> {
    logger.info('Shutting down worker...');

    await searchScheduler.stop();
    await playwrightManager.shutdown();

    logger.info('Worker shutdown complete');
    process.exit(0);
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

// Start worker
startWorker().catch((error) => {
    logger.error('Failed to start worker:', error);
    process.exit(1);
});
