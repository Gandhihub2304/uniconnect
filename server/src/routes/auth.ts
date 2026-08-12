import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { UserModel } from '../models/UserModel';
import { NotificationModel } from '../models/NotificationModel';
import { FollowRequestModel } from '../models/FollowRequestModel';
import { authMiddleware, AuthRequest } from '../middleware/authMiddleware';
import { JWT_SECRET } from '../config/env';
import { getIO } from '../sockets/ioInstance';
import { sendPushNotification } from '../config/firebase';

const router = Router();

// Sign Up / Register
router.post('/signup', async (req, res) => {
  try {
    const { name, username, email, password, avatar, bio } = req.body;

    if (!name || !username || !email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide all required fields (Name, Username, Email, Password)' });
    }

    const existingEmail = await UserModel.findOne({ email: email.toLowerCase() });
    if (existingEmail) {
      return res.status(400).json({ success: false, message: 'Email is already registered. Please login instead.' });
    }

    const existingUsername = await UserModel.findOne({ username: username.toLowerCase() });
    if (existingUsername) {
      return res.status(400).json({ success: false, message: 'Username is already taken. Please pick another handle.' });
    }

    const user = new UserModel({
      name,
      username: username.toLowerCase(),
      email: email.toLowerCase(),
      password,
      avatar: avatar || undefined,
      bio: bio || undefined,
    });

    await user.save();

    const token = user.generateAuthToken();
    const userObject = user.toObject();
    delete userObject.password;

    return res.status(201).json({
      success: true,
      message: 'Account created successfully!',
      token,
      user: userObject,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Server error during Sign Up' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { emailOrUsername, password } = req.body;

    if (!emailOrUsername || !password) {
      return res.status(400).json({ success: false, message: 'Please enter your Email/Username and Password' });
    }

    const user = await UserModel.findOne({
      $or: [
        { email: emailOrUsername.toLowerCase() },
        { username: emailOrUsername.toLowerCase() },
      ],
    });

    if (!user) {
      return res.status(401).json({ success: false, message: 'No account found with that email/username.' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid password.' });
    }

    user.isOnline = true;
    user.lastSeen = new Date();
    await user.save();

    const token = user.generateAuthToken();
    const userObject = user.toObject() as any;
    delete userObject.password;

    const sentRequests = await FollowRequestModel.find({ fromUserId: user._id.toString() }).select('toUserId');
    userObject.sentFollowRequestIds = sentRequests.map(r => r.toUserId);

    return res.json({ success: true, token, user: userObject });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Server error during Login' });
  }
});

// Step 1 of password reset: verify identity by matching username/email to the registered email
router.post('/forgot-password', async (req, res) => {
  try {
    const { emailOrUsername, email } = req.body;
    if (!emailOrUsername || !email) {
      return res.status(400).json({ success: false, message: 'Please enter your username/email and your registered email address' });
    }

    const user = await UserModel.findOne({
      $or: [{ email: emailOrUsername.toLowerCase() }, { username: emailOrUsername.toLowerCase() }],
    });

    if (!user || user.email.toLowerCase() !== email.toLowerCase()) {
      return res.status(404).json({ success: false, message: "We couldn't verify an account with that username/email and email combination." });
    }

    const resetToken = jwt.sign({ id: user._id, purpose: 'password_reset' }, JWT_SECRET, { expiresIn: '10m' });
    res.json({ success: true, resetToken });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Error starting password reset' });
  }
});

// Step 2 of password reset: consume the short-lived reset token to set a new password
router.post('/reset-password', async (req, res) => {
  try {
    const { resetToken, newPassword } = req.body;
    if (!resetToken || !newPassword || newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'A reset token and a password of at least 6 characters are required' });
    }

    let decoded: any;
    try {
      decoded = jwt.verify(resetToken, JWT_SECRET);
    } catch {
      return res.status(401).json({ success: false, message: 'Reset link has expired. Please start over.' });
    }
    if (decoded.purpose !== 'password_reset') {
      return res.status(401).json({ success: false, message: 'Invalid reset token' });
    }

    const user = await UserModel.findById(decoded.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    user.password = newPassword;
    await user.save();

    res.json({ success: true, message: 'Password reset successfully. You can now sign in.' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Error resetting password' });
  }
});

// Get Logged In User (`/me`)
router.get('/me', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const user = await UserModel.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const sentRequests = await FollowRequestModel.find({ fromUserId: req.user.id }).select('toUserId');
    const userObj = user.toObject() as any;
    userObj.sentFollowRequestIds = sentRequests.map(r => r.toUserId);

    res.json({ success: true, user: userObj });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Error fetching profile' });
  }
});

// Update profile
router.put('/profile', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const allowed = ['name', 'bio', 'avatar', 'coverImage', 'location', 'website', 'work', 'education'];
    const updates: Record<string, any> = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }
    const user = await UserModel.findByIdAndUpdate(req.user.id, updates, { new: true }).select('-password');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, user });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Error updating profile' });
  }
});

// Update settings / security
router.put('/settings', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await UserModel.findById(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    if (newPassword) {
      if (!currentPassword || !(await user.comparePassword(currentPassword))) {
        return res.status(401).json({ success: false, message: 'Current password is incorrect' });
      }
      user.password = newPassword;
    }

    await user.save();
    const userObject = user.toObject();
    delete userObject.password;
    res.json({ success: true, user: userObject });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Error updating settings' });
  }
});

// Register this device's FCM push token against the logged-in user (called on app login)
router.post('/push-token', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { token: pushToken } = req.body;
    if (!pushToken) return res.status(400).json({ success: false, message: 'token is required' });

    await UserModel.findByIdAndUpdate(req.user.id, { $addToSet: { pushTokens: pushToken } });
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Error registering push token' });
  }
});

// Remove a device's push token (called on logout)
router.post('/push-token/remove', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { token: pushToken } = req.body;
    if (!pushToken) return res.status(400).json({ success: false, message: 'token is required' });

    await UserModel.findByIdAndUpdate(req.user.id, { $pull: { pushTokens: pushToken } });
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Error removing push token' });
  }
});

// Suggestions (users you may know). Pass ?all=true to list every user (used by the mobile Explore "People" tab).
router.get('/suggestions', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const showAll = req.query.all === 'true';
    let query = UserModel.find({ _id: { $ne: req.user.id } }).select('-password');
    if (!showAll) query = query.limit(6);
    const users = await query;
    res.json({ success: true, users });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Error fetching suggestions' });
  }
});

// Send a follow request, or cancel one you already sent, or unfollow if already following.
// Real follows only happen once the target confirms via /follow-request/:requesterId/confirm.
router.post('/follow/:targetId', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const targetId = req.params.targetId;
    const currentUserId = req.user.id;

    if (targetId === currentUserId) {
      return res.status(400).json({ success: false, message: 'You cannot follow yourself' });
    }

    const currentUser = await UserModel.findById(currentUserId);
    const targetUser = await UserModel.findById(targetId);

    if (!currentUser || !targetUser) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (!currentUser.following) currentUser.following = [];
    if (!targetUser.followers) targetUser.followers = [];

    const isFollowing = currentUser.following.includes(targetId);

    if (isFollowing) {
      // Unfollow immediately — no confirmation needed to remove a follow
      currentUser.following = currentUser.following.filter((id: string) => id !== targetId);
      targetUser.followers = targetUser.followers.filter((id: string) => id !== currentUserId);
      await currentUser.save();
      await targetUser.save();

      const userObj = currentUser.toObject();
      delete userObj.password;

      return res.json({
        success: true,
        isFollowing: false,
        isRequested: false,
        user: userObj,
        followersCount: targetUser.followers.length,
        followingCount: currentUser.following.length,
      });
    }

    const existingRequest = await FollowRequestModel.findOne({ fromUserId: currentUserId, toUserId: targetId });

    if (existingRequest) {
      // Tapping again on a pending request cancels it
      await existingRequest.deleteOne();
      await NotificationModel.findOneAndDelete({ userId: targetId, fromUserId: currentUserId, type: 'follow_request' });

      return res.json({
        success: true,
        isFollowing: false,
        isRequested: false,
        followersCount: targetUser.followers.length,
        followingCount: currentUser.following.length,
      });
    }

    // Create a new pending follow request
    await FollowRequestModel.create({ fromUserId: currentUserId, toUserId: targetId });

    const notification = await NotificationModel.create({
      userId: targetId,
      type: 'follow_request',
      fromUserId: currentUserId,
      fromUserName: currentUser.name,
      fromUserAvatar: currentUser.avatar,
      text: 'wants to follow you',
    });

    const io = getIO();
    if (io) io.to(`user_${targetId}`).emit('new_notification', notification);

    if (targetUser.pushTokens && targetUser.pushTokens.length > 0) {
      sendPushNotification(
        targetUser.pushTokens,
        { title: currentUser.name, body: 'wants to follow you' },
        { type: 'follow_request' }
      ).catch(() => {});
    }

    res.json({
      success: true,
      isFollowing: false,
      isRequested: true,
      followersCount: targetUser.followers.length,
      followingCount: currentUser.following.length,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Error executing follow action' });
  }
});

// Confirm a pending follow request — this is the only place followers/following actually get updated
router.post('/follow-request/:requesterId/confirm', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const requesterId = req.params.requesterId;
    const currentUserId = req.user.id;

    const request = await FollowRequestModel.findOne({ fromUserId: requesterId, toUserId: currentUserId });
    if (!request) return res.status(404).json({ success: false, message: 'Follow request not found' });

    const requester = await UserModel.findById(requesterId);
    const currentUser = await UserModel.findById(currentUserId);
    if (!requester || !currentUser) return res.status(404).json({ success: false, message: 'User not found' });

    if (!requester.following) requester.following = [];
    if (!currentUser.followers) currentUser.followers = [];

    if (!requester.following.includes(currentUserId)) requester.following.push(currentUserId);
    if (!currentUser.followers.includes(requesterId)) currentUser.followers.push(requesterId);

    await requester.save();
    await currentUser.save();
    await request.deleteOne();

    // Clean up the original request notification, then let the requester know they were accepted
    await NotificationModel.findOneAndDelete({ userId: currentUserId, fromUserId: requesterId, type: 'follow_request' });

    const confirmNotif = await NotificationModel.create({
      userId: requesterId,
      type: 'follow',
      fromUserId: currentUserId,
      fromUserName: currentUser.name,
      fromUserAvatar: currentUser.avatar,
      text: 'accepted your follow request',
    });

    const io = getIO();
    if (io) io.to(`user_${requesterId}`).emit('new_notification', confirmNotif);

    if (requester.pushTokens && requester.pushTokens.length > 0) {
      sendPushNotification(
        requester.pushTokens,
        { title: currentUser.name, body: 'accepted your follow request' },
        { type: 'follow' }
      ).catch(() => {});
    }

    res.json({ success: true, followersCount: currentUser.followers.length });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Error confirming follow request' });
  }
});

// Decline a pending follow request — no follow relationship is created
router.post('/follow-request/:requesterId/decline', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const requesterId = req.params.requesterId;
    const currentUserId = req.user.id;

    await FollowRequestModel.findOneAndDelete({ fromUserId: requesterId, toUserId: currentUserId });
    await NotificationModel.findOneAndDelete({ userId: currentUserId, fromUserId: requesterId, type: 'follow_request' });

    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Error declining follow request' });
  }
});

// Get Followers List for a User
router.get('/followers/:userId', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const targetUser = await UserModel.findById(req.params.userId);
    if (!targetUser) return res.status(404).json({ success: false, message: 'User not found' });

    const followersList = await UserModel.find({ _id: { $in: targetUser.followers || [] } }).select('name username avatar bio');
    res.json({ success: true, followers: followersList });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Error fetching followers' });
  }
});

// Get Following List for a User
router.get('/following/:userId', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const targetUser = await UserModel.findById(req.params.userId);
    if (!targetUser) return res.status(404).json({ success: false, message: 'User not found' });

    const followingList = await UserModel.find({ _id: { $in: targetUser.following || [] } }).select('name username avatar bio');
    res.json({ success: true, following: followingList });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Error fetching following' });
  }
});

export default router;
