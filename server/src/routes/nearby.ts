import { Router } from 'express';
import { UserModel } from '../models/UserModel';
import { authMiddleware, AuthRequest } from '../middleware/authMiddleware';

const router = Router();

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// GET /api/nearby?lat=..&lng=..&radiusKm=10
router.get('/', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const lat = parseFloat(req.query.lat as string);
    const lng = parseFloat(req.query.lng as string);
    const radiusKm = req.query.radiusKm ? parseFloat(req.query.radiusKm as string) : 10;

    if (Number.isNaN(lat) || Number.isNaN(lng)) {
      return res.status(400).json({ success: false, message: 'lat and lng query params are required' });
    }

    // Also persist the requester's own last-known location
    await UserModel.findByIdAndUpdate(req.user.id, { geo: { lat, lng } });

    const users = await UserModel.find({ _id: { $ne: req.user.id }, geo: { $exists: true } }).select('-password');
    const nearby = users
      .map((u) => ({
        user: u,
        distanceKm: haversineKm(lat, lng, u.geo!.lat, u.geo!.lng),
      }))
      .filter((entry) => entry.distanceKm <= radiusKm)
      .sort((a, b) => a.distanceKm - b.distanceKm);

    res.json({ success: true, nearby });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Error fetching nearby users' });
  }
});

export default router;
