import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../config/env';
import { ChatModel } from '../models/ChatModel';
import { MessageModel } from '../models/MessageModel';
import { UserModel } from '../models/UserModel';
import { sendPushNotification, sendDataOnlyPush } from '../config/firebase';

async function notifyChatParticipants(chatId: string, senderName: string, messagePreview: string, senderId: string) {
  const chat = await ChatModel.findById(chatId);
  if (!chat) return;
  const recipientIds = chat.participants.filter((pid: string) => pid !== senderId);
  if (recipientIds.length === 0) return;
  const recipients = await UserModel.find({ _id: { $in: recipientIds } }).select('pushTokens');
  const allTokens = recipients.flatMap(r => r.pushTokens || []);
  if (allTokens.length === 0) return;
  const result = await sendPushNotification(allTokens, { title: senderName, body: messagePreview }, { type: 'new_message', chatId });
  if (result?.staleTokens && result.staleTokens.length > 0) {
    await UserModel.updateMany({ _id: { $in: recipientIds } }, { $pullAll: { pushTokens: result.staleTokens } });
  }
}

// userId -> set of connected socket ids (a user can have multiple tabs)
const onlineUsers = new Map<string, Set<string>>();
// socketId -> userId
const socketUser = new Map<string, string>();

function getUserIdFromSocket(socket: Socket): string | null {
  try {
    const token = socket.handshake.auth?.token || socket.handshake.query?.token;
    if (!token) return null;
    const decoded: any = jwt.verify(token as string, JWT_SECRET);
    return decoded.id;
  } catch {
    return null;
  }
}

export const setupSocketHandlers = (io: Server) => {
  io.on('connection', (socket: Socket) => {
    const userId = getUserIdFromSocket(socket);

    if (userId) {
      socketUser.set(socket.id, userId);
      socket.join(`user_${userId}`);
      if (!onlineUsers.has(userId)) onlineUsers.set(userId, new Set());
      onlineUsers.get(userId)!.add(socket.id);

      if (onlineUsers.get(userId)!.size === 1) {
        UserModel.findByIdAndUpdate(userId, { isOnline: true }).catch(() => {});
        io.emit('presence_update', { userId, isOnline: true });
      }
    }

    socket.on('join_chat', (chatId: string) => {
      socket.join(`chat_${chatId}`);
    });

    socket.on('leave_chat', (chatId: string) => {
      socket.leave(`chat_${chatId}`);
    });

    // Real-time chat message (also persisted so REST history matches)
    socket.on('send_message', async (data: { chatId: string; text: string; mediaUrl?: string; mediaType?: string; replyToId?: string }) => {
      if (!userId) return;
      try {
        const user = await UserModel.findById(userId);
        if (!user) return;

        const message = await MessageModel.create({
          chatId: data.chatId,
          senderId: user._id.toString(),
          senderName: user.name,
          senderAvatar: user.avatar,
          text: data.text || '',
          mediaUrl: data.mediaUrl,
          mediaType: data.mediaType,
          replyToId: data.replyToId,
        });

        await ChatModel.findByIdAndUpdate(data.chatId, {
          lastMessage: data.text || 'Sent media',
          lastMessageTime: new Date(),
        });

        io.to(`chat_${data.chatId}`).emit('new_message', message);
        notifyChatParticipants(data.chatId, user.name, data.text || 'Sent media', userId).catch(() => {});
      } catch (err) {
        console.error('send_message error:', err);
      }
    });

    // Typing indicators
    socket.on('typing', (data: { chatId: string; userName: string; isTyping: boolean }) => {
      socket.to(`chat_${data.chatId}`).emit('user_typing', data);
    });

    // WebRTC Calling Signaling — targeted at the specific callee, not broadcast to everyone
    socket.on('call_user', async (data: { userToCall: string; signalData: any; from: string; name: string; callType?: 'voice' | 'video' }) => {
      io.to(`user_${data.userToCall}`).emit('call_incoming', { signal: data.signalData, from: data.from, name: data.name, callType: data.callType });

      // Also push a high-priority "incoming call" notification so the callee's phone
      // rings even if the app is fully closed (a live socket connection alone can't
      // wake a closed app — only a native push can).
      try {
        const callee = await UserModel.findById(data.userToCall).select('pushTokens');
        if (callee?.pushTokens && callee.pushTokens.length > 0) {
          const result = await sendDataOnlyPush(
            callee.pushTokens,
            { type: 'incoming_call', fromId: data.from, fromName: data.name, callType: data.callType || 'voice' }
          );
          if (result?.staleTokens && result.staleTokens.length > 0) {
            await UserModel.findByIdAndUpdate(data.userToCall, { $pullAll: { pushTokens: result.staleTokens } });
          }
        }
      } catch (err) {
        console.error('Failed to send incoming-call push:', err);
      }
    });

    socket.on('answer_call', (data: { to: string; signal: any }) => {
      io.to(`user_${data.to}`).emit('call_accepted', data.signal);
    });

    socket.on('ice_candidate', (data: { to: string; candidate: any }) => {
      io.to(`user_${data.to}`).emit('ice_candidate', { candidate: data.candidate });
    });

    socket.on('end_call', (data: { to?: string }) => {
      if (data?.to) io.to(`user_${data.to}`).emit('call_ended');
      else socket.broadcast.emit('call_ended');

      // Also tell the other side's native layer to cancel any ringing
      // full-screen notification (covers the case where the app was closed
      // and only ever saw the push, never the socket event).
      if (data?.to) {
        UserModel.findById(data.to).select('pushTokens').then(target => {
          if (target?.pushTokens && target.pushTokens.length > 0) {
            sendDataOnlyPush(target.pushTokens, { type: 'call_ended' }).catch(() => {});
          }
        }).catch(() => {});
      }
    });

    socket.on('disconnect', () => {
      socketUser.delete(socket.id);
      if (userId) {
        const sockets = onlineUsers.get(userId);
        sockets?.delete(socket.id);
        if (sockets && sockets.size === 0) {
          onlineUsers.delete(userId);
          UserModel.findByIdAndUpdate(userId, { isOnline: false, lastSeen: new Date() }).catch(() => {});
          io.emit('presence_update', { userId, isOnline: false });
        }
      }
    });
  });
};
