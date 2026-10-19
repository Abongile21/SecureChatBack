import { Router } from 'express';
import { getDashboard, getUserProfile, updateUserProfile, getAllUsers } from '../controllers/userController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Protected routes
router.get('/profile', authenticateToken, getUserProfile);
router.get('/dashboard', authenticateToken, getDashboard);
router.put('/profile', authenticateToken, updateUserProfile);
router.get('/', authenticateToken, getAllUsers); // Admin only

export default router;
