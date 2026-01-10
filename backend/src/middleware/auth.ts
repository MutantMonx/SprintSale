import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config, prisma } from '../config/index.js';
import { UnauthorizedError, ForbiddenError } from '../utils/errors.js';

export interface JwtPayload {
    userId: string;
    email: string;
    tier: string;
    type: 'access' | 'refresh';
}

export interface AuthRequest extends Request {
    user?: {
        id: string;
        email: string;
        tier: string;
    };
}

export const authenticate = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader?.startsWith('Bearer ')) {
            throw new UnauthorizedError('No token provided');
        }

        const token = authHeader.split(' ')[1];

        const payload = jwt.verify(token, config.jwt.secret) as JwtPayload;

        if (payload.type !== 'access') {
            throw new UnauthorizedError('Invalid token type');
        }

        // Verify user still exists and is active
        const user = await prisma.user.findUnique({
            where: { id: payload.userId },
            select: { id: true, email: true, tier: true, deletedAt: true },
        });

        if (!user || user.deletedAt) {
            throw new UnauthorizedError('User not found or deactivated');
        }

        req.user = {
            id: user.id,
            email: user.email,
            tier: user.tier,
        };

        next();
    } catch (error) {
        if (error instanceof jwt.TokenExpiredError) {
            next(new UnauthorizedError('Token expired'));
        } else if (error instanceof jwt.JsonWebTokenError) {
            next(new UnauthorizedError('Invalid token'));
        } else {
            next(error);
        }
    }
};

export const requirePremium = (
    req: AuthRequest,
    res: Response,
    next: NextFunction
): void => {
    if (req.user?.tier !== 'PREMIUM') {
        next(new ForbiddenError('Premium subscription required'));
        return;
    }
    next();
};

export const optionalAuth = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const authHeader = req.headers.authorization;

        if (authHeader?.startsWith('Bearer ')) {
            const token = authHeader.split(' ')[1];
            const payload = jwt.verify(token, config.jwt.secret) as JwtPayload;

            if (payload.type === 'access') {
                const user = await prisma.user.findUnique({
                    where: { id: payload.userId },
                    select: { id: true, email: true, tier: true, deletedAt: true },
                });

                if (user && !user.deletedAt) {
                    req.user = {
                        id: user.id,
                        email: user.email,
                        tier: user.tier,
                    };
                }
            }
        }

        next();
    } catch {
        // Token invalid/expired, continue as unauthenticated
        next();
    }
};
