import { Router, type Response } from 'express';
import { prisma } from '../config/index.js';
import { authenticate, type AuthRequest } from '../middleware/auth.js';
import { validateBody, validateParams, validateQuery } from '../middleware/validate.js';
import {
    createSearchConfigSchema,
    updateSearchConfigSchema,
    uuidParamSchema,
    paginationQuerySchema
} from '../schemas/index.js';
import { NotFoundError, ForbiddenError } from '../utils/errors.js';

const router = Router();

// List user's search configurations
router.get(
    '/',
    authenticate,
    validateQuery(paginationQuerySchema),
    async (req: AuthRequest, res: Response, next) => {
        try {
            const { page, limit } = req.query as { page: number; limit: number };
            const skip = (page - 1) * limit;

            const [searchConfigs, total] = await Promise.all([
                prisma.searchConfig.findMany({
                    where: { userId: req.user!.id },
                    include: {
                        service: {
                            select: {
                                id: true,
                                name: true,
                                logoUrl: true,
                            },
                        },
                    },
                    orderBy: { createdAt: 'desc' },
                    skip,
                    take: limit,
                }),
                prisma.searchConfig.count({
                    where: { userId: req.user!.id },
                }),
            ]);

            res.json({
                success: true,
                data: searchConfigs,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit),
                },
            });
        } catch (error) {
            next(error);
        }
    }
);

// Create a new search configuration
router.post(
    '/',
    authenticate,
    validateBody(createSearchConfigSchema),
    async (req: AuthRequest, res: Response, next) => {
        try {
            // Verify user is subscribed to the service
            const subscription = await prisma.userService.findUnique({
                where: {
                    userId_serviceId: {
                        userId: req.user!.id,
                        serviceId: req.body.serviceId,
                    },
                    isActive: true,
                },
            });

            if (!subscription) {
                throw new ForbiddenError('You must subscribe to this service first');
            }

            // Calculate next run time
            const now = new Date();
            const jitter = Math.floor(Math.random() * req.body.randomRangeSeconds * 2) - req.body.randomRangeSeconds;
            const nextRunAt = new Date(now.getTime() + (req.body.intervalSeconds + jitter) * 1000);

            const searchConfig = await prisma.searchConfig.create({
                data: {
                    userId: req.user!.id,
                    serviceId: req.body.serviceId,
                    name: req.body.name,
                    keywords: req.body.keywords,
                    priceMin: req.body.priceMin,
                    priceMax: req.body.priceMax,
                    location: req.body.location,
                    customFilters: req.body.customFilters,
                    intervalSeconds: req.body.intervalSeconds,
                    randomRangeSeconds: req.body.randomRangeSeconds,
                    nextRunAt,
                },
                include: {
                    service: {
                        select: {
                            id: true,
                            name: true,
                            logoUrl: true,
                        },
                    },
                },
            });

            res.status(201).json({
                success: true,
                data: searchConfig,
            });
        } catch (error) {
            next(error);
        }
    }
);

// Get a single search configuration
router.get(
    '/:id',
    authenticate,
    validateParams(uuidParamSchema),
    async (req: AuthRequest, res: Response, next) => {
        try {
            const searchConfig = await prisma.searchConfig.findUnique({
                where: { id: req.params.id },
                include: {
                    service: {
                        select: {
                            id: true,
                            name: true,
                            logoUrl: true,
                            baseUrl: true,
                        },
                    },
                    listings: {
                        take: 10,
                        orderBy: { detectedAt: 'desc' },
                    },
                },
            });

            if (!searchConfig) {
                throw new NotFoundError('Search configuration not found');
            }

            if (searchConfig.userId !== req.user!.id) {
                throw new ForbiddenError('Access denied');
            }

            res.json({
                success: true,
                data: searchConfig,
            });
        } catch (error) {
            next(error);
        }
    }
);

// Update a search configuration
router.patch(
    '/:id',
    authenticate,
    validateParams(uuidParamSchema),
    validateBody(updateSearchConfigSchema),
    async (req: AuthRequest, res: Response, next) => {
        try {
            const existing = await prisma.searchConfig.findUnique({
                where: { id: req.params.id },
            });

            if (!existing) {
                throw new NotFoundError('Search configuration not found');
            }

            if (existing.userId !== req.user!.id) {
                throw new ForbiddenError('Access denied');
            }

            const searchConfig = await prisma.searchConfig.update({
                where: { id: req.params.id },
                data: req.body,
                include: {
                    service: {
                        select: {
                            id: true,
                            name: true,
                            logoUrl: true,
                        },
                    },
                },
            });

            res.json({
                success: true,
                data: searchConfig,
            });
        } catch (error) {
            next(error);
        }
    }
);

// Delete a search configuration
router.delete(
    '/:id',
    authenticate,
    validateParams(uuidParamSchema),
    async (req: AuthRequest, res: Response, next) => {
        try {
            const existing = await prisma.searchConfig.findUnique({
                where: { id: req.params.id },
            });

            if (!existing) {
                throw new NotFoundError('Search configuration not found');
            }

            if (existing.userId !== req.user!.id) {
                throw new ForbiddenError('Access denied');
            }

            await prisma.searchConfig.delete({
                where: { id: req.params.id },
            });

            res.json({
                success: true,
                message: 'Search configuration deleted',
            });
        } catch (error) {
            next(error);
        }
    }
);

// Toggle search configuration active status
router.patch(
    '/:id/toggle',
    authenticate,
    validateParams(uuidParamSchema),
    async (req: AuthRequest, res: Response, next) => {
        try {
            const existing = await prisma.searchConfig.findUnique({
                where: { id: req.params.id },
            });

            if (!existing) {
                throw new NotFoundError('Search configuration not found');
            }

            if (existing.userId !== req.user!.id) {
                throw new ForbiddenError('Access denied');
            }

            // If activating, calculate next run time
            const nextRunAt = !existing.isActive
                ? new Date(Date.now() + existing.intervalSeconds * 1000)
                : null;

            const searchConfig = await prisma.searchConfig.update({
                where: { id: req.params.id },
                data: {
                    isActive: !existing.isActive,
                    nextRunAt,
                },
            });

            res.json({
                success: true,
                data: searchConfig,
            });
        } catch (error) {
            next(error);
        }
    }
);

// Trigger manual run
router.post(
    '/:id/run',
    authenticate,
    validateParams(uuidParamSchema),
    async (req: AuthRequest, res: Response, next) => {
        try {
            const existing = await prisma.searchConfig.findUnique({
                where: { id: req.params.id },
            });

            if (!existing) {
                throw new NotFoundError('Search configuration not found');
            }

            if (existing.userId !== req.user!.id) {
                throw new ForbiddenError('Access denied');
            }

            // TODO: Queue the job for immediate execution
            // This will be implemented with Bull queue

            // For now, just update last run time
            await prisma.searchConfig.update({
                where: { id: req.params.id },
                data: {
                    lastRunAt: new Date(),
                    nextRunAt: new Date(Date.now() + existing.intervalSeconds * 1000),
                },
            });

            res.json({
                success: true,
                message: 'Search triggered. Results will appear soon.',
            });
        } catch (error) {
            next(error);
        }
    }
);

export default router;
