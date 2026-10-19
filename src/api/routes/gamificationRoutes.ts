import { Router } from 'express';
import { 
  getLeaderboard, 
  getUserAchievements, 
  awardPoints,
  getBadges 
} from '../controllers/gamificationController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Protected routes
router.get('/leaderboard', authenticateToken, getLeaderboard);
router.get('/achievements/:userId', authenticateToken, getUserAchievements);
router.post('/points', authenticateToken, awardPoints);
router.get('/badges', authenticateToken, getBadges);

export default router;
