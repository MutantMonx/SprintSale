import {
    chromium,
    Browser,
    BrowserContext,
    Page,
    type LaunchOptions
} from 'playwright';
import { config } from '../config/env.js';
import { logger } from '../utils/logger.js';

interface BrowserSession {
    browser: Browser;
    context: BrowserContext;
    page: Page;
    createdAt: Date;
    lastUsedAt: Date;
}

const MAX_POOL_SIZE = 3;
const SESSION_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes

class PlaywrightManager {
    private pool: BrowserSession[] = [];
    private isShuttingDown = false;

    private getLaunchOptions(): LaunchOptions {
        return {
            headless: config.playwright.headless,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-gpu',
            ],
        };
    }

    async acquire(): Promise<BrowserSession> {
        // Clean up stale sessions
        this.cleanupStaleSessions();

        // Try to reuse existing session
        const available = this.pool.find(s => !this.isSessionInUse(s));
        if (available) {
            available.lastUsedAt = new Date();
            logger.debug('Reusing existing browser session');
            return available;
        }

        // Create new session if pool not full
        if (this.pool.length < MAX_POOL_SIZE) {
            const session = await this.createSession();
            this.pool.push(session);
            logger.info(`Created new browser session (pool size: ${this.pool.length})`);
            return session;
        }

        // Wait for available session
        logger.warn('Browser pool exhausted, waiting for available session');
        await this.waitForAvailable();
        return this.acquire();
    }

    async release(session: BrowserSession): Promise<void> {
        session.lastUsedAt = new Date();

        // Clear cookies and storage between uses
        try {
            await session.context.clearCookies();
            await session.page.goto('about:blank');
        } catch (error) {
            logger.error('Failed to clear session state:', error);
        }
    }

    async shutdown(): Promise<void> {
        this.isShuttingDown = true;
        logger.info('Shutting down browser pool...');

        for (const session of this.pool) {
            try {
                await session.context.close();
                await session.browser.close();
            } catch (error) {
                logger.error('Error closing browser session:', error);
            }
        }

        this.pool = [];
        logger.info('Browser pool shutdown complete');
    }

    private async createSession(): Promise<BrowserSession> {
        const browser = await chromium.launch(this.getLaunchOptions());
        const context = await browser.newContext({
            viewport: { width: 1280, height: 720 },
            userAgent: this.getRandomUserAgent(),
            locale: 'pl-PL',
            timezoneId: 'Europe/Warsaw',
        });
        const page = await context.newPage();

        // Set default timeout
        page.setDefaultTimeout(config.playwright.timeout);

        return {
            browser,
            context,
            page,
            createdAt: new Date(),
            lastUsedAt: new Date(),
        };
    }

    private cleanupStaleSessions(): void {
        const now = Date.now();
        this.pool = this.pool.filter(session => {
            const age = now - session.lastUsedAt.getTime();
            if (age > SESSION_TIMEOUT_MS) {
                logger.debug('Cleaning up stale browser session');
                session.context.close().catch(() => { });
                session.browser.close().catch(() => { });
                return false;
            }
            return true;
        });
    }

    private isSessionInUse(_session: BrowserSession): boolean {
        // For now, assume sessions are not locked
        return false;
    }

    private async waitForAvailable(): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, 1000));
    }

    private getRandomUserAgent(): string {
        const userAgents = [
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15',
        ];
        return userAgents[Math.floor(Math.random() * userAgents.length)];
    }
}

export const playwrightManager = new PlaywrightManager();

// Graceful shutdown
process.on('SIGTERM', () => playwrightManager.shutdown());
process.on('SIGINT', () => playwrightManager.shutdown());
