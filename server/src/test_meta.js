import axios from 'axios';

async function testGraphAPI() {
  const instagramBusinessId = "17841439677670228";
  const accessToken = "EAAWMd0aA2YYBR1IJ3ZAqZCYxbMJ8wqPoub42RjvY5YZCbkOZBeqwgG2qAZAXZCXGkwmEuvzC2ZB9Kx9DtBIOudtHvPDHnuW5B8urBR6BHrhwJKUHJNh72vktTO5asYJbhOWpnmYmvIgdtZAaOE0mUNcgoxZAGZBmkthsRrZChLQHJc4xCZA4oI48Lxsr0r910H3bFgntimnKPc6KFSkAw2eM1dDS";
  
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
    console.error("GRAPH API ERROR:", err.response?.data || err.message);
  }
}

testGraphAPI();
