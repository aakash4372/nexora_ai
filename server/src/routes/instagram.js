import express from 'express';
import { instagramController } from '../controllers/instagramController.js';
import { commentAutomationController } from '../controllers/commentAutomationController.js';
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
router.get('/follower-trend', requireAuth, instagramController.getFollowerTrend);
router.get('/auto-reply-settings', requireAuth, instagramController.getAutoReplySettings);
router.put('/auto-reply-settings', requireAuth, instagramController.saveAutoReplySettings);

// Comment-to-DM Automation Routes
router.get('/comment-automations', requireAuth, commentAutomationController.list);
router.post('/comment-automations', requireAuth, commentAutomationController.create);
router.put('/comment-automations/:id', requireAuth, commentAutomationController.update);
router.patch('/comment-automations/:id', requireAuth, commentAutomationController.toggleStatus);
router.delete('/comment-automations/:id', requireAuth, commentAutomationController.remove);

// Webhook Routes (Separate from OAuth Callback)
router.get('/webhook', instagramController.verifyWebhook);
router.post('/webhook', instagramController.handleWebhookEvent);

export default router;
