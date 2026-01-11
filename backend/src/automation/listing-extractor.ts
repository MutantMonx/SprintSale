// @ts-nocheck - Uses Playwright DOM types
import { Page } from 'playwright';
import { logger } from '../utils/logger.js';

interface ExtractedListing {
    externalId: string;
    title: string;
    description: string | null;
    price: number | null;
    currency: string;
    location: string | null;
    phone: string | null;
    listingUrl: string;
    images: string[];
}

interface ListingExtractorConfig {
    containerSelector: string;
    fields: {
        title: { selector: string; attribute?: string };
        price: { selector: string; attribute?: string; regex?: string };
        description?: { selector: string; attribute?: string };
        location?: { selector: string; attribute?: string };
        phone?: { selector: string; attribute?: string };
        link: { selector: string; attribute: string };
        image?: { selector: string; attribute: string };
        externalId?: { selector: string; attribute: string; regex?: string };
    };
}

// Service-specific extractors
const EXTRACTORS: Record<string, ListingExtractorConfig> = {
    olx: {
        containerSelector: '[data-cy="l-card"]',
        fields: {
            title: { selector: 'h4, h6', attribute: undefined },
            price: { selector: '[data-testid="ad-price"]', regex: '([\\d\\s]+)' },
            location: { selector: '[data-testid="location-date"]' },
            link: { selector: 'a', attribute: 'href' },
            image: { selector: 'img', attribute: 'src' },
            externalId: { selector: 'a', attribute: 'href', regex: '/d/oferta/([^/]+)|/oferta/([^/]+)' },
        },
    },
    otomoto: {
        // OTOMOTO listings are now embedded in OLX with same structure
        containerSelector: '[data-cy="l-card"], article[data-id], [data-testid="listing-ad"]',
        fields: {
            title: { selector: 'h4, h1, h2', attribute: undefined },
            price: { selector: '[data-testid="ad-price"], [data-testid="listing-price"]', regex: '([\\d\\s]+)' },
            location: { selector: '[data-testid="location-date"], [data-testid="location"]' },
            link: { selector: 'a', attribute: 'href' },
            image: { selector: 'img', attribute: 'src' },
            externalId: { selector: 'article', attribute: 'data-id' },
        },
    },
    allegro: {
        containerSelector: 'article[data-item]',
        fields: {
            title: { selector: 'h2, .mgn2_14' },
            price: { selector: '[data-role="price"]', regex: '([\\d\\s,]+)' },
            location: { selector: '[data-role="delivery"]' },
            link: { selector: 'a[href*="/oferta/"]', attribute: 'href' },
            image: { selector: 'img', attribute: 'src' },
            externalId: { selector: 'article', attribute: 'data-item' },
        },
    },
    sprzedajemy: {
        containerSelector: '.offer',
        fields: {
            title: { selector: '.title a' },
            price: { selector: '.price', regex: '([\\d\\s]+)' },
            location: { selector: '.location' },
            link: { selector: '.title a', attribute: 'href' },
            image: { selector: 'img', attribute: 'src' },
            externalId: { selector: 'article', attribute: 'data-id' },
        },
    },
    autoplac: {
        containerSelector: '.offer-item, .car-item, article.listing',
        fields: {
            title: { selector: 'h2 a, .title a, .offer-title' },
            price: { selector: '.price, .offer-price', regex: '([\\d\\s]+)' },
            location: { selector: '.location, .offer-location' },
            link: { selector: 'a[href*="/oferta/"], h2 a, .title a', attribute: 'href' },
            image: { selector: 'img', attribute: 'src' },
            externalId: { selector: '[data-id], article', attribute: 'data-id' },
        },
    },
};

export async function extractListings(
    page: Page,
    serviceName: string
): Promise<ExtractedListing[]> {
    // Normalize service name: "OLX.pl" -> "olx", "OTOMOTO.pl" -> "otomoto"
    const configKey = serviceName
        .toLowerCase()
        .replace(/\.pl$/i, '')  // Remove .pl suffix
        .replace(/\.com$/i, '') // Remove .com suffix  
        .replace(/[^a-z]/g, ''); // Remove any remaining non-letter chars
    const config = EXTRACTORS[configKey];

    if (!config) {
        logger.warn(`No extractor config for service: ${serviceName} (key: ${configKey})`);
        return [];
    }

    const listings: ExtractedListing[] = [];

    try {
        await page.waitForSelector(config.containerSelector, { timeout: 10000 });
        const elements = await page.$$(config.containerSelector);

        for (const element of elements.slice(0, 50)) { // Limit to 50 per page
            try {
                const listing = await extractSingleListing(element, config);
                if (listing && listing.title && listing.listingUrl) {
                    listings.push(listing);
                }
            } catch (error) {
                logger.debug('Failed to extract listing element:', error);
            }
        }

        logger.info(`Extracted ${listings.length} listings from ${serviceName}`);
    } catch (error) {
        logger.error(`Failed to extract listings from ${serviceName}:`, error);
    }

    return listings;
}

async function extractSingleListing(
    element: any,
    config: ListingExtractorConfig
): Promise<ExtractedListing | null> {
    const { fields } = config;

    // Extract title
    const titleEl = await element.$(fields.title.selector);
    const title = titleEl
        ? (fields.title.attribute
            ? await titleEl.getAttribute(fields.title.attribute)
            : await titleEl.textContent())
        : null;

    if (!title) return null;

    // Extract price
    let price: number | null = null;
    const priceEl = await element.$(fields.price.selector);
    if (priceEl) {
        let priceText = await priceEl.textContent();
        if (priceText && fields.price.regex) {
            const match = priceText.match(new RegExp(fields.price.regex));
            priceText = match ? match[1] : priceText;
        }
        if (priceText) {
            price = parseInt(priceText.replace(/\s/g, '').replace(',', '.'), 10);
            if (isNaN(price)) price = null;
        }
    }

    // Extract link
    const linkEl = await element.$(fields.link.selector);
    let listingUrl = linkEl ? await linkEl.getAttribute(fields.link.attribute) : null;
    if (!listingUrl) return null;

    // Make URL absolute if needed
    if (listingUrl.startsWith('/')) {
        const pageUrl = new URL(await element.evaluate((el: Element) => el.ownerDocument.location.href) as string);
        listingUrl = `${pageUrl.origin}${listingUrl}`;
    }

    // Extract external ID
    let externalId = '';
    if (fields.externalId) {
        const idEl = await element.$(fields.externalId.selector);
        if (idEl) {
            let idValue = await idEl.getAttribute(fields.externalId.attribute);
            if (idValue && fields.externalId.regex) {
                const match = idValue.match(new RegExp(fields.externalId.regex));
                idValue = match ? match[1] : idValue;
            }
            externalId = idValue || '';
        }
    }
    if (!externalId) {
        externalId = listingUrl.split('/').pop() || String(Date.now());
    }

    // Extract optional fields
    const location = fields.location
        ? await extractText(element, fields.location)
        : null;

    const images: string[] = [];
    if (fields.image) {
        const imgEl = await element.$(fields.image.selector);
        if (imgEl) {
            const src = await imgEl.getAttribute(fields.image.attribute);
            if (src) images.push(src);
        }
    }

    return {
        externalId,
        title: title.trim(),
        description: null, // Would need to visit detail page
        price,
        currency: 'PLN',
        location: location?.trim() || null,
        phone: null, // Usually hidden, needs login
        listingUrl,
        images,
    };
}

async function extractText(element: any, field: { selector: string; attribute?: string }): Promise<string | null> {
    const el = await element.$(field.selector);
    if (!el) return null;
    return field.attribute
        ? await el.getAttribute(field.attribute)
        : await el.textContent();
}
