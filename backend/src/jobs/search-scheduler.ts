import { prisma } from '../config/database.js';
import { logger } from '../utils/logger.js';
import { searchQueue, type SearchJobData } from './search-processor.js';

class SearchScheduler {
    private intervalId: NodeJS.Timeout | null = null;
    private checkIntervalMs = 30000; // Check every 30 seconds

    async start(): Promise<void> {
        logger.info('Starting search scheduler');

        // Initial check
        await this.checkAndSchedule();

        // Set up interval
        this.intervalId = setInterval(
            () => this.checkAndSchedule(),
            this.checkIntervalMs
        );
    }

    async stop(): Promise<void> {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
        logger.info('Search scheduler stopped');
    }

    private async checkAndSchedule(): Promise<void> {
        try {
            const now = new Date();

            // Find search configs that are due
            const dueConfigs = await prisma.searchConfig.findMany({
                where: {
                    isActive: true,
                    OR: [
                        { nextRunAt: null },
                        { nextRunAt: { lte: now } },
                    ],
                },
                include: {
                    service: true,
                    user: true,
                },
                take: 10, // Process in batches
            });

            for (const config of dueConfigs) {
                // Check if user is active
                if (config.user.deletedAt) continue;

                // Check if service is active
                if (!config.service.isActive) continue;

                // Add job to queue
                const jobData: SearchJobData = {
                    searchConfigId: config.id,
                    userId: config.userId,
                    serviceId: config.serviceId,
                    serviceName: config.service.name,
                    serviceBaseUrl: config.service.baseUrl,
                    keywords: config.keywords as string[],
                    priceMin: config.priceMin,
                    priceMax: config.priceMax,
                    location: config.location,
                };

                await searchQueue.add(jobData, {
                    jobId: `search-${config.id}-${Date.now()}`,
                    delay: this.getRandomDelay(0, 10000), // Random 0-10s delay
                });

                // Update nextRunAt with jitter
                const intervalSeconds = config.intervalSeconds || 300;
                const jitterSeconds = config.randomRangeSeconds || Math.floor(intervalSeconds * 0.2);
                const jitter = Math.floor(Math.random() * jitterSeconds * 2) - jitterSeconds;

                await prisma.searchConfig.update({
                    where: { id: config.id },
                    data: {
                        nextRunAt: new Date(now.getTime() + (intervalSeconds + jitter) * 1000),
                    },
                });

                logger.debug(`Scheduled search job: ${config.id} (${config.name})`);
            }
        } catch (error) {
            logger.error('Error in search scheduler:', error);
        }
    }

    private getRandomDelay(min: number, max: number): number {
        return Math.floor(Math.random() * (max - min) + min);
    }

    async triggerManualRun(searchConfigId: string): Promise<void> {
        const config = await prisma.searchConfig.findUnique({
            where: { id: searchConfigId },
            include: {
                service: true,
                user: true,
            },
        });

        if (!config) {
            throw new Error('Search config not found');
        }

        const jobData: SearchJobData = {
            searchConfigId: config.id,
            userId: config.userId,
            serviceId: config.serviceId,
            serviceName: config.service.name,
            serviceBaseUrl: config.service.baseUrl,
            keywords: config.keywords as string[],
            priceMin: config.priceMin,
            priceMax: config.priceMax,
            location: config.location,
        };

        await searchQueue.add(jobData, {
            jobId: `manual-${config.id}-${Date.now()}`,
            priority: 1, // Higher priority for manual runs
        });

        logger.info(`Manual search triggered: ${searchConfigId}`);
    }
}

export const searchScheduler = new SearchScheduler();
