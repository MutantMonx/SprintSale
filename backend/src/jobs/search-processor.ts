// @ts-nocheck - Uses Playwright with DOM APIs
import Bull, { Queue, Job } from 'bull';
import { redis } from '../config/redis.js';
import { prisma } from '../config/database.js';
import { logger } from '../utils/logger.js';
import { playwrightManager, extractListings } from '../automation/index.js';
import { encryptionService } from '../services/encryption.service.js';
import { notificationDispatcher } from './notification-dispatcher.js';

export interface SearchJobData {
    searchConfigId: string;
    userId: string;
    serviceId: string;
    serviceName: string;
    serviceBaseUrl: string;
    keywords: string[];
    priceMin: number | null;
    priceMax: number | null;
    location: string | null;
}

// Create queue
export const searchQueue: Queue<SearchJobData> = new Bull('search-jobs', {
    redis: {
        host: redis.options.host as string,
        port: redis.options.port as number,
        password: redis.options.password as string | undefined,
    },
    defaultJobOptions: {
        removeOnComplete: 100,
        removeOnFail: 50,
        attempts: 3,
        backoff: {
            type: 'exponential',
            delay: 5000,
        },
    },
});

// Process jobs
searchQueue.process(2, async (job: Job<SearchJobData>) => {
    const { searchConfigId, serviceName, serviceBaseUrl, keywords, priceMin, priceMax, location } = job.data;

    logger.info(`Processing search job: ${searchConfigId}`);

    let session;
    try {
        // Acquire browser session
        session = await playwrightManager.acquire();

        // Build search URL based on service
        const searchUrl = buildSearchUrl(serviceBaseUrl, keywords, priceMin, priceMax, location);

        // Navigate and extract
        await session.page.goto(searchUrl, { waitUntil: 'domcontentloaded' });
        await randomDelay(2000, 4000);

        // Scroll to load lazy content
        await session.page.evaluate(() => window.scrollBy(0, 500));
        await randomDelay(1000, 2000);

        // Extract listings
        const extractedListings = await extractListings(session.page, serviceName);

        // Process and deduplicate
        const newListings = await processListings(job.data, extractedListings);

        // Update last run time
        await prisma.searchConfig.update({
            where: { id: searchConfigId },
            data: {
                lastRunAt: new Date(),
                nextRunAt: calculateNextRun(job.data),
            },
        });

        logger.info(`Search job ${searchConfigId} completed: ${newListings.length} new listings`);

        return { newListingsCount: newListings.length };
    } catch (error) {
        logger.error(`Search job failed: ${searchConfigId}`, error);
        throw error;
    } finally {
        if (session) {
            await playwrightManager.release(session);
        }
    }
});

async function processListings(
    jobData: SearchJobData,
    extractedListings: Awaited<ReturnType<typeof extractListings>>
): Promise<string[]> {
    const newListingIds: string[] = [];

    for (const listing of extractedListings) {
        // Create deduplication hashes
        const primaryHash = encryptionService.createListingPrimaryHash(
            jobData.serviceId,
            listing.externalId
        );

        const semanticHash = encryptionService.createListingSemanticHash(
            listing.title,
            listing.price,
            listing.phone
        );

        // Check for existing listing by primary hash
        const existing = await prisma.listing.findUnique({
            where: { primaryHash },
        });

        if (existing) {
            // Check for price change
            if (listing.price && existing.price && listing.price < existing.price) {
                await prisma.listing.update({
                    where: { id: existing.id },
                    data: {
                        previousPrice: existing.price,
                        price: listing.price,
                    },
                });

                // Notify about price drop
                await notificationDispatcher.dispatch({
                    userId: jobData.userId,
                    listingId: existing.id,
                    type: 'price_drop',
                    title: `Spadek ceny: ${listing.title}`,
                    body: `${existing.price} → ${listing.price} PLN`,
                });
            }
            continue;
        }

        // Create new listing
        const newListing = await prisma.listing.create({
            data: {
                serviceId: jobData.serviceId,
                searchConfigId: jobData.searchConfigId,
                externalId: listing.externalId,
                title: listing.title,
                description: listing.description,
                price: listing.price,
                currency: listing.currency,
                location: listing.location,
                phone: listing.phone,
                listingUrl: listing.listingUrl,
                images: listing.images,
                primaryHash,
                semanticHash,
                detectedAt: new Date(),
            },
        });

        newListingIds.push(newListing.id);

        // Send notification for new listing
        await notificationDispatcher.dispatch({
            userId: jobData.userId,
            listingId: newListing.id,
            type: 'new_listing',
            title: 'Nowe ogłoszenie',
            body: `${listing.title} - ${listing.price || 'Brak ceny'} PLN`,
        });
    }

    return newListingIds;
}

function buildSearchUrl(
    baseUrl: string,
    keywords: string[],
    priceMin: number | null,
    priceMax: number | null,
    location: string | null
): string {
    const url = new URL(baseUrl);
    const keywordString = keywords.join(' ');

    // Generic search params - services may need specific handling
    if (keywordString) url.searchParams.set('q', keywordString);
    if (priceMin) url.searchParams.set('price_from', String(priceMin));
    if (priceMax) url.searchParams.set('price_to', String(priceMax));
    if (location) url.searchParams.set('city', location);

    return url.toString();
}

function calculateNextRun(jobData: SearchJobData): Date {
    // Add random jitter to avoid detection patterns
    const baseInterval = 300; // 5 minutes default
    const jitter = Math.floor(Math.random() * 120) - 60; // ±60 seconds
    return new Date(Date.now() + (baseInterval + jitter) * 1000);
}

function randomDelay(min: number, max: number): Promise<void> {
    const delay = Math.floor(Math.random() * (max - min) + min);
    return new Promise(resolve => setTimeout(resolve, delay));
}

// Queue event handlers
searchQueue.on('completed', (job, result) => {
    logger.debug(`Job ${job.id} completed:`, result);
});

searchQueue.on('failed', (job, err) => {
    logger.error(`Job ${job.id} failed:`, err);
});

export default searchQueue;
