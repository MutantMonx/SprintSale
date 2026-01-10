// @ts-nocheck
import { Router, type Response } from 'express';
import { prisma } from '../config/index.js';
import { authenticate, type AuthRequest } from '../middleware/auth.js';
import { validateParams, validateQuery } from '../middleware/validate.js';
import { listNotificationsQuerySchema, uuidParamSchema } from '../schemas/index.js';
import { NotFoundError, ForbiddenError } from '../utils/errors.js';

const router = Router();

// List notifications
router.get(
    '/',
    authenticate,
    validateQuery(listNotificationsQuerySchema),
    async (req: AuthRequest, res: Response, next) => {
        try {
            const { page, limit, status, unreadOnly } =
                req.query as {
                    page: number;
                    limit: number;
                    status?: string;
                    unreadOnly?: boolean;
                };
            const skip = (page - 1) * limit;

            const where: Record<string, unknown> = {
                userId: req.user!.id,
            };

            if (status) where.status = status;
            if (unreadOnly) where.readAt = null;

            const [notifications, total] = await Promise.all([
                prisma.notification.findMany({
                    where,
                    include: {
                        listing: {
                            select: {
                                id: true,
                                title: true,
                                price: true,
                                currency: true,
                                listingUrl: true,
                                phone: true,
                                images: true,
                            },
                        },
                    },
                    orderBy: { createdAt: 'desc' },
                    skip,
                    take: limit,
                }),
                prisma.notification.count({ where }),
            ]);

            res.json({
                success: true,
                data: notifications,
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

// Get unread count
router.get(
    '/unread-count',
    authenticate,
    async (req: AuthRequest, res: Response, next) => {
        try {
            const count = await prisma.notification.count({
                where: {
                    userId: req.user!.id,
                    readAt: null,
                },
            });

            res.json({
                success: true,
                data: { count },
            });
        } catch (error) {
            next(error);
        }
    }
);

// Mark notification as read
router.patch(
    '/:id/read',
    authenticate,
    validateParams(uuidParamSchema),
    async (req: AuthRequest, res: Response, next) => {
        try {
            const notification = await prisma.notification.findUnique({
                where: { id: req.params.id },
            });

            if (!notification) {
                throw new NotFoundError('Notification not found');
            }

            if (notification.userId !== req.user!.id) {
                throw new ForbiddenError('Access denied');
            }

            await prisma.notification.update({
                where: { id: req.params.id },
                data: {
                    readAt: new Date(),
                    status: 'READ',
                },
            });

            res.json({
                success: true,
                message: 'Notification marked as read',
            });
        } catch (error) {
            next(error);
        }
    }
);

// Mark all notifications as read
router.patch(
    '/read-all',
    authenticate,
    async (req: AuthRequest, res: Response, next) => {
        try {
            await prisma.notification.updateMany({
                where: {
                    userId: req.user!.id,
                    readAt: null,
                },
                data: {
                    readAt: new Date(),
                    status: 'READ',
                },
            });

            res.json({
                success: true,
                message: 'All notifications marked as read',
            });
        } catch (error) {
            next(error);
        }
    }
);

export default router;
