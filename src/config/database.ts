import { Db, MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

let client: MongoClient | undefined;
let databasePromise: Promise<Db> | undefined;

export const getDatabase = (): Promise<Db> => {
  if (!databasePromise) {
    const uri = process.env.MONGODB_URI?.trim();
    if (!uri) {
      return Promise.reject(new Error('MONGODB_URI must be configured'));
    }
    const databaseClient = new MongoClient(uri);
    client = databaseClient;
    databasePromise = databaseClient.connect().then(() => {
      const database = databaseClient.db(process.env.MONGODB_DB_NAME || process.env.DB_NAME || 'securechat_db');
      return Promise.all([
        database.collection('users').createIndex({ email: 1 }, { unique: true }),
        database.collection('chat_sessions').createIndex({ user_id: 1 }, { unique: true }),
        database.collection('chat_messages').createIndex({ chat_session_id: 1, created_at: -1 }),
        database.collection('points_ledger').createIndex({ user_id: 1, created_at: -1 }),
        database.collection('quiz_attempts').createIndex({ user_id: 1, submitted_at: -1 }),
        database.collection('quiz_attempts').createIndex({ user_id: 1, quiz_id: 1 }, { unique: true }),
        database.collection('lesson_progress').createIndex({ user_id: 1, lesson_id: 1 }, { unique: true }),
      ]).then(() => database);
    }).catch(async (error: unknown) => {
      await databaseClient.close().catch(() => undefined);
      client = undefined;
      databasePromise = undefined;
      throw error;
    });
  }

  return databasePromise;
};

export const closeDatabase = async (): Promise<void> => {
  if (databasePromise && client) {
    await client.close();
    databasePromise = undefined;
    client = undefined;
  }
};
