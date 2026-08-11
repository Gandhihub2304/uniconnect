import mongoose, { Schema, Document } from 'mongoose';

export interface IMessageDocument extends Document {
  chatId: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  text: string;
  mediaUrl?: string;
  mediaType?: 'image' | 'video' | 'audio' | 'document';
  fileName?: string;
  fileSize?: number;
  isViewOnce?: boolean;
  viewedBy?: string[];
  deletedFor?: string[];
  isDeletedForEveryone?: boolean;
  isEdited?: boolean;
  disappearingTimer?: string;
  expiresAt?: Date;
  voiceDuration?: number;
  isDisappearing?: boolean;
  reactions?: { emoji: string; userId: string }[];
  replyToId?: string;
  createdAt: Date;
}

const MessageSchema = new Schema<IMessageDocument>(
  {
    chatId: { type: String, required: true },
    senderId: { type: String, required: true },
    senderName: { type: String, required: true },
    senderAvatar: { type: String, required: true },
    text: { type: String, default: '' },
    mediaUrl: { type: String },
    mediaType: { type: String, enum: ['image', 'video', 'audio', 'document'] },
    fileName: { type: String },
    fileSize: { type: Number },
    isViewOnce: { type: Boolean, default: false },
    viewedBy: { type: [String], default: [] },
    deletedFor: { type: [String], default: [] },
    isDeletedForEveryone: { type: Boolean, default: false },
    isEdited: { type: Boolean, default: false },
    disappearingTimer: { type: String, default: 'off' },
    expiresAt: { type: Date, default: undefined },
    voiceDuration: { type: Number },
    isDisappearing: { type: Boolean, default: false },
    reactions: { type: [{ emoji: String, userId: String }], default: [] },
    replyToId: { type: String },
  },
  { timestamps: true }
);

export const MessageModel = mongoose.models.Message || mongoose.model<IMessageDocument>('Message', MessageSchema);
