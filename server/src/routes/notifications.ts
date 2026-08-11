import { Router } from 'express';
import { NotificationModel } from '../models/NotificationModel';
import { authMiddleware, AuthRequest } from '../middleware/authMiddleware';

import { UserModel } from '../models/UserModel';
import { getIO } from '../sockets/ioInstance';

const router = Router();

router.get('/', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const notifications = await NotificationModel.find({ userId: req.user.id }).sort({ createdAt: -1 }).limit(50);
    res.json({ success: true, notifications });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Error fetching notifications' });
  }
});

// Get follow requests sent by logged-in user (to persist requested state on page refresh)
router.get('/sent', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const sentNotifications = await NotificationModel.find({ fromUserId: req.user.id, type: 'follow_request' });
    res.json({ success: true, notifications: sentNotifications });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Error fetching sent notifications' });
  }
});

// Create notification (e.g. follow request, like, comment)
router.post('/', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { userId, type, text, targetId, fromUserId, fromUserName, fromUserAvatar } = req.body;
    if (!userId || !type || !text) {
      return res.status(400).json({ success: false, message: 'userId, type, and text are required' });
    }

    const sender = await UserModel.findById(req.user.id);

    const notification = await NotificationModel.create({
      userId,
      type,
      fromUserId: fromUserId || req.user.id,
      fromUserName: fromUserName || (sender ? sender.name : 'User'),
      fromUserAvatar: fromUserAvatar || (sender ? sender.avatar : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=300'),
      text,
      targetId,
      isRead: false,
    });

    // Real-time notification socket dispatch directly to recipient's socket room
    const io = getIO();
    if (io) {
      io.to(`user_${userId}`).emit('new_notification', notification);
    }

    res.status(201).json({ success: true, notification });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Error creating notification' });
  }
});

router.patch('/:id/read', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const notification = await NotificationModel.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { isRead: true },
      { new: true }
    );
    if (!notification) return res.status(404).json({ success: false, message: 'Notification not found' });
    res.json({ success: true, notification });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Error updating notification' });
  }
});

router.patch('/read-all', authMiddleware, async (req: AuthRequest, res) => {
  try {
    await NotificationModel.updateMany({ userId: req.user.id, isRead: false }, { isRead: true });
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Error marking notifications read' });
  }
});

// Delete notification (e.g. decline follow request)
router.delete('/:id', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const notification = await NotificationModel.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
    if (!notification) return res.status(404).json({ success: false, message: 'Notification not found' });
    res.json({ success: true, message: 'Notification deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Error deleting notification' });
  }
});

export default router;
