import { NotificationModel } from '../models/NotificationModel';
import { getIO } from '../sockets/ioInstance';

interface CreateNotificationInput {
  userId: string;
  type: 'like' | 'comment' | 'follow' | 'rsvp' | 'mention';
  fromUserId: string;
  fromUserName: string;
  fromUserAvatar: string;
  text: string;
  targetId?: string;
}

export async function createNotification(input: CreateNotificationInput) {
  const notification = await NotificationModel.create(input);
  const io = getIO();
  if (io) {
    io.to(`user_${input.userId}`).emit('new_notification', notification);
  }
  return notification;
}
