import { Router } from 'express';
import { CommunityModel } from '../models/CommunityModel';
import { ChannelMessageModel } from '../models/ChannelMessageModel';
import { UserModel } from '../models/UserModel';
import { authMiddleware, AuthRequest } from '../middleware/authMiddleware';

const router = Router();

router.get('/', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const communities = await CommunityModel.find().sort({ createdAt: -1 });
    res.json({ success: true, communities });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Error fetching communities' });
  }
});

router.post('/', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { name, icon, banner, description } = req.body;
    const community = await CommunityModel.create({
      name,
      icon: icon || 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&q=80&w=200',
      banner: banner || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=800',
      description: description || '',
      membersCount: 1,
      members: [req.user.id],
    });
    res.status(201).json({ success: true, community });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Error creating community' });
  }
});

router.post('/:id/join', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const community = await CommunityModel.findById(req.params.id);
    if (!community) return res.status(404).json({ success: false, message: 'Community not found' });
    if (!community.members.includes(req.user.id)) {
      community.members.push(req.user.id);
      community.membersCount = community.members.length;
      await community.save();
    }
    res.json({ success: true, community });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Error joining community' });
  }
});

router.post('/:id/channels', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { name, type } = req.body;
    const community = await CommunityModel.findById(req.params.id);
    if (!community) return res.status(404).json({ success: false, message: 'Community not found' });
    const channel = { id: `ch_${Date.now()}`, name, type: type || 'text' };
    community.channels.push(channel as any);
    await community.save();
    res.status(201).json({ success: true, community });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Error creating channel' });
  }
});

router.get('/:id/channels/:channelId/messages', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const messages = await ChannelMessageModel.find({
      communityId: req.params.id,
      channelId: req.params.channelId,
    }).sort({ createdAt: 1 });
    res.json({ success: true, messages });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Error fetching channel messages' });
  }
});

router.post('/:id/channels/:channelId/messages', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { text } = req.body;
    const user = await UserModel.findById(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const message = await ChannelMessageModel.create({
      communityId: req.params.id,
      channelId: req.params.channelId,
      senderId: user._id.toString(),
      senderName: user.name,
      senderAvatar: user.avatar,
      text,
    });
    res.status(201).json({ success: true, message });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Error sending channel message' });
  }
});

export default router;
