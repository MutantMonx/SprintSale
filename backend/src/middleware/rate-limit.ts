import rateLimit from 'express-rate-limit';
import { config } from '../config/env.js';
import { TooManyRequestsError } from '../utils/errors.js';

export const globalRateLimiter = rateLimit({
    windowMs: config.rateLimit.windowMs,
    max: config.rateLimit.maxRequests,
    standardHeaders: true,
    legacyHeaders: false,
    handler: () => {
        throw new TooManyRequestsError('Too many requests, please try again later');
    },
});

// Stricter rate limit for auth endpoints
export const authRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // 10 attempts per 15 minutes
    standardHeaders: true,
    legacyHeaders: false,
    handler: () => {
        throw new TooManyRequestsError('Too many authentication attempts, please try again later');
    },
    skipSuccessfulRequests: true,
});

// Rate limiter for scraping triggers
export const scrapingRateLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 5, // 5 manual triggers per minute
    standardHeaders: true,
    legacyHeaders: false,
    handler: () => {
        throw new TooManyRequestsError('Too many scraping requests, please wait');
    },
});
