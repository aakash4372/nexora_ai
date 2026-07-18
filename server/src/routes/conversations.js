import express from 'express';
import axios from 'axios';
import InstagramConnection from '../models/InstagramConnection.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

/* ── In-memory data (mirrors prototype state) ── */
let conversations = [
  {
    id: 1,
    name: 'Riya Kapoor',
    channel: 'instagram',
    last: 'Is the blue one still in stock?',
    time: '2m',
    unread: 2,
    assigned: 'AI',
    tags: ['Lead', 'VIP'],
    typing: true,
    msgs: [
      { id: 1, from: 'them', text: 'Hi! I saw your story about the new collection 👀', ts: Date.now() - 400000 },
      { id: 2, from: 'ai', text: 'Hey Riya! Yes, the Spring Drop just landed. Want me to send you the lookbook?', ts: Date.now() - 300000 },
      { id: 3, from: 'them', text: 'Yes please!', ts: Date.now() - 200000 },
      { id: 4, from: 'them', text: 'Is the blue one still in stock?', ts: Date.now() - 120000 },
    ],
  },
  {
    id: 2,
    name: 'Karan Mehta',
    channel: 'whatsapp',
    last: 'Thank you so much 🙏',
    time: '14m',
    unread: 0,
    assigned: 'Priya',
    tags: ['Customer'],
    typing: false,
    msgs: [
      { id: 1, from: 'them', text: "My order hasn't arrived yet", ts: Date.now() - 900000 },
      { id: 2, from: 'out', text: "So sorry about that Karan — I've escalated it, refund issued if not delivered by Friday.", ts: Date.now() - 860000 },
      { id: 3, from: 'them', text: 'Thank you so much 🙏', ts: Date.now() - 840000 },
    ],
  },
  {
    id: 3,
    name: 'Neha Verma',
    channel: 'facebook',
    last: 'Can I get a discount code?',
    time: '1h',
    unread: 1,
    assigned: 'Unassigned',
    tags: ['Lead'],
    typing: false,
    msgs: [
      { id: 1, from: 'them', text: 'Can I get a discount code?', ts: Date.now() - 3600000 },
    ],
  },
  {
    id: 4,
    name: 'Devansh Rao',
    channel: 'instagram',
    last: 'Perfect, booking now',
    time: '3h',
    unread: 0,
    assigned: 'AI',
    tags: [],
    typing: false,
    msgs: [
      { id: 1, from: 'them', text: 'Do you have size L?', ts: Date.now() - 10800000 },
      { id: 2, from: 'ai', text: 'Yes! Size L is available in all colors.', ts: Date.now() - 10700000 },
      { id: 3, from: 'them', text: 'Perfect, booking now', ts: Date.now() - 10600000 },
    ],
  },
  {
    id: 5,
    name: 'Ishita Rao',
    channel: 'whatsapp',
    last: '👍',
    time: '1d',
    unread: 0,
    assigned: 'AI',
    tags: ['Customer'],
    typing: false,
    msgs: [{ id: 1, from: 'them', text: '👍', ts: Date.now() - 86400000 }],
  },
];

/** GET /api/conversations */
router.get('/', requireAuth, async (req, res) => {
  const { filter, assigned } = req.query;
  const userId = req.userId || req.user?.id;

  try {
    // 1. Check if InstagramConnection exists for the user
    console.log("DEBUG conversations: querying for userId:", userId);
    const allConns = await InstagramConnection.find({});
    console.log("DEBUG conversations: all connections in DB:", allConns);
    const connection = await InstagramConnection.findOne({ userId, connected: true }).sort({ updatedAt: -1 });
    console.log("DEBUG conversations: connection found:", connection);
    
    if (connection) {
      const { instagramBusinessId, accessToken } = connection;
      const url = `https://graph.facebook.com/v20.0/${instagramBusinessId}/conversations`;

      // Fetch conversations from Meta Graph API
      const graphRes = await axios.get(url, {
        params: {
          platform: 'instagram',
          fields: 'id,participants,updated_time,unread_count,messages{id,message,from,created_time}',
          access_token: accessToken,
        },
      });

      const metaConvs = graphRes.data.data || [];
      
      // Map meta conversations to Nexora format
      const formattedConvs = metaConvs.map((c) => {
        // Find customer participant (not the business itself)
        const customer = c.participants?.data?.find(p => p.id !== instagramBusinessId) || { name: 'Instagram User', id: 'unknown' };
        
        // Map messages
        const msgs = (c.messages?.data || []).map((m) => ({
          id: m.id,
          from: m.from?.id === instagramBusinessId ? 'out' : 'them',
          text: m.message,
          ts: new Date(m.created_time).getTime(),
        })).reverse(); // Reverse to place oldest first for chat flow

        return {
          id: c.id,
          name: customer.username || customer.name || 'Instagram User',
          channel: 'instagram',
          last: msgs[msgs.length - 1]?.text || 'No messages',
          time: new Date(c.updated_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          unread: c.unread_count || 0,
          assigned: 'AI',
          tags: ['Instagram'],
          typing: false,
          msgs,
        };
      });

      // Merge Instagram conversations with mock conversations
      let result = [...formattedConvs, ...conversations];
      if (filter === 'unread') result = result.filter((c) => c.unread > 0);
      if (filter === 'assigned') result = result.filter((c) => c.assigned !== 'Unassigned');
      if (filter === 'ai') result = result.filter((c) => c.assigned === 'AI');
      if (assigned) result = result.filter((c) => c.assigned === assigned);
      return res.json({ success: true, data: result });
    }
  } catch (error) {
    console.error('⚠️ Error fetching live Instagram conversations:', error.message);
  }

  // Fallback to in-memory mock conversations if no connection or error
  let result = [...conversations];
  if (filter === 'unread') result = result.filter((c) => c.unread > 0);
  if (filter === 'assigned') result = result.filter((c) => c.assigned !== 'Unassigned');
  if (filter === 'ai') result = result.filter((c) => c.assigned === 'AI');
  if (assigned) result = result.filter((c) => c.assigned === assigned);
  res.json({ success: true, data: result });
});

/** GET /api/conversations/:id */
router.get('/:id', requireAuth, (req, res) => {
  const conv = conversations.find((c) => c.id === Number(req.params.id));
  if (!conv) return res.status(404).json({ success: false, message: 'Conversation not found.' });
  res.json({ success: true, data: conv });
});

/** POST /api/conversations/:id/messages — Send a message */
router.post('/:id/messages', requireAuth, async (req, res) => {
  const { id } = req.params;
  const { text, from = 'out' } = req.body;
  const userId = req.userId || req.user?.id;

  if (!text?.trim()) return res.status(400).json({ success: false, message: 'Message text is required.' });

  // 1. If it's a numeric mock ID, handle via mock array
  if (!isNaN(id)) {
    const conv = conversations.find((c) => c.id === Number(id));
    if (!conv) return res.status(404).json({ success: false, message: 'Conversation not found.' });

    const newMsg = {
      id: conv.msgs.length + 1,
      from,
      text: text.trim(),
      ts: Date.now(),
    };
    conv.msgs.push(newMsg);
    conv.last = text.trim().slice(0, 60);
    conv.time = 'just now';
    return res.status(201).json({ success: true, data: newMsg });
  }

  // 2. Otherwise it's a Meta/Instagram conversation ID
  try {
    const connection = await InstagramConnection.findOne({ userId, connected: true }).sort({ updatedAt: -1 });
    if (!connection) {
      return res.status(400).json({ success: false, message: 'No connected Instagram account found to send messages.' });
    }

    const { accessToken, instagramBusinessId } = connection;

    // Fetch conversation detail to get customer user IGSID
    const detailUrl = `https://graph.facebook.com/v20.0/${id}`;
    const detailRes = await axios.get(detailUrl, {
      params: {
        fields: 'participants',
        access_token: accessToken,
      },
    });

    const customer = detailRes.data.participants?.data?.find(p => p.id !== instagramBusinessId);
    if (!customer) {
      return res.status(400).json({ success: false, message: 'Could not find message recipient.' });
    }

    // Send DM using Meta Send API
    const sendUrl = `https://graph.facebook.com/v20.0/me/messages`;
    const sendRes = await axios.post(
      sendUrl,
      {
        recipient: { id: customer.id },
        message: { text: text.trim() },
      },
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    const newMsg = {
      id: sendRes.data.message_id || `msg_${Date.now()}`,
      from: 'out',
      text: text.trim(),
      ts: Date.now(),
    };

    return res.status(201).json({ success: true, data: newMsg });
  } catch (error) {
    console.error('❌ Error sending message to Instagram Graph API:', error.response?.data || error.message);
    return res.status(500).json({ success: false, message: 'Failed to send message via Instagram.' });
  }
});

/** PATCH /api/conversations/:id — Update (assign, mark read, add tag) */
router.patch('/:id', requireAuth, (req, res) => {
  const idx = conversations.findIndex((c) => c.id === Number(req.params.id));
  if (idx === -1) return res.status(404).json({ success: false, message: 'Conversation not found.' });
  conversations[idx] = { ...conversations[idx], ...req.body };
  res.json({ success: true, data: conversations[idx] });
});

export default router;
