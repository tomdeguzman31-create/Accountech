import mongoose from 'mongoose';
import { env } from './env.js';

export async function connectDatabase(): Promise<void> {
  await mongoose.connect(env.mongoUri, {
    autoIndex: true,
  });
}

export async function dbHealthcheck(): Promise<void> {
  if (mongoose.connection.readyState !== 1) {
    throw new Error('MongoDB is not connected');
  }
}
