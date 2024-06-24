import express from 'express';
import walletRoutes from './walletRoutes';
import settingRoutes from './settingRoutes';

const router = express.Router();

// Import and use wallet routes
router.use('/wallet', walletRoutes);

// Import and use setting routes
router.use('/settings', settingRoutes);

export default router;
