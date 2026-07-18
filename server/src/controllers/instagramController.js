import { instagramService } from '../services/instagramService.js';
import InstagramConnection from '../models/InstagramConnection.js';

export const instagramController = {
  /**
   * GET /api/instagram/connect
   * Initiates the Meta OAuth flow.
   */
  async connect(req, res) {
    const { workspaceId } = req.query;
    if (!workspaceId) {
      return res.status(400).json({ success: false, message: 'workspaceId query parameter is required.' });
    }

    try {
      // Create CSRF state parameter containing userId and workspaceId
      const stateObj = { userId: req.userId, workspaceId };
      const stateStr = Buffer.from(JSON.stringify(stateObj)).toString('base64');

      const authUrl = instagramService.getAuthUrl(stateStr);
      res.json({ success: true, url: authUrl });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to generate OAuth URL.', error: error.message });
    }
  },

  /**
   * GET /api/instagram/callback
   * Processes the Meta OAuth redirect.
   */
  async callback(req, res) {
    const { code, state, error, error_description } = req.query;

    if (error) {
      console.error('❌ Meta OAuth Error:', error, error_description);
      return res.redirect(`${process.env.CLIENT_URL || 'http://localhost:5173'}/integrations?error=${encodeURIComponent(error_description || 'OAuth Cancelled')}`);
    }

    if (!code || !state) {
      return res.redirect(`${process.env.CLIENT_URL || 'http://localhost:5173'}/integrations?error=missing_parameters`);
    }

    try {
      // Parse state
      const stateObj = JSON.parse(Buffer.from(state, 'base64').toString('utf-8'));
      const { userId, workspaceId } = stateObj;

      if (!userId || !workspaceId) {
        throw new Error('Invalid state signature.');
      }

      // 1. Exchange auth code for long-lived user token
      const tokenData = await instagramService.exchangeCodeForToken(code);

      // 2. Fetch Facebook pages & linked Instagram business account details
      const assets = await instagramService.fetchFacebookAssets(tokenData.accessToken);

      // 3. Subscribe Facebook Page to our app to receive DMs and Comments
      let webhookSubscribed = false;
      try {
        webhookSubscribed = await instagramService.subscribeWebhook(assets.facebookPageId, assets.facebookPageAccessToken);
      } catch (err) {
        console.error('❌ Webhook subscription failed:', err.message);
      }

      // Calculate expiration date
      const expiresAt = tokenData.expiresIn ? new Date(Date.now() + tokenData.expiresIn * 1000) : null;

      // 4. Upsert connection record in MongoDB
      const connectionData = {
        workspaceId,
        userId,
        facebookUserId: assets.facebookUserId,
        facebookPageId: assets.facebookPageId,
        facebookPageName: assets.facebookPageName,
        instagramBusinessId: assets.instagramBusinessId,
        instagramUsername: assets.instagramUsername,
        profilePicture: assets.profilePicture,
        accessToken: assets.facebookPageAccessToken, // Saved via encrypt setter
        expiresAt,
        connected: true,
        webhookSubscribed,
      };

      await InstagramConnection.findOneAndUpdate(
        { workspaceId, userId },
        connectionData,
        { upsert: true, new: true }
      );

      // Redirect client to landing selector page
      res.redirect(`${process.env.CLIENT_URL || 'http://localhost:5173'}/?status=success`);
    } catch (err) {
      console.error('❌ Callback verification failed:', err);
      res.redirect(`${process.env.CLIENT_URL || 'http://localhost:5173'}/?error=${encodeURIComponent(err.message || 'OAuth Exchange Failed')}`);
    }
  },

  /**
   * GET /api/instagram/status
   * Fetches status of the connected Instagram account for the user's workspace.
   */
  async getStatus(req, res) {
    const { workspaceId } = req.query;
    if (!workspaceId) {
      return res.status(400).json({ success: false, message: 'workspaceId query parameter is required.' });
    }

    try {
      const conn = await InstagramConnection.findOne({ workspaceId, userId: req.userId });

      if (!conn || !conn.connected) {
        return res.json({ success: true, connected: false });
      }

      res.json({
        success: true,
        connected: true,
        connection: {
          id: conn._id,
          facebookPageName: conn.facebookPageName,
          instagramUsername: conn.instagramUsername,
          instagramBusinessId: conn.instagramBusinessId,
          profilePicture: conn.profilePicture,
          webhookSubscribed: conn.webhookSubscribed,
          expiresAt: conn.expiresAt,
          updatedAt: conn.updatedAt
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to fetch connection status.', error: error.message });
    }
  },

  /**
   * POST /api/instagram/disconnect
   * Disconnects the linked Instagram account.
   */
  async disconnect(req, res) {
    const { workspaceId } = req.body;
    if (!workspaceId) {
      return res.status(400).json({ success: false, message: 'workspaceId is required in body.' });
    }

    try {
      const conn = await InstagramConnection.findOne({ workspaceId, userId: req.userId });

      if (conn) {
        // Attempt webhook unsubscribe
        try {
          await instagramService.deleteWebhookSubscription(conn.facebookPageId, conn.accessToken);
        } catch (err) {
          console.warn('❌ Failed to delete webhook subscription:', err.message);
        }

        // Delete the connection from Database to remove access token completely
        await InstagramConnection.deleteOne({ _id: conn._id });
      }

      res.json({ success: true, message: 'Instagram account disconnected successfully.' });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to disconnect account.', error: error.message });
    }
  },

  /**
   * GET /api/instagram/pages
   * Fetches connected Facebook pages (simulated/actual wrapper).
   */
  async getPages(req, res) {
    try {
      const conn = await InstagramConnection.findOne({ userId: req.userId });
      if (!conn) return res.status(404).json({ success: false, message: 'No connected Instagram account found.' });
      res.json({ success: true, pages: [{ id: conn.facebookPageId, name: conn.facebookPageName }] });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  /**
   * GET /api/instagram/profile
   * Returns connected profile.
   */
  async getProfile(req, res) {
    try {
      const conn = await InstagramConnection.findOne({ userId: req.userId });
      if (!conn) return res.status(404).json({ success: false, message: 'No connected Instagram account found.' });
      res.json({
        success: true,
        profile: {
          instagramBusinessId: conn.instagramBusinessId,
          instagramUsername: conn.instagramUsername,
          profilePicture: conn.profilePicture
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
};
