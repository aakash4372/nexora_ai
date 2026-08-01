import { instagramService } from '../services/instagramService.js';
import InstagramConnection from '../models/InstagramConnection.js';
import AutoReplyRule from '../models/AutoReplyRule.js';

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
   * GET /api/instagram/auto-replies
   */
  async getAutoReplies(req, res) {
    const { workspaceId } = req.query;
    try {
      const filter = workspaceId ? { workspaceId } : {};
      const rules = await AutoReplyRule.find(filter).sort({ createdAt: -1 });
      res.json({ success: true, data: rules });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to fetch auto replies.', error: error.message });
    }
  },

  /**
   * POST /api/instagram/auto-replies
   */
  async createAutoReply(req, res) {
    const { workspaceId, postId, postCaption, postMediaUrl, mediaType, permalink, triggerKeyword, autoDmMessage, publicCommentReply } = req.body;

    if (!workspaceId || !postId || !autoDmMessage) {
      return res.status(400).json({ success: false, message: 'workspaceId, postId, and autoDmMessage are required.' });
    }

    try {
      const rule = await AutoReplyRule.create({
        workspaceId,
        userId: req.userId,
        postId,
        postCaption: postCaption || '',
        postMediaUrl: postMediaUrl || '',
        mediaType: mediaType || 'IMAGE',
        permalink: permalink || '',
        triggerKeyword: triggerKeyword || '*',
        autoDmMessage,
        publicCommentReply: publicCommentReply || '',
        status: 'Live',
        runs: 0
      });

      res.status(201).json({ success: true, data: rule, message: 'Auto reply rule created successfully!' });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to create auto reply rule.', error: error.message });
    }
  },

  /**
   * PATCH /api/instagram/auto-replies/:id
   */
  async toggleAutoReply(req, res) {
    const { id } = req.params;
    try {
      const rule = await AutoReplyRule.findById(id);
      if (!rule) return res.status(404).json({ success: false, message: 'Rule not found.' });

      rule.status = rule.status === 'Live' ? 'Paused' : 'Live';
      await rule.save();
      res.json({ success: true, data: rule });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to toggle rule.', error: error.message });
    }
  },

  /**
   * DELETE /api/instagram/auto-replies/:id
   */
  async deleteAutoReply(req, res) {
    const { id } = req.params;
    try {
      await AutoReplyRule.findByIdAndDelete(id);
      res.json({ success: true, message: 'Auto reply rule deleted successfully.' });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to delete rule.', error: error.message });
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
        for (const item of entry) {
          const igBusinessId = item.id;

          // Process Instagram Comments (Post / Reel comment triggers)
          if (item.changes) {
            for (const changeEvent of item.changes) {
              if (changeEvent.field === 'comments' || changeEvent.field === 'live_comments') {
                const commentValue = changeEvent.value;
                const commentText = (commentValue?.text || '').toUpperCase();
                const mediaId = commentValue?.media?.id || commentValue?.id;
                const commenterId = commentValue?.from?.id;

                console.log(`💬 New Instagram comment on media ${mediaId}: "${commentValue?.text}" by ${commenterId}`);

                // Find matching active auto-reply rules for this post or workspace
                const rules = await AutoReplyRule.find({ status: 'Live' });
                for (const rule of rules) {
                  const keywordMatch = rule.triggerKeyword === '*' ||
                    rule.triggerKeyword.toUpperCase().split(',').some(k => commentText.includes(k.trim()));

                  const postMatch = !rule.postId || rule.postId === 'ALL' || rule.postId === mediaId;

                  if (keywordMatch && postMatch) {
                    console.log(`🎯 Auto reply rule matched! Rule ID: ${rule._id}`);
                    rule.runs += 1;
                    await rule.save();

                    // Send Auto DM to commenter
                    if (commenterId && rule.autoDmMessage) {
                      await instagramService.sendDirectMessage(igBusinessId, commenterId, rule.autoDmMessage);
                    }
                    // Post optional comment reply
                    if (commentValue?.id && rule.publicCommentReply) {
                      await instagramService.replyToComment(commentValue.id, rule.publicCommentReply);
                    }
                  }
                }
              }
            }
          }

          // Process direct message triggers
          if (item.messaging) {
            for (const messagingEvent of item.messaging) {
              if (messagingEvent.message && messagingEvent.sender) {
                const text = (messagingEvent.message.text || '').toUpperCase();
                const senderId = messagingEvent.sender.id;

                const rules = await AutoReplyRule.find({ status: 'Live' });
                for (const rule of rules) {
                  const keywordMatch = rule.triggerKeyword === '*' ||
                    rule.triggerKeyword.toUpperCase().split(',').some(k => text.includes(k.trim()));

                  if (keywordMatch) {
                    console.log(`🎯 Auto DM keyword matched for DM from ${senderId}! Rule ID: ${rule._id}`);
                    rule.runs += 1;
                    await rule.save();

                    await instagramService.sendDirectMessage(igBusinessId, senderId, rule.autoDmMessage);
                  }
                }
              }
            }
          }
        }
      }
      return res.status(200).send('EVENT_RECEIVED');
    }

    return res.status(200).send('EVENT_RECEIVED');
  }
};

