import { randomUUID } from 'crypto';
import { getDatabase } from '../config/database';
import { User } from './User';

export interface ChatSession {
  id: string;
  user_id: string;
  topic?: string;
  started_at: Date;
  ended_at?: Date;
}

export interface ChatMessage {
  id: string;
  chat_session_id: string;
  user_id: string;
  user_message: string;
  bot_response: string;
  created_at: Date;
}

const sessions = async () => (await getDatabase()).collection<ChatSession>('chat_sessions');
const messages = async () => (await getDatabase()).collection<ChatMessage>('chat_messages');

export const ChatSession = {
  async create(userId: string, topic?: string): Promise<ChatSession> {
    const session: ChatSession = {
      id: randomUUID(),
      user_id: userId,
      ...(topic === undefined ? {} : { topic }),
      started_at: new Date(),
    };
    await (await sessions()).insertOne(session);
    return session;
  },

  async getOrCreate(userId: string): Promise<ChatSession> {
    const result = await (await sessions()).findOneAndUpdate(
      { user_id: userId },
      {
        $setOnInsert: {
          id: randomUUID(),
          user_id: userId,
          started_at: new Date(),
        },
      },
      { upsert: true, returnDocument: 'after', projection: { _id: 0 } }
    );
    return result as ChatSession;
  },

  async findById(id: string): Promise<ChatSession | undefined> {
    return (await sessions()).findOne({ id }, { projection: { _id: 0 } }) as Promise<ChatSession | undefined>;
  },

  async getUserSessions(userId: string): Promise<ChatSession[]> {
    return (await sessions()).find({ user_id: userId }, { projection: { _id: 0 } }).sort({ started_at: -1 }).toArray();
  },

  async addMessage(chatSessionId: string, userId: string, userMessage: string, botResponse: string): Promise<ChatMessage> {
    const message: ChatMessage = {
      id: randomUUID(),
      chat_session_id: chatSessionId,
      user_id: userId,
      user_message: userMessage,
      bot_response: botResponse,
      created_at: new Date(),
    };
    await (await messages()).insertOne(message);
    await User.addPoints(userId, 5);
    await (await getDatabase()).collection('points_ledger').insertOne({
      user_id: userId,
      points: 5,
      reason: 'Chat message',
      created_at: message.created_at,
    });
    return message;
  },

  async getMessages(chatSessionId: string, limit = 20, offset = 0): Promise<ChatMessage[]> {
    const result = await (await messages())
      .find({ chat_session_id: chatSessionId }, { projection: { _id: 0 } })
      .sort({ created_at: -1 })
      .skip(offset)
      .limit(limit)
      .toArray();
    return result.reverse();
  },
};
