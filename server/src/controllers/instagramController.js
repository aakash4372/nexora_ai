import { instagramService } from '../services/instagramService.js';
import InstagramConnection from '../models/InstagramConnection.js';
import AutoReplySettings from '../models/AutoReplySettings.js';
import AutoReplyLog from '../models/AutoReplyLog.js';
import CommentAutomation from '../models/CommentAutomation.js';
import CommentAutomationLog from '../models/CommentAutomationLog.js';

/**
 * Matches an incoming comment against the user's Live comment-automations,
 * posts the public reply, and sends the opening DM (as a private reply to
 * the comment) with a postback button that continues the flow.
 */
async function handleCommentEvent({ igBusinessId, conn, accessToken, commentValue }) {
  const commentId = commentValue?.id;
  const mediaId = commentValue?.media?.id || commentValue?.media_id;
  const commentText = (commentValue?.text || '').toUpperCase();
  const commenterId = commentValue?.from?.id;

  if (!commentId || !commenterId) return;

  console.log(`💬 New Instagram comment on media ${mediaId}: "${commentValue?.text}" by ${commenterId}`);

  const automations = await CommentAutomation.find({ userId: conn.userId, status: 'Live' });

  for (const automation of automations) {
    const postMatch = automation.postIds.includes('ALL') || automation.postIds.includes(mediaId);
    if (!postMatch) continue;

    const keywordMatch = automation.commentMatchType === 'ANY' ||
      automation.keywords.some((k) => commentText.includes(k.toUpperCase().trim()));
    if (!keywordMatch) continue;

    // Dedupe so a retried webhook delivery for the same comment never
    // double-fires the reply/DM flow.
    try {
      await CommentAutomationLog.create({ automationId: automation._id, commentId });
    } catch (err) {
      if (err.code === 11000) {
        console.log(`⏭️ Comment ${commentId} already processed for automation ${automation._id} — skipping.`);
        return;
      }
      throw err;
    }

    automation.runs += 1;
    await automation.save();

    console.log(`🎯 Comment automation matched! Automation ID: ${automation._id}`);

    if (automation.commentReply) {
      await instagramService.replyToComment(igBusinessId, commentId, automation.commentReply, accessToken);
    }

    const openingButtons = [{
      name: automation.openingButtonName,
      postback: `CMTAUTO:${automation._id}:OPEN`,
    }];
    await instagramService.sendCommentPrivateReply(igBusinessId, commentId, automation.openingMessage, openingButtons, accessToken);

    // Only the first matching automation runs for a given comment.
    return;
  }
}

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Sends the final message (link + CTA button) for a comment-automation.
 */
async function sendAutomationFinalMessage(igBusinessId, senderId, automation, accessToken) {
  if (automation.finalCtaButtons.length > 0) {
    await instagramService.sendButtonMessage(igBusinessId, senderId, automation.finalMessage, automation.finalCtaButtons, accessToken);
  } else {
    await instagramService.sendDirectMessage(igBusinessId, senderId, automation.finalMessage, accessToken);
  }
}

/**
 * Continues a comment-automation flow when the user taps a postback button
 * (the opening DM's button, or the follow-confirm step's self-confirm
 * button). Payload format: `CMTAUTO:<automationId>:<step>`.
 */
async function handleAutomationPostback({ igBusinessId, conn, accessToken, senderId, payload }) {
  if (!payload?.startsWith('CMTAUTO:')) return;

  const [, automationId, step] = payload.split(':');
  const automation = await CommentAutomation.findOne({ _id: automationId, userId: conn.userId });
  if (!automation) return;

  console.log(`👆 Comment automation postback "${step}" from ${senderId} for automation ${automationId}`);

  if (step === 'OPEN' && automation.requireFollowConfirm) {
    // Follow-confirm step, ManyChat-style: two separate bubbles sent a beat
    // apart (not one bubble crammed with two buttons) — first the "go
    // follow" prompt with a link button to the profile, then a short pause,
    // then the "confirm" prompt with the self-confirm button that gates
    // progression. Instagram has no API/webhook to verify an actual follow,
    // so nothing here checks or claims real follow status — the user is
    // trusted at their word when they tap confirm.
    if (conn.username) {
      const followButtons = [{ name: automation.followNowButtonName, url: `https://instagram.com/${conn.username}` }];
      await instagramService.sendButtonMessage(igBusinessId, senderId, automation.followMessage, followButtons, accessToken);
    } else {
      await instagramService.sendDirectMessage(igBusinessId, senderId, automation.followMessage, accessToken);
    }

    await wait(1400);

    const confirmButtons = [{ name: automation.followConfirmButtonName, postback: `CMTAUTO:${automation._id}:FOLLOW_CONFIRMED` }];
    await instagramService.sendButtonMessage(igBusinessId, senderId, automation.followConfirmPromptMessage, confirmButtons, accessToken);
    return;
  }

  // step === 'OPEN' with the confirm step disabled, or step === 'FOLLOW_CONFIRMED' (self-reported, unverifiable)
  await sendAutomationFinalMessage(igBusinessId, senderId, automation, accessToken);
}

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
   * Fetches the authenticated user's Instagram connection status. Keyed by
   * req.userId (stable), not the client-supplied workspaceId — see
   * AutoReplySettings for why that string can drift and silently orphan
   * the lookup.
   */
  async getStatus(req, res) {
    try {
      const conn = await InstagramConnection.findOne({ userId: req.userId });

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
    try {
      let accessToken = null;
      let instagramUserId = null;
      // Keyed by the authenticated user (stable), not the client-supplied
      // workspaceId — see AutoReplySettings for why that string can drift
      // and silently orphan the lookup.
      const conn = await InstagramConnection.findOne({ userId: req.userId });
      if (conn) {
        accessToken = conn.accessToken;
        instagramUserId = conn.instagramBusinessId || conn.instagramUserId;
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

    // Instagram rejects button URLs that aren't well-formed absolute
    // http(s) links — validate up front instead of failing silently at
    // send time.
    const isValidUrl = (url) => {
      try {
        const parsed = new URL(url.trim());
        return parsed.protocol === 'http:' || parsed.protocol === 'https:';
      } catch {
        return false;
      }
    };

    for (const t of templates) {
      for (const b of t?.ctaButtons || []) {
        if (b?.name && b?.url && !isValidUrl(b.url)) {
          return res.status(400).json({
            success: false,
            message: `CTA button "${b.name}" has an invalid URL. It must start with http:// or https:// (e.g. https://example.com).`,
          });
        }
      }
    }

    const cleanTemplates = templates
      .filter((t) => t?.text && t.text.trim())
      .map((t) => ({
        text: t.text.trim(),
        ctaButtons: Array.isArray(t.ctaButtons)
          ? t.ctaButtons.filter((b) => b?.name && b?.url).map((b) => ({ name: b.name.trim(), url: b.url.trim() })).slice(0, 3)
          : [],
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
   * Handles incoming Instagram webhook events: DMs (the Auto Reply Setup
   * welcome-message flow), comments (Comment-to-DM automations), and
   * postback button taps (continuing a comment-automation's DM flow).
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

      // ── Comments → Comment-to-DM automations ──
      if (Array.isArray(item.changes)) {
        for (const changeEvent of item.changes) {
          if (changeEvent.field === 'comments' || changeEvent.field === 'live_comments') {
            await handleCommentEvent({ igBusinessId, conn, accessToken, commentValue: changeEvent.value });
          }
        }
      }

      // ── DMs → Auto Reply Setup (welcome-message templates) ──
      const settings = await AutoReplySettings.findOne({ userId: conn.userId });
      const activeTemplate = settings?.templates?.find((t) => t.active);
      // `enabled` is a mode switch, not a kill switch: ON = reply once every
      // 24h per sender (cooldown), OFF = reply to every incoming message
      // every time (no cooldown).
      console.log(`🔎 Connection userId="${conn.userId}" | Settings found: ${!!settings} | 24h-cooldown mode: ${settings?.enabled} | active template: ${!!activeTemplate}`);

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
          // Postback taps continue a comment-automation's DM flow — handle
          // separately and don't also treat them as a plain DM.
          if (messagingEvent.postback && messagingEvent.sender) {
            await handleAutomationPostback({
              igBusinessId, conn, accessToken,
              senderId: messagingEvent.sender.id,
              payload: messagingEvent.postback.payload,
            });
            continue;
          }
          if (messagingEvent.message && messagingEvent.sender) {
            dmEvents.push({
              senderId: messagingEvent.sender.id,
              text: messagingEvent.message.text || '',
              isEcho: !!messagingEvent.message.is_echo,
            });
          }
        }
      }

      if (!settings || !activeTemplate) {
        continue;
      }

      for (const dm of dmEvents) {
        // Skip echoes of our own outgoing messages so the bot never replies to itself.
        if (dm.isEcho || !dm.senderId) continue;

        console.log(`📩 New Instagram DM: "${dm.text}" from ${dm.senderId}`);

        // 24h-cooldown mode (toggle ON): only auto-reply once every 24h per
        // sender — if they messaged again within the last 24h (including
        // while a human is handling the conversation manually), skip.
        // Toggle OFF: no cooldown, reply to every incoming message.
        if (settings.enabled) {
          const COOLDOWN_MS = 24 * 60 * 60 * 1000;
          const lastLog = await AutoReplyLog.findOne({ userId: conn.userId, senderId: dm.senderId });
          if (lastLog && Date.now() - lastLog.sentAt.getTime() < COOLDOWN_MS) {
            console.log(`⏭️ Sender ${dm.senderId} already got an auto-reply within the last 24h — skipping.`);
            continue;
          }

          // Record the send before actually calling the Graph API so a
          // duplicate webhook delivery for the same event (Meta retries on
          // slow responses) can't slip past the cooldown check above.
          await AutoReplyLog.findOneAndUpdate(
            { userId: conn.userId, senderId: dm.senderId },
            { sentAt: new Date() },
            { upsert: true }
          );
        }

        if (settings.delaySeconds > 0) {
          await new Promise((resolve) => setTimeout(resolve, settings.delaySeconds * 1000));
        }

        // When CTA buttons are configured, send text + buttons as a single
        // combined bubble (Instagram button template) instead of two
        // separate messages.
        if (activeTemplate.ctaButtons.length > 0) {
          await instagramService.sendButtonMessage(igBusinessId, dm.senderId, activeTemplate.text, activeTemplate.ctaButtons, accessToken);
        } else {
          await instagramService.sendDirectMessage(igBusinessId, dm.senderId, activeTemplate.text, accessToken);
        }
      }
    }

    return res.status(200).send('EVENT_RECEIVED');
  }
};

