import { Router } from 'express';
import { ChatModel } from '../models/ChatModel';
import { MessageModel } from '../models/MessageModel';
import { UserModel } from '../models/UserModel';
import { authMiddleware, AuthRequest } from '../middleware/authMiddleware';
import { getIO } from '../sockets/ioInstance';
import { sendPushNotification } from '../config/firebase';

const router = Router();

// Push a "new message" alert to every other participant of a chat who has a registered device,
// pruning any tokens Firebase reports as no-longer-valid.
async function notifyChatParticipants(chatId: string, senderName: string, messagePreview: string, senderId: string) {
  const chat = await ChatModel.findById(chatId);
  if (!chat) return;

  const recipientIds = chat.participants.filter((pid: string) => pid !== senderId);
  if (recipientIds.length === 0) return;

  const recipients = await UserModel.find({ _id: { $in: recipientIds } }).select('pushTokens');
  const allTokens = recipients.flatMap(r => r.pushTokens || []);
  if (allTokens.length === 0) return;

  const result = await sendPushNotification(
    allTokens,
    { title: senderName, body: messagePreview },
    { type: 'new_message', chatId }
  );

  if (result?.staleTokens && result.staleTokens.length > 0) {
    await UserModel.updateMany(
      { _id: { $in: recipientIds } },
      { $pullAll: { pushTokens: result.staleTokens } }
    );
  }
}

router.get('/', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const chats = await ChatModel.find({ participants: req.user.id }).sort({ lastMessageTime: -1 });

    // Enrich each chat with the other participant's username
    const enriched = await Promise.all(
      chats.map(async (chat) => {
        const chatObj = chat.toObject() as any;
        if (!chat.isGroup) {
          const otherParticipantId = chat.participants.find((pid: string) => pid !== req.user.id);
          if (otherParticipantId) {
            const otherUser = await UserModel.findById(otherParticipantId).select('username name avatar isOnline lastSeen');
            if (otherUser) {
              chatObj.username = otherUser.username;
              chatObj.name = otherUser.name;
              chatObj.avatar = otherUser.avatar;
              chatObj.otherUserId = otherParticipantId;
              chatObj.isOnline = otherUser.isOnline;
              chatObj.lastSeen = otherUser.lastSeen;
            }
          }
        }
        const unreadCount = await MessageModel.countDocuments({
          chatId: chat._id,
          senderId: { $ne: req.user.id },
          readBy: { $ne: req.user.id },
          deletedFor: { $ne: req.user.id },
        });
        chatObj.unread = unreadCount;
        return chatObj;
      })
    );

    res.json({ success: true, chats: enriched });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Error fetching chats' });
  }
});

// Start (or get existing) a 1:1 chat with another user
router.post('/', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { participantId } = req.body;
    if (!participantId) return res.status(400).json({ success: false, message: 'participantId is required' });

    let chat = await ChatModel.findOne({ isGroup: false, participants: { $all: [req.user.id, participantId], $size: 2 } });
    if (!chat) {
      const otherUser = await UserModel.findById(participantId);
      if (!otherUser) return res.status(404).json({ success: false, message: 'User not found' });
      chat = await ChatModel.create({
        isGroup: false,
        participants: [req.user.id, participantId],
        name: otherUser.name,
        avatar: otherUser.avatar,
      });
    }
    res.status(201).json({ success: true, chat });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Error creating chat' });
  }
});

// Update Disappearing Messages Timer setting for chat
router.put('/:chatId/disappearing', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { timer } = req.body; // 'off' | '10s' | '24h' | '7d'
    const chat = await ChatModel.findByIdAndUpdate(req.params.chatId, { disappearingTimer: timer }, { new: true });
    if (!chat) return res.status(404).json({ success: false, message: 'Chat not found' });

    const io = getIO();
    if (io) {
      io.to(`chat_${chat._id}`).emit('disappearing_timer_updated', {
        chatId: chat._id.toString(),
        disappearingTimer: timer
      });
    }

    res.json({ success: true, chat });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Error updating disappearing timer' });
  }
});

// Clear entire chat history for both users
router.delete('/:chatId/clear', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const chatId = req.params.chatId;
    await MessageModel.deleteMany({ chatId });
    await ChatModel.findByIdAndUpdate(chatId, { lastMessage: '', lastMessageTime: new Date() });

    const io = getIO();
    if (io) {
      io.to(`chat_${chatId}`).emit('chat_cleared', { chatId });
      io.emit('chat_updated', { chatId, lastMessage: '', lastMessageTime: new Date() });
    }

    res.json({ success: true, message: 'Chat history cleared for both participants' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Error clearing chat history' });
  }
});

// Mark all messages in a chat as read by the current user (read receipts)
router.put('/:chatId/read', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const chatId = req.params.chatId;
    await MessageModel.updateMany(
      { chatId, senderId: { $ne: req.user.id }, readBy: { $ne: req.user.id } },
      { $addToSet: { readBy: req.user.id } }
    );

    const io = getIO();
    if (io) {
      io.to(`chat_${chatId}`).emit('messages_read', { chatId, readerId: req.user.id });
    }

    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Error marking messages as read' });
  }
});

router.get('/:chatId/messages', authMiddleware, async (req: AuthRequest, res) => {
  try {
    // Purge expired disappearing messages from database
    await MessageModel.deleteMany({
      chatId: req.params.chatId,
      expiresAt: { $exists: true, $ne: null, $lte: new Date() }
    });

    const messages = await MessageModel.find({
      chatId: req.params.chatId,
      deletedFor: { $ne: req.user.id }
    }).sort({ createdAt: 1 });

    // Enrich each message with the sender's current name and avatar from the DB
    const enriched = await Promise.all(
      messages.map(async (msg) => {
        const msgObj = msg.toObject() as any;
        if (msg.senderId) {
          const sender = await UserModel.findById(msg.senderId).select('name avatar username');
          if (sender) {
            msgObj.senderName = sender.name;
            msgObj.senderAvatar = sender.avatar;
            msgObj.senderUsername = sender.username;
          }
        }
        return msgObj;
      })
    );

    res.json({ success: true, messages: enriched });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Error fetching messages' });
  }
});

router.post('/:chatId/messages', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { text, mediaUrl, mediaType, fileName, fileSize, isViewOnce, replyToId, disappearingTimer } = req.body;
    const chatId = req.params.chatId;

    const user = await UserModel.findById(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    // Calculate expiration date for disappearing messages
    let expiresAt: Date | undefined = undefined;
    if (disappearingTimer === '10s') {
      expiresAt = new Date(Date.now() + 10 * 1000);
    } else if (disappearingTimer === '24h') {
      expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    } else if (disappearingTimer === '7d') {
      expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    }

    const message = await MessageModel.create({
      chatId,
      senderId: user._id.toString(),
      senderName: user.name,
      senderAvatar: user.avatar,
      text: text || '',
      mediaUrl,
      mediaType,
      fileName,
      fileSize,
      isViewOnce: !!isViewOnce,
      disappearingTimer: disappearingTimer || 'off',
      expiresAt,
      replyToId,
    });

    const lastMsgText = isViewOnce ? '📷 1x View Once Photo' : (text || (mediaType === 'image' ? '📷 Photo' : mediaType === 'document' ? '📄 Document' : 'Sent media'));

    await ChatModel.findByIdAndUpdate(chatId, {
      lastMessage: lastMsgText,
      lastMessageTime: new Date(),
    });

    const enrichedMsg = message.toObject() as any;
    enrichedMsg.senderName = user.name;
    enrichedMsg.senderAvatar = user.avatar;

    // Real-time socket broadcast
    const io = getIO();
    if (io) {
      io.to(`chat_${chatId}`).emit('new_message', enrichedMsg);
      io.emit('chat_updated', { chatId, lastMessage: lastMsgText, lastMessageTime: new Date() });
    }

    // Push notification to the other participant(s), for when the app is closed/backgrounded
    notifyChatParticipants(chatId, user.name, lastMsgText, req.user.id).catch(() => {});

    res.status(201).json({ success: true, message: enrichedMsg });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Error sending message' });
  }
});

// Mark view-once message as viewed/opened
router.post('/messages/:id/view-once', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const message = await MessageModel.findById(req.params.id);
    if (!message) return res.status(404).json({ success: false, message: 'Message not found' });

    if (message.isViewOnce) {
      if (!message.viewedBy) message.viewedBy = [];
      if (!message.viewedBy.includes(req.user.id)) {
        message.viewedBy.push(req.user.id);
        await message.save();
      }
    }

    const io = getIO();
    if (io) {
      io.to(`chat_${message.chatId}`).emit('view_once_opened', {
        messageId: message._id.toString(),
        viewedBy: message.viewedBy
      });
    }

    res.json({ success: true, message });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Error viewing message' });
  }
});

// Edit a message
router.put('/messages/:id', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { text } = req.body;
    const message = await MessageModel.findById(req.params.id);
    if (!message) return res.status(404).json({ success: false, message: 'Message not found' });

    if (message.senderId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'You can only edit your own messages' });
    }

    message.text = text;
    message.isEdited = true;
    await message.save();

    const io = getIO();
    if (io) {
      io.to(`chat_${message.chatId}`).emit('message_edited', {
        messageId: message._id.toString(),
        text: message.text,
        isEdited: true
      });
    }

    res.json({ success: true, message });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Error editing message' });
  }
});

// Delete a message (For Me / For Everyone)
router.delete('/messages/:id', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const deleteType = req.query.type as string; // 'me' | 'everyone'
    const message = await MessageModel.findById(req.params.id);
    if (!message) return res.status(404).json({ success: false, message: 'Message not found' });

    if (deleteType === 'everyone') {
      if (message.senderId !== req.user.id) {
        return res.status(403).json({ success: false, message: 'Only sender can delete for everyone' });
      }
      message.isDeletedForEveryone = true;
      message.text = '🚫 This message was deleted';
      message.mediaUrl = undefined;
      message.mediaType = undefined;
      message.isViewOnce = false;
      await message.save();

      const io = getIO();
      if (io) {
        io.to(`chat_${message.chatId}`).emit('message_deleted', {
          messageId: message._id.toString(),
          deleteType: 'everyone',
          text: '🚫 This message was deleted'
        });
      }
    } else {
      // Delete for me
      if (!message.deletedFor) message.deletedFor = [];
      if (!message.deletedFor.includes(req.user.id)) {
        message.deletedFor.push(req.user.id);
        await message.save();
      }

      const io = getIO();
      if (io) {
        io.to(`user_${req.user.id}`).emit('message_deleted', {
          messageId: message._id.toString(),
          deleteType: 'me',
          userId: req.user.id
        });
      }
    }

    res.json({ success: true, message });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Error deleting message' });
  }
});

// React to a message
router.post('/messages/:id/react', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { emoji } = req.body;
    const message = await MessageModel.findById(req.params.id);
    if (!message) return res.status(404).json({ success: false, message: 'Message not found' });

    message.reactions = (message.reactions || []).filter((r: any) => r.userId !== req.user.id);
    if (emoji) message.reactions.push({ emoji, userId: req.user.id });
    await message.save();

    const io = getIO();
    if (io) {
      io.to(`chat_${message.chatId}`).emit('message_reacted', {
        messageId: message._id.toString(),
        reactions: message.reactions
      });
    }

    res.json({ success: true, message });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Error reacting to message' });
  }
});

// Accept friend / follow request
router.post('/accept-friend', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { fromUserId, fromUserName } = req.body;
    if (!fromUserId) return res.status(400).json({ success: false, message: 'fromUserId is required' });

    const currentUser = await UserModel.findById(req.user.id);
    const requestingUser = await UserModel.findById(fromUserId);

    let chat = await ChatModel.findOne({ isGroup: false, participants: { $all: [req.user.id, fromUserId], $size: 2 } });
    if (!chat) {
      chat = await ChatModel.create({
        isGroup: false,
        participants: [req.user.id, fromUserId],
        name: requestingUser ? requestingUser.name : (fromUserName || 'Friend'),
        avatar: requestingUser ? requestingUser.avatar : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=300',
      });
    }

    // Send confirmation notification back to requester
    if (requestingUser) {
      const NotificationModel = (await import('../models/NotificationModel')).NotificationModel;
      const getIO = (await import('../sockets/ioInstance')).getIO;

      // Clean up original pending request
      await NotificationModel.findOneAndDelete({ userId: req.user.id, fromUserId, type: 'follow_request' });

      const confirmNotif = await NotificationModel.create({
        userId: fromUserId,
        type: 'follow',
        fromUserId: req.user.id,
        fromUserName: currentUser ? currentUser.name : 'User',
        fromUserAvatar: currentUser ? currentUser.avatar : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=300',
        text: 'accepted your follow request! You are now connected 🎉',
        isRead: false,
      });

      const io = getIO();
      if (io) {
        io.to(`user_${fromUserId}`).emit('new_notification', confirmNotif);
      }
    }

    res.status(200).json({ success: true, chat });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Error accepting friend request' });
  }
});

export default router;
