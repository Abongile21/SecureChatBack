import { Response } from 'express';
import { getDatabase } from '../../config/database';
import { User } from '../../models/User';
import { AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';

type QuizQuestion = { id: string; prompt: string; options: string[]; correctOption: number };
type Quiz = { id: string; title: string; description: string; questions: QuizQuestion[]; pointsPerCorrect: number };
type Lesson = { id: string; title: string; summary: string; sections: Array<{ heading: string; content: string }>; quizId: string; completionPoints: number };

export const getLessons = async (_req: AuthRequest, res: Response): Promise<void> => {
  const lessons = await (await getDatabase()).collection<Lesson>('lessons').find({}, { projection: { _id: 0 } }).toArray();
  res.status(200).json({ lessons });
};

export const completeLesson = async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.user?.id;
  if (!userId) throw new AppError(401, 'Authenticated user required');
  const database = await getDatabase();
  const lesson = await database.collection<Lesson>('lessons').findOne({ id: String(req.params.lessonId) });
  if (!lesson) throw new AppError(404, 'Lesson not found');

  const existing = await database.collection('lesson_progress').findOne({ user_id: userId, lesson_id: lesson.id });
  if (existing) {
    res.status(200).json({ lessonId: lesson.id, completed: true, pointsAwarded: 0, alreadyCompleted: true });
    return;
  }
  await database.collection('lesson_progress').insertOne({
    user_id: userId,
    lesson_id: lesson.id,
    completed_at: new Date(),
  });
  await User.addPoints(userId, lesson.completionPoints);
  await database.collection('points_ledger').insertOne({
    user_id: userId,
    points: lesson.completionPoints,
    reason: `Lesson: ${lesson.title}`,
    created_at: new Date(),
  });
  res.status(201).json({ lessonId: lesson.id, completed: true, pointsAwarded: lesson.completionPoints, alreadyCompleted: false });
};

export const getQuizzes = async (_req: AuthRequest, res: Response): Promise<void> => {
  const quizzes = await (await getDatabase()).collection<Quiz>('quizzes').find({}, { projection: { _id: 0, 'questions.correctOption': 0 } }).toArray();
  res.status(200).json({ quizzes });
};

export const submitQuiz = async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.user?.id;
  if (!userId) throw new AppError(401, 'Authenticated user required');
  const quizId = String(req.params.quizId);
  const answers = req.body.answers;
  if (!Array.isArray(answers) || answers.some((answer) => !Number.isInteger(answer))) {
    throw new AppError(400, 'Answers must be an array of option numbers');
  }

  const database = await getDatabase();
  const quiz = await database.collection<Quiz>('quizzes').findOne({ id: quizId });
  if (!quiz) throw new AppError(404, 'Quiz not found');
  if (answers.length !== quiz.questions.length) {
    throw new AppError(400, 'An answer is required for every question');
  }

  const correctAnswers = quiz.questions.reduce((total, question, index) => (
    total + (answers[index] === question.correctOption ? 1 : 0)
  ), 0);
  const score = Math.round((correctAnswers / quiz.questions.length) * 100);
  const pointsAwarded = correctAnswers * quiz.pointsPerCorrect;
  const attempt = {
    user_id: userId,
    quiz_id: quiz.id,
    score,
    correctAnswers,
    totalQuestions: quiz.questions.length,
    pointsAwarded,
    submitted_at: new Date(),
  };

  const existingAttempt = await database.collection('quiz_attempts').findOne({ user_id: userId, quiz_id: quiz.id });
  if (existingAttempt) {
    await database.collection('quiz_attempts').replaceOne({ _id: existingAttempt._id }, attempt);
    const pointDifference = pointsAwarded - Number(existingAttempt.pointsAwarded || 0);
    if (pointDifference > 0) {
      await User.addPoints(userId, pointDifference);
      await database.collection('points_ledger').insertOne({ user_id: userId, points: pointDifference, reason: `Quiz: ${quiz.title}`, created_at: new Date() });
    }
  } else {
    await database.collection('quiz_attempts').insertOne(attempt);
    await User.addPoints(userId, pointsAwarded);
    if (pointsAwarded > 0) {
      await database.collection('points_ledger').insertOne({ user_id: userId, points: pointsAwarded, reason: `Quiz: ${quiz.title}`, created_at: new Date() });
    }
  }

  res.status(200).json({ quizId, score, correctAnswers, totalQuestions: quiz.questions.length, pointsAwarded });
};
