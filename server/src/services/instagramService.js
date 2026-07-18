import axios from 'axios';

const GRAPH_API_VERSION = 'v20.0';
const BASE_URL = `https://graph.facebook.com/${GRAPH_API_VERSION}`;

/**
 * Service to handle Meta/Facebook Graph API calls for Instagram Business.
 */
export const instagramService = {
  getAuthUrl(state) {
    const appId = process.env.FACEBOOK_APP_ID;
    const redirectUri = encodeURIComponent(process.env.FACEBOOK_REDIRECT_URI);
    const scopes = [
      'instagram_basic',
      'instagram_manage_messages',
      'instagram_manage_comments',
      'pages_show_list',
      'pages_read_engagement',
      'pages_manage_metadata',
      'business_management'
    ];

    return `https://www.facebook.com/${GRAPH_API_VERSION}/dialog/oauth?client_id=${appId}&redirect_uri=${redirectUri}&scope=${scopes.join(',')}&response_type=code&state=${state}`;
  },

  /**
   * Exchanges the OAuth authorization code for a long-lived page access token.
   */
  async exchangeCodeForToken(code) {
    const appId = process.env.FACEBOOK_APP_ID;
    const appSecret = process.env.FACEBOOK_APP_SECRET;
    const redirectUri = process.env.FACEBOOK_REDIRECT_URI;

    // 1. Get short-lived user access token
    const tokenRes = await axios.get(`${BASE_URL}/oauth/access_token`, {
      params: {
        client_id: appId,
        redirect_uri: redirectUri,
        client_secret: appSecret,
        code,
      },
    });

    const shortLivedToken = tokenRes.data.access_token;

    // 2. Exchange short-lived token for long-lived user token
    const longLivedRes = await axios.get(`${BASE_URL}/oauth/access_token`, {
      params: {
        grant_type: 'fb_exchange_token',
        client_id: appId,
        client_secret: appSecret,
        fb_exchange_token: shortLivedToken,
      },
    });

    return {
      accessToken: longLivedRes.data.access_token,
      expiresIn: longLivedRes.data.expires_in,
    };
  },

  /**
   * Fetches Facebook user, pages, and linked Instagram Business account details.
   */
  async fetchFacebookAssets(userAccessToken) {
    // 1. Fetch Facebook User ID
    const meRes = await axios.get(`${BASE_URL}/me`, {
      params: { access_token: userAccessToken },
    });
    const facebookUserId = meRes.data.id;

    // 2. Fetch Facebook Pages linked to the account
    const pagesRes = await axios.get(`${BASE_URL}/me/accounts`, {
      params: { access_token: userAccessToken },
    });

    console.log("DEBUG: Meta Pages Response:", JSON.stringify(pagesRes.data, null, 2));

    const pages = pagesRes.data.data;
    if (!pages || pages.length === 0) {
      throw new Error('No Facebook Pages found. Please ensure: 1) You have created a Facebook Page on this account, and 2) You checked/granted permission for your Pages in the Facebook login prompt (use "Edit Settings" in the popup to verify).');
    }

    // 3. Find the Facebook Page with an Instagram Business account connected
    let connectedPage = null;
    let instagramBusinessId = null;

    for (const page of pages) {
      try {
        const pageDetailRes = await axios.get(`${BASE_URL}/${page.id}`, {
          params: {
            fields: 'instagram_business_account',
            access_token: page.access_token,
          },
        });

        if (pageDetailRes.data.instagram_business_account) {
          connectedPage = page;
          instagramBusinessId = pageDetailRes.data.instagram_business_account.id;
          break; // Found the connected page
        }
      } catch (err) {
        console.warn(`Could not check page ${page.name}:`, err.message);
      }
    }

    if (!connectedPage || !instagramBusinessId) {
      throw new Error('No Instagram Business Account linked to your Facebook Pages. Please ensure: 1) Your Instagram account is a Business or Creator account, and 2) It is linked/connected to your Facebook Page in the Page settings.');
    }

    // 4. Fetch Instagram profile details
    const igProfileRes = await axios.get(`${BASE_URL}/${instagramBusinessId}`, {
      params: {
        fields: 'username,name,profile_picture_url',
        access_token: connectedPage.access_token,
      },
    });

    const { username, profile_picture_url } = igProfileRes.data;

    return {
      facebookUserId,
      facebookPageId: connectedPage.id,
      facebookPageName: connectedPage.name,
      facebookPageAccessToken: connectedPage.access_token, // This is the token we save
      instagramBusinessId,
      instagramUsername: username,
      profilePicture: profile_picture_url || '',
    };
  },

  /**
   * Subscribes the Facebook Page to our app to receive Instagram Webhook events.
   */
  async subscribeWebhook(pageId, pageAccessToken) {
    const url = `${BASE_URL}/${pageId}/subscribed_apps`;
    const response = await axios.post(
      url,
      {
        subscribed_fields: ['messages', 'comments', 'mentions', 'message_reactions', 'story_mentions'],
      },
      {
        headers: {
          Authorization: `Bearer ${pageAccessToken}`,
        },
      }
    );
    return response.data.success === true;
  },

  /**
   * Deletes the webhook subscription for the page.
   */
  async deleteWebhookSubscription(pageId, pageAccessToken) {
    const url = `${BASE_URL}/${pageId}/subscribed_apps`;
    const response = await axios.delete(url, {
      headers: {
        Authorization: `Bearer ${pageAccessToken}`,
      },
    });
    return response.data.success === true;
  }
};
