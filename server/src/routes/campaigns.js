import express from 'express';

const router = express.Router();

let campaigns = [
  { id: 1, name: 'Spring Drop Launch', status: 'Scheduled', audience: 'All Contacts', date: 'Jul 22, 2026', sent: 0 },
  { id: 2, name: 'Abandoned Cart Nudge', status: 'Completed', audience: 'Cart Segment', date: 'Jul 10, 2026', sent: 1420 },
  { id: 3, name: 'VIP Early Access', status: 'Draft', audience: 'VIP Tag', date: '—', sent: 0 },
];

/** GET /api/campaigns */
router.get('/', (_req, res) => {
  res.json({ success: true, data: campaigns });
});

/** GET /api/campaigns/:id */
router.get('/:id', (req, res) => {
  const item = campaigns.find((c) => c.id === Number(req.params.id));
  if (!item) return res.status(404).json({ success: false, message: 'Campaign not found.' });
  res.json({ success: true, data: item });
});

/** POST /api/campaigns */
router.post('/', (req, res) => {
  const { name, audience } = req.body;
  if (!name || !audience) return res.status(400).json({ success: false, message: 'Name and audience are required.' });
  const newCampaign = {
    id: campaigns.length + 1,
    name,
    audience,
    status: 'Draft',
    date: '—',
    sent: 0,
  };
  campaigns.push(newCampaign);
  res.status(201).json({ success: true, data: newCampaign });
});

/** PATCH /api/campaigns/:id */
router.patch('/:id', (req, res) => {
  const idx = campaigns.findIndex((c) => c.id === Number(req.params.id));
  if (idx === -1) return res.status(404).json({ success: false, message: 'Campaign not found.' });
  campaigns[idx] = { ...campaigns[idx], ...req.body };
  res.json({ success: true, data: campaigns[idx] });
});

/** DELETE /api/campaigns/:id */
router.delete('/:id', (req, res) => {
  const idx = campaigns.findIndex((c) => c.id === Number(req.params.id));
  if (idx === -1) return res.status(404).json({ success: false, message: 'Campaign not found.' });
  campaigns.splice(idx, 1);
  res.json({ success: true, message: 'Campaign deleted.' });
});

export default router;
