import mongoose, { Schema, Document } from 'mongoose';

export interface ICommunityDocument extends Document {
  name: string;
  icon: string;
  banner: string;
  description: string;
  membersCount: number;
  members: string[];
  channels: { id: string; name: string; type: 'text' | 'voice' }[];
  createdAt: Date;
}

const CommunitySchema = new Schema<ICommunityDocument>(
  {
    name: { type: String, required: true },
    icon: { type: String, required: true },
    banner: { type: String, required: true },
    description: { type: String, default: '' },
    membersCount: { type: Number, default: 1 },
    members: { type: [String], default: [] },
    channels: {
      type: [{ id: String, name: String, type: { type: String, enum: ['text', 'voice'] } }],
      default: [{ id: 'ch_general', name: '💬 general-chat', type: 'text' }],
    },
  },
  { timestamps: true }
);

export const CommunityModel = mongoose.models.Community || mongoose.model<ICommunityDocument>('Community', CommunitySchema);
