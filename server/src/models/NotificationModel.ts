import mongoose, { Schema, Document } from 'mongoose';

export interface INotificationDocument extends Document {
  userId: string; // recipient
  type: 'like' | 'comment' | 'follow' | 'follow_request' | 'rsvp' | 'mention';
  fromUserId: string;
  fromUserName: string;
  fromUserAvatar: string;
  text: string;
  targetId?: string;
  isRead: boolean;
  createdAt: Date;
}

const NotificationSchema = new Schema<INotificationDocument>(
  {
    userId: { type: String, required: true },
    type: { type: String, enum: ['like', 'comment', 'follow', 'follow_request', 'rsvp', 'mention'], required: true },
    fromUserId: { type: String, required: true },
    fromUserName: { type: String, required: true },
    fromUserAvatar: { type: String, required: true },
    text: { type: String, required: true },
    targetId: { type: String },
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const NotificationModel = mongoose.models.Notification || mongoose.model<INotificationDocument>('Notification', NotificationSchema);
