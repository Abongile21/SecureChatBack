import { Response } from 'express';
import { getDatabase } from '../../config/database';
import { User } from '../../models/User';
import { AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';

const BADGES = [
  { id: 'security-novice', name: 'Security Novice', description: 'Earn 100 points', pointsRequired: 100 },
  { id: 'phishing-expert', name: 'Phishing Expert', description: 'Earn 500 points', pointsRequired: 500 },
  { id: 'security-champion', name: 'Security Champion', description: 'Earn 2,000 points', pointsRequired: 2000 },
];

const getUserId = (req: AuthRequest, requestedId?: string): string => {
  const userId = requestedId || req.user?.id;
  if (!userId) throw new AppError(401, 'Authenticated user required');
  if (requestedId && requestedId !== req.user?.id) {
    throw new AppError(403, 'You can only view your own achievements');
  }
  return userId;
};

export const getLeaderboard = async (_req: AuthRequest, res: Response): Promise<void> => {
  const leaderboard = await User.getLeaderboard(20);
  const entries = await Promise.all(leaderboard.map(async (user, index) => ({
    rank: index + 1,
    user: { id: user.id, name: user.name, role: user.role },
    points: user.total_points,
    badges: BADGES.filter((badge) => user.total_points >= badge.pointsRequired).length,
  })));
  res.status(200).json({ leaderboard: entries, timestamp: new Date().toISOString() });
};

export const getUserAchievements = async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = getUserId(req, req.params.userId);
  const user = await User.findById(userId);
  if (!user) throw new AppError(404, 'User not found');

  const messageCount = await (await getDatabase()).collection('points_ledger').countDocuments({
    user_id: userId,
    reason: 'Chat message',
  });
  const achievements = [
    { id: 'first-chat', name: 'First Conversation', description: 'Send your first chat message', unlocked: messageCount >= 1 },
    { id: 'security-novice', name: 'Security Novice', description: 'Earn 100 points', unlocked: user.total_points >= 100 },
    { id: 'security-champion', name: 'Security Champion', description: 'Earn 2,000 points', unlocked: user.total_points >= 2000 },
  ];
  res.status(200).json({ userId, totalPoints: user.total_points, achievements });
};

export const awardPoints = async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = getUserId(req, req.body.userId);
  const points = Number(req.body.points);
  const reason = String(req.body.reason || 'Manual award').trim();
  if (!Number.isInteger(points) || points < 1 || points > 1000 || !reason) {
    throw new AppError(400, 'Points must be an integer between 1 and 1000, with a reason');
  }

  const user = await User.addPoints(userId, points);
  if (!user) throw new AppError(404, 'User not found');
  await (await getDatabase()).collection('points_ledger').insertOne({
    user_id: userId,
    points,
    reason,
    created_at: new Date(),
  });
  res.status(200).json({ message: 'Points awarded successfully', userId, pointsAwarded: points, totalPoints: user.total_points });
};

export const getBadges = async (_req: AuthRequest, res: Response): Promise<void> => {
  res.status(200).json({ badges: BADGES });
};
