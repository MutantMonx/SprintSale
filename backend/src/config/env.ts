import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const envSchema = z.object({
    // Server
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    PORT: z.coerce.number().default(4000),
    API_URL: z.string().default('http://localhost:4000'),
    FRONTEND_URL: z.string().default('http://localhost:3000'),

    // Database
    DATABASE_URL: z.string(),

    // Redis (REDIS_URL takes priority, or use host/port for local dev)
    REDIS_URL: z.string().optional(),
    REDIS_HOST: z.string().optional().default('localhost'),
    REDIS_PORT: z.coerce.number().optional().default(6379),
    REDIS_PASSWORD: z.string().optional(),

    // JWT
    JWT_SECRET: z.string().min(32),
    JWT_ACCESS_EXPIRY: z.string().default('15m'),
    JWT_REFRESH_EXPIRY: z.string().default('7d'),

    // Encryption
    ENCRYPTION_KEY: z.string().length(32),
    ENCRYPTION_IV_LENGTH: z.coerce.number().default(16),

    // Firebase (optional)
    FCM_PROJECT_ID: z.string().optional(),
    FCM_PRIVATE_KEY: z.string().optional(),
    FCM_CLIENT_EMAIL: z.string().optional(),

    // Playwright
    PLAYWRIGHT_HEADLESS: z.coerce.boolean().default(true),
    PLAYWRIGHT_TIMEOUT: z.coerce.number().default(30000),

    // Logging
    LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
    LOG_FORMAT: z.enum(['json', 'simple']).default('json'),

    // Rate Limiting
    RATE_LIMIT_WINDOW_MS: z.coerce.number().default(60000),
    RATE_LIMIT_MAX_REQUESTS: z.coerce.number().default(100),

    // Admin Seed
    ADMIN_EMAIL: z.string().email().optional(),
    ADMIN_PASSWORD: z.string().min(8).optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
    console.error('❌ Invalid environment variables:');
    console.error(parsed.error.format());
    process.exit(1);
}

export const env = parsed.data;

export const config = {
    isDev: env.NODE_ENV === 'development',
    isProd: env.NODE_ENV === 'production',
    isTest: env.NODE_ENV === 'test',

    server: {
        port: env.PORT,
        apiUrl: env.API_URL,
        frontendUrl: env.FRONTEND_URL,
    },

    database: {
        url: env.DATABASE_URL,
    },

    redis: {
        url: env.REDIS_URL,
        host: env.REDIS_HOST,
        port: env.REDIS_PORT,
        password: env.REDIS_PASSWORD,
    },

    jwt: {
        secret: env.JWT_SECRET,
        accessExpiry: env.JWT_ACCESS_EXPIRY,
        refreshExpiry: env.JWT_REFRESH_EXPIRY,
    },

    encryption: {
        key: env.ENCRYPTION_KEY,
        ivLength: env.ENCRYPTION_IV_LENGTH,
    },

    firebase: {
        projectId: env.FCM_PROJECT_ID,
        privateKey: env.FCM_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        clientEmail: env.FCM_CLIENT_EMAIL,
    },

    playwright: {
        headless: env.PLAYWRIGHT_HEADLESS,
        timeout: env.PLAYWRIGHT_TIMEOUT,
    },

    logging: {
        level: env.LOG_LEVEL,
        format: env.LOG_FORMAT,
    },

    rateLimit: {
        windowMs: env.RATE_LIMIT_WINDOW_MS,
        maxRequests: env.RATE_LIMIT_MAX_REQUESTS,
    },

    admin: {
        email: env.ADMIN_EMAIL,
        password: env.ADMIN_PASSWORD,
    },
} as const;
