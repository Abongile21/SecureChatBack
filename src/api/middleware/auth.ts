import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AppError } from './errorHandler';

interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
  };
}

export const authenticateToken = (
  req: AuthRequest,
  _res: Response,
  next: NextFunction
): void => {
  const authorization = req.headers.authorization;
  const token = authorization?.startsWith('Bearer ') ? authorization.slice(7) : undefined;

  if (!token) {
    throw new AppError(401, 'No token provided');
  }

  try {
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) throw new AppError(500, 'Authentication is not configured');
    const decoded = jwt.verify(token, jwtSecret) as {
      id: string;
      email: string;
    };
    req.user = decoded;
    next();
  } catch (err) {
    throw new AppError(401, 'Invalid or expired token');
  }
};

export { AuthRequest };
