import winston from 'winston';
import { config } from '../config/env.js';

const { combine, timestamp, json, simple, colorize, printf } = winston.format;

const devFormat = combine(
    colorize(),
    timestamp({ format: 'HH:mm:ss' }),
    printf(({ level, message, timestamp, ...meta }) => {
        const metaStr = Object.keys(meta).length ? JSON.stringify(meta) : '';
        return `${timestamp} ${level}: ${message} ${metaStr}`;
    })
);

const prodFormat = combine(
    timestamp(),
    json()
);

export const logger = winston.createLogger({
    level: config.logging.level,
    format: config.logging.format === 'json' ? prodFormat : devFormat,
    transports: [
        new winston.transports.Console(),
    ],
    exceptionHandlers: [
        new winston.transports.Console(),
    ],
    rejectionHandlers: [
        new winston.transports.Console(),
    ],
});

// Stream for Morgan HTTP logging
export const httpLogStream = {
    write: (message: string) => {
        logger.info(message.trim());
    },
};
