import { Router } from 'express';
import { login, logout, refreshToken, register } from '../controllers/authController';

const router = Router();

// Authentication endpoints
router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);
router.post('/refresh-token', refreshToken);

export default router;
