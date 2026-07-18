import express from 'express';

const router = express.Router();

let contacts = [
  { id: 1, name: 'Riya Kapoor', channel: 'Instagram', phone: '+91 98765 43210', email: 'riya.k@gmail.com', score: 82, tags: ['Lead', 'VIP'] },
  { id: 2, name: 'Karan Mehta', channel: 'WhatsApp', phone: '+91 91234 56780', email: 'karan.m@gmail.com', score: 64, tags: ['Customer'] },
  { id: 3, name: 'Neha Verma', channel: 'Facebook', phone: '+91 99887 66554', email: 'neha.v@gmail.com', score: 41, tags: ['Lead'] },
  { id: 4, name: 'Devansh Rao', channel: 'Instagram', phone: '+91 90000 11122', email: 'devansh.r@gmail.com', score: 77, tags: [] },
];

/** GET /api/contacts */
router.get('/', (req, res) => {
  const { search, channel, tag } = req.query;
  let result = [...contacts];
  if (search) {
    const q = search.toLowerCase();
    result = result.filter(
      (c) => c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q)
    );
  }
  if (channel) result = result.filter((c) => c.channel.toLowerCase() === channel.toLowerCase());
  if (tag) result = result.filter((c) => c.tags.includes(tag));
  res.json({ success: true, data: result, total: result.length });
});

/** GET /api/contacts/:id */
router.get('/:id', (req, res) => {
  const contact = contacts.find((c) => c.id === Number(req.params.id));
  if (!contact) return res.status(404).json({ success: false, message: 'Contact not found.' });
  res.json({ success: true, data: contact });
});

/** POST /api/contacts */
router.post('/', (req, res) => {
  const { name, channel, phone, email, tags = [] } = req.body;
  if (!name || !email) return res.status(400).json({ success: false, message: 'Name and email are required.' });
  const newContact = {
    id: contacts.length + 1,
    name,
    channel: channel || 'Manual',
    phone: phone || '',
    email,
    score: Math.floor(Math.random() * 60 + 30),
    tags,
  };
  contacts.push(newContact);
  res.status(201).json({ success: true, data: newContact });
});

/** PATCH /api/contacts/:id */
router.patch('/:id', (req, res) => {
  const idx = contacts.findIndex((c) => c.id === Number(req.params.id));
  if (idx === -1) return res.status(404).json({ success: false, message: 'Contact not found.' });
  contacts[idx] = { ...contacts[idx], ...req.body };
  res.json({ success: true, data: contacts[idx] });
});

/** DELETE /api/contacts/:id */
router.delete('/:id', (req, res) => {
  const idx = contacts.findIndex((c) => c.id === Number(req.params.id));
  if (idx === -1) return res.status(404).json({ success: false, message: 'Contact not found.' });
  contacts.splice(idx, 1);
  res.json({ success: true, message: 'Contact deleted.' });
});

export default router;
