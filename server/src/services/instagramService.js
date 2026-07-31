import axios from 'axios';

const INSTAGRAM_GRAPH_URL = 'https://graph.instagram.com/v20.0';
const FACEBOOK_GRAPH_URL = 'https://graph.facebook.com/v20.0';

/**
 * Service handling Instagram Business Login & Instagram Graph API interactions.
 */
export const instagramService = {
  /**
   * Generates the direct Instagram Business Login Authorization URL.
   */
  getAuthUrl(state) {
    const appId = process.env.META_APP_ID;
    const redirectUri = encodeURIComponent(process.env.INSTAGRAM_REDIRECT_URI);
    const scopes = [
      'instagram_business_basic',
      'instagram_business_manage_messages',
      'instagram_business_manage_comments'
    ];

    // enable_fb_login=0 forces direct Instagram Business Login prompt
    const url = `https://www.instagram.com/oauth/authorize?enable_fb_login=0&force_authentication=1&client_id=${appId}&redirect_uri=${redirectUri}&scope=${scopes.join(',')}&response_type=code&state=${state}`;
    console.log("Instagram OAuth URL:", url);
    return url;
  },

  /**
   * Exchanges authorization code for an Instagram access token.
   */
  async exchangeCodeForToken(code) {
    const appId = process.env.META_APP_ID;
    const appSecret = process.env.META_APP_SECRET;
    const redirectUri = process.env.INSTAGRAM_REDIRECT_URI;

    console.log("Exchanging Instagram authorization code for access token...");

    // 1. Exchange authorization code for short-lived token via api.instagram.com or graph.facebook.com
    let accessToken = null;
    let expiresIn = 5184000; // default 60 days for long-lived tokens

    try {
      // Try direct Instagram API OAuth exchange
      const params = new URLSearchParams();
      params.append('client_id', appId);
      params.append('client_secret', appSecret);
      params.append('grant_type', 'authorization_code');
      params.append('redirect_uri', redirectUri);
      params.append('code', code);

      const tokenRes = await axios.post('https://api.instagram.com/oauth/access_token', params, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      });

      console.log("Instagram token exchange response:", tokenRes.data);
      accessToken = tokenRes.data.access_token || tokenRes.data.accessToken;

      // Exchange short-lived token for long-lived Instagram token if needed
      if (accessToken) {
        try {
          const longLivedRes = await axios.get('https://graph.instagram.com/access_token', {
            params: {
              grant_type: 'ig_exchange_token',
              client_secret: appSecret,
              access_token: accessToken,
            }
          });
          if (longLivedRes.data?.access_token) {
            accessToken = longLivedRes.data.access_token;
            expiresIn = longLivedRes.data.expires_in || expiresIn;
          }
        } catch (llErr) {
          console.warn("Notice: Long-lived token exchange warning:", llErr.message);
        }
      }
    } catch (err) {
      console.warn("Primary IG exchange failed, falling back to Meta Graph OAuth:", err.response?.data || err.message);

      // Fallback exchange via graph.facebook.com
      const fbTokenRes = await axios.get(`${FACEBOOK_GRAPH_URL}/oauth/access_token`, {
        params: {
          client_id: appId,
          client_secret: appSecret,
          redirect_uri: redirectUri,
          code,
        }
      });

      console.log("Instagram token exchange response:", fbTokenRes.data);
      const shortToken = fbTokenRes.data.access_token;

      // Get long lived token
      const longRes = await axios.get(`${FACEBOOK_GRAPH_URL}/oauth/access_token`, {
        params: {
          grant_type: 'fb_exchange_token',
          client_id: appId,
          client_secret: appSecret,
          fb_exchange_token: shortToken,
        }
      });

      accessToken = longRes.data.access_token;
      expiresIn = longRes.data.expires_in || expiresIn;
    }

    if (!accessToken) {
      throw new Error('Access token failure: Could not exchange authorization code for access token.');
    }

    return {
      accessToken,
      expiresIn,
    };
  },

  /**
   * Fetches connected Instagram Professional/Business account details.
   */
  async fetchInstagramAccount(userAccessToken) {
    console.log("Fetching Instagram account response...");

    // 1. Try Direct Instagram Graph API (/me)
    try {
      const meRes = await axios.get(`${INSTAGRAM_GRAPH_URL}/me`, {
        params: {
          fields: 'id,username,account_type,profile_picture_url',
          access_token: userAccessToken,
        }
      });

      console.log("Instagram account response:", meRes.data);
      const { id, username, account_type, profile_picture_url } = meRes.data;

      return {
        instagramUserId: id,
        instagramBusinessId: id,
        username: username || 'instagram_user',
        accountType: account_type || 'BUSINESS',
        profilePicture: profile_picture_url || '',
      };
    } catch (err) {
      console.warn("Direct IG /me failed, checking linked Meta Business accounts:", err.response?.data || err.message);

      // 2. Fallback via Meta Graph API /me/accounts -> instagram_business_account
      const meRes = await axios.get(`${FACEBOOK_GRAPH_URL}/me`, {
        params: { access_token: userAccessToken }
      });
      const facebookUserId = meRes.data.id;

      const pagesRes = await axios.get(`${FACEBOOK_GRAPH_URL}/me/accounts`, {
        params: { access_token: userAccessToken }
      });

      const pages = pagesRes.data.data;
      if (!pages || pages.length === 0) {
        throw new Error('Instagram account not eligible: No Instagram professional account found.');
      }

      let connectedPage = null;
      let instagramBusinessId = null;

      for (const page of pages) {
        try {
          const detailRes = await axios.get(`${FACEBOOK_GRAPH_URL}/${page.id}`, {
            params: { fields: 'instagram_business_account', access_token: page.access_token }
          });
          if (detailRes.data.instagram_business_account) {
            connectedPage = page;
            instagramBusinessId = detailRes.data.instagram_business_account.id;
            break;
          }
        } catch (e) {
          // ignore individual page error
        }
      }

      if (!connectedPage || !instagramBusinessId) {
        throw new Error('Instagram account not eligible: Your Instagram account must be a Business or Creator account.');
      }

      const igProfileRes = await axios.get(`${FACEBOOK_GRAPH_URL}/${instagramBusinessId}`, {
        params: {
          fields: 'username,name,profile_picture_url',
          access_token: connectedPage.access_token,
        }
      });

      console.log("Instagram account response:", igProfileRes.data);

      return {
        instagramUserId: instagramBusinessId,
        instagramBusinessId,
        username: igProfileRes.data.username || 'instagram_user',
        accountType: 'BUSINESS',
        profilePicture: igProfileRes.data.profile_picture_url || '',
        facebookPageId: connectedPage.id,
        facebookPageAccessToken: connectedPage.access_token,
      };
    }
  },

  /**
   * Subscribes webhook events.
   */
  async subscribeWebhook(pageId, pageAccessToken) {
    if (!pageId || !pageAccessToken) return false;
    try {
      const url = `${FACEBOOK_GRAPH_URL}/${pageId}/subscribed_apps`;
      const response = await axios.post(
        url,
        { subscribed_fields: ['messages', 'message_reactions'] },
        { headers: { Authorization: `Bearer ${pageAccessToken}` } }
      );
      return response.data.success === true;
    } catch (err) {
      console.warn("Webhook subscription notice:", err.message);
      return false;
    }
  },

  /**
   * Deletes webhook subscription.
   */
  async deleteWebhookSubscription(pageId, pageAccessToken) {
    if (!pageId || !pageAccessToken) return false;
    try {
      const url = `${FACEBOOK_GRAPH_URL}/${pageId}/subscribed_apps`;
      const response = await axios.delete(url, {
        headers: { Authorization: `Bearer ${pageAccessToken}` }
      });
      return response.data.success === true;
    } catch (err) {
      return false;
    }
  }
};
