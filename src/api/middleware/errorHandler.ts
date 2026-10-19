import { Request, Response, NextFunction } from 'express';
import logger from '../../config/logger';

export class AppError extends Error {
  constructor(
    public statusCode: number,
    message: string
  ) {
    super(message);
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  logger.error({
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      error: err.message,
      statusCode: err.statusCode,
    });
  } else {
    const message = err.message.toLowerCase();
    const databaseError = err.name.startsWith('Mongo')
      || typeof (err as Error & { code?: unknown }).code === 'number'
      || message.includes('mongodb')
      || message.includes('mongoserverselectionerror')
      || message.includes('mongonetworkerror')
      || message.includes('mongodb_uri');
    if (databaseError) {
      res.status(503).json({
        error: 'Database unavailable. Check MONGODB_URI and MongoDB Atlas Network Access.',
        statusCode: 503,
      });
      return;
    }
    res.status(500).json({
      error: 'Internal server error',
      statusCode: 500,
    });
  }
};
