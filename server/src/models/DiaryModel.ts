import mongoose, { Schema, Document } from 'mongoose';

export interface IDiaryEntryDocument extends Document {
  userId: string;
  title: string;
  content: string;
  mood?: string;
  mediaUrl?: string;
  createdAt: Date;
}

const DiaryEntrySchema = new Schema<IDiaryEntryDocument>(
  {
    userId: { type: String, required: true },
    title: { type: String, required: true },
    content: { type: String, required: true },
    mood: { type: String },
    mediaUrl: { type: String },
  },
  { timestamps: true }
);

export const DiaryEntryModel = mongoose.models.DiaryEntry || mongoose.model<IDiaryEntryDocument>('DiaryEntry', DiaryEntrySchema);

export interface ITimeCapsuleDocument extends Document {
  userId: string;
  title: string;
  message: string;
  mediaUrl?: string;
  unlockDate: Date;
  createdAt: Date;
}

const TimeCapsuleSchema = new Schema<ITimeCapsuleDocument>(
  {
    userId: { type: String, required: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    mediaUrl: { type: String },
    unlockDate: { type: Date, required: true },
  },
  { timestamps: true }
);

export const TimeCapsuleModel = mongoose.models.TimeCapsule || mongoose.model<ITimeCapsuleDocument>('TimeCapsule', TimeCapsuleSchema);
