import { Router, type Response } from 'express';
import { authService } from '../services/auth.service.js';
import { validateBody } from '../middleware/validate.js';
import { authenticate, type AuthRequest } from '../middleware/auth.js';
import { authRateLimiter } from '../middleware/rate-limit.js';
import { registerSchema, loginSchema, refreshTokenSchema, updateUserSchema } from '../schemas/index.js';

const router = Router();

// Register
router.post(
    '/register',
    authRateLimiter,
    validateBody(registerSchema),
    async (req, res: Response, next) => {
        try {
            const result = await authService.register(req.body);
            res.status(201).json({
                success: true,
                data: result,
            });
        } catch (error) {
            next(error);
        }
    }
);

// Login
router.post(
    '/login',
    authRateLimiter,
    validateBody(loginSchema),
    async (req, res: Response, next) => {
        try {
            const result = await authService.login(req.body);
            res.json({
                success: true,
                data: result,
            });
        } catch (error) {
            next(error);
        }
    }
);

// Refresh token
router.post(
    '/refresh',
    validateBody(refreshTokenSchema),
    async (req, res: Response, next) => {
        try {
            const tokens = await authService.refreshToken(req.body.refreshToken);
            res.json({
                success: true,
                data: tokens,
            });
        } catch (error) {
            next(error);
        }
    }
);

// Logout
router.post(
    '/logout',
    validateBody(refreshTokenSchema),
    async (req, res: Response, next) => {
        try {
            await authService.logout(req.body.refreshToken);
            res.json({
                success: true,
                message: 'Logged out successfully',
            });
        } catch (error) {
            next(error);
        }
    }
);

// Get current user
router.get(
    '/me',
    authenticate,
    async (req: AuthRequest, res: Response, next) => {
        try {
            const user = await authService.getUser(req.user!.id);
            res.json({
                success: true,
                data: user,
            });
        } catch (error) {
            next(error);
        }
    }
);

// Update current user
router.patch(
    '/me',
    authenticate,
    validateBody(updateUserSchema),
    async (req: AuthRequest, res: Response, next) => {
        try {
            const user = await authService.updateUser(req.user!.id, req.body);
            res.json({
                success: true,
                data: user,
            });
        } catch (error) {
            next(error);
        }
    }
);

// Delete account (soft delete)
router.delete(
    '/me',
    authenticate,
    async (req: AuthRequest, res: Response, next) => {
        try {
            await authService.deleteUser(req.user!.id);
            res.json({
                success: true,
                message: 'Account deleted successfully',
            });
        } catch (error) {
            next(error);
        }
    }
);

export default router;
