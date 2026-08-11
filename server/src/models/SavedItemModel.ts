import mongoose, { Schema, Document } from 'mongoose';

export interface ISavedItemDocument extends Document {
  userId: string;
  postId: string;
  createdAt: Date;
}

const SavedItemSchema = new Schema<ISavedItemDocument>(
  {
    userId: { type: String, required: true },
    postId: { type: String, required: true },
  },
  { timestamps: true }
);

SavedItemSchema.index({ userId: 1, postId: 1 }, { unique: true });

export const SavedItemModel = mongoose.models.SavedItem || mongoose.model<ISavedItemDocument>('SavedItem', SavedItemSchema);
