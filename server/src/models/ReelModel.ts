import mongoose, { Schema, Document } from 'mongoose';

export interface IReelDocument extends Document {
  userId: string;
  userName: string;
  userAvatar: string;
  userUsername: string;
  videoUrl: string;
  caption?: string;
  musicTrack?: string;
  likes: number;
  likedBy: string[];
  commentsCount: number;
  createdAt: Date;
}

const ReelSchema = new Schema<IReelDocument>(
  {
    userId: { type: String, required: true },
    userName: { type: String, required: true },
    userAvatar: { type: String, required: true },
    userUsername: { type: String, required: true },
    videoUrl: { type: String, required: true },
    caption: { type: String, default: '' },
    musicTrack: { type: String },
    likes: { type: Number, default: 0 },
    likedBy: { type: [String], default: [] },
    commentsCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const ReelModel = mongoose.models.Reel || mongoose.model<IReelDocument>('Reel', ReelSchema);
