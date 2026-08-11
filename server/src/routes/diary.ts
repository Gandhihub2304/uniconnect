import { Router } from 'express';
import { DiaryEntryModel, TimeCapsuleModel } from '../models/DiaryModel';
import { authMiddleware, AuthRequest } from '../middleware/authMiddleware';

const router = Router();

router.get('/entries', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const search = (req.query.search as string) || '';
    const filter: any = { userId: req.user.id };
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } },
      ];
    }
    const entries = await DiaryEntryModel.find(filter).sort({ createdAt: -1 });
    res.json({ success: true, entries });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Error fetching diary entries' });
  }
});

router.post('/entries', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { title, content, mood, mediaUrl } = req.body;
    const entry = await DiaryEntryModel.create({ userId: req.user.id, title, content, mood, mediaUrl });
    res.status(201).json({ success: true, entry });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Error creating diary entry' });
  }
});

router.get('/capsules', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const capsules = await TimeCapsuleModel.find({ userId: req.user.id }).sort({ unlockDate: 1 });
    res.json({ success: true, capsules });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Error fetching time capsules' });
  }
});

router.post('/capsules', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { title, message, mediaUrl, unlockDate } = req.body;
    const capsule = await TimeCapsuleModel.create({ userId: req.user.id, title, message, mediaUrl, unlockDate });
    res.status(201).json({ success: true, capsule });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Error creating time capsule' });
  }
});

export default router;
