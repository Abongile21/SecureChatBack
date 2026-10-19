import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { completeLesson, getLessons, getQuizzes, submitQuiz } from '../controllers/quizController';

const router = Router();

router.get('/', authenticateToken, getQuizzes);
router.get('/lessons', authenticateToken, getLessons);
router.post('/lessons/:lessonId/complete', authenticateToken, completeLesson);
router.post('/:quizId/submit', authenticateToken, submitQuiz);

export default router;
