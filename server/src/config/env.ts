import dotenv from 'dotenv';

dotenv.config();

export const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/uniconnect';
export const JWT_SECRET = process.env.JWT_SECRET || 'uniconnect_super_secret_jwt_key_2026';
export const PORT = process.env.PORT || 5000;
export const PUBLIC_URL = process.env.PUBLIC_URL || `http://localhost:${PORT}`;

export const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME || '';
export const CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY || '';
export const CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET || '';
