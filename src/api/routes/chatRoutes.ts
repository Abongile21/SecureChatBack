import { Router } from 'express';
import { sendMessage, getChatHistory, startNewChat } from '../controllers/chatController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Protected routes
router.post('/message', authenticateToken, sendMessage);
router.get('/history/:chatId', authenticateToken, getChatHistory);
router.post('/start', authenticateToken, startNewChat);

export default router;
