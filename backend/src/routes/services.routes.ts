// @ts-nocheck
import { Router, type Response } from 'express';
import { prisma } from '../config/index.js';
import { authenticate, type AuthRequest } from '../middleware/auth.js';
import { validateBody, validateParams } from '../middleware/validate.js';
import { storeCredentialsSchema, uuidParamSchema } from '../schemas/index.js';
import { encryptionService } from '../services/encryption.service.js';
import { NotFoundError, ConflictError } from '../utils/errors.js';

const router = Router();

// List all available services
router.get('/', async (req, res: Response, next) => {
    try {
        const services = await prisma.service.findMany({
            where: { isActive: true },
            select: {
                id: true,
                name: true,
                baseUrl: true,
                logoUrl: true,
                defaultConfig: true,
            },
            orderBy: { name: 'asc' },
        });

        res.json({
            success: true,
            data: services,
        });
    } catch (error) {
        next(error);
    }
});

// Get service details
router.get(
    '/:id',
    validateParams(uuidParamSchema),
    async (req, res: Response, next) => {
        try {
            const service = await prisma.service.findUnique({
                where: { id: req.params.id, isActive: true },
                include: {
                    workflows: {
                        where: { isActive: true },
                        select: {
                            id: true,
                            name: true,
                            description: true,
                            version: true,
                        },
                    },
                },
            });

            if (!service) {
                throw new NotFoundError('Service not found');
            }

            res.json({
                success: true,
                data: service,
            });
        } catch (error) {
            next(error);
        }
    }
);

// Subscribe to a service
router.post(
    '/:id/subscribe',
    authenticate,
    validateParams(uuidParamSchema),
    async (req: AuthRequest, res: Response, next) => {
        try {
            const service = await prisma.service.findUnique({
                where: { id: req.params.id, isActive: true },
            });

            if (!service) {
                throw new NotFoundError('Service not found');
            }

            // Check if already subscribed
            const existing = await prisma.userService.findUnique({
                where: {
                    userId_serviceId: {
                        userId: req.user!.id,
                        serviceId: req.params.id,
                    },
                },
            });

            if (existing) {
                if (existing.isActive) {
                    throw new ConflictError('Already subscribed to this service');
                }

                // Reactivate subscription
                const updated = await prisma.userService.update({
                    where: { id: existing.id },
                    data: { isActive: true },
                });

                res.json({
                    success: true,
                    data: updated,
                });
                return;
            }

            const userService = await prisma.userService.create({
                data: {
                    userId: req.user!.id,
                    serviceId: req.params.id,
                },
            });

            res.status(201).json({
                success: true,
                data: userService,
            });
        } catch (error) {
            next(error);
        }
    }
);

// Unsubscribe from a service
router.delete(
    '/:id/subscribe',
    authenticate,
    validateParams(uuidParamSchema),
    async (req: AuthRequest, res: Response, next) => {
        try {
            const userService = await prisma.userService.findUnique({
                where: {
                    userId_serviceId: {
                        userId: req.user!.id,
                        serviceId: req.params.id,
                    },
                },
            });

            if (!userService || !userService.isActive) {
                throw new NotFoundError('Subscription not found');
            }

            await prisma.userService.update({
                where: { id: userService.id },
                data: { isActive: false },
            });

            res.json({
                success: true,
                message: 'Unsubscribed successfully',
            });
        } catch (error) {
            next(error);
        }
    }
);

// Store encrypted credentials for a service
router.post(
    '/:id/credentials',
    authenticate,
    validateParams(uuidParamSchema),
    validateBody(storeCredentialsSchema),
    async (req: AuthRequest, res: Response, next) => {
        try {
            const userService = await prisma.userService.findUnique({
                where: {
                    userId_serviceId: {
                        userId: req.user!.id,
                        serviceId: req.params.id,
                    },
                    isActive: true,
                },
            });

            if (!userService) {
                throw new NotFoundError('Subscription not found. Subscribe first.');
            }

            // Encrypt credentials
            const encryptedUsername = encryptionService.encrypt(req.body.username);
            const encryptedPassword = encryptionService.encrypt(req.body.password);

            // Upsert credentials
            await prisma.serviceCredentials.upsert({
                where: { userServiceId: userService.id },
                create: {
                    userServiceId: userService.id,
                    encryptedUsername: Buffer.concat([encryptedUsername.encrypted, encryptedUsername.authTag]),
                    encryptedPassword: Buffer.concat([encryptedPassword.encrypted, encryptedPassword.authTag]),
                    iv: encryptedUsername.iv, // Same IV for both (simplified)
                },
                update: {
                    encryptedUsername: Buffer.concat([encryptedUsername.encrypted, encryptedUsername.authTag]),
                    encryptedPassword: Buffer.concat([encryptedPassword.encrypted, encryptedPassword.authTag]),
                    iv: encryptedUsername.iv,
                },
            });

            res.json({
                success: true,
                message: 'Credentials stored securely',
            });
        } catch (error) {
            next(error);
        }
    }
);

// Get user's subscribed services
router.get(
    '/subscribed',
    authenticate,
    async (req: AuthRequest, res: Response, next) => {
        try {
            const subscriptions = await prisma.userService.findMany({
                where: {
                    userId: req.user!.id,
                    isActive: true,
                },
                include: {
                    service: {
                        select: {
                            id: true,
                            name: true,
                            baseUrl: true,
                            logoUrl: true,
                        },
                    },
                    credentials: {
                        select: {
                            id: true,
                            createdAt: true,
                            updatedAt: true,
                        },
                    },
                },
            });

            res.json({
                success: true,
                data: subscriptions.map(sub => ({
                    ...sub.service,
                    hasCredentials: !!sub.credentials,
                    subscribedAt: sub.createdAt,
                })),
            });
        } catch (error) {
            next(error);
        }
    }
);

export default router;
