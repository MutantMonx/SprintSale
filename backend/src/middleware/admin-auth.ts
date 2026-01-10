import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config, prisma } from '../config/index.js';
import { UnauthorizedError, ForbiddenError } from '../utils/errors.js';

export interface AdminJwtPayload {
    adminId: string;
    email: string;
    type: 'admin_access';
}

export interface AdminRequest extends Request {
    admin?: {
        id: string;
        email: string;
        name: string;
    };
}

export const authenticateAdmin = async (
    req: AdminRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader?.startsWith('Bearer ')) {
            throw new UnauthorizedError('No token provided');
        }

        const token = authHeader.split(' ')[1];

        const payload = jwt.verify(token, config.jwt.secret) as AdminJwtPayload;

        if (payload.type !== 'admin_access') {
            throw new UnauthorizedError('Invalid token type');
        }

        const admin = await prisma.adminUser.findUnique({
            where: { id: payload.adminId },
            select: { id: true, email: true, name: true },
        });

        if (!admin) {
            throw new UnauthorizedError('Admin not found');
        }

        req.admin = {
            id: admin.id,
            email: admin.email,
            name: admin.name,
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

export const requireTotp = async (
    req: AdminRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    if (!req.admin) {
        next(new UnauthorizedError('Not authenticated'));
        return;
    }

    const admin = await prisma.adminUser.findUnique({
        where: { id: req.admin.id },
        select: { totpEnabled: true },
    });

    if (admin?.totpEnabled) {
        // TOTP verification would happen during login flow
        // This middleware ensures TOTP-protected admins have completed verification
        const totpVerified = req.headers['x-totp-verified'] === 'true';
        if (!totpVerified) {
            next(new ForbiddenError('TOTP verification required'));
            return;
        }
    }

    next();
};
