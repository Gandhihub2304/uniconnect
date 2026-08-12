import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import path from 'path';

import { PORT } from './config/env';
import { connectDB } from './config/db';
import authRoutes from './routes/auth';
import postsRoutes from './routes/posts';
import storiesRoutes from './routes/stories';
import chatsRoutes from './routes/chats';
import uploadRoutes from './routes/upload';
import { setupSocketHandlers } from './sockets/chatSocket';
import { setIO } from './sockets/ioInstance';
import notificationsRoutes from './routes/notifications';
import reelsRoutes from './routes/reels';
import savedRoutes from './routes/saved';
import searchRoutes from './routes/search';

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE']
  }
});
setIO(io);

// Middlewares
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Connect Database
connectDB();

// Setup Socket.IO
setupSocketHandlers(io);

// REST API Routes
app.use('/api/auth', authRoutes);
app.use('/api/posts', postsRoutes);
app.use('/api/stories', storiesRoutes);
app.use('/api/chats', chatsRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/reels', reelsRoutes);
app.use('/api/saved', savedRoutes);
app.use('/api/search', searchRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'UniConnect Backend API Server', time: new Date() });
});

server.listen(PORT, () => {
  console.log(`==================================================`);
  console.log(`🚀 UniConnect Server Running at http://localhost:${PORT}`);
  console.log(`📡 Socket.IO Real-time Engine initialized`);
  console.log(`==================================================`);
});
