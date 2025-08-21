import express from 'express';
import { getDashboardAnalytics } from '../controllers/analytics.controller.js';
import protect from '../middleware/auth.js';

const router = express.Router();

// Protected routes (require authentication)
router.get('/dashboard', protect, getDashboardAnalytics);

export default router;
