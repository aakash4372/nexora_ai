import express from 'express';

const router = express.Router();

let automations = [
  { id: 1, name: 'Welcome DM Flow', status: 'Live', trigger: 'New Follower', runs: 1204 },
  { id: 2, name: 'Order Status Bot', status: 'Live', trigger: 'Keyword: order', runs: 842 },
  { id: 3, name: 'Discount Comment Reply', status: 'Paused', trigger: 'Comment', runs: 301 },
];

/** GET /api/automations */
router.get('/', (_req, res) => {
  res.json({ success: true, data: automations });
});

/** GET /api/automations/:id */
router.get('/:id', (req, res) => {
  const item = automations.find((a) => a.id === Number(req.params.id));
  if (!item) return res.status(404).json({ success: false, message: 'Automation not found.' });
  res.json({ success: true, data: item });
});

/** POST /api/automations */
router.post('/', (req, res) => {
  const { name, trigger } = req.body;
  if (!name || !trigger) return res.status(400).json({ success: false, message: 'Name and trigger are required.' });
  const newItem = { id: automations.length + 1, name, trigger, status: 'Paused', runs: 0 };
  automations.push(newItem);
  res.status(201).json({ success: true, data: newItem });
});

/** PATCH /api/automations/:id — toggle status, rename, etc. */
router.patch('/:id', (req, res) => {
  const idx = automations.findIndex((a) => a.id === Number(req.params.id));
  if (idx === -1) return res.status(404).json({ success: false, message: 'Automation not found.' });
  automations[idx] = { ...automations[idx], ...req.body };
  res.json({ success: true, data: automations[idx] });
});

/** DELETE /api/automations/:id */
router.delete('/:id', (req, res) => {
  const idx = automations.findIndex((a) => a.id === Number(req.params.id));
  if (idx === -1) return res.status(404).json({ success: false, message: 'Automation not found.' });
  automations.splice(idx, 1);
  res.json({ success: true, message: 'Automation deleted.' });
});

export default router;
