import mongoose, { Schema, Document } from 'mongoose';

export interface IChatDocument extends Document {
  name?: string;
  isGroup: boolean;
  participants: string[];
  lastMessage?: string;
  lastMessageTime?: Date;
  unreadCount?: number;
  avatar?: string;
  isSecret?: boolean;
  isPinned?: boolean;
  disappearingTimer?: string;
}

const ChatSchema = new Schema<IChatDocument>(
  {
    name: { type: String },
    isGroup: { type: Boolean, default: false },
    participants: { type: [String], required: true },
    lastMessage: { type: String, default: '' },
    lastMessageTime: { type: Date, default: Date.now },
    unreadCount: { type: Number, default: 0 },
    avatar: { type: String },
    isSecret: { type: Boolean, default: false },
    isPinned: { type: Boolean, default: false },
    disappearingTimer: { type: String, default: 'off' },
  },
  { timestamps: true }
);

export const ChatModel = mongoose.models.Chat || mongoose.model<IChatDocument>('Chat', ChatSchema);
