import axios from 'axios';

async function testGraphAPI() {
  const instagramBusinessId = "17841439677670228";
  const accessToken = "EAAWMd0aA2YYBRyjY3DBZCHDtdqQdKIj7x4VZAHEPfPsmnQyflrEiX4RXOAWyoQO7zxRBxgdV8DQoc9wvSpa2MXpr6gtldxeaALkkutwzHHpcYaZAhzYpzsG8507YbXnAdkRzyAMuefqyiZC3CYan5cftpYz4ZCJagPJW7v3h0zELwFDtMLHm7KXYvJzYw0dH6gGSX0phgWjgFjUsxym0p";
  
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
