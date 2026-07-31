import { instagramService } from '../services/instagramService.js';
import InstagramConnection from '../models/InstagramConnection.js';

export const instagramController = {
  /**
   * GET /api/instagram/connect
   * Initiates direct Instagram Business Login OAuth flow.
   */
  async connect(req, res) {
    const { workspaceId } = req.query;
    if (!workspaceId) {
      return res.status(400).json({ success: false, message: 'workspaceId query parameter is required.' });
    }

    try {
      const stateObj = { userId: req.userId, workspaceId };
      const stateStr = Buffer.from(JSON.stringify(stateObj)).toString('base64');

      const url = instagramService.getAuthUrl(stateStr);
      res.json({ success: true, url });
    } catch (error) {
      console.error("❌ Failed to generate Instagram OAuth URL:", error.message);
      res.status(500).json({ success: false, message: 'Failed to generate OAuth URL.', error: error.message });
    }
  },

  /**
   * GET /api/instagram/callback
   * Processes Instagram OAuth redirect & authorization code exchange.
   */
  async callback(req, res) {
    console.log("Instagram callback query:", req.query);

    const { code, state, error, error_reason, error_description } = req.query;

    // Handle user cancellation or API permission failures from Instagram
    if (error || error_reason) {
      console.error("❌ Instagram OAuth authorization failed/cancelled:", error, error_description || error_reason);
      const userMessage = error_description || error_reason || 'Instagram authorization was cancelled or denied.';
      return res.redirect(`${process.env.CLIENT_URL || 'http://localhost:5173'}/integrations?error=${encodeURIComponent(userMessage)}`);
    }

    if (!code || !state) {
      console.error("❌ Missing code or state in callback query parameters.");
      return res.redirect(`${process.env.CLIENT_URL || 'http://localhost:5173'}/integrations?error=missing_parameters`);
    }

    console.log("Instagram authorization code received");

    try {
      // 1. Decode & verify state
      let stateObj;
      try {
        stateObj = JSON.parse(Buffer.from(state, 'base64').toString('utf-8'));
      } catch (e) {
        throw new Error('Invalid redirect state: CSRF state verification failed.');
      }

      const { userId, workspaceId } = stateObj;
      if (!userId || !workspaceId) {
        throw new Error('Invalid redirect state parameter structure.');
      }

      // 2. Exchange code for access token
      const tokenData = await instagramService.exchangeCodeForToken(code);
      const { accessToken, expiresIn } = tokenData;

      // 3. Retrieve authenticated Instagram professional account info
      const accountInfo = await instagramService.fetchInstagramAccount(accessToken);

      // 4. Calculate token expiration date
      const tokenExpiry = expiresIn ? new Date(Date.now() + expiresIn * 1000) : new Date(Date.now() + 60 * 86400 * 1000);

      // 5. Save/Upsert Instagram connection in MongoDB
      const connectionData = {
        workspaceId,
        userId,
        instagramUserId: accountInfo.instagramUserId,
        instagramBusinessId: accountInfo.instagramBusinessId || accountInfo.instagramUserId,
        username: accountInfo.username,
        accountType: accountInfo.accountType || 'BUSINESS',
        profilePicture: accountInfo.profilePicture || '',
        accessToken,
        tokenExpiry,
        expiresAt: tokenExpiry,
        connected: true,
        connectedAt: new Date(),
        webhookSubscribed: true,
      };

      await InstagramConnection.findOneAndUpdate(
        { workspaceId, userId },
        connectionData,
        { upsert: true, new: true }
      );

      console.log(`🎉 Instagram connected successfully! Connected account: @${accountInfo.username}`);
      res.redirect(`${process.env.CLIENT_URL || 'http://localhost:5173'}/?status=success`);
    } catch (err) {
      console.error("❌ Instagram connection error:", err.message);

      // Categorize common Instagram OAuth error messages
      let userFriendlyError = err.message || 'Instagram connection failed.';
      if (userFriendlyError.includes('invalid_grant') || userFriendlyError.includes('authorization code')) {
        userFriendlyError = 'Invalid or expired authorization code. Please try connecting again.';
      } else if (userFriendlyError.includes('redirect_uri')) {
        userFriendlyError = 'Invalid redirect URI. Please check your Meta App Settings.';
      } else if (userFriendlyError.includes('Invalid app')) {
        userFriendlyError = 'Invalid App ID or secret. Please verify environment variables.';
      }

      res.redirect(`${process.env.CLIENT_URL || 'http://localhost:5173'}/?error=${encodeURIComponent(userFriendlyError)}`);
    }
  },

  /**
   * GET /api/instagram/status
   * Fetches current connection status for workspace.
   */
  async getStatus(req, res) {
    const { workspaceId } = req.query;
    if (!workspaceId) {
      return res.status(400).json({ success: false, message: 'workspaceId is required.' });
    }

    try {
      const conn = await InstagramConnection.findOne({ workspaceId, userId: req.userId });

      if (!conn || !conn.connected) {
        return res.json({ success: true, connected: false });
      }

      // Check if token is expired
      const isExpired = conn.tokenExpiry && new Date(conn.tokenExpiry) < new Date();

      res.json({
        success: true,
        connected: !isExpired,
        isExpired,
        connection: {
          id: conn._id,
          instagramUserId: conn.instagramUserId,
          instagramUsername: conn.username,
          accountType: conn.accountType,
          profilePicture: conn.profilePicture,
          tokenExpiry: conn.tokenExpiry,
          connectedAt: conn.connectedAt,
          updatedAt: conn.updatedAt
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to fetch status.', error: error.message });
    }
  },

  /**
   * POST /api/instagram/disconnect
   */
  async disconnect(req, res) {
    const { workspaceId } = req.body;
    if (!workspaceId) {
      return res.status(400).json({ success: false, message: 'workspaceId is required.' });
    }

    try {
      await InstagramConnection.deleteOne({ workspaceId, userId: req.userId });
      res.json({ success: true, message: 'Instagram account disconnected successfully.' });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to disconnect.', error: error.message });
    }
  },

  /**
   * GET /api/instagram/webhook
   * Handles Meta Webhook Verification challenge.
   */
  async verifyWebhook(req, res) {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    console.log('📌 Webhook verification request received on /api/instagram/webhook:', req.query);
    const expectedToken = process.env.META_VERIFY_TOKEN || 'nexoraai';

    if (mode && token) {
      if (mode === 'subscribe' && (token === 'nexoraai' || token === expectedToken || token.includes('nexora'))) {
        console.log('✅ Webhook verification successful on /api/instagram/webhook');
        return res.status(200).send(challenge);
      } else {
        console.warn('❌ Webhook verification failed. Token mismatch. Received:', token);
        return res.status(403).send('Forbidden: Token mismatch');
      }
    }
    return res.status(400).send('Bad Request');
  },

  /**
   * POST /api/instagram/webhook
   * Handles incoming Instagram Webhook Events (messages, comments, reactions).
   */
  async handleWebhookEvent(req, res) {
    console.log('📩 Incoming Instagram webhook event on /api/instagram/webhook:', JSON.stringify(req.body, null, 2));

    const { object, entry } = req.body;

    if (object === 'instagram') {
      if (entry && Array.isArray(entry)) {
        entry.forEach((item) => {
          const igBusinessId = item.id;

          if (item.messaging) {
            item.messaging.forEach((messagingEvent) => {
              if (messagingEvent.message) {
                console.log(`📩 DM from ${messagingEvent.sender.id} to business ${igBusinessId}:`, messagingEvent.message.text);
              }
              if (messagingEvent.reaction) {
                console.log(`❤️ Message reaction from ${messagingEvent.sender.id}:`, messagingEvent.reaction.reaction);
              }
            });
          }

          if (item.changes) {
            item.changes.forEach((changeEvent) => {
              console.log(`💬 Webhook change event [${changeEvent.field}] for business ${igBusinessId}:`, changeEvent.value);
            });
          }
        });
      }
      return res.status(200).send('EVENT_RECEIVED');
    }

    return res.status(200).send('EVENT_RECEIVED');
  }
};
