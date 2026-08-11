import { Router } from 'express';
import { UserModel } from '../models/UserModel';
import { PostModel } from '../models/PostModel';
import { StoryModel } from '../models/StoryModel';
import { EventModel } from '../models/EventModel';
import { CommunityModel } from '../models/CommunityModel';
import { authMiddleware, AuthRequest } from '../middleware/authMiddleware';

const router = Router();

router.get('/stats', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const [totalUsers, totalPosts, totalStories, totalEvents, activeCommunities, users] = await Promise.all([
      UserModel.countDocuments(),
      PostModel.countDocuments(),
      StoryModel.countDocuments(),
      EventModel.countDocuments(),
      CommunityModel.countDocuments(),
      UserModel.find().select('-password').sort({ createdAt: -1 }).limit(50),
    ]);

    res.json({
      success: true,
      stats: {
        totalUsers,
        totalPosts,
        totalStories,
        totalEvents,
        activeCommunities,
        uptimeSeconds: Math.floor(process.uptime()),
      },
      users,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Error fetching admin stats' });
  }
});

router.delete('/users/:id', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const user = await UserModel.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, message: 'User deleted' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Error deleting user' });
  }
});

router.delete('/posts/:id', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const post = await PostModel.findByIdAndDelete(req.params.id);
    if (!post) return res.status(404).json({ success: false, message: 'Post not found' });
    res.json({ success: true, message: 'Post deleted' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Error deleting post' });
  }
});

export default router;
