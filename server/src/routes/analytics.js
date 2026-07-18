import express from 'express';

const router = express.Router();

/* ── Static analytics data (prototype-consistent) ── */
const analyticsData = {
  overview: {
    totalMessages: { value: 12847, delta: '+18%', up: true },
    aiHandled: { value: 9204, delta: '+24%', up: true },
    avgResponseTime: { value: '1m 12s', delta: '-32%', up: true },
    csat: { value: '94%', delta: '+2%', up: true },
  },
  channelBreakdown: [
    { channel: 'Instagram', messages: 5210, pct: 41 },
    { channel: 'WhatsApp', messages: 4180, pct: 33 },
    { channel: 'Facebook', messages: 2320, pct: 18 },
    { channel: 'Other', messages: 1137, pct: 9 },
  ],
  weeklyMessages: [
    { day: 'Mon', count: 1620 },
    { day: 'Tue', count: 1845 },
    { day: 'Wed', count: 1420 },
    { day: 'Thu', count: 2100 },
    { day: 'Fri', count: 1990 },
    { day: 'Sat', count: 980 },
    { day: 'Sun', count: 892 },
  ],
  aiPerformance: {
    accuracy: 92,
    escalations: 8,
    avgConfidence: 88,
  },
};

/** GET /api/analytics */
router.get('/', (_req, res) => {
  res.json({ success: true, data: analyticsData });
});

/** GET /api/analytics/overview */
router.get('/overview', (_req, res) => {
  res.json({ success: true, data: analyticsData.overview });
});

/** GET /api/analytics/channels */
router.get('/channels', (_req, res) => {
  res.json({ success: true, data: analyticsData.channelBreakdown });
});

/** GET /api/analytics/weekly */
router.get('/weekly', (_req, res) => {
  res.json({ success: true, data: analyticsData.weeklyMessages });
});

export default router;
