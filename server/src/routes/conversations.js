import express from 'express';

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
router.get('/', (req, res) => {
  const { filter, assigned } = req.query;
  let result = [...conversations];
  if (filter === 'unread') result = result.filter((c) => c.unread > 0);
  if (filter === 'assigned') result = result.filter((c) => c.assigned !== 'Unassigned');
  if (filter === 'ai') result = result.filter((c) => c.assigned === 'AI');
  if (assigned) result = result.filter((c) => c.assigned === assigned);
  res.json({ success: true, data: result });
});

/** GET /api/conversations/:id */
router.get('/:id', (req, res) => {
  const conv = conversations.find((c) => c.id === Number(req.params.id));
  if (!conv) return res.status(404).json({ success: false, message: 'Conversation not found.' });
  res.json({ success: true, data: conv });
});

/** POST /api/conversations/:id/messages — Send a message */
router.post('/:id/messages', (req, res) => {
  const conv = conversations.find((c) => c.id === Number(req.params.id));
  if (!conv) return res.status(404).json({ success: false, message: 'Conversation not found.' });

  const { text, from = 'out' } = req.body;
  if (!text?.trim()) return res.status(400).json({ success: false, message: 'Message text is required.' });

  const newMsg = {
    id: conv.msgs.length + 1,
    from,
    text: text.trim(),
    ts: Date.now(),
  };
  conv.msgs.push(newMsg);
  conv.last = text.trim().slice(0, 60);
  conv.time = 'just now';

  res.status(201).json({ success: true, data: newMsg });
});

/** PATCH /api/conversations/:id — Update (assign, mark read, add tag) */
router.patch('/:id', (req, res) => {
  const idx = conversations.findIndex((c) => c.id === Number(req.params.id));
  if (idx === -1) return res.status(404).json({ success: false, message: 'Conversation not found.' });
  conversations[idx] = { ...conversations[idx], ...req.body };
  res.json({ success: true, data: conversations[idx] });
});

export default router;
