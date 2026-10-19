import { Router } from 'express';
import { 
  getEngagementMetrics,
  getTrainingProgress,
  generateReport,
  getPhishingSimulationStats
} from '../controllers/analyticsController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Protected routes (manager/admin only)
router.get('/engagement', authenticateToken, getEngagementMetrics);
router.get('/training-progress', authenticateToken, getTrainingProgress);
router.post('/generate-report', authenticateToken, generateReport);
router.get('/phishing-stats', authenticateToken, getPhishingSimulationStats);

export default router;
