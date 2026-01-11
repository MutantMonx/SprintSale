// @ts-nocheck
import { Router, type Response } from 'express';
import { prisma } from '../config/index.js';
import { NotFoundError } from '../utils/errors.js';

const router = Router();

// ============================================================================
// PUBLIC - Legal pages
// ============================================================================

// Get all published legal pages (metadata only)
router.get('/', async (req, res: Response, next) => {
    try {
        const pages = await prisma.legalPage.findMany({
            where: { isPublished: true },
            select: {
                slug: true,
                title: true,
                updatedAt: true,
            },
            orderBy: { slug: 'asc' },
        });

        res.json({ success: true, data: pages });
    } catch (error) {
        next(error);
    }
});

// Get specific legal page by slug
router.get('/:slug', async (req, res: Response, next) => {
    try {
        const page = await prisma.legalPage.findUnique({
            where: { slug: req.params.slug },
        });

        if (!page || !page.isPublished) {
            throw new NotFoundError('Page not found');
        }

        res.json({
            success: true,
            data: {
                slug: page.slug,
                title: page.title,
                content: page.content,
                updatedAt: page.updatedAt,
            },
        });
    } catch (error) {
        next(error);
    }
});

export default router;
