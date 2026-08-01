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
   * Subscribes the connected IG account to receive "messages"/"comments" webhook
   * events. Accounts connected via direct Instagram Business Login authenticate
   * this call with their own IG access token against graph.instagram.com, not a
   * Facebook Page token. Falls back to the Page-based call for accounts that were
   * connected through a linked Facebook Page (facebookPageId/facebookPageAccessToken).
   */
  async subscribeWebhook(igUserId, accessToken, facebookPageId, facebookPageAccessToken) {
    if (igUserId && accessToken) {
      try {
        const url = `${INSTAGRAM_GRAPH_URL}/${igUserId}/subscribed_apps`;
        const response = await axios.post(url, null, {
          params: {
            subscribed_fields: 'messages',
            access_token: accessToken,
          },
        });
        if (response.data.success === true) return true;
      } catch (err) {
        console.warn("IG webhook subscription notice:", err.response?.data || err.message);
      }
    }

    if (facebookPageId && facebookPageAccessToken) {
      try {
        const url = `${FACEBOOK_GRAPH_URL}/${facebookPageId}/subscribed_apps`;
        const response = await axios.post(
          url,
          { subscribed_fields: ['messages'] },
          { headers: { Authorization: `Bearer ${facebookPageAccessToken}` } }
        );
        return response.data.success === true;
      } catch (err) {
        console.warn("Facebook Page webhook subscription notice:", err.response?.data || err.message);
      }
    }

    return false;
  },

  /**
   * Deletes webhook subscription.
   */
  async deleteWebhookSubscription(igUserId, accessToken) {
    if (!igUserId || !accessToken) return false;
    try {
      const url = `${INSTAGRAM_GRAPH_URL}/${igUserId}/subscribed_apps`;
      const response = await axios.delete(url, {
        params: { access_token: accessToken },
      });
      return response.data.success === true;
    } catch (err) {
      return false;
    }
  },

  /**
   * Fetches published Instagram Posts and Reels for an Instagram Account.
   */
  async fetchUserMedia(userAccessToken, instagramUserId) {
    const demoMedia = [
      {
        id: '18029384711928374',
        caption: '🔥 Our New Summer Drop is Live! Comment "PRICE" to get exclusive 20% OFF discount code in your DMs! 🎁✨',
        media_type: 'REEL',
        media_url: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600&auto=format&fit=crop',
        thumbnail_url: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600&auto=format&fit=crop',
        permalink: 'https://instagram.com/p/C_demo_reel_1',
        timestamp: new Date().toISOString(),
      },
      {
        id: '17992837461928375',
        caption: 'Behind the scenes at Nexora AI Labs! Drop a comment with "DEMO" to try our automated customer agent today 🚀',
        media_type: 'VIDEO',
        media_url: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=600&auto=format&fit=crop',
        thumbnail_url: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=600&auto=format&fit=crop',
        permalink: 'https://instagram.com/p/C_demo_post_2',
        timestamp: new Date(Date.now() - 86400000).toISOString(),
      },
      {
        id: '17859384729104829',
        caption: 'Check out our new collection lookbook! Comment "LOOKBOOK" for catalog PDF link. 📖👇',
        media_type: 'CAROUSEL_ALBUM',
        media_url: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=600&auto=format&fit=crop',
        thumbnail_url: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=600&auto=format&fit=crop',
        permalink: 'https://instagram.com/p/C_demo_post_3',
        timestamp: new Date(Date.now() - 172800000).toISOString(),
      },
      {
        id: '18102938475619284',
        caption: 'Which color is your favorite? Comment "BLUE" or "BLACK" to get stock alert DMs! 🛍️',
        media_type: 'IMAGE',
        media_url: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=600&auto=format&fit=crop',
        thumbnail_url: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=600&auto=format&fit=crop',
        permalink: 'https://instagram.com/p/C_demo_post_4',
        timestamp: new Date(Date.now() - 259200000).toISOString(),
      }
    ];

    if (!userAccessToken) return demoMedia;

    try {
      // 1. Attempt Instagram Graph API call
      const res = await axios.get(`${INSTAGRAM_GRAPH_URL}/me/media`, {
        params: {
          fields: 'id,caption,media_type,media_url,thumbnail_url,permalink,timestamp',
          access_token: userAccessToken,
          limit: 25,
        }
      });
      if (res.data && res.data.data && res.data.data.length > 0) {
        return res.data.data;
      }
    } catch (err) {
      console.warn("Notice: Fetching live IG media failed, returning demo media:", err.response?.data || err.message);
    }

    try {
      // 2. Attempt Meta Graph API fallback using instagramBusinessId
      if (instagramUserId) {
        const fbRes = await axios.get(`${FACEBOOK_GRAPH_URL}/${instagramUserId}/media`, {
          params: {
            fields: 'id,caption,media_type,media_url,thumbnail_url,permalink,timestamp',
            access_token: userAccessToken,
            limit: 25,
          }
        });
        if (fbRes.data && fbRes.data.data && fbRes.data.data.length > 0) {
          return fbRes.data.data;
        }
      }
    } catch (err) {
      console.warn("Notice: Fetching Meta IG business media failed, returning demo media:", err.message);
    }

    return demoMedia;
  },

  /**
   * Sends an automated Direct Message on Instagram.
   */
  async sendDirectMessage(igBusinessId, recipientId, messageText, accessToken) {
    console.log(`🤖 Triggering Auto DM to ${recipientId}: "${messageText}"`);

    if (!recipientId || !messageText) return false;

    if (!accessToken || !igBusinessId) {
      console.log(`ℹ️ Demo/Local Mode: Auto DM trigger logged for ${recipientId}`);
      return false;
    }

    const recipient = { id: recipientId };

    // 1. Instagram Graph API (correct endpoint/token pairing for accounts
    //    connected via direct Instagram Business Login).
    try {
      const res = await axios.post(`${INSTAGRAM_GRAPH_URL}/${igBusinessId}/messages`, {
        recipient,
        message: { text: messageText }
      }, {
        params: { access_token: accessToken },
        headers: { 'Content-Type': 'application/json' }
      });
      console.log(`✅ Live Instagram DM delivered to ${recipientId}:`, res.data);
      return true;
    } catch (err) {
      console.warn("Instagram Graph API DM send failed:", err.response?.data || err.message);
    }

    // 2. Fallback: Meta Graph API (for accounts connected via a linked Facebook Page).
    try {
      const res2 = await axios.post(`${FACEBOOK_GRAPH_URL}/${igBusinessId}/messages`, {
        recipient,
        message: { text: messageText }
      }, {
        params: { access_token: accessToken },
        headers: { 'Content-Type': 'application/json' }
      });
      console.log(`✅ Live Instagram DM delivered via Meta Graph API fallback:`, res2.data);
      return true;
    } catch (err2) {
      console.error(`❌ Auto DM to ${recipientId} failed on both endpoints:`, err2.response?.data || err2.message);
      return false;
    }
  },

  /**
   * Sends a DM containing up to 3 call-to-action web-link buttons
   * (Instagram/Messenger "button template" attachment).
   */
  async sendButtonMessage(igBusinessId, recipientId, ctaButtons, accessToken) {
    if (!recipientId || !accessToken || !igBusinessId || !ctaButtons?.length) return false;

    const payload = {
      recipient: { id: recipientId },
      message: {
        attachment: {
          type: 'template',
          payload: {
            template_type: 'button',
            text: '👇',
            buttons: ctaButtons.slice(0, 3).map((b) => ({
              type: 'web_url',
              url: b.url,
              title: b.name,
            })),
          },
        },
      },
    };

    try {
      const res = await axios.post(`${INSTAGRAM_GRAPH_URL}/${igBusinessId}/messages`, payload, {
        params: { access_token: accessToken },
        headers: { 'Content-Type': 'application/json' }
      });
      console.log(`✅ CTA button message delivered to ${recipientId}:`, res.data);
      return true;
    } catch (err) {
      console.warn("Instagram Graph API CTA button send failed:", err.response?.data || err.message);
    }

    try {
      const res2 = await axios.post(`${FACEBOOK_GRAPH_URL}/${igBusinessId}/messages`, payload, {
        params: { access_token: accessToken },
        headers: { 'Content-Type': 'application/json' }
      });
      console.log(`✅ CTA button message delivered via Meta Graph API fallback:`, res2.data);
      return true;
    } catch (err2) {
      console.error(`❌ CTA button send to ${recipientId} failed on both endpoints:`, err2.response?.data || err2.message);
      return false;
    }
  }
};

