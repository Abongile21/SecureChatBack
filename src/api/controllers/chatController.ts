import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import { generateChatbotResponse } from '../../services/aiService';
import { ChatSession } from '../../models/ChatSession';

export const sendMessage = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { chatId, message } = req.body;
    const userId = req.user?.id;

    if (!message || !chatId || !userId || typeof message !== 'string' || message.trim().length > 2000) {
      throw new AppError(400, 'Message, chat ID, and authenticated user are required');
    }

    const session = await ChatSession.findById(chatId);
    if (!session || session.user_id !== userId) {
      throw new AppError(404, 'Conversation not found');
    }

    // Get AI response
    const context = await ChatSession.getMessages(chatId, 10);
    const response = await generateChatbotResponse(message, chatId, context.flatMap((item) => [
      { role: 'user' as const, content: item.user_message },
      { role: 'assistant' as const, content: item.bot_response },
    ]));

    const savedMessage = await ChatSession.addMessage(chatId, userId, message.trim(), response);

    res.status(200).json({
      chatId,
      messageId: savedMessage.id,
      userMessage: message.trim(),
      botResponse: response,
      timestamp: savedMessage.created_at,
    });
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError(500, 'Failed to process message');
  }
};

export const getChatHistory = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { chatId } = req.params;
    const userId = req.user?.id;
    if (!userId) throw new AppError(401, 'Authenticated user required');

    const session = await ChatSession.findById(chatId);
    if (!session || session.user_id !== userId) {
      throw new AppError(404, 'Conversation not found');
    }

    const page = Math.max(Number.parseInt(String(req.query.page || '1'), 10) || 1, 1);
    const limit = Math.min(Math.max(Number.parseInt(String(req.query.limit || '20'), 10) || 20, 1), 50);
    const messages = await ChatSession.getMessages(chatId, limit, (page - 1) * limit);
    res.status(200).json({
      chatId,
      page,
      limit,
      messages: messages.flatMap((item) => [
        { id: `${item.id}:user`, role: 'user', content: item.user_message, timestamp: item.created_at },
        { id: `${item.id}:assistant`, role: 'assistant', content: item.bot_response, timestamp: item.created_at },
      ]),
    });
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError(500, 'Failed to fetch chat history');
  }
};

export const startNewChat = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?.id) throw new AppError(401, 'Authenticated user required');
    const session = await ChatSession.getOrCreate(req.user.id);
    res.status(201).json({
      chatId: session.id,
      createdAt: session.started_at,
    });
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError(500, 'Failed to start new chat');
  }
};
