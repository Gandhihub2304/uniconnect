import { Router } from 'express';
import { SavedItemModel } from '../models/SavedItemModel';
import { PostModel } from '../models/PostModel';
import { authMiddleware, AuthRequest } from '../middleware/authMiddleware';

const router = Router();

router.get('/', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const savedItems = await SavedItemModel.find({ userId: req.user.id }).sort({ createdAt: -1 });
    const postIds = savedItems.map((s) => s.postId);
    const posts = await PostModel.find({ _id: { $in: postIds } });
    const postsById = new Map(posts.map((p) => [p._id.toString(), p]));
    const orderedPosts = postIds.map((id) => postsById.get(id)).filter(Boolean);
    res.json({ success: true, posts: orderedPosts });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Error fetching saved posts' });
  }
});

export default router;
