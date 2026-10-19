import { Db, MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const uri = process.env.MONGODB_URI;
if (!uri) {
  throw new Error('MONGODB_URI must be configured');
}

const client = new MongoClient(uri);
let databasePromise: Promise<Db> | undefined;

export const getDatabase = (): Promise<Db> => {
  if (!databasePromise) {
    databasePromise = client.connect().then(() => {
      const database = client.db(process.env.MONGODB_DB_NAME || process.env.DB_NAME || 'securechat_db');
      return Promise.all([
        database.collection('users').createIndex({ email: 1 }, { unique: true }),
        database.collection('chat_sessions').createIndex({ user_id: 1 }, { unique: true }),
        database.collection('chat_messages').createIndex({ chat_session_id: 1, created_at: -1 }),
        database.collection('points_ledger').createIndex({ user_id: 1, created_at: -1 }),
        database.collection('quiz_attempts').createIndex({ user_id: 1, submitted_at: -1 }),
        database.collection('quiz_attempts').createIndex({ user_id: 1, quiz_id: 1 }, { unique: true }),
        database.collection('lesson_progress').createIndex({ user_id: 1, lesson_id: 1 }, { unique: true }),
        seedQuizzes(database),
        seedLessons(database),
      ]).then(() => database);
    });
  }

  return databasePromise;
};

const seedQuizzes = async (database: Db): Promise<void> => {
  const quizzes = database.collection('quizzes');
  if (await quizzes.countDocuments() > 0) return;
  await quizzes.insertMany([
    {
      id: 'phishing-basics',
      title: 'Phishing Basics',
      description: 'Test your ability to spot common phishing indicators.',
      questions: [
        { id: 'q1', prompt: 'Which is the strongest phishing warning sign?', options: ['An expected internal email', 'An urgent request to verify credentials through a link', 'A calendar reminder', 'A saved contact email'], correctOption: 1 },
        { id: 'q2', prompt: 'What should you do with a suspicious link?', options: ['Open it quickly', 'Forward it to everyone', 'Verify the destination independently before opening', 'Reply with your password'], correctOption: 2 },
        { id: 'q3', prompt: 'Which password is safest?', options: ['Password123', 'Your name and birthday', 'A unique long passphrase stored in a password manager', 'The same password used everywhere'], correctOption: 2 },
      ],
      pointsPerCorrect: 25,
    },
    {
      id: 'password-security',
      title: 'Password Security',
      description: 'Practice the fundamentals of secure authentication.',
      questions: [
        { id: 'q1', prompt: 'Why should passwords be unique?', options: ['It makes them shorter', 'A breach of one service will not expose every account', 'It avoids using a password manager', 'It makes sharing easier'], correctOption: 1 },
        { id: 'q2', prompt: 'What adds a second layer of account protection?', options: ['Multi-factor authentication', 'A shorter password', 'Disabling updates', 'Sharing recovery codes'], correctOption: 0 },
        { id: 'q3', prompt: 'Where should recovery codes be kept?', options: ['In a public chat', 'In a secure private location', 'As a social media post', 'Inside an email signature'], correctOption: 1 },
      ],
      pointsPerCorrect: 25,
    },
  ]);
};

const seedLessons = async (database: Db): Promise<void> => {
  const lessons = database.collection('lessons');
  if (await lessons.countDocuments() > 0) return;
  await lessons.insertMany([
    {
      id: 'phishing-basics',
      title: 'Phishing Basics',
      summary: 'Learn how attackers use urgency, impersonation, and links to steal information.',
      sections: [
        { heading: 'Check the sender', content: 'Inspect the full sender address, not only the display name. Attackers often use lookalike domains.' },
        { heading: 'Pause on urgency', content: 'Requests for immediate payment, password resets, or secrecy are common social-engineering signals.' },
        { heading: 'Verify safely', content: 'Do not use the message link. Open the official website or contact the sender through a trusted channel.' },
      ],
      quizId: 'phishing-basics',
      completionPoints: 10,
    },
    {
      id: 'password-security',
      title: 'Password Security',
      summary: 'Build stronger account protection with unique passwords and multi-factor authentication.',
      sections: [
        { heading: 'Use unique passwords', content: 'A unique password prevents one breached service from exposing your other accounts.' },
        { heading: 'Prefer long passphrases', content: 'Use a long, memorable passphrase or generate a strong password with a password manager.' },
        { heading: 'Turn on MFA', content: 'Multi-factor authentication adds another verification step even if a password is stolen.' },
      ],
      quizId: 'password-security',
      completionPoints: 10,
    },
  ]);
};

export const closeDatabase = async (): Promise<void> => {
  if (databasePromise) {
    await client.close();
    databasePromise = undefined;
  }
};
