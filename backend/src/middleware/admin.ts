// @ts-nocheck
import type { Response, NextFunction } from 'express';
import type { AuthRequest } from './auth.js';
import { prisma } from '../config/index.js';
import { UnauthorizedError, ForbiddenError } from '../utils/errors.js';

/**
 * Middleware to check if the authenticated user is an admin
 * Must be used AFTER the authenticate middleware
 */
export const requireAdmin = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        if (!req.user) {
            throw new UnauthorizedError('Authentication required');
        }

        const user = await prisma.user.findUnique({
            where: { id: req.user.id },
            select: { isAdmin: true },
        });

        if (!user || !user.isAdmin) {
            throw new ForbiddenError('Admin access required');
        }

        next();
    } catch (error) {
        next(error);
    }
};

/**
 * Middleware to check if request is from an AdminUser (separate admin panel login)
 * This would be used for a completely separate admin authentication flow
 */
export const requireAdminUser = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    // For now, we use the same User table with isAdmin flag
    // In the future, we could implement separate AdminUser authentication
    return requireAdmin(req, res, next);
};
