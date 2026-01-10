import { Router, type Response } from 'express';
import { prisma } from '../config/index.js';
import { authenticate, type AuthRequest } from '../middleware/auth.js';
import { validateParams, validateQuery } from '../middleware/validate.js';
import { listListingsQuerySchema, uuidParamSchema } from '../schemas/index.js';
import { NotFoundError, ForbiddenError } from '../utils/errors.js';

const router = Router();

// List detected listings
router.get(
    '/',
    authenticate,
    validateQuery(listListingsQuerySchema),
    async (req: AuthRequest, res: Response, next) => {
        try {
            const { page, limit, serviceId, searchConfigId, minPrice, maxPrice } =
                req.query as {
                    page: number;
                    limit: number;
                    serviceId?: string;
                    searchConfigId?: string;
                    minPrice?: number;
                    maxPrice?: number;
                };
            const skip = (page - 1) * limit;

            // Build where clause
            const where: Record<string, unknown> = {
                searchConfig: {
                    userId: req.user!.id,
                },
            };

            if (serviceId) where.serviceId = serviceId;
            if (searchConfigId) where.searchConfigId = searchConfigId;
            if (minPrice || maxPrice) {
                where.price = {
                    ...(minPrice && { gte: minPrice }),
                    ...(maxPrice && { lte: maxPrice }),
                };
            }

            const [listings, total] = await Promise.all([
                prisma.listing.findMany({
                    where,
                    include: {
                        service: {
                            select: {
                                id: true,
                                name: true,
                                logoUrl: true,
                            },
                        },
                    },
                    orderBy: { detectedAt: 'desc' },
                    skip,
                    take: limit,
                }),
                prisma.listing.count({ where }),
            ]);

            res.json({
                success: true,
                data: listings,
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

// Get a single listing
router.get(
    '/:id',
    authenticate,
    validateParams(uuidParamSchema),
    async (req: AuthRequest, res: Response, next) => {
        try {
            const listing = await prisma.listing.findUnique({
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
                    searchConfig: {
                        select: {
                            id: true,
                            name: true,
                            userId: true,
                        },
                    },
                },
            });

            if (!listing) {
                throw new NotFoundError('Listing not found');
            }

            if (listing.searchConfig.userId !== req.user!.id) {
                throw new ForbiddenError('Access denied');
            }

            res.json({
                success: true,
                data: listing,
            });
        } catch (error) {
            next(error);
        }
    }
);

// Mark listing as spam/ad
router.post(
    '/:id/mark-spam',
    authenticate,
    validateParams(uuidParamSchema),
    async (req: AuthRequest, res: Response, next) => {
        try {
            const listing = await prisma.listing.findUnique({
                where: { id: req.params.id },
                include: {
                    searchConfig: {
                        select: { userId: true },
                    },
                },
            });

            if (!listing) {
                throw new NotFoundError('Listing not found');
            }

            if (listing.searchConfig.userId !== req.user!.id) {
                throw new ForbiddenError('Access denied');
            }

            await prisma.listing.update({
                where: { id: req.params.id },
                data: { isAd: true },
            });

            res.json({
                success: true,
                message: 'Listing marked as ad/spam',
            });
        } catch (error) {
            next(error);
        }
    }
);

// Mark listing as successful contact
router.post(
    '/:id/mark-success',
    authenticate,
    validateParams(uuidParamSchema),
    async (req: AuthRequest, res: Response, next) => {
        try {
            const listing = await prisma.listing.findUnique({
                where: { id: req.params.id },
                include: {
                    searchConfig: {
                        select: { userId: true },
                    },
                },
            });

            if (!listing) {
                throw new NotFoundError('Listing not found');
            }

            if (listing.searchConfig.userId !== req.user!.id) {
                throw new ForbiddenError('Access denied');
            }

            // Log success for analytics (TODO: add to audit log)
            // For now, just return success

            res.json({
                success: true,
                message: 'Listing marked as successful',
            });
        } catch (error) {
            next(error);
        }
    }
);

export default router;
