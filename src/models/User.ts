import { randomUUID } from 'crypto';
import { getDatabase } from '../config/database';

export interface User {
  id: string;
  email: string;
  name: string;
  password_hash?: string;
  role: 'employee' | 'manager' | 'admin';
  total_points: number;
  current_rank: number;
  created_at: Date;
  updated_at: Date;
}

const users = async () => (await getDatabase()).collection<User>('users');

export const User = {
  async findById(id: string): Promise<User | undefined> {
    return (await users()).findOne({ id }, { projection: { _id: 0 } }) as Promise<User | undefined>;
  },

  async findByEmail(email: string): Promise<User | undefined> {
    return (await users()).findOne({ email }, { projection: { _id: 0 } }) as Promise<User | undefined>;
  },

  async create(userData: Partial<User>): Promise<User> {
    const now = new Date();
    const user: User = {
      id: userData.id || randomUUID(),
      email: userData.email || '',
      name: userData.name || '',
      role: userData.role || 'employee',
      total_points: userData.total_points || 0,
      current_rank: userData.current_rank || 0,
      created_at: userData.created_at || now,
      updated_at: userData.updated_at || now,
    };
    if (userData.password_hash !== undefined) {
      user.password_hash = userData.password_hash;
    }
    await (await users()).insertOne(user);
    return user;
  },

  async update(id: string, userData: Partial<User>): Promise<User | undefined> {
    const result = await (await users()).findOneAndUpdate(
      { id },
      { $set: { ...userData, updated_at: new Date() } },
      { returnDocument: 'after', projection: { _id: 0 } }
    );
    return result as User | undefined;
  },

  async getLeaderboard(limit: number = 20): Promise<User[]> {
    return (await users()).find({}, { projection: { _id: 0 } }).sort({ total_points: -1 }).limit(limit).toArray();
  },

  async addPoints(id: string, points: number): Promise<User | undefined> {
    const result = await (await users()).findOneAndUpdate(
      { id },
      { $inc: { total_points: points }, $set: { updated_at: new Date() } },
      { returnDocument: 'after', projection: { _id: 0 } }
    );
    return result as User | undefined;
  },

  async getRank(id: string): Promise<number> {
    const user = await User.findById(id);
    if (!user) return 0;
    return (await (await getDatabase()).collection<User>('users').countDocuments({
      $or: [
        { total_points: { $gt: user.total_points } },
        { total_points: user.total_points, id: { $lt: user.id } },
      ],
    })) + 1;
  },

  async count(): Promise<number> {
    return (await users()).countDocuments();
  },
};
