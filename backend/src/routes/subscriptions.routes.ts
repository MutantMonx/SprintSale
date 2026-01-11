// @ts-nocheck
import { Router, type Response } from 'express';
import { prisma } from '../config/index.js';
import { authenticate, type AuthRequest } from '../middleware/auth.js';
import { NotFoundError, ForbiddenError, ValidationError } from '../utils/errors.js';

const router = Router();

// ============================================================================
// PUBLIC - Available plans
// ============================================================================

router.get('/plans', async (req, res: Response, next) => {
    try {
        const plans = await prisma.subscriptionPlan.findMany({
            where: { isActive: true },
            orderBy: { displayOrder: 'asc' },
            select: {
                id: true,
                name: true,
                displayName: true,
                description: true,
                priceMonthly: true,
                priceQuarterly: true,
                priceYearly: true,
                currency: true,
                maxServices: true,
                maxCustomServices: true,
                maxSearchConfigs: true,
                dailySearchMinutes: true,
                maxNotificationsDay: true,
                canAddCustomService: true,
                hasBonusService: true,
                hasEmailReports: true,
                hasPrioritySupport: true,
            },
        });

        res.json({ success: true, data: plans });
    } catch (error) {
        next(error);
    }
});

// ============================================================================
// AUTHENTICATED - User subscription
// ============================================================================

// Get current user's subscription status
router.get('/current', authenticate, async (req: AuthRequest, res: Response, next) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user!.id },
            include: {
                plan: true,
                subscriptions: {
                    where: { status: { in: ['ACTIVE', 'PAST_DUE'] } },
                    orderBy: { createdAt: 'desc' },
                    take: 1,
                    include: { plan: true },
                },
            },
        });

        if (!user) {
            throw new NotFoundError('User not found');
        }

        // Get today's usage
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const dailyUsage = await prisma.dailyUsage.findUnique({
            where: {
                userId_date: {
                    userId: req.user!.id,
                    date: today,
                },
            },
        });

        const activeSubscription = user.subscriptions[0] || null;
        const currentPlan = activeSubscription?.plan || user.plan;

        res.json({
            success: true,
            data: {
                plan: currentPlan,
                subscription: activeSubscription,
                usage: {
                    searchMinutesUsed: dailyUsage?.searchMinutesUsed || 0,
                    searchMinutesLimit: currentPlan?.dailySearchMinutes || 120,
                    searchMinutesRemaining: Math.max(0, (currentPlan?.dailySearchMinutes || 120) - (dailyUsage?.searchMinutesUsed || 0)),
                    notificationsSent: dailyUsage?.notificationsSent || 0,
                    notificationsLimit: currentPlan?.maxNotificationsDay || 2,
                    notificationsRemaining: Math.max(0, (currentPlan?.maxNotificationsDay || 2) - (dailyUsage?.notificationsSent || 0)),
                    isUnlimited: currentPlan?.dailySearchMinutes === 0,
                },
                limits: {
                    maxServices: currentPlan?.maxServices || 1,
                    maxCustomServices: currentPlan?.maxCustomServices || 0,
                    maxSearchConfigs: currentPlan?.maxSearchConfigs || 1,
                    canAddCustomService: currentPlan?.canAddCustomService || false,
                    hasBonusService: currentPlan?.hasBonusService || false,
                },
            },
        });
    } catch (error) {
        next(error);
    }
});

// Check if user can perform action (based on limits)
router.get('/can-perform/:action', authenticate, async (req: AuthRequest, res: Response, next) => {
    try {
        const action = req.params.action;
        const user = await prisma.user.findUnique({
            where: { id: req.user!.id },
            include: {
                plan: true,
                _count: {
                    select: {
                        userServices: { where: { isActive: true } },
                        searchConfigs: { where: { isActive: true } },
                    },
                },
            },
        });

        if (!user || !user.plan) {
            res.json({ success: true, data: { canPerform: false, reason: 'No plan assigned' } });
            return;
        }

        let canPerform = true;
        let reason = '';

        switch (action) {
            case 'add-service':
                if (user.plan.maxServices > 0 && user._count.userServices >= user.plan.maxServices) {
                    canPerform = false;
                    reason = `Osiągnięto limit ${user.plan.maxServices} serwisów w planie ${user.plan.displayName}`;
                }
                break;

            case 'add-search':
                if (user.plan.maxSearchConfigs > 0 && user._count.searchConfigs >= user.plan.maxSearchConfigs) {
                    canPerform = false;
                    reason = `Osiągnięto limit ${user.plan.maxSearchConfigs} wyszukiwań w planie ${user.plan.displayName}`;
                }
                break;

            case 'add-custom-service':
                if (!user.plan.canAddCustomService) {
                    canPerform = false;
                    reason = 'Dodawanie własnych serwisów dostępne tylko w planie Premium';
                }
                break;

            default:
                break;
        }

        res.json({
            success: true,
            data: {
                canPerform,
                reason,
                upgradeRequired: !canPerform,
                currentPlan: user.plan.displayName,
            },
        });
    } catch (error) {
        next(error);
    }
});

// Create upgrade checkout session (placeholder for payment integration)
router.post('/upgrade', authenticate, async (req: AuthRequest, res: Response, next) => {
    try {
        const { planId, billingPeriod } = req.body;

        if (!planId) {
            throw new ValidationError('Plan ID is required');
        }

        const plan = await prisma.subscriptionPlan.findUnique({
            where: { id: planId },
        });

        if (!plan || !plan.isActive) {
            throw new NotFoundError('Plan not found');
        }

        if (plan.name === 'FREE') {
            throw new ValidationError('Cannot upgrade to free plan');
        }

        // Calculate price based on billing period
        let price: number;
        switch (billingPeriod) {
            case 'YEARLY':
                price = Number(plan.priceYearly);
                break;
            case 'QUARTERLY':
                price = Number(plan.priceQuarterly);
                break;
            default:
                price = Number(plan.priceMonthly);
        }

        // TODO: Integrate with payment provider (PayU, PayPal, etc.)
        // For now, return a placeholder response

        res.json({
            success: true,
            data: {
                message: 'Payment integration not yet configured',
                plan: {
                    id: plan.id,
                    name: plan.displayName,
                    price,
                    currency: plan.currency,
                    billingPeriod: billingPeriod || 'MONTHLY',
                },
                // When payment is integrated, this will contain:
                // checkoutUrl: 'https://payment-provider.com/checkout/...',
                // sessionId: '...',
            },
        });
    } catch (error) {
        next(error);
    }
});

// Cancel subscription
router.post('/cancel', authenticate, async (req: AuthRequest, res: Response, next) => {
    try {
        const { reason } = req.body;

        const subscription = await prisma.subscription.findFirst({
            where: {
                userId: req.user!.id,
                status: 'ACTIVE',
            },
        });

        if (!subscription) {
            throw new NotFoundError('No active subscription found');
        }

        await prisma.subscription.update({
            where: { id: subscription.id },
            data: {
                autoRenew: false,
                cancelledAt: new Date(),
                cancellationReason: reason,
            },
        });

        res.json({
            success: true,
            message: 'Subscription will not renew after current period',
            data: {
                currentPeriodEnd: subscription.currentPeriodEnd,
            },
        });
    } catch (error) {
        next(error);
    }
});

export default router;
