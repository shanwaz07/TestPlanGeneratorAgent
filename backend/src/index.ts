import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { initDb } from './db';
import settingsRouter from './routes/settings';
import jiraRouter from './routes/jira';
import templatesRouter from './routes/templates';
import testplanRouter from './routes/testplan';

const app = express();
const PORT = process.env['PORT'] ?? 5000;

// Middleware
app.use(cors({ origin: ['http://localhost:3000', 'http://127.0.0.1:3000'] }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static: serve template files for preview
app.use('/templates', express.static(path.resolve(__dirname, '../../templates')));

// Routes
app.use('/api/settings', settingsRouter);
app.use('/api/jira', jiraRouter);
app.use('/api/templates', templatesRouter);
app.use('/api/testplan', testplanRouter);

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Global error handler
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[Error]', err.message);
  res.status(500).json({ error: err.message });
});

// Boot
(async () => {
  try {
    await initDb();
    console.log('✅ Database initialized');

    app.listen(PORT, () => {
      console.log(`🚀 Backend running at http://localhost:${PORT}`);
      console.log(`   Health: http://localhost:${PORT}/health`);
    });
  } catch (err) {
    console.error('❌ Failed to start server:', err);
    process.exit(1);
  }
})();
