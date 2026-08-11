import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { PUBLIC_URL } from '../config/env';
import { authMiddleware } from '../middleware/authMiddleware';

const router = express.Router();

// Ensure uploads folder exists
const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer Disk Storage Engine
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname) || '.jpg';
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  }
});

const upload = multer({ storage });

// File Upload Handler (Images, Videos, Avatars, Voice Notes)
router.post('/', authMiddleware, upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No file uploaded' });
  }

  const fileUrl = `${PUBLIC_URL}/uploads/${req.file.filename}`;
  res.json({
    success: true,
    fileUrl,
    filename: req.file.filename,
    mimetype: req.file.mimetype,
    size: req.file.size
  });
});

export default router;
