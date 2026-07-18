import express from 'express';
import crypto from 'crypto';

const router = express.Router();

/**
 * GET /api/webhooks/instagram
 * Verifies webhook subscription challenge from Meta/Facebook.
 */
router.get('/instagram', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  const localVerifyToken = process.env.META_VERIFY_TOKEN || 'nexora_webhook_verification_token';

  if (mode && token) {
    if (mode === 'subscribe' && token === localVerifyToken) {
      console.log('🔌 Meta Webhook verified successfully.');
      return res.status(200).send(challenge);
    }
    console.warn('❌ Meta Webhook verification token mismatch.');
    return res.status(403).send('Forbidden: Token mismatch');
  }
  return res.status(400).send('Bad Request');
});

/**
 * Helper to validate signature of Meta Webhook requests.
 */
function verifySignature(req, res, buf) {
  const signature = req.headers['x-hub-signature-256'];
  if (!signature) {
    throw new Error('No signature signature on request');
  }

  const elements = signature.split('=');
  const signatureHash = elements[1];
  const expectedHash = crypto
    .createHmac('sha256', process.env.META_APP_SECRET || 'nexora_app_secret')
    .update(buf)
    .digest('hex');

  if (signatureHash !== expectedHash) {
    throw new Error('Signature validation failed');
  }
}

/**
 * POST /api/webhooks/instagram
 * Receives webhook events from Meta (messages, comments, reactions, etc.).
 */
router.post('/instagram', (req, res) => {
  // Try validating payload signature if app secret is configured
  if (process.env.META_APP_SECRET) {
    try {
      const rawBody = JSON.stringify(req.body);
      verifySignature(req, res, Buffer.from(rawBody));
    } catch (err) {
      console.warn('⚠️ Webhook payload signature validation failed:', err.message);
      // In production, you might return 401, but we'll log it and continue
    }
  }

  const { object, entry } = req.body;

  if (object === 'instagram') {
    entry.forEach((item) => {
      const igBusinessId = item.id;
      const timeOfEvent = item.time;

      if (item.messaging) {
        item.messaging.forEach((messagingEvent) => {
          // Handle incoming messages / DMs
          if (messagingEvent.message) {
            console.log(`📩 DM from ${messagingEvent.sender.id} to business ${igBusinessId}:`, messagingEvent.message.text);
          }
          // Handle message reactions
          if (messagingEvent.reaction) {
            console.log(`❤️ Message reaction from ${messagingEvent.sender.id}:`, messagingEvent.reaction.reaction);
          }
        });
      }

      if (item.changes) {
        item.changes.forEach((changeEvent) => {
          // Handle comments, mentions, story mentions
          const field = changeEvent.field;
          const value = changeEvent.value;
          console.log(`💬 Webhook change event [${field}] for business ${igBusinessId}:`, value);
        });
      }
    });

    return res.status(200).send('EVENT_RECEIVED');
  }

  // Fallback to 404 if not instagram object
  res.status(404).send('Not Found');
});

export default router;
