import express from 'express';
import { instagramController } from '../controllers/instagramController.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

// Webhook verification (GET) & OAuth redirect (GET)
router.get('/callback', instagramController.callback);

// Webhook events (POST)
router.post('/callback', instagramController.handleWebhookEvent);

// Authenticated routes
router.get('/connect', requireAuth, instagramController.connect);
router.get('/status', requireAuth, instagramController.getStatus);
router.post('/disconnect', requireAuth, instagramController.disconnect);
router.get('/profile', requireAuth, instagramController.getProfile);

export default router;
