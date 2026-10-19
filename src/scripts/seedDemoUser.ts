import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { closeDatabase, getDatabase } from '../config/database';
import { User } from '../models/User';

dotenv.config();

const email = (process.env.DEMO_USER_EMAIL || 'demo@securechat.local').trim().toLowerCase();
const password = process.env.DEMO_USER_PASSWORD || 'SecureChatDemo2026!';
const name = process.env.DEMO_USER_NAME || 'SecureChat Demo User';

const seedDemoUser = async (): Promise<void> => {
  if (password.length < 12) {
    throw new Error('DEMO_USER_PASSWORD must be at least 12 characters long');
  }

  await getDatabase();
  const existingUser = await User.findByEmail(email);

  if (existingUser) {
    console.log(`Demo user already exists: ${email}`);
    return;
  }

  await User.create({
    email,
    name,
    password_hash: await bcrypt.hash(password, 12),
  });

  console.log(`Demo user created: ${email}`);
};

seedDemoUser()
  .catch((error: unknown) => {
    console.error('Failed to seed demo user:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await closeDatabase();
  });
