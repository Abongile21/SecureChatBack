import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { AppError } from '../middleware/errorHandler';
import { User } from '../../models/User';

const issueToken = (id: string, email: string): string => {
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) throw new AppError(500, 'Authentication is not configured');
  return jwt.sign({ id, email }, jwtSecret, { expiresIn: process.env.JWT_EXPIRE || '7d' } as jwt.SignOptions);
};

export const register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const email = String(req.body.email || '').trim().toLowerCase();
    const name = String(req.body.name || '').trim();
    const password = String(req.body.password || '');
    if (!email || !name || password.length < 12) {
      throw new AppError(400, 'Name, email, and a password of at least 12 characters are required');
    }
    if (await User.findByEmail(email)) throw new AppError(409, 'An account with this email already exists');
    const user = await User.create({ email, name, password_hash: await bcrypt.hash(password, 12) });
    res.status(201).json({ token: issueToken(user.id, user.email), user: { id: user.id, email: user.email, name: user.name, role: user.role } });
  } catch (error) {
    next(error);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const email = String(req.body.email || '').trim().toLowerCase();
    const password = String(req.body.password || '');
    const user = await User.findByEmail(email);
    if (!user?.password_hash || !(await bcrypt.compare(password, user.password_hash))) {
      throw new AppError(401, 'Invalid email or password');
    }
    res.status(200).json({ token: issueToken(user.id, user.email), user: { id: user.id, email: user.email, name: user.name, role: user.role } });
  } catch (error) {
    next(error);
  }
};

export const logout = (_req: Request, res: Response): void => {
  res.status(200).json({ message: 'Logged out successfully' });
};

export const refreshToken = (req: Request, res: Response, next: NextFunction): void => {
  const { token } = req.body;
  try {
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) throw new AppError(500, 'Authentication is not configured');
    const decoded = jwt.verify(token, jwtSecret) as {
      id: string;
      email: string;
    };
    const newToken = jwt.sign(
      { id: decoded.id, email: decoded.email },
      jwtSecret,
      { expiresIn: process.env.JWT_EXPIRE || '7d' } as jwt.SignOptions
    );
    res.status(200).json({ token: newToken });
  } catch {
    next(new AppError(401, 'Invalid token'));
  }
};
