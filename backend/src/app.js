import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import mobileRoutes from './routes/mobile/index.js';
import adminRoutes from './routes/admin/index.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

// Serve Admin Dashboard UI
const adminBuildPath = path.join(__dirname, '../../admin/dist');
app.use('/admin-panel', express.static(adminBuildPath));
app.get('/admin-panel/*', (_req, res) => {
  res.sendFile(path.join(adminBuildPath, 'index.html'));
});

app.use((_req, res) => {
  res.status(404).json({ error: 'Not Found' });
});

app.use((err, _req, res, _next) => {
  console.error('[error]', err);
  res.status(err.status || 500).json({ error: err.message || 'Internal Server Error' });
});

export default app;
