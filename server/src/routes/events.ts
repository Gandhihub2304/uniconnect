import { Router } from 'express';
import { EventModel } from '../models/EventModel';
import { authMiddleware, AuthRequest } from '../middleware/authMiddleware';

const router = Router();

router.get('/', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const events = await EventModel.find().sort({ createdAt: -1 });
    res.json({ success: true, events });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Error fetching events' });
  }
});

router.post('/', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { title, date, time, location, category, image } = req.body;
    const event = await EventModel.create({
      title,
      date: date || '10 JUN',
      time: time || '05:00 PM',
      location: location || 'Campus Hub',
      category: category || 'General',
      attendeesCount: 1,
      attendees: [req.user.id],
      image: image || 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&q=80&w=600',
      expenses: [],
      createdBy: req.user.id,
    });
    res.status(201).json({ success: true, event });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Error creating event' });
  }
});

router.post('/:id/rsvp', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const event = await EventModel.findById(req.params.id);
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });

    const idx = event.attendees.indexOf(req.user.id);
    let attending: boolean;
    if (idx > -1) {
      event.attendees.splice(idx, 1);
      attending = false;
    } else {
      event.attendees.push(req.user.id);
      attending = true;
    }
    event.attendeesCount = event.attendees.length;
    await event.save();
    res.json({ success: true, attending, attendeesCount: event.attendeesCount, event });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Error updating RSVP' });
  }
});

export default router;
