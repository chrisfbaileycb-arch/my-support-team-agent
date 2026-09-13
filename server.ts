import express, { type Request, type Response, type NextFunction } from 'express';
import path from 'node:path';
import crypto from 'node:crypto';
import { createServer as createViteServer } from 'vite';
import { getDatabase, closeDatabase } from './server/db';
import { startScheduler, stopScheduler } from './server/scheduler';
import { router as apiRouter } from './server/routes';

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// Initialize database schema and migrations on boot
getDatabase();

// 1. Security Headers & Request Correlation ID
app.use((req: Request, res: Response, next: NextFunction) => {
  const reqId = crypto.randomUUID();
  req.requestId = reqId;
  res.setHeader('X-Request-Id', reqId);
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

// 2. CORS Handling
app.use((req: Request, res: Response, next: NextFunction) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Request-Id');
  if (req.method === 'OPTIONS') {
    res.sendStatus(204);
    return;
  }
  next();
});

// 3. Body Parsing
app.use(express.json({ limit: '5mb' }));

// 4. Rate Limiting Middleware for API
const apiRateLimitMap = new Map<string, number[]>();
app.use('/api', (req: Request, res: Response, next: NextFunction) => {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const now = Date.now();
  const oneMinuteAgo = now - 60000;
  let history = apiRateLimitMap.get(ip) || [];
  history = history.filter((t) => t > oneMinuteAgo);
  if (history.length > 200) {
    res.status(429).json({ error: 'Too many requests. Please slow down.', code: 'RATE_LIMIT_EXCEEDED' });
    return;
  }
  history.push(now);
  apiRateLimitMap.set(ip, history);
  next();
});

// 5. Mount API Routes
app.use('/api', apiRouter);

// 6. Global Error Handling
app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  const message = err instanceof Error ? err.message : 'Internal Server Error';
  console.error('Unhandled server error:', err);
  res.status(500).json({
    error: message,
    code: 'INTERNAL_SERVER_ERROR',
  });
});

// 7. Start Background Scheduler
startScheduler(30000);

// Graceful Shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received. Shutting down gracefully...');
  stopScheduler();
  closeDatabase();
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received. Shutting down gracefully...');
  stopScheduler();
  closeDatabase();
  process.exit(0);
});

// 8. Vite Dev Middleware / Production Static Serving
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.use((_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Maximize Your Future server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
