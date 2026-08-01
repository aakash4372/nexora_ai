import express from 'express';
import { instagramController } from '../controllers/instagramController.js';

const router = express.Router();

/**
 * GET /api/webhooks/instagram
 * POST /api/webhooks/instagram
 *
 * Delegates to the same controller handlers used by /api/instagram/webhook
 * so that auto-reply rules fire regardless of which callback URL is
 * registered in the Meta App dashboard.
 */
router.get('/instagram', instagramController.verifyWebhook);
router.post('/instagram', instagramController.handleWebhookEvent);

export default router;
