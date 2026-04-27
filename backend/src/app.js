import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import mobileRoutes from './routes/mobile/index.js';
import adminRoutes from './routes/admin/index.js';

const app = express();

app.use(cors());
app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(morgan('dev'));
app.use(express.json({ limit: '1mb' }));

app.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'carbonshift-backend', ts: new Date().toISOString() });
});

app.use('/api', mobileRoutes);
app.use('/admin', adminRoutes);

app.use((_req, res) => {
  res.status(404).json({ error: 'Not Found' });
});

app.use((err, _req, res, _next) => {
  console.error('[error]', err);
  res.status(err.status || 500).json({ error: err.message || 'Internal Server Error' });
});

export default app;
