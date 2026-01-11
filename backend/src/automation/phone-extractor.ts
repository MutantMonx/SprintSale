// @ts-nocheck - Uses Playwright DOM types
import { Page } from 'playwright';
import { logger } from '../utils/logger.js';

/**
 * Phone Extractor Configuration
 * Service-specific selectors for revealing and extracting phone numbers
 */
interface PhoneExtractorConfig {
    revealButtonSelector: string;
    phoneSelector: string;
    phoneAttribute: 'textContent' | 'href';
    requiresLogin: boolean;
}

/**
 * Service-specific phone extraction configurations
 * Based on browser analysis of OLX and OTOMOTO
 */
const PHONE_EXTRACTORS: Record<string, PhoneExtractorConfig> = {
    olx: {
        revealButtonSelector: 'button[data-testid="ad-contact-phone"]',
        phoneSelector: 'a[data-testid="contact-phone"]',
        phoneAttribute: 'href', // Format: tel:123456789
        requiresLogin: false,
    },
    otomoto: {
        revealButtonSelector: 'button[data-testid="show-phone"]',
        phoneSelector: 'a[href^="tel:"]',
        phoneAttribute: 'href',
        requiresLogin: false,
    },
    // Allegro blocked - no phone extraction
    // Autoplac - needs analysis
};

/**
 * Extract phone number from a listing detail page
 * @param page Playwright page object (already on the detail page)
 * @param serviceName Name of the service (e.g., "OLX.pl", "OTOMOTO")
 * @returns Extracted phone number or null
 */
export async function extractPhoneFromDetailPage(
    page: Page,
    serviceName: string
): Promise<string | null> {
    // Normalize service name
    const serviceKey = serviceName
        .toLowerCase()
        .replace(/\.pl$/i, '')
        .replace(/\.com$/i, '')
        .replace(/[^a-z]/g, '');

    const config = PHONE_EXTRACTORS[serviceKey];

    if (!config) {
        logger.debug(`No phone extractor config for service: ${serviceName}`);
        return null;
    }

    if (config.requiresLogin) {
        logger.debug(`Phone extraction for ${serviceName} requires login - skipping`);
        return null;
    }

    try {
        // Wait for and click the reveal button
        const revealButton = await page.$(config.revealButtonSelector);

        if (!revealButton) {
            logger.debug(`Phone reveal button not found for ${serviceName}`);
            return null;
        }

        // Click the reveal button
        await revealButton.click();
        logger.debug('Clicked phone reveal button');

        // Wait for the phone to appear
        await page.waitForSelector(config.phoneSelector, { timeout: 5000 });

        // Extract the phone
        const phoneElement = await page.$(config.phoneSelector);
        if (!phoneElement) {
            logger.debug('Phone element not found after clicking reveal');
            return null;
        }

        let rawPhone: string | null = null;

        if (config.phoneAttribute === 'href') {
            rawPhone = await phoneElement.getAttribute('href');
        } else {
            rawPhone = await phoneElement.textContent();
        }

        if (!rawPhone) {
            return null;
        }

        // Parse and normalize the phone number
        const phone = parsePhoneNumber(rawPhone);
        logger.info(`Extracted phone: ${phone} from ${serviceName}`);

        return phone;
    } catch (error) {
        logger.debug(`Failed to extract phone from ${serviceName}:`, error);
        return null;
    }
}

/**
 * Parse and normalize a phone number
 * Handles formats like: tel:+48123456789, tel:123456789, +48 123 456 789
 * @param rawPhone Raw phone string from href or text
 * @returns Normalized phone number
 */
export function parsePhoneNumber(rawPhone: string): string {
    // Remove tel: prefix
    let phone = rawPhone.replace(/^tel:/i, '');

    // Remove all whitespace
    phone = phone.replace(/\s+/g, '');

    // Remove dashes and dots often used as separators
    phone = phone.replace(/[-\.]/g, '');

    // Add +48 prefix if missing and looks like Polish number
    if (phone.match(/^[0-9]{9}$/)) {
        phone = '+48' + phone;
    } else if (phone.match(/^48[0-9]{9}$/)) {
        phone = '+' + phone;
    }

    return phone;
}

/**
 * Check if a service supports phone extraction
 */
export function supportsPhoneExtraction(serviceName: string): boolean {
    const serviceKey = serviceName
        .toLowerCase()
        .replace(/\.pl$/i, '')
        .replace(/\.com$/i, '')
        .replace(/[^a-z]/g, '');

    return serviceKey in PHONE_EXTRACTORS;
}
