import mongoose from 'mongoose';
import { MONGO_URI } from '../config/env';
import { UserModel } from '../models/UserModel';
import { PostModel } from '../models/PostModel';
import { StoryModel } from '../models/StoryModel';
import { ChatModel } from '../models/ChatModel';
import { MessageModel } from '../models/MessageModel';
import { EventModel } from '../models/EventModel';
import { CommunityModel } from '../models/CommunityModel';

const SEED_PASSWORD = 'uniconnect123';

const seedUsers = [
  { name: 'Manoj Gandhi', username: 'manoj_28', email: 'manoj@uniconnect.app', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=300', coverImage: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=1200', bio: 'Computer Science Student | Tech Enthusiast | Building UniConnect 🚀', location: 'Bangalore, India', website: 'https://uniconnect.app', work: 'Lead Engineer @ UniConnect', education: 'B.Tech Computer Science (2025)', circles: ['Friends', 'Family', 'College', 'Gaming', 'Travel', 'Work'], xp: 2840, level: 14, streak: 12, badges: ['🚀 Early Adopter', '⚡ Power Creator', '🎯 Event Host', '🛡️ Circle Leader'], geo: { lat: 12.9716, lng: 77.5946 } },
  { name: 'Ananya Sharma', username: 'ananya_s', email: 'ananya@uniconnect.app', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=300', circles: ['Friends', 'Travel', 'College'], xp: 1950, level: 9, streak: 7, badges: ['✨ Storyteller', '📸 Nomad'], geo: { lat: 12.9352, lng: 77.6146 } },
  { name: 'Rahul Verma', username: 'rahul_v', email: 'rahul@uniconnect.app', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=300', circles: ['Friends', 'Gaming', 'Work'], xp: 2100, level: 11, streak: 9, badges: ['🎮 Pro Gamer'], geo: { lat: 12.9784, lng: 77.6408 } },
  { name: 'Sneha Reddy', username: 'sneha_r', email: 'sneha@uniconnect.app', avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=300', circles: ['Friends', 'College'], xp: 1400, level: 7, streak: 5, badges: ['🎨 Designer'], geo: { lat: 12.9611, lng: 77.5763 } },
  { name: 'Karthik Raj', username: 'karthik_r', email: 'karthik@uniconnect.app', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=300', circles: ['Friends', 'Sports'], xp: 1800, level: 10, streak: 15, badges: ['🏸 Badminton Champ'], geo: { lat: 12.9166, lng: 77.6101 } },
  { name: 'Harsha Vardhan', username: 'harsha_v', email: 'harsha@uniconnect.app', avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&q=80&w=300', circles: ['College', 'Gaming'], xp: 1200, level: 6, streak: 3, badges: ['⚡ Coder'], geo: { lat: 12.9833, lng: 77.5833 } },
  { name: 'Pooja Hegde', username: 'pooja_h', email: 'pooja@uniconnect.app', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=300', circles: ['Family'], xp: 900, level: 4, streak: 1, badges: ['🌟 Rising Star'], geo: { lat: 12.9279, lng: 77.6271 } },
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
      circle: 'For You', likes: 1200, likedBy: [manoj._id, rahul._id, sneha._id], commentsCount: 0, sharesCount: 32,
      aiSummary: 'Ananya shared a beautiful sunset from Goa with a deep thought about endings and new beginnings.',
      location: 'Goa, India',
    },
    {
      userId: karthik._id, userName: karthik.name, userAvatar: karthik.avatar, userUsername: karthik.username, isVerified: true,
      content: 'Super excited to host the UniConnect Inter-College Badminton Tournament next week! 🏸 Registrations are open now.',
      media: ['https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?auto=format&fit=crop&q=80&w=1200'],
      circle: 'College', likes: 340, likedBy: [manoj._id], commentsCount: 0, sharesCount: 14,
      aiSummary: 'Karthik announced the inter-college badminton tournament with open registrations.',
      location: 'Main Sports Complex',
    },
    {
      userId: rahul._id, userName: rahul.name, userAvatar: rahul.avatar, userUsername: rahul.username, isVerified: false,
      content: 'Just deployed the new Socket.IO real-time engine for our app! 🚀 Instant chat sync under 15ms latency.',
      media: ['https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&q=80&w=1200'],
      circle: 'Work', likes: 520, likedBy: [manoj._id, sneha._id, harsha._id], commentsCount: 0, sharesCount: 19,
      aiSummary: 'Rahul shared technical milestone details regarding Socket.IO latency improvements.',
      location: 'UniConnect Labs',
    },
  ]);
  console.log('Created posts');

  await StoryModel.create([
    { userId: ananya._id, userName: ananya.name, userAvatar: ananya.avatar, userUsername: ananya.username, mediaUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&q=80&w=600', type: 'image', caption: 'Goa beach breeze 🌊✨', musicTrack: 'Midnight City - M83', likes: 42 },
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
  const devSquad = await ChatModel.create({
    isGroup: true, name: '⚡ Core Dev Squad',
    participants: [manoj._id.toString(), rahul._id.toString(), sneha._id.toString(), harsha._id.toString()],
    lastMessage: 'Rahul: WebRTC video calling test is ready!', lastMessageTime: new Date(), unreadCount: 5,
    avatar: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&q=80&w=300', isPinned: true,
  });

  await MessageModel.create([
    { chatId: chatWithAnanya._id.toString(), senderId: ananya._id.toString(), senderName: ananya.name, senderAvatar: ananya.avatar, text: 'Hey Manoj! Did you see the sunset pictures from Goa?' },
    { chatId: chatWithAnanya._id.toString(), senderId: manoj._id.toString(), senderName: manoj.name, senderAvatar: manoj.avatar, text: 'Yes! They look absolutely stunning 🌅' },
    { chatId: chatWithAnanya._id.toString(), senderId: ananya._id.toString(), senderName: ananya.name, senderAvatar: ananya.avatar, text: 'Hey Manoj! Are you coming to the Goa meetup?' },
    { chatId: devSquad._id.toString(), senderId: rahul._id.toString(), senderName: rahul.name, senderAvatar: rahul.avatar, text: 'WebRTC video calling test is ready!' },
  ]);
  console.log('Created chats & messages');

  await EventModel.create([
    { title: 'College Fest 2K25', date: '24 MAY', time: '10:00 AM', location: 'Main Auditorium', category: 'College', attendeesCount: 2, attendees: [manoj._id.toString(), rahul._id.toString()], image: 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&q=80&w=600', expenses: [{ title: 'Stage & Lighting', amount: 15000, paidBy: 'Manoj Gandhi' }, { title: 'Sound System', amount: 8000, paidBy: 'Rahul Verma' }] },
    { title: 'Badminton Tournament', date: '31 MAY', time: '09:00 AM', location: 'Sports Complex', category: 'Sports', attendeesCount: 1, attendees: [karthik._id.toString()], image: 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?auto=format&fit=crop&q=80&w=600', expenses: [{ title: 'Court Booking', amount: 2000, paidBy: 'Karthik Raj' }, { title: 'Shuttlecock Boxes', amount: 1200, paidBy: 'Manoj Gandhi' }] },
  ]);
  console.log('Created events');

  await CommunityModel.create([
    { name: '🚀 Web Developers Hub', icon: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&q=80&w=200', banner: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=800', description: 'The ultimate space for Full-Stack & React developers.', membersCount: 1420, members: [manoj._id.toString()], channels: [{ id: 'ch_announcements', name: '📢 announcements', type: 'text' }, { id: 'ch_general', name: '💬 general-chat', type: 'text' }, { id: 'ch_showcase', name: '✨ project-showcase', type: 'text' }, { id: 'ch_lounge', name: '🔊 Lounge Voice Room', type: 'voice' }] },
    { name: '🎮 Uni Gamers Club', icon: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&q=80&w=200', banner: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&q=80&w=800', description: 'Valorant, BGMI, EA FC, and Indie games community.', membersCount: 890, members: [rahul._id.toString()], channels: [{ id: 'ch_valorant', name: '🎯 valorant-squads', type: 'text' }, { id: 'ch_tournaments', name: '🏆 tournaments', type: 'text' }, { id: 'ch_game_voice', name: '🔊 Squad Voice 1', type: 'voice' }] },
  ]);
  console.log('Created communities');

  console.log('\n✅ Seed complete. All seeded users share the password:', SEED_PASSWORD);
  console.log('Login with e.g. "manoj_28" / "uniconnect123"');

  await mongoose.disconnect();
}

run().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
