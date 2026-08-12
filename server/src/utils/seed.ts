import mongoose from 'mongoose';
import { MONGO_URI } from '../config/env';
import { UserModel } from '../models/UserModel';
import { PostModel } from '../models/PostModel';
import { StoryModel } from '../models/StoryModel';
import { ChatModel } from '../models/ChatModel';
import { MessageModel } from '../models/MessageModel';

const SEED_PASSWORD = 'uniconnect123';

const seedUsers = [
  { name: 'Manoj Gandhi', username: 'manoj_28', email: 'manoj@uniconnect.app', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=300', coverImage: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=1200', bio: 'Computer Science Student | Tech Enthusiast 🚀', location: 'Bangalore, India' },
  { name: 'Ananya Sharma', username: 'ananya_s', email: 'ananya@uniconnect.app', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=300' },
  { name: 'Rahul Verma', username: 'rahul_v', email: 'rahul@uniconnect.app', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=300' },
  { name: 'Sneha Reddy', username: 'sneha_r', email: 'sneha@uniconnect.app', avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=300' },
  { name: 'Karthik Raj', username: 'karthik_r', email: 'karthik@uniconnect.app', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=300' },
  { name: 'Harsha Vardhan', username: 'harsha_v', email: 'harsha@uniconnect.app', avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&q=80&w=300' },
];

async function run() {
  await mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 5000 });
  console.log(`Connected to ${MONGO_URI}`);

  const existingCount = await UserModel.countDocuments();
  if (existingCount > 0) {
    console.log(`Database already has ${existingCount} users. Skipping seed to avoid duplicates.`);
    console.log('To re-seed from scratch, drop the database first.');
    await mongoose.disconnect();
    return;
  }

  const createdUsers: Record<string, any> = {};
  for (const u of seedUsers) {
    const user = new UserModel({ ...u, password: SEED_PASSWORD });
    await user.save();
    createdUsers[u.username] = user;
    console.log(`Created user ${u.username}`);
  }

  const manoj = createdUsers['manoj_28'];
  const ananya = createdUsers['ananya_s'];
  const rahul = createdUsers['rahul_v'];
  const sneha = createdUsers['sneha_r'];
  const karthik = createdUsers['karthik_r'];
  const harsha = createdUsers['harsha_v'];

  await PostModel.create([
    {
      userId: ananya._id, userName: ananya.name, userAvatar: ananya.avatar, userUsername: ananya.username, isVerified: true,
      content: 'Sunsets are proof that endings can be beautiful too. 🌇💖',
      media: ['https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&q=80&w=1200'],
      likes: 1200, likedBy: [manoj._id, rahul._id, sneha._id], commentsCount: 0, sharesCount: 32,
      location: 'Goa, India',
    },
    {
      userId: karthik._id, userName: karthik.name, userAvatar: karthik.avatar, userUsername: karthik.username, isVerified: true,
      content: 'Weekend badminton finals were incredible! 🏸',
      media: ['https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?auto=format&fit=crop&q=80&w=1200'],
      likes: 340, likedBy: [manoj._id], commentsCount: 0, sharesCount: 14,
      location: 'Main Sports Complex',
    },
    {
      userId: rahul._id, userName: rahul.name, userAvatar: rahul.avatar, userUsername: rahul.username, isVerified: false,
      content: 'Late night coding session ☕💻 #buildinpublic',
      media: ['https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&q=80&w=1200'],
      likes: 520, likedBy: [manoj._id, sneha._id, harsha._id], commentsCount: 0, sharesCount: 19,
    },
  ]);
  console.log('Created posts');

  await StoryModel.create([
    { userId: ananya._id, userName: ananya.name, userAvatar: ananya.avatar, userUsername: ananya.username, mediaUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&q=80&w=600', type: 'image', caption: 'Goa beach breeze 🌊✨', likes: 42 },
    { userId: rahul._id, userName: rahul.name, userAvatar: rahul.avatar, userUsername: rahul.username, mediaUrl: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&q=80&w=600', type: 'image', caption: 'Late night setup & coffee ☕💻', likes: 31 },
    { userId: sneha._id, userName: sneha.name, userAvatar: sneha.avatar, userUsername: sneha.username, mediaUrl: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&q=80&w=600', type: 'image', caption: 'Weekend canvas painting 🎨', likes: 28 },
    { userId: karthik._id, userName: karthik.name, userAvatar: karthik.avatar, userUsername: karthik.username, mediaUrl: 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?auto=format&fit=crop&q=80&w=600', type: 'image', caption: 'Badminton finals practice 🏸🔥', likes: 54 },
  ]);
  console.log('Created stories');

  const chatWithAnanya = await ChatModel.create({
    isGroup: false, participants: [manoj._id.toString(), ananya._id.toString()],
    lastMessage: 'Hey Manoj! Are you coming to the Goa meetup?', lastMessageTime: new Date(), unreadCount: 2,
    avatar: ananya.avatar, name: ananya.name, isPinned: true,
  });

  await MessageModel.create([
    { chatId: chatWithAnanya._id.toString(), senderId: ananya._id.toString(), senderName: ananya.name, senderAvatar: ananya.avatar, text: 'Hey Manoj! Did you see the sunset pictures from Goa?' },
    { chatId: chatWithAnanya._id.toString(), senderId: manoj._id.toString(), senderName: manoj.name, senderAvatar: manoj.avatar, text: 'Yes! They look absolutely stunning 🌅' },
    { chatId: chatWithAnanya._id.toString(), senderId: ananya._id.toString(), senderName: ananya.name, senderAvatar: ananya.avatar, text: 'Hey Manoj! Are you coming to the Goa meetup?' },
  ]);
  console.log('Created chats & messages');

  console.log('\n✅ Seed complete. All seeded users share the password:', SEED_PASSWORD);
  console.log('Login with e.g. "manoj_28" / "uniconnect123"');

  await mongoose.disconnect();
}

run().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
