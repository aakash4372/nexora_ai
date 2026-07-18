import 'dotenv/config';
import express from 'express';
import morgan from 'morgan';
import helmet from 'helmet';
import cors from 'cors';

import { connectDB } from './lib/db.js';
import authRoutes from './routes/auth.js';
import conversationRoutes from './routes/conversations.js';
import contactRoutes from './routes/contacts.js';
import automationRoutes from './routes/automations.js';
import campaignRoutes from './routes/campaigns.js';
import analyticsRoutes from './routes/analytics.js';
import instagramRoutes from './routes/instagram.js';
import webhookRoutes from './routes/webhooks.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(helmet({
  crossOriginOpenerPolicy: { policy: 'same-origin-allow-popups' }
}));

/* ─── CORS ──────────────────────────────────────────────── */
const allowedOrigins = [
  process.env.CLIENT_URL,
  'http://localhost:5173',
  'http://localhost:5174'
];

app.use(
  cors({
    origin: (origin, callback) => {
      // allow requests with no origin (mobile apps, curl, etc.)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      callback(new Error(`CORS policy: origin ${origin} not allowed`));
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  })
);

/* ─── Logging ───────────────────────────────────────────── */
// Use 'dev' format in development, 'combined' in production
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

/* ─── Body parsers ──────────────────────────────────────── */
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

/* ─── Health check ──────────────────────────────────────── */
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'Nexora Labs API',
    env: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
  });
});

/* ─── API Routes ────────────────────────────────────────── */
app.use('/api/auth', authRoutes);
app.use('/api/conversations', conversationRoutes);
app.use('/api/contacts', contactRoutes);
app.use('/api/automations', automationRoutes);
app.use('/api/campaigns', campaignRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/instagram', instagramRoutes);
app.use('/api/webhooks', webhookRoutes);

/* ─── Error handling ────────────────────────────────────── */
app.use(notFound);
app.use(errorHandler);

/* ─── Start DB & Server ─────────────────────────────────── */
async function startServer() {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`\n🚀 Nexora API running on http://localhost:${PORT}`);
    console.log(`   Environment : ${process.env.NODE_ENV}`);
    console.log(`   Client URL  : ${process.env.CLIENT_URL}`);
    console.log(`   Health      : http://localhost:${PORT}/health\n`);
  });
}

startServer();
export default app;