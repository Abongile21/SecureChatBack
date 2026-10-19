import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import logger from './config/logger';
import { errorHandler } from './api/middleware/errorHandler';
import authRoutes from './api/routes/authRoutes';
import chatRoutes from './api/routes/chatRoutes';
import userRoutes from './api/routes/userRoutes';
import gamificationRoutes from './api/routes/gamificationRoutes';
import analyticsRoutes from './api/routes/analyticsRoutes';
import quizRoutes from './api/routes/quizRoutes';
import { closeDatabase } from './config/database';

// Load environment variables
dotenv.config();

if (process.env.NODE_ENV === 'production' && !process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET must be configured in production');
}

const app: Express = express();
const DEFAULT_PORT = Number(process.env.PORT) || 5000;

const startServer = (port: number) => {
  const httpServer = createServer(app);
  
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: (process.env.FRONTEND_URL || 'http://localhost:3000').split(',').map((value) => value.trim()),
      credentials: true,
    },
  });

  // Socket.IO event handlers for real-time messaging
  io.on('connection', (socket) => {
    logger.info(`Socket connected: ${socket.id}`);

    socket.on('disconnect', () => {
      logger.info(`Socket disconnected: ${socket.id}`);
    });

    socket.on('join-chat', (chatId: string, userId: string) => {
      socket.join(`chat-${chatId}`);
      logger.info(`User ${userId} joined chat ${chatId}`);
    });

    socket.on('message', (data: { chatId: string; userId: string; message: string }) => {
      io.to(`chat-${data.chatId}`).emit('message-received', data);
    });
  });

  const server = httpServer.listen(port, '0.0.0.0', () => {
    logger.info(`Server running on port ${port} with Socket.IO enabled`);
  });

  server.on('error', (error: NodeJS.ErrnoException) => {
    if (error.code === 'EADDRINUSE') {
      logger.warn(`Port ${port} is busy. Trying ${port + 1}...`);
      startServer(port + 1);
      return;
    }

    logger.error('Failed to start server', error);
    process.exit(1);
  });

  // Attach io to app for use in routes
  (app as any).io = io;
};

// Middleware
app.use(helmet());
app.use(cors({
  origin: (process.env.FRONTEND_URL || 'http://localhost:3000').split(',').map((value) => value.trim()),
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req: Request, _res: Response, next: NextFunction) => {
  logger.info(`${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/users', userRoutes);
app.use('/api/gamification', gamificationRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/quizzes', quizRoutes);

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handling middleware
app.use(errorHandler);

// Vercel invokes the exported Express app as a serverless function.
if (!process.env.VERCEL) {
  startServer(DEFAULT_PORT);
}

process.once('SIGINT', () => {
  void closeDatabase().finally(() => process.exit(0));
});
process.once('SIGTERM', () => {
  void closeDatabase().finally(() => process.exit(0));
});

export default app;
