import { Router } from 'express';
import { ReelModel } from '../models/ReelModel';
import { CommentModel } from '../models/CommentModel';
import { UserModel } from '../models/UserModel';
import { authMiddleware, AuthRequest } from '../middleware/authMiddleware';
import { createNotification } from '../utils/notify';

const router = Router();

router.get('/', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const reels = await ReelModel.find().sort({ createdAt: -1 });
    res.json({ success: true, reels });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Error fetching reels' });
  }
});

router.post('/', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { videoUrl, caption, musicTrack } = req.body;
    const user = await UserModel.findById(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const reel = await ReelModel.create({
      userId: user._id.toString(),
      userName: user.name,
      userAvatar: user.avatar,
      userUsername: user.username,
      videoUrl,
      caption,
      musicTrack,
    });
    res.status(201).json({ success: true, reel });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Error creating reel' });
  }
});

router.post('/:id/like', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const reel = await ReelModel.findById(req.params.id);
    if (!reel) return res.status(404).json({ success: false, message: 'Reel not found' });

    const idx = reel.likedBy.indexOf(req.user.id);
    let liked: boolean;
    if (idx > -1) {
      reel.likedBy.splice(idx, 1);
      reel.likes = Math.max(0, reel.likes - 1);
      liked = false;
    } else {
      reel.likedBy.push(req.user.id);
      reel.likes += 1;
      liked = true;
      if (reel.userId !== req.user.id) {
        const me = await UserModel.findById(req.user.id);
        if (me) await createNotification({ userId: reel.userId, type: 'like', fromUserId: req.user.id, fromUserName: me.name, fromUserAvatar: me.avatar, text: `${me.name} liked your reel`, targetId: reel._id.toString() });
      }
    }
    await reel.save();
    res.json({ success: true, likes: reel.likes, liked });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Error toggling like' });
  }
});

router.get('/:id/comments', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const comments = await CommentModel.find({ targetType: 'reel', targetId: req.params.id }).sort({ createdAt: 1 });
    res.json({ success: true, comments });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Error fetching comments' });
  }
});

router.post('/:id/comments', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ success: false, message: 'Comment text is required' });

    const user = await UserModel.findById(req.user.id);
    const reel = await ReelModel.findById(req.params.id);
    if (!user || !reel) return res.status(404).json({ success: false, message: 'Not found' });

    const comment = await CommentModel.create({
      targetType: 'reel', targetId: req.params.id,
      userId: user._id.toString(), userName: user.name, userAvatar: user.avatar, userUsername: user.username,
      text,
    });
    reel.commentsCount += 1;
    await reel.save();

    res.status(201).json({ success: true, comment });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Error adding comment' });
  }
});

export default router;
