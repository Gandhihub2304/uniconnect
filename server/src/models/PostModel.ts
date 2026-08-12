import mongoose, { Schema, Document } from 'mongoose';

export interface IPostDocument extends Document {
  userId: string;
  userName: string;
  userAvatar: string;
  userUsername: string;
  isVerified?: boolean;
  content: string;
  media: string[];
  likes: number;
  likedBy: string[];
  commentsCount: number;
  sharesCount: number;
  location?: string;
  isPinned?: boolean;
  isHidden?: boolean;
  hashtags?: string[];
  createdAt: Date;
}

const PostSchema = new Schema<IPostDocument>(
  {
    userId: { type: String, required: true },
    userName: { type: String, required: true },
    userAvatar: { type: String, required: true },
    userUsername: { type: String, required: true },
    isVerified: { type: Boolean, default: false },
    content: { type: String, required: true },
    media: { type: [String], default: [] },
    likes: { type: Number, default: 0 },
    likedBy: { type: [String], default: [] },
    commentsCount: { type: Number, default: 0 },
    sharesCount: { type: Number, default: 0 },
    location: { type: String },
    isPinned: { type: Boolean, default: false },
    isHidden: { type: Boolean, default: false },
    hashtags: { type: [String], default: [] },
  },
  { timestamps: true }
);

export const PostModel = mongoose.models.Post || mongoose.model<IPostDocument>('Post', PostSchema);
