import { Router } from 'express';
import { UserModel } from '../models/UserModel';
import { PostModel } from '../models/PostModel';
import { CommunityModel } from '../models/CommunityModel';
import { authMiddleware, AuthRequest } from '../middleware/authMiddleware';

const router = Router();

router.get('/', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const q = ((req.query.q as string) || '').trim();
    if (!q) {
      return res.json({ success: true, users: [], posts: [], communities: [] });
    }

    const regex = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');

    const [users, posts, communities] = await Promise.all([
      UserModel.find({
        _id: { $ne: req.user.id },
        $or: [{ name: regex }, { username: regex }],
      }).select('name username avatar bio').limit(6),

      PostModel.find({
        isHidden: { $ne: true },
        $or: [{ content: regex }, { hashtags: regex }],
      }).sort({ createdAt: -1 }).limit(6),

      CommunityModel.find({
        $or: [{ name: regex }, { description: regex }],
      }).limit(6),
    ]);

    res.json({ success: true, users, posts, communities });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Error searching' });
  }
});

export default router;
