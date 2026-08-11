import mongoose, { Schema, Document } from 'mongoose';

export interface IStoryDocument extends Document {
  userId: string;
  userName: string;
  userAvatar: string;
  userUsername: string;
  mediaUrl: string;
  type: 'image' | 'video' | 'voice' | 'text';
  caption?: string;
  musicTrack?: string;
  pollOptions?: { option: string; votes: number; votedBy: string[] }[];
  likes: number;
  likedBy: string[];
  isHighlighted?: boolean;
  highlightTitle?: string;
  createdAt: Date;
}

const StorySchema = new Schema<IStoryDocument>(
  {
    userId: { type: String, required: true },
    userName: { type: String, required: true },
    userAvatar: { type: String, required: true },
    userUsername: { type: String, required: true },
    mediaUrl: { type: String, required: true },
    type: { type: String, enum: ['image', 'video', 'voice', 'text'], default: 'image' },
    caption: { type: String },
    musicTrack: { type: String },
    pollOptions: { type: [{ option: String, votes: { type: Number, default: 0 }, votedBy: { type: [String], default: [] } }], default: undefined },
    likes: { type: Number, default: 0 },
    likedBy: { type: [String], default: [] },
    isHighlighted: { type: Boolean, default: false },
    highlightTitle: { type: String },
  },
  { timestamps: true }
);

export const StoryModel = mongoose.models.Story || mongoose.model<IStoryDocument>('Story', StorySchema);
