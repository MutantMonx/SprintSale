// @ts-nocheck
import { Router, type Response } from 'express';
import { prisma } from '../config/index.js';
import { authenticate, type AuthRequest } from '../middleware/auth.js';
import { requireAdmin } from '../middleware/admin.js';
import { NotFoundError, ValidationError } from '../utils/errors.js';

const router = Router();

// All admin routes require authentication + admin privileges
router.use(authenticate, requireAdmin);

// ============================================================================
// DASHBOARD
// ============================================================================

router.get('/dashboard', async (req: AuthRequest, res: Response, next) => {
    try {
        const [
            totalUsers,
            activeUsers,
            premiumUsers,
            totalSearchConfigs,
            activeSearchConfigs,
            totalListings,
            todayListings,
            totalPayments,
            pendingPayments,
        ] = await Promise.all([
            prisma.user.count({ where: { deletedAt: null } }),
            prisma.user.count({
                where: {
                    deletedAt: null,
                    updatedAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
                }
            }),
            prisma.user.count({ where: { tier: 'PREMIUM', deletedAt: null } }),
            prisma.searchConfig.count(),
            prisma.searchConfig.count({ where: { isActive: true } }),
            prisma.listing.count(),
            prisma.listing.count({
                where: { createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } }
            }),
            prisma.payment.count(),
            prisma.payment.count({ where: { status: 'PENDING' } }),
        ]);

        // Recent activity
        const recentUsers = await prisma.user.findMany({
            take: 5,
            orderBy: { createdAt: 'desc' },
            select: { id: true, email: true, name: true, tier: true, createdAt: true },
        });

        const recentPayments = await prisma.payment.findMany({
            take: 5,
            orderBy: { createdAt: 'desc' },
            include: {
                subscription: {
                    include: { user: { select: { email: true } } }
                }
            }
        });

        res.json({
            success: true,
            data: {
                stats: {
                    users: { total: totalUsers, active: activeUsers, premium: premiumUsers },
                    searchConfigs: { total: totalSearchConfigs, active: activeSearchConfigs },
                    listings: { total: totalListings, today: todayListings },
                    payments: { total: totalPayments, pending: pendingPayments },
                },
                recentUsers,
                recentPayments,
            },
        });
    } catch (error) {
        next(error);
    }
});

// ============================================================================
// USERS MANAGEMENT
// ============================================================================

router.get('/users', async (req: AuthRequest, res: Response, next) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
        const search = req.query.search as string;
        const tier = req.query.tier as string;

        const where: any = { deletedAt: null };

        if (search) {
            where.OR = [
                { email: { contains: search, mode: 'insensitive' } },
                { name: { contains: search, mode: 'insensitive' } },
            ];
        }

        if (tier && ['FREE', 'PREMIUM'].includes(tier)) {
            where.tier = tier;
        }

        const [users, total] = await Promise.all([
            prisma.user.findMany({
                where,
                skip: (page - 1) * limit,
                take: limit,
                orderBy: { createdAt: 'desc' },
                select: {
                    id: true,
                    email: true,
                    name: true,
                    tier: true,
                    isAdmin: true,
                    emailVerified: true,
                    createdAt: true,
                    updatedAt: true,
                    plan: { select: { name: true, displayName: true } },
                    _count: {
                        select: {
                            searchConfigs: true,
                            userServices: true,
                        }
                    }
                },
            }),
            prisma.user.count({ where }),
        ]);

        res.json({
            success: true,
            data: users,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        next(error);
    }
});

router.get('/users/:id', async (req: AuthRequest, res: Response, next) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.params.id },
            include: {
                plan: true,
                subscriptions: {
                    orderBy: { createdAt: 'desc' },
                    take: 5,
                    include: { plan: true, payments: { take: 5, orderBy: { createdAt: 'desc' } } }
                },
                userServices: { include: { service: true } },
                searchConfigs: { take: 10, orderBy: { createdAt: 'desc' } },
                _count: {
                    select: {
                        notifications: true,
                        mobileDevices: true,
                    }
                }
            },
        });

        if (!user) {
            throw new NotFoundError('User not found');
        }

        res.json({ success: true, data: user });
    } catch (error) {
        next(error);
    }
});

// Create a new user from admin panel
router.post('/users', async (req: AuthRequest, res: Response, next) => {
    try {
        const { email, password, name, tier, isAdmin, planId, emailVerified } = req.body;

        if (!email || !password) {
            throw new ValidationError('Email and password are required');
        }

        // Check if user already exists
        const existing = await prisma.user.findUnique({
            where: { email },
        });

        if (existing) {
            throw new ValidationError('User with this email already exists');
        }

        // Hash password
        const bcrypt = await import('bcrypt');
        const passwordHash = await bcrypt.hash(password, 12);

        // If tier is set, find corresponding plan
        let resolvedPlanId = planId;
        if (!planId && tier) {
            const plan = await prisma.subscriptionPlan.findUnique({
                where: { name: tier },
            });
            if (plan) {
                resolvedPlanId = plan.id;
            }
        }

        const user = await prisma.user.create({
            data: {
                email,
                passwordHash,
                name: name || null,
                tier: tier || 'FREE',
                isAdmin: isAdmin || false,
                emailVerified: emailVerified || false,
                planId: resolvedPlanId || null,
            },
            include: { plan: true },
        });

        res.status(201).json({ success: true, data: user });
    } catch (error) {
        next(error);
    }
});

router.put('/users/:id', async (req: AuthRequest, res: Response, next) => {
    try {
        const { name, tier, isAdmin, planId } = req.body;

        const user = await prisma.user.update({
            where: { id: req.params.id },
            data: {
                ...(name !== undefined && { name }),
                ...(tier !== undefined && { tier }),
                ...(isAdmin !== undefined && { isAdmin }),
                ...(planId !== undefined && { planId }),
            },
            include: { plan: true },
        });

        res.json({ success: true, data: user });
    } catch (error) {
        next(error);
    }
});

router.delete('/users/:id', async (req: AuthRequest, res: Response, next) => {
    try {
        // Soft delete
        await prisma.user.update({
            where: { id: req.params.id },
            data: { deletedAt: new Date() },
        });

        res.json({ success: true, message: 'User deleted' });
    } catch (error) {
        next(error);
    }
});

// ============================================================================
// SUBSCRIPTION PLANS
// ============================================================================

router.get('/plans', async (req: AuthRequest, res: Response, next) => {
    try {
        const plans = await prisma.subscriptionPlan.findMany({
            orderBy: { displayOrder: 'asc' },
            include: {
                _count: { select: { users: true, subscriptions: true } }
            }
        });

        res.json({ success: true, data: plans });
    } catch (error) {
        next(error);
    }
});

router.get('/plans/:id', async (req: AuthRequest, res: Response, next) => {
    try {
        const plan = await prisma.subscriptionPlan.findUnique({
            where: { id: req.params.id },
            include: {
                _count: { select: { users: true, subscriptions: true } }
            }
        });

        if (!plan) {
            throw new NotFoundError('Plan not found');
        }

        res.json({ success: true, data: plan });
    } catch (error) {
        next(error);
    }
});

router.put('/plans/:id', async (req: AuthRequest, res: Response, next) => {
    try {
        const {
            displayName,
            description,
            priceMonthly,
            priceQuarterly,
            priceYearly,
            maxServices,
            maxCustomServices,
            maxSearchConfigs,
            dailySearchMinutes,
            maxNotificationsDay,
            canAddCustomService,
            hasBonusService,
            hasEmailReports,
            hasPrioritySupport,
            isActive,
            displayOrder,
        } = req.body;

        const plan = await prisma.subscriptionPlan.update({
            where: { id: req.params.id },
            data: {
                ...(displayName !== undefined && { displayName }),
                ...(description !== undefined && { description }),
                ...(priceMonthly !== undefined && { priceMonthly }),
                ...(priceQuarterly !== undefined && { priceQuarterly }),
                ...(priceYearly !== undefined && { priceYearly }),
                ...(maxServices !== undefined && { maxServices }),
                ...(maxCustomServices !== undefined && { maxCustomServices }),
                ...(maxSearchConfigs !== undefined && { maxSearchConfigs }),
                ...(dailySearchMinutes !== undefined && { dailySearchMinutes }),
                ...(maxNotificationsDay !== undefined && { maxNotificationsDay }),
                ...(canAddCustomService !== undefined && { canAddCustomService }),
                ...(hasBonusService !== undefined && { hasBonusService }),
                ...(hasEmailReports !== undefined && { hasEmailReports }),
                ...(hasPrioritySupport !== undefined && { hasPrioritySupport }),
                ...(isActive !== undefined && { isActive }),
                ...(displayOrder !== undefined && { displayOrder }),
            },
        });

        res.json({ success: true, data: plan });
    } catch (error) {
        next(error);
    }
});

// ============================================================================
// PAYMENTS
// ============================================================================

router.get('/payments', async (req: AuthRequest, res: Response, next) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
        const status = req.query.status as string;

        const where: any = {};
        if (status) {
            where.status = status;
        }

        const [payments, total] = await Promise.all([
            prisma.payment.findMany({
                where,
                skip: (page - 1) * limit,
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: {
                    subscription: {
                        include: {
                            user: { select: { id: true, email: true, name: true } },
                            plan: { select: { name: true, displayName: true } },
                        }
                    }
                }
            }),
            prisma.payment.count({ where }),
        ]);

        res.json({
            success: true,
            data: payments,
            pagination: { page, limit, total, pages: Math.ceil(total / limit) },
        });
    } catch (error) {
        next(error);
    }
});

// ============================================================================
// SERVICES MANAGEMENT
// ============================================================================

router.get('/services', async (req: AuthRequest, res: Response, next) => {
    try {
        const services = await prisma.service.findMany({
            orderBy: { name: 'asc' },
            include: {
                _count: { select: { userServices: true, searchConfigs: true, listings: true } }
            }
        });

        res.json({ success: true, data: services });
    } catch (error) {
        next(error);
    }
});

router.post('/services', async (req: AuthRequest, res: Response, next) => {
    try {
        const { name, baseUrl, logoUrl, defaultConfig, isActive } = req.body;

        if (!name || !baseUrl) {
            throw new ValidationError('Name and baseUrl are required');
        }

        const service = await prisma.service.create({
            data: { name, baseUrl, logoUrl, defaultConfig, isActive: isActive ?? true },
        });

        res.status(201).json({ success: true, data: service });
    } catch (error) {
        next(error);
    }
});

router.put('/services/:id', async (req: AuthRequest, res: Response, next) => {
    try {
        const { name, baseUrl, logoUrl, defaultConfig, isActive } = req.body;

        const service = await prisma.service.update({
            where: { id: req.params.id },
            data: {
                ...(name !== undefined && { name }),
                ...(baseUrl !== undefined && { baseUrl }),
                ...(logoUrl !== undefined && { logoUrl }),
                ...(defaultConfig !== undefined && { defaultConfig }),
                ...(isActive !== undefined && { isActive }),
            },
        });

        res.json({ success: true, data: service });
    } catch (error) {
        next(error);
    }
});

router.delete('/services/:id', async (req: AuthRequest, res: Response, next) => {
    try {
        await prisma.service.update({
            where: { id: req.params.id },
            data: { isActive: false },
        });

        res.json({ success: true, message: 'Service deactivated' });
    } catch (error) {
        next(error);
    }
});

// ============================================================================
// APP SETTINGS
// ============================================================================

router.get('/settings', async (req: AuthRequest, res: Response, next) => {
    try {
        const settings = await prisma.appSettings.findMany({
            orderBy: { key: 'asc' },
        });

        // Convert to key-value object
        const settingsObj = settings.reduce((acc, s) => {
            acc[s.key] = { value: s.value, description: s.description, isPublic: s.isPublic };
            return acc;
        }, {} as Record<string, any>);

        res.json({ success: true, data: settingsObj });
    } catch (error) {
        next(error);
    }
});

router.put('/settings', async (req: AuthRequest, res: Response, next) => {
    try {
        const updates = req.body; // { "key": "value", ... }

        for (const [key, value] of Object.entries(updates)) {
            await prisma.appSettings.upsert({
                where: { key },
                create: { key, value: String(value) },
                update: { value: String(value) },
            });
        }

        res.json({ success: true, message: 'Settings updated' });
    } catch (error) {
        next(error);
    }
});

// ============================================================================
// PAYMENT PROVIDERS
// ============================================================================

router.get('/payment-providers', async (req: AuthRequest, res: Response, next) => {
    try {
        const providers = await prisma.paymentSettings.findMany();

        // Don't expose encrypted secrets
        const safeProviders = providers.map(p => ({
            id: p.id,
            provider: p.provider,
            isEnabled: p.isEnabled,
            isSandbox: p.isSandbox,
            clientId: p.clientId,
            merchantId: p.merchantId,
            posId: p.posId,
            hasClientSecret: !!p.clientSecretEnc,
            hasSecondKey: !!p.secondKeyEnc,
            hasWebhookSecret: !!p.webhookSecretEnc,
            config: p.config,
            updatedAt: p.updatedAt,
        }));

        res.json({ success: true, data: safeProviders });
    } catch (error) {
        next(error);
    }
});

router.put('/payment-providers/:provider', async (req: AuthRequest, res: Response, next) => {
    try {
        const provider = req.params.provider;
        const { isEnabled, isSandbox, clientId, clientSecret, merchantId, posId, secondKey, webhookSecret, config } = req.body;

        // TODO: Encrypt secrets before storing
        // For now, just store the config (secrets should be encrypted in production)

        await prisma.paymentSettings.upsert({
            where: { provider: provider as any },
            create: {
                provider: provider as any,
                isEnabled: isEnabled ?? false,
                isSandbox: isSandbox ?? true,
                clientId,
                merchantId,
                posId,
                config,
                // Note: In production, encrypt these values
                // clientSecretEnc: encrypt(clientSecret),
            },
            update: {
                ...(isEnabled !== undefined && { isEnabled }),
                ...(isSandbox !== undefined && { isSandbox }),
                ...(clientId !== undefined && { clientId }),
                ...(merchantId !== undefined && { merchantId }),
                ...(posId !== undefined && { posId }),
                ...(config !== undefined && { config }),
            },
        });

        res.json({ success: true, message: 'Payment provider updated' });
    } catch (error) {
        next(error);
    }
});

// ============================================================================
// LEGAL PAGES
// ============================================================================

router.get('/legal', async (req: AuthRequest, res: Response, next) => {
    try {
        const pages = await prisma.legalPage.findMany({
            orderBy: { slug: 'asc' },
        });

        res.json({ success: true, data: pages });
    } catch (error) {
        next(error);
    }
});

router.get('/legal/:slug', async (req: AuthRequest, res: Response, next) => {
    try {
        const page = await prisma.legalPage.findUnique({
            where: { slug: req.params.slug },
        });

        if (!page) {
            throw new NotFoundError('Legal page not found');
        }

        res.json({ success: true, data: page });
    } catch (error) {
        next(error);
    }
});

router.put('/legal/:slug', async (req: AuthRequest, res: Response, next) => {
    try {
        const { title, content, isPublished } = req.body;

        const page = await prisma.legalPage.upsert({
            where: { slug: req.params.slug },
            create: {
                slug: req.params.slug,
                title: title || req.params.slug,
                content: content || '',
                isPublished: isPublished ?? true,
            },
            update: {
                ...(title !== undefined && { title }),
                ...(content !== undefined && { content }),
                ...(isPublished !== undefined && { isPublished }),
            },
        });

        res.json({ success: true, data: page });
    } catch (error) {
        next(error);
    }
});

export default router;
