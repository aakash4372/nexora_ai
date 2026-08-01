import { instagramService } from '../services/instagramService.js';
import InstagramConnection from '../models/InstagramConnection.js';
import AutoReplySettings from '../models/AutoReplySettings.js';

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

      const tokenData = await instagramService.exchangeCodeForToken(code);
      const { accessToken, expiresIn } = tokenData;

      const accountInfo = await instagramService.fetchInstagramAccount(accessToken);

      const tokenExpiry = expiresIn ? new Date(Date.now() + expiresIn * 1000) : new Date(Date.now() + 60 * 86400 * 1000);

      // Actually tell Meta to start sending "messages"/"comments" webhook events
      // for this IG account instead of just assuming it's subscribed.
      const webhookSubscribed = await instagramService.subscribeWebhook(
        accountInfo.instagramBusinessId || accountInfo.instagramUserId,
        accessToken,
        accountInfo.facebookPageId,
        accountInfo.facebookPageAccessToken
      );

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
        webhookSubscribed,
      };

      await InstagramConnection.findOneAndUpdate(
        { workspaceId, userId },
        connectionData,
        { upsert: true, new: true }
      );

      if (!webhookSubscribed) {
        console.warn(`⚠️ Instagram connected but webhook subscription FAILED for @${accountInfo.username}. Auto-replies will not trigger until this is resolved.`);
      }

      console.log(`🎉 Instagram connected successfully! Connected account: @${accountInfo.username}`);
      res.redirect(`${process.env.CLIENT_URL || 'http://localhost:5173'}/?status=success`);
    } catch (err) {
      console.error("❌ Instagram connection error:", err.message);

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
   * GET /api/instagram/profile
   */
  async getProfile(req, res) {
    try {
      const conn = await InstagramConnection.findOne({ userId: req.userId });
      if (!conn) return res.status(404).json({ success: false, message: 'No connected Instagram account found.' });
      res.json({
        success: true,
        profile: {
          instagramUserId: conn.instagramUserId,
          username: conn.username,
          accountType: conn.accountType,
          profilePicture: conn.profilePicture
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  /**
   * GET /api/instagram/media
   * Fetches published Instagram Posts & Reels for the workspace.
   */
  async getMedia(req, res) {
    const { workspaceId } = req.query;
    try {
      let accessToken = null;
      let instagramUserId = null;
      if (workspaceId) {
        const conn = await InstagramConnection.findOne({ workspaceId });
        if (conn) {
          accessToken = conn.accessToken;
          instagramUserId = conn.instagramBusinessId || conn.instagramUserId;
        }
      }
      const media = await instagramService.fetchUserMedia(accessToken, instagramUserId);
      res.json({ success: true, media });
    } catch (error) {
      console.error("Failed to fetch media:", error);
      res.status(500).json({ success: false, message: 'Failed to fetch media.', error: error.message });
    }
  },

  /**
   * GET /api/instagram/auto-reply-settings
   * Fetches the authenticated user's DM auto-reply configuration (welcome
   * messages, optional delay, CTA buttons). Returns schema defaults if none
   * saved yet. Keyed by req.userId (stable), not the client-supplied
   * workspaceId (a renameable display string).
   */
  async getAutoReplySettings(req, res) {
    try {
      let settings = await AutoReplySettings.findOne({ userId: req.userId });
      if (!settings) {
        settings = new AutoReplySettings({ userId: req.userId });
      }
      res.json({ success: true, data: settings });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to fetch auto reply settings.', error: error.message });
    }
  },

  /**
   * PUT /api/instagram/auto-reply-settings
   * Creates or updates the authenticated user's DM auto-reply configuration.
   * `templates` is a list of alternative welcome-message + CTA-button
   * combinations; exactly one is `active` at a time — that's the one sent
   * to new DMs.
   */
  async saveAutoReplySettings(req, res) {
    const { enabled, delaySeconds, templates } = req.body;

    if (!Array.isArray(templates) || templates.length === 0) {
      return res.status(400).json({ success: false, message: 'At least one message template is required.' });
    }

    const cleanTemplates = templates
      .filter((t) => t?.text && t.text.trim())
      .map((t) => ({
        text: t.text.trim(),
        ctaButtons: Array.isArray(t.ctaButtons) ? t.ctaButtons.filter((b) => b?.name && b?.url).slice(0, 3) : [],
        active: !!t.active,
      }));

    if (cleanTemplates.length === 0) {
      return res.status(400).json({ success: false, message: 'At least one message template is required.' });
    }

    // Enforce a single active template — if the client sent more than one
    // (or none), keep only the first marked active, falling back to the
    // first template overall.
    let activeAssigned = false;
    for (const t of cleanTemplates) {
      if (t.active && !activeAssigned) {
        activeAssigned = true;
      } else {
        t.active = false;
      }
    }
    if (!activeAssigned) cleanTemplates[0].active = true;

    try {
      const settings = await AutoReplySettings.findOneAndUpdate(
        { userId: req.userId },
        {
          userId: req.userId,
          enabled: enabled !== false,
          delaySeconds: Number(delaySeconds) || 0,
          templates: cleanTemplates,
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );

      res.json({ success: true, data: settings, message: 'Auto reply settings saved successfully!' });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to save auto reply settings.', error: error.message });
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
   * Handles incoming Instagram Direct Message webhook events only.
   * Comment/mention events are intentionally ignored — this app auto-replies
   * to DMs exclusively.
   */
  async handleWebhookEvent(req, res) {
    console.log('📩 Incoming Instagram webhook event on /api/instagram/webhook:', JSON.stringify(req.body, null, 2));

    const { object, entry } = req.body;

    if (object !== 'instagram' || !Array.isArray(entry)) {
      return res.status(200).send('EVENT_RECEIVED');
    }

    for (const item of entry) {
      const igBusinessId = item.id;

      // Retrieve active connection & access token for this IG business ID
      const conn = await InstagramConnection.findOne({
        $or: [
          { instagramBusinessId: igBusinessId },
          { instagramUserId: igBusinessId },
          { connected: true }
        ]
      }).sort({ updatedAt: -1 });

      if (!conn) {
        console.warn(`⚠️ No InstagramConnection found for igBusinessId ${igBusinessId}. Skipping.`);
        continue;
      }

      const accessToken = conn.accessToken;
      const settings = await AutoReplySettings.findOne({ userId: conn.userId });
      const activeTemplate = settings?.templates?.find((t) => t.active);
      console.log(`🔎 Connection userId="${conn.userId}" | Settings found: ${!!settings} | enabled: ${settings?.enabled} | active template: ${!!activeTemplate}`);

      if (!settings || !settings.enabled || !activeTemplate) {
        console.warn(`⚠️ Skipping DM reply — no enabled/active AutoReplySettings template for userId "${conn.userId}".`);
        continue;
      }

      // Collect DM events from both the `changes` (messages field) and
      // legacy `messaging` array shapes Meta may send.
      const dmEvents = [];

      if (Array.isArray(item.changes)) {
        for (const changeEvent of item.changes) {
          if (changeEvent.field === 'messages' || changeEvent.field === 'messaging') {
            const dmValue = changeEvent.value;
            dmEvents.push({
              senderId: dmValue?.sender?.id || dmValue?.from?.id,
              text: dmValue?.message?.text || dmValue?.text || '',
              isEcho: !!dmValue?.message?.is_echo,
            });
          }
        }
      }

      if (Array.isArray(item.messaging)) {
        for (const messagingEvent of item.messaging) {
          if (messagingEvent.message && messagingEvent.sender) {
            dmEvents.push({
              senderId: messagingEvent.sender.id,
              text: messagingEvent.message.text || '',
              isEcho: !!messagingEvent.message.is_echo,
            });
          }
        }
      }

      for (const dm of dmEvents) {
        // Skip echoes of our own outgoing messages so the bot never replies to itself.
        if (dm.isEcho || !dm.senderId) continue;

        console.log(`📩 New Instagram DM: "${dm.text}" from ${dm.senderId}`);

        if (settings.delaySeconds > 0) {
          await new Promise((resolve) => setTimeout(resolve, settings.delaySeconds * 1000));
        }

        await instagramService.sendDirectMessage(igBusinessId, dm.senderId, activeTemplate.text, accessToken);

        if (activeTemplate.ctaButtons.length > 0) {
          await instagramService.sendButtonMessage(igBusinessId, dm.senderId, activeTemplate.ctaButtons, accessToken);
        }
      }
    }

    return res.status(200).send('EVENT_RECEIVED');
  }
};

