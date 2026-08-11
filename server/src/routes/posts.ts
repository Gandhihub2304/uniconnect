import { Router } from 'express';
import { PostModel } from '../models/PostModel';
import { CommentModel } from '../models/CommentModel';
import { SavedItemModel } from '../models/SavedItemModel';
import { UserModel } from '../models/UserModel';
import { authMiddleware, AuthRequest } from '../middleware/authMiddleware';
import { createNotification } from '../utils/notify';

const router = Router();

// Get feed posts (with circle filtering)
router.get('/', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const circle = (req.query.circle as string) || 'For You';
    const filter: any = { isHidden: { $ne: true } };
    if (circle !== 'For You') filter.circle = circle;

    const posts = await PostModel.find(filter).sort({ isPinned: -1, createdAt: -1 });
    res.json({ success: true, posts });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Error fetching posts' });
  }
});

// Create new post
router.post('/', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { content, media, circle } = req.body;
    const user = await UserModel.findById(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const hashtags = Array.from(new Set(((content || '').match(/#[a-z0-9_]+/gi) || []).map((h: string) => h.toLowerCase())));

    const postDoc = new PostModel({
      userId: user._id.toString(),
      userName: user.name,
      userAvatar: user.avatar,
      userUsername: user.username,
      isVerified: true,
      content,
      media: media || [],
      circle: circle || 'For You',
      hashtags,
      aiSummary: `AI Summary: ${(content || '').substring(0, 80)}...`,
    });

    await postDoc.save();
    res.status(201).json({ success: true, post: postDoc });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Error creating post' });
  }
});

// Explore / trending feed — recent posts ranked by engagement, plus top hashtags
router.get('/explore', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const hashtag = (req.query.hashtag as string) || '';
    const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const filter: any = { isHidden: { $ne: true }, createdAt: { $gte: cutoff } };
    if (hashtag) filter.hashtags = hashtag.toLowerCase().startsWith('#') ? hashtag.toLowerCase() : `#${hashtag.toLowerCase()}`;

    const posts = await PostModel.aggregate([
      { $match: filter },
      { $addFields: { score: { $add: ['$likes', { $multiply: ['$commentsCount', 2] }] } } },
      { $sort: { score: -1, createdAt: -1 } },
      { $limit: 30 },
    ]);

    const trendingHashtags = await PostModel.aggregate([
      { $match: { isHidden: { $ne: true }, createdAt: { $gte: cutoff }, hashtags: { $exists: true, $ne: [] } } },
      { $unwind: '$hashtags' },
      { $group: { _id: '$hashtags', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]);

    res.json({
      success: true,
      posts,
      trendingHashtags: trendingHashtags.map((h) => ({ tag: h._id, count: h.count })),
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Error fetching explore feed' });
  }
});

// Delete post
router.delete('/:id', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const post = await PostModel.findById(req.params.id);
    if (!post) return res.status(404).json({ success: false, message: 'Post not found' });
    if (post.userId !== req.user.id) return res.status(403).json({ success: false, message: 'Not authorized to delete this post' });
    await post.deleteOne();
    res.json({ success: true, message: 'Post deleted' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Error deleting post' });
  }
});

// Pin / hide flags
router.patch('/:id', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { isPinned, isHidden } = req.body;
    const post = await PostModel.findById(req.params.id);
    if (!post) return res.status(404).json({ success: false, message: 'Post not found' });
    if (post.userId !== req.user.id) return res.status(403).json({ success: false, message: 'Not authorized' });
    if (isPinned !== undefined) post.isPinned = isPinned;
    if (isHidden !== undefined) post.isHidden = isHidden;
    await post.save();
    res.json({ success: true, post });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Error updating post' });
  }
});

// Like / Unlike post
router.post('/:id/like', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const postId = req.params.id;
    const userId = req.user.id;

    const postDoc = await PostModel.findById(postId);
    if (!postDoc) return res.status(404).json({ success: false, message: 'Post not found' });

    const index = postDoc.likedBy.indexOf(userId);
    let liked: boolean;
    if (index > -1) {
      postDoc.likedBy.splice(index, 1);
      postDoc.likes = Math.max(0, postDoc.likes - 1);
      liked = false;
    } else {
      postDoc.likedBy.push(userId);
      postDoc.likes += 1;
      liked = true;
      if (postDoc.userId !== userId) {
        const me = await UserModel.findById(userId);
        if (me) await createNotification({ userId: postDoc.userId, type: 'like', fromUserId: userId, fromUserName: me.name, fromUserAvatar: me.avatar, text: `${me.name} liked your post`, targetId: postId });
      }
    }
    await postDoc.save();
    res.json({ success: true, likes: postDoc.likes, liked });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Error toggling like' });
  }
});

// Comments
router.get('/:id/comments', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const comments = await CommentModel.find({ targetType: 'post', targetId: req.params.id }).sort({ createdAt: 1 });
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
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const post = await PostModel.findById(req.params.id);
    if (!post) return res.status(404).json({ success: false, message: 'Post not found' });

    const comment = await CommentModel.create({
      targetType: 'post', targetId: req.params.id,
      userId: user._id.toString(), userName: user.name, userAvatar: user.avatar, userUsername: user.username,
      text,
    });

    post.commentsCount += 1;
    await post.save();

    if (post.userId !== user._id.toString()) {
      await createNotification({ userId: post.userId, type: 'comment', fromUserId: user._id.toString(), fromUserName: user.name, fromUserAvatar: user.avatar, text: `${user.name} commented on your post`, targetId: post._id.toString() });
    }

    res.status(201).json({ success: true, comment });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Error adding comment' });
  }
});

// Save / unsave (bookmark)
router.post('/:id/save', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const userId = req.user.id;
    const postId = req.params.id;
    const existing = await SavedItemModel.findOne({ userId, postId });
    if (existing) {
      await existing.deleteOne();
      return res.json({ success: true, saved: false });
    }
    await SavedItemModel.create({ userId, postId });
    res.json({ success: true, saved: true });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Error toggling save' });
  }
});

export default router;
