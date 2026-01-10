import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';
import { config } from '../config/env.js';

export interface ErrorResponse {
    success: false;
    error: {
        code: string;
        message: string;
        stack?: string;
    };
}

export const errorHandler = (
    err: Error,
    req: Request,
    res: Response<ErrorResponse>,
    _next: NextFunction
): void => {
    // Log error
    logger.error('Error occurred', {
        error: err.message,
        stack: err.stack,
        path: req.path,
        method: req.method,
        ip: req.ip,
    });

    // Handle AppError (operational errors)
    if (err instanceof AppError) {
        res.status(err.statusCode).json({
            success: false,
            error: {
                code: err.code,
                message: err.message,
                ...(config.isDev && { stack: err.stack }),
            },
        });
        return;
    }

    // Handle Prisma errors
    if (err.constructor.name === 'PrismaClientKnownRequestError') {
        const prismaError = err as { code: string; meta?: { target?: string[] } };

        if (prismaError.code === 'P2002') {
            res.status(409).json({
                success: false,
                error: {
                    code: 'DUPLICATE_ENTRY',
                    message: `A record with this ${prismaError.meta?.target?.join(', ') || 'value'} already exists`,
                },
            });
            return;
        }

        if (prismaError.code === 'P2025') {
            res.status(404).json({
                success: false,
                error: {
                    code: 'NOT_FOUND',
                    message: 'Record not found',
                },
            });
            return;
        }
    }

    // Handle unknown errors
    res.status(500).json({
        success: false,
        error: {
            code: 'INTERNAL_ERROR',
            message: config.isDev ? err.message : 'An unexpected error occurred',
            ...(config.isDev && { stack: err.stack }),
        },
    });
};

// 404 handler
export const notFoundHandler = (req: Request, res: Response): void => {
    res.status(404).json({
        success: false,
        error: {
            code: 'NOT_FOUND',
            message: `Route ${req.method} ${req.path} not found`,
        },
    });
};
