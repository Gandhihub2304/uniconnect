import mongoose, { Schema, Document } from 'mongoose';

export interface ICommentDocument extends Document {
  targetType: 'post' | 'reel';
  targetId: string;
  userId: string;
  userName: string;
  userAvatar: string;
  userUsername: string;
  text: string;
  createdAt: Date;
}

const CommentSchema = new Schema<ICommentDocument>(
  {
    targetType: { type: String, enum: ['post', 'reel'], required: true },
    targetId: { type: String, required: true },
    userId: { type: String, required: true },
    userName: { type: String, required: true },
    userAvatar: { type: String, required: true },
    userUsername: { type: String, required: true },
    text: { type: String, required: true },
  },
  { timestamps: true }
);

export const CommentModel = mongoose.models.Comment || mongoose.model<ICommentDocument>('Comment', CommentSchema);
