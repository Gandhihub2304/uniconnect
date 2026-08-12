import mongoose, { Schema, Document } from 'mongoose';

export interface IFollowRequestDocument extends Document {
  fromUserId: string; // the person who wants to follow
  toUserId: string;   // the person being asked to confirm
  createdAt: Date;
}

const FollowRequestSchema = new Schema<IFollowRequestDocument>(
  {
    fromUserId: { type: String, required: true },
    toUserId: { type: String, required: true },
  },
  { timestamps: true }
);

FollowRequestSchema.index({ fromUserId: 1, toUserId: 1 }, { unique: true });

export const FollowRequestModel = mongoose.models.FollowRequest || mongoose.model<IFollowRequestDocument>('FollowRequest', FollowRequestSchema);
