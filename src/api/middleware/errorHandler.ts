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
    res.status(500).json({
      error: 'Internal server error',
      statusCode: 500,
    });
  }
};
