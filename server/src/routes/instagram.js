import express from 'express';
import { instagramController } from '../controllers/instagramController.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

// Public callback handler for Meta OAuth redirection
router.get('/callback', instagramController.callback);

// Authenticated routes
router.get('/connect', requireAuth, instagramController.connect);
router.get('/status', requireAuth, instagramController.getStatus);
router.post('/disconnect', requireAuth, instagramController.disconnect);
router.get('/pages', requireAuth, instagramController.getPages);
router.get('/profile', requireAuth, instagramController.getProfile);

export default router;
