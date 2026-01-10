import Redis, { RedisOptions } from 'ioredis';
import { config } from './env.js';
import { logger } from '../utils/logger.js';

// Support both REDIS_URL and individual host/port config
const getRedisConfig = (): string | RedisOptions => {
    if (config.redis.url) {
        return config.redis.url;
    }
    return {
        host: config.redis.host,
        port: config.redis.port,
        password: config.redis.password || undefined,
        maxRetriesPerRequest: null,
        retryStrategy: (times: number) => {
            if (times > 10) {
                logger.error('Redis connection failed after 10 retries');
                return null;
            }
            return Math.min(times * 100, 3000);
        },
    };
};

export const redis = new Redis(getRedisConfig());

redis.on('connect', () => {
    logger.info('Redis connected successfully');
});

redis.on('error', (err: Error) => {
    logger.error('Redis connection error:', err);
});

export default redis;
