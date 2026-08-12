import express from 'express';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import { authMiddleware } from '../middleware/authMiddleware';
import { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } from '../config/env';

const router = express.Router();

cloudinary.config({
  cloud_name: CLOUDINARY_CLOUD_NAME,
  api_key: CLOUDINARY_API_KEY,
  api_secret: CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => ({
    folder: 'uniconnect',
    resource_type: file.mimetype.startsWith('video') ? 'video' : 'image',
  }),
});

const upload = multer({ storage, limits: { fileSize: 100 * 1024 * 1024 } });

// File Upload Handler (Images, Videos, Avatars, Voice Notes) — stored permanently on Cloudinary
router.post('/', authMiddleware, upload.single('file'), (req, res) => {
  const file = req.file as Express.Multer.File & { path: string; filename: string };
  if (!file) {
    return res.status(400).json({ success: false, message: 'No file uploaded' });
  }

  res.json({
    success: true,
    fileUrl: file.path,
    filename: file.filename,
    mimetype: file.mimetype,
    size: file.size,
  });
});

export default router;
