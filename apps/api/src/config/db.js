import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import User from '../models/User.js';
import { env } from './env.js';
export async function connectDB() {
  try {
    await mongoose.connect(env.mongoUri, {
      serverSelectionTimeoutMS: 5000,
      maxPoolSize: 10,
      autoIndex: env.nodeEnv !== 'production',
    });
  } catch (error) {
    const message = error.name === 'MongooseServerSelectionError'
      ? error.message.replace(/mongodb(?:\+srv)?:\/\/\S+/gi, '[redacted database URI]')
      : 'Check that MongoDB is running and MONGO_URI points to the intended database.';
    console.error('MongoDB connection failed', {
      name: error.name,
      code: error.code,
      message,
    });
    throw new Error(`Unable to connect to MongoDB. ${message}`);
  }
  console.log('MongoDB connected');
}

export async function ensureIndexes() {
  const models = mongoose.modelNames().map((name) => mongoose.model(name));
  await Promise.all(models.map((model) => model.createIndexes()));
  console.log(`MongoDB indexes ready (${models.length} models)`);
}

export async function ensureAdminAccount() {
  const email = env.adminEmail.trim().toLowerCase();
  if (!email || !env.adminPassword) {
    console.warn('Admin account not provisioned: set ADMIN_EMAIL and ADMIN_PASSWORD');
    return;
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || env.adminPassword.length < 8) {
    throw new Error('ADMIN_EMAIL must be valid and ADMIN_PASSWORD must contain at least 8 characters');
  }

  const password = await bcrypt.hash(env.adminPassword, 12);
  const admin = await User.findOneAndUpdate(
    { email },
    { $setOnInsert: { name: 'Store Administrator', email, password, role: 'admin' } },
    { upsert: true, new: true, runValidators: true },
  );
  if (admin.role !== 'admin') {
    throw new Error('Configured ADMIN_EMAIL already belongs to a non-admin account; resolve the account role before startup');
  }
}
