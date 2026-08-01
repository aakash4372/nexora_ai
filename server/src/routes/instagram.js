import express from 'express';
import { instagramController } from '../controllers/instagramController.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

// OAuth Routes
router.get('/connect', requireAuth, instagramController.connect);
router.get('/callback', instagramController.callback);
router.get('/status', requireAuth, instagramController.getStatus);
router.post('/disconnect', requireAuth, instagramController.disconnect);
router.get('/profile', requireAuth, instagramController.getProfile);

// Media & Auto Reply Routes
router.get('/media', requireAuth, instagramController.getMedia);
router.get('/auto-reply-settings', requireAuth, instagramController.getAutoReplySettings);
router.put('/auto-reply-settings', requireAuth, instagramController.saveAutoReplySettings);

// Webhook Routes (Separate from OAuth Callback)
router.get('/webhook', instagramController.verifyWebhook);
router.post('/webhook', instagramController.handleWebhookEvent);

export default router;
