import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { UserModel } from '../models/UserModel';
import { authMiddleware, AuthRequest } from '../middleware/authMiddleware';
import { JWT_SECRET } from '../config/env';

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
    const userObject = user.toObject();
    delete userObject.password;

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

    res.json({ success: true, user });
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

// Suggestions (users you may know)
router.get('/suggestions', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const users = await UserModel.find({ _id: { $ne: req.user.id } }).select('-password').limit(6);
    res.json({ success: true, users });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Error fetching suggestions' });
  }
});

// Follow / Unfollow User Toggle
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
      currentUser.following = currentUser.following.filter((id: string) => id !== targetId);
      targetUser.followers = targetUser.followers.filter((id: string) => id !== currentUserId);
    } else {
      currentUser.following.push(targetId);
      targetUser.followers.push(currentUserId);
    }

    await currentUser.save();
    await targetUser.save();

    const userObj = currentUser.toObject();
    delete userObj.password;

    res.json({
      success: true,
      isFollowing: !isFollowing,
      user: userObj,
      followersCount: targetUser.followers.length,
      followingCount: currentUser.following.length
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Error executing follow action' });
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
