import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import { User } from '../../models/User';
import { ChatSession } from '../../models/ChatSession';
import { getDatabase } from '../../config/database';

export const getUserProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const user = userId ? await User.findById(userId) : undefined;
    if (!user) throw new AppError(404, 'User not found');
    res.status(200).json({
      userId,
      email: user.email,
      profile: { id: user.id, name: user.name, email: user.email, role: user.role, total_points: user.total_points, current_rank: user.current_rank },
    });
  } catch (error) {
    throw new AppError(500, 'Failed to fetch user profile');
  }
};

export const getDashboard = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) throw new AppError(401, 'Authenticated user required');
    const user = await User.findById(userId);
    if (!user) throw new AppError(404, 'User not found');
    const rank = await User.getRank(userId);
    const badges = [100, 500, 2000].filter((threshold) => user.total_points >= threshold).length;
    const sessions = await ChatSession.getUserSessions(userId);
    const messages = (await Promise.all(sessions.map((session) => ChatSession.getMessages(session.id, 1000)))).flat();
    const database = await getDatabase();
    const [totalTrainings, completedTrainings] = await Promise.all([
      database.collection('quizzes').countDocuments(),
      database.collection('quiz_attempts').countDocuments({ user_id: userId, score: { $gte: 70 } }),
    ]);
    const phishingQuizzes = await database.collection('quiz_attempts').countDocuments({ user_id: userId });
    const completedLessons = await database.collection('lesson_progress').countDocuments({ user_id: userId });
    res.status(200).json({
      user: { name: user.name, totalPoints: user.total_points, rank, badges },
      activity: {
        chatMessages: messages.length,
        activeSessions: sessions.length,
        completedTrainings,
        totalTrainings,
        completedLessons,
        phishingQuizzes,
        weeklyConsistency: totalTrainings ? Math.round((completedTrainings / totalTrainings) * 100) : 0,
      },
    });
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError(500, 'Failed to fetch dashboard data');
  }
};

export const updateUserProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const updates = req.body;
    // Update user profile in database
    res.status(200).json({
      message: 'Profile updated successfully',
      userId,
      updatedFields: Object.keys(updates || {}).length,
    });
  } catch (error) {
    throw new AppError(500, 'Failed to update user profile');
  }
};

export const getAllUsers = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    // Fetch all users (admin only)
    res.status(200).json({
      users: [],
      total: 0,
    });
  } catch (error) {
    throw new AppError(500, 'Failed to fetch users');
  }
};
