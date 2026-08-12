import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../config/env';

export interface IUserDocument extends Document {
  name: string;
  username: string;
  email: string;
  password?: string;
  avatar: string;
  coverImage?: string;
  bio?: string;
  location?: string;
  website?: string;
  work?: string;
  education?: string;
  followers: string[];
  following: string[];
  isOnline: boolean;
  lastSeen: Date;
  pushTokens: string[];
  comparePassword(candidatePassword: string): Promise<boolean>;
  generateAuthToken(): string;
}

const UserSchema = new Schema<IUserDocument>(
  {
    name: { type: String, required: true },
    username: { type: String, required: true, unique: true, lowercase: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    avatar: { type: String, default: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=300' },
    coverImage: { type: String, default: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=1200' },
    bio: { type: String, default: '' },
    location: { type: String, default: '' },
    website: { type: String, default: '' },
    work: { type: String, default: '' },
    education: { type: String, default: '' },
    followers: { type: [String], default: [] },
    following: { type: [String], default: [] },
    isOnline: { type: Boolean, default: true },
    lastSeen: { type: Date, default: Date.now },
    pushTokens: { type: [String], default: [] },
  },
  { timestamps: true }
);

// Password Hashing Pre-Save Hook
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password!, salt);
    next();
  } catch (err: any) {
    next(err);
  }
});

// Compare Password Method
UserSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password!);
};

// JWT Token Generation Method
UserSchema.methods.generateAuthToken = function (): string {
  return jwt.sign(
    { id: this._id, username: this.username, email: this.email },
    JWT_SECRET,
    { expiresIn: '30d' }
  );
};

export const UserModel = mongoose.models.User || mongoose.model<IUserDocument>('User', UserSchema);
