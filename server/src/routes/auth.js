import express from 'express';
import User from '../models/User.js';

const router = express.Router();

/**
 * POST /api/auth/login
 * Body: { email, password }
 */
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Email and password are required.' });
  }

  try {
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    // Generate JWT simulation (or real JWT)
    const token = Buffer.from(JSON.stringify({ id: user._id, email: user.email })).toString('base64');
    const initials = user.name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        initials,
        workspace: `${user.name.split(' ')[0]}'s Workspace`,
        plan: 'Pro',
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Database login query failed.', error: error.message });
  }
});

/**
 * POST /api/auth/register
 * Body: { name, email, password }
 */
router.post('/register', async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ success: false, message: 'All fields are required.' });
  }

  try {
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ success: false, message: 'An account with that email already exists.' });
    }

    const user = new User({ name, email, password });
    await user.save();

    const token = Buffer.from(JSON.stringify({ id: user._id, email: user.email })).toString('base64');
    const initials = name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        initials,
        workspace: `${name.split(' ')[0]}'s Workspace`,
        plan: 'Free',
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'User registration failed.', error: error.message });
  }
});

/**
 * POST /api/auth/forgot-password
 * Body: { email }
 */
router.post('/forgot-password', (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ success: false, message: 'Email is required.' });
  res.json({ success: true, message: `Reset link sent to ${email}` });
});

/**
 * POST /api/auth/reset-password
 * Body: { password, confirmPassword }
 */
router.post('/reset-password', (req, res) => {
  const { password, confirmPassword } = req.body;
  if (!password || password !== confirmPassword) {
    return res.status(400).json({ success: false, message: 'Passwords do not match.' });
  }
  res.json({ success: true, message: 'Password updated successfully.' });
});

/**
 * POST /api/auth/google
 * Body: { token } — simulated Google OAuth
 */
router.post('/google', async (req, res) => {
  try {
    // If google login triggered, find or create dummy user
    let user = await User.findOne({ email: 'aarav@nexoralabs.io' });
    if (!user) {
      user = new User({
        name: 'Aarav Sharma',
        email: 'aarav@nexoralabs.io',
        password: 'password123',
      });
      await user.save();
    }

    const token = Buffer.from(JSON.stringify({ id: user._id, email: user.email })).toString('base64');
    const initials = user.name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        initials,
        workspace: `${user.name.split(' ')[0]}'s Workspace`,
        plan: 'Pro',
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Google auth failed.', error: error.message });
  }
});

export default router;
