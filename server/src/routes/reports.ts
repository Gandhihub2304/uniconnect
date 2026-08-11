import { Router } from 'express';
import { ReportModel } from '../models/ReportModel';
import { UserModel } from '../models/UserModel';
import { authMiddleware, AuthRequest } from '../middleware/authMiddleware';

const router = Router();

// Create a report (post or user)
router.post('/', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { targetType, targetId, reason } = req.body;
    if (!targetType || !targetId || !reason) {
      return res.status(400).json({ success: false, message: 'targetType, targetId, and reason are required' });
    }

    const reporter = await UserModel.findById(req.user.id);
    if (!reporter) return res.status(404).json({ success: false, message: 'User not found' });

    const report = await ReportModel.create({
      targetType,
      targetId,
      reporterId: reporter._id.toString(),
      reporterName: reporter.name,
      reason,
    });

    res.status(201).json({ success: true, report });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Error creating report' });
  }
});

// Admin: list reports (pending by default)
router.get('/', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const status = (req.query.status as string) || 'pending';
    const filter = status === 'all' ? {} : { status };
    const reports = await ReportModel.find(filter).sort({ createdAt: -1 }).limit(100);
    res.json({ success: true, reports });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Error fetching reports' });
  }
});

// Admin: resolve or dismiss a report
router.patch('/:id', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { status } = req.body;
    if (!['resolved', 'dismissed'].includes(status)) {
      return res.status(400).json({ success: false, message: 'status must be resolved or dismissed' });
    }
    const report = await ReportModel.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!report) return res.status(404).json({ success: false, message: 'Report not found' });
    res.json({ success: true, report });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Error updating report' });
  }
});

export default router;
