import { Router } from 'express';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

router.post('/prompt', authMiddleware, (req, res) => {
  const { prompt } = req.body;
  const lower = (prompt || '').toLowerCase();

  let reply = "I'm UniConnect AI! I can help you summarize chats, generate post captions, plan events, or search your memories.";

  if (lower.includes('chat') || lower.includes('summarize')) {
    reply = "📌 **AI Unread Chat Summary**:\n• Ananya asked if you're coming to the Goa meetup.\n• Core Dev Squad reported that WebRTC video calling tests passed with sub-50ms latency!";
  } else if (lower.includes('caption')) {
    reply = "✨ **Suggested Caption**:\n\"Chasing sunsets and making memories that last a lifetime 🌅✨ #UniConnect #Vibes #GoaDiaries\"";
  } else if (lower.includes('event') || lower.includes('plan')) {
    reply = "📅 **Event Plan Suggestion**: Badminton Championship 🏸\n• Suggested Time: This Saturday @ 9:00 AM\n• Location: Main Sports Complex Court 2\n• Suggested Circle: Sports & Friends";
  } else if (lower.includes('goa') || lower.includes('memory') || lower.includes('photo')) {
    reply = "📸 **AI Memory Search Results**:\nFound 4 memories from Goa Trip (May 2025) including Ananya's sunset upload and group beach volleyball photos.";
  }

  res.json({ success: true, reply });
});

export default router;
