import { Router, type Response } from 'express';
import { prisma } from '../config/index.js';
import { authenticate, type AuthRequest } from '../middleware/auth.js';
import { validateBody, validateParams } from '../middleware/validate.js';
import { registerDeviceSchema, uuidParamSchema } from '../schemas/index.js';
import { NotFoundError, ForbiddenError, ConflictError } from '../utils/errors.js';

const router = Router();

// Register a device for push notifications
router.post(
    '/',
    authenticate,
    validateBody(registerDeviceSchema),
    async (req: AuthRequest, res: Response, next) => {
        try {
            // Check if device already registered
            const existing = await prisma.mobileDevice.findUnique({
                where: { deviceToken: req.body.deviceToken },
            });

            if (existing) {
                // Update to current user if different
                if (existing.userId !== req.user!.id) {
                    await prisma.mobileDevice.update({
                        where: { id: existing.id },
                        data: {
                            userId: req.user!.id,
                            isActive: true,
                            deviceName: req.body.deviceName,
                        },
                    });
                } else if (!existing.isActive) {
                    await prisma.mobileDevice.update({
                        where: { id: existing.id },
                        data: { isActive: true },
                    });
                }

                res.json({
                    success: true,
                    data: { id: existing.id },
                    message: 'Device updated',
                });
                return;
            }

            const device = await prisma.mobileDevice.create({
                data: {
                    userId: req.user!.id,
                    deviceToken: req.body.deviceToken,
                    platform: req.body.platform,
                    deviceName: req.body.deviceName,
                },
            });

            res.status(201).json({
                success: true,
                data: { id: device.id },
                message: 'Device registered',
            });
        } catch (error) {
            next(error);
        }
    }
);

// List user's devices
router.get(
    '/',
    authenticate,
    async (req: AuthRequest, res: Response, next) => {
        try {
            const devices = await prisma.mobileDevice.findMany({
                where: {
                    userId: req.user!.id,
                    isActive: true,
                },
                select: {
                    id: true,
                    platform: true,
                    deviceName: true,
                    createdAt: true,
                    updatedAt: true,
                },
                orderBy: { createdAt: 'desc' },
            });

            res.json({
                success: true,
                data: devices,
            });
        } catch (error) {
            next(error);
        }
    }
);

// Unregister a device
router.delete(
    '/:id',
    authenticate,
    validateParams(uuidParamSchema),
    async (req: AuthRequest, res: Response, next) => {
        try {
            const device = await prisma.mobileDevice.findUnique({
                where: { id: req.params.id },
            });

            if (!device) {
                throw new NotFoundError('Device not found');
            }

            if (device.userId !== req.user!.id) {
                throw new ForbiddenError('Access denied');
            }

            await prisma.mobileDevice.update({
                where: { id: req.params.id },
                data: { isActive: false },
            });

            res.json({
                success: true,
                message: 'Device unregistered',
            });
        } catch (error) {
            next(error);
        }
    }
);

export default router;
