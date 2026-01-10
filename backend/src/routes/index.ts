import { Router } from 'express';
import authRoutes from './auth.routes.js';
import servicesRoutes from './services.routes.js';
import searchConfigsRoutes from './search-configs.routes.js';
import listingsRoutes from './listings.routes.js';
import notificationsRoutes from './notifications.routes.js';
import devicesRoutes from './devices.routes.js';

const router = Router();

// Health check
router.get('/health', (req, res) => {
    res.json({
        success: true,
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
    });
});

// API routes
router.use('/auth', authRoutes);
router.use('/services', servicesRoutes);
router.use('/search-configs', searchConfigsRoutes);
router.use('/listings', listingsRoutes);
router.use('/notifications', notificationsRoutes);
router.use('/devices', devicesRoutes);

export default router;
