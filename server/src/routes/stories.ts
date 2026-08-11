import { Router } from 'express';
import { StoryModel } from '../models/StoryModel';
import { UserModel } from '../models/UserModel';
import { authMiddleware, AuthRequest } from '../middleware/authMiddleware';

const router = Router();

const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;

// GET all stories (last 24 hours, plus any highlighted stories regardless of age)
router.get('/', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const cutoff = new Date(Date.now() - TWENTY_FOUR_HOURS);
    const stories = await StoryModel.find({
      $or: [{ createdAt: { $gte: cutoff } }, { isHighlighted: true }],
    }).sort({ createdAt: -1 });
    res.json({ success: true, stories });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Error fetching stories' });
  }
});

// GET a user's highlighted stories (for their profile)
router.get('/highlights/:userId', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const highlights = await StoryModel.find({ userId: req.params.userId, isHighlighted: true }).sort({ createdAt: -1 });
    res.json({ success: true, highlights });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Error fetching highlights' });
  }
});

// POST publish new story
router.post('/', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { mediaUrl, caption, musicTrack, type, pollOptions } = req.body;
    const user = await UserModel.findById(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const story = await StoryModel.create({
      userId: user._id.toString(),
      userName: user.name,
      userAvatar: user.avatar,
      userUsername: user.username,
      mediaUrl,
      type: type || 'image',
      caption,
      musicTrack,
      pollOptions: pollOptions ? pollOptions.map((o: string) => ({ option: o, votes: 0, votedBy: [] })) : undefined,
    });

    res.status(201).json({ success: true, story });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Error creating story' });
  }
});

// Vote on a story poll
router.post('/:id/vote', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { optionIndex } = req.body;
    const story = await StoryModel.findById(req.params.id);
    if (!story || !story.pollOptions) return res.status(404).json({ success: false, message: 'Poll not found' });

    (story.pollOptions as any[]).forEach((opt: any, idx: number) => {
      opt.votedBy = opt.votedBy.filter((id: string) => id !== req.user.id);
      if (idx === optionIndex) {
        opt.votedBy.push(req.user.id);
        opt.votes = opt.votedBy.length;
      } else {
        opt.votes = opt.votedBy.length;
      }
    });

    await story.save();
    res.json({ success: true, story });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Error voting on poll' });
  }
});

// Like a story
router.post('/:id/like', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const story = await StoryModel.findById(req.params.id);
    if (!story) return res.status(404).json({ success: false, message: 'Story not found' });
    const idx = story.likedBy.indexOf(req.user.id);
    if (idx > -1) {
      story.likedBy.splice(idx, 1);
      story.likes = Math.max(0, story.likes - 1);
    } else {
      story.likedBy.push(req.user.id);
      story.likes += 1;
    }
    await story.save();
    res.json({ success: true, likes: story.likes });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Error liking story' });
  }
});

// Toggle highlight (pin story to profile permanently)
router.post('/:id/highlight', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { title } = req.body;
    const story = await StoryModel.findById(req.params.id);
    if (!story) return res.status(404).json({ success: false, message: 'Story not found' });
    if (story.userId !== req.user.id) return res.status(403).json({ success: false, message: 'Not authorized' });

    story.isHighlighted = !story.isHighlighted;
    story.highlightTitle = story.isHighlighted ? (title || story.caption || 'Highlight') : undefined;
    await story.save();
    res.json({ success: true, story });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Error toggling highlight' });
  }
});

// DELETE story
router.delete('/:id', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const story = await StoryModel.findById(req.params.id);
    if (!story) return res.status(404).json({ success: false, message: 'Story not found' });
    if (story.userId !== req.user.id) return res.status(403).json({ success: false, message: 'Not authorized' });
    await story.deleteOne();
    res.json({ success: true, message: 'Story deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Error deleting story' });
  }
});

export default router;
