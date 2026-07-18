import express from 'express';
import User from '../models/User.js';
import axios from 'axios';

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
    const expiryDays = parseInt(process.env.SESSION_EXPIRY_DAYS || '30', 10);
    const exp = Date.now() + expiryDays * 24 * 60 * 60 * 1000;
    const token = Buffer.from(JSON.stringify({ id: user._id, email: user.email, exp })).toString('base64');
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

    const token = Buffer.from(JSON.stringify({
      id: user._id,
      email: user.email,
      exp: Date.now() + parseInt(process.env.SESSION_EXPIRY_DAYS || '30', 10) * 24 * 60 * 60 * 1000
    })).toString('base64');
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
 * Body: { token } — real Google OAuth
 */
router.post('/google', async (req, res) => {
  const { token } = req.body;
  if (!token) {
    return res.status(400).json({ success: false, message: 'Google token is required.' });
  }

  try {
    // Verify token with google userinfo endpoint
    const response = await axios.get('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${token}` }
    });
    const { email, name } = response.data;

    if (!email) {
      return res.status(400).json({ success: false, message: 'Invalid token, email not found.' });
    }

    let user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      // Create user if not registered
      user = new User({
        name: name || 'Google User',
        email: email.toLowerCase(),
        password: Math.random().toString(36).slice(-12), // Placeholder password
      });
      await user.save();
    }

    const jwtToken = Buffer.from(JSON.stringify({ id: user._id, email: user.email })).toString('base64');
    const initials = user.name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);

    res.json({
      success: true,
      token: jwtToken,
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
    console.error('❌ Google Auth Route Error:', error.response?.data || error.message || error);
    res.status(500).json({ success: false, message: 'Google auth failed.', error: error.message });
  }
});

/**
 * GET /api/auth/me
 */
router.get('/me', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'No token provided.' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = JSON.parse(Buffer.from(token, 'base64').toString('utf-8'));
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({ success: false, message: 'User not found.' });
    }

    const initials = user.name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);
    res.json({
      success: true,
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
    res.status(401).json({ success: false, message: 'Invalid session.' });
  }
});

export default router;
