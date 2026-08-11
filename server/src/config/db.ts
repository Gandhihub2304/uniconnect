import mongoose from 'mongoose';
import { MONGO_URI } from './env';

export const connectDB = async () => {
  try {
    mongoose.set('strictQuery', false);
    await mongoose.connect(MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log(`✅ MongoDB Connected Successfully -> ${MONGO_URI}`);
  } catch (error: any) {
    console.error('❌ MongoDB connection failed. UniConnect requires MongoDB to persist data.');
    console.error(`   URI: ${MONGO_URI}`);
    console.error(`   Reason: ${error?.message || error}`);
  }
};
