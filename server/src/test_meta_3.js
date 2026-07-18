import axios from 'axios';

async function testGraphAPI() {
  const instagramBusinessId = "17841439677670228";
  const accessToken = "EAAWMd0aA2YYBR6AoKqCj6vR2TwyV5rVTHfCTpn8IkmRhniZCC2EI1CC427ztHRG14nUehjSYwyjKv3YBLn3h3xriK4Mi4LuAL5ZCOZCtiZBDhEtrDVtcoqA8JE0a2suHVhY4fYUaBwU06ajbMFuWXk9KNiPhLjRFBOxxMheF6FDTuc4RQuAzW1FijqKnFqVaZAesCBubO1tlisnbavzTH";
  
  const url = `https://graph.facebook.com/v20.0/${instagramBusinessId}/conversations`;

  try {
    const res = await axios.get(url, {
      params: {
        platform: 'instagram',
        fields: 'id,participants,updated_time,unread_count,messages{id,message,from,created_time}',
        access_token: accessToken,
      },
    });
    console.log("SUCCESS:", JSON.stringify(res.data, null, 2));
  } catch (err) {
    console.error("GRAPH API ERROR FOR NEW TOKEN:", err.response?.data || err.message);
  }
}

testGraphAPI();
