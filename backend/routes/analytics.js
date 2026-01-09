import express from 'express';
import { getPopulationStats } from '../controllers/analyticsController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.get('/stats', authenticateToken, getPopulationStats);

export default router;
