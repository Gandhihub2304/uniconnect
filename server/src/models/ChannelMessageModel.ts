import mongoose, { Schema, Document } from 'mongoose';

export interface IChannelMessageDocument extends Document {
  communityId: string;
  channelId: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  text: string;
  createdAt: Date;
}

const ChannelMessageSchema = new Schema<IChannelMessageDocument>(
  {
    communityId: { type: String, required: true },
    channelId: { type: String, required: true },
    senderId: { type: String, required: true },
    senderName: { type: String, required: true },
    senderAvatar: { type: String, required: true },
    text: { type: String, default: '' },
  },
  { timestamps: true }
);

export const ChannelMessageModel = mongoose.models.ChannelMessage || mongoose.model<IChannelMessageDocument>('ChannelMessage', ChannelMessageSchema);
