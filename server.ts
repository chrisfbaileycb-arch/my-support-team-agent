import express, { type Request, type Response, type NextFunction } from 'express';
import path from 'node:path';
import crypto from 'node:crypto';
import { createServer as createViteServer } from 'vite';
import { getDatabase, closeDatabase } from './server/db';
import { startScheduler, stopScheduler } from './server/scheduler';
import { router as apiRouter } from './server/routes';
import { createRateLimiter } from './server/rateLimit';

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// Initialize database schema and migrations on boot
getDatabase();

// 1. Security Headers & Request Correlation ID
app.use((req: Request, res: Response, next: NextFunction) => {
  const reqId = (req.headers['x-request-id'] as string) || `req_${crypto.randomBytes(8).toString('hex')}`;
  req.requestId = reqId;
  res.setHeader('X-Request-Id', reqId);
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

// 2. CORS Restriction (Requirement 23)
const rawAllowedOrigins = process.env.ALLOWED_ORIGINS || '';
const explicitAllowedOrigins = rawAllowedOrigins
  ? rawAllowedOrigins.split(',').map((s) => s.trim().toLowerCase())
  : [];

function isOriginAllowed(origin: string): boolean {
  if (!origin) return true; // Same-origin or non-browser client
  const lowerOrigin = origin.toLowerCase();

  // If user configured explicit allowed origins
  if (explicitAllowedOrigins.length > 0) {
    return explicitAllowedOrigins.includes(lowerOrigin);
  }

  // Preview / Development / Standard Cloud Run origins
  try {
    const url = new URL(lowerOrigin);
    if (url.hostname === 'localhost' || url.hostname === '127.0.0.1') return true;
    if (url.hostname.endsWith('.run.app')) return true;
    if (url.hostname.endsWith('.aistudio.google.com') || url.hostname.endsWith('.google.com')) return true;
  } catch {
    return false;
  }

  return false;
}

app.use((req: Request, res: Response, next: NextFunction) => {
  const origin = req.headers.origin;

  if (origin && isOriginAllowed(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Request-Id');
  }

  if (req.method === 'OPTIONS') {
    res.sendStatus(204);
    return;
  }
  next();
});

// 3. Body Parsing
app.use(express.json({ limit: '5mb' }));

// 4. Persistent SQLite Rate Limiting for Global API
const globalLimiter = createRateLimiter({
  windowSeconds: 60,
  maxRequests: 200,
  keyPrefix: 'global_api',
});
app.use('/api', globalLimiter);

// 5. Mount API Routes
app.use('/api', apiRouter);

// 6. Global Error Handling (Requirement 25: Safe error envelope, no stack traces)
app.use((err: unknown, req: Request, res: Response, _next: NextFunction) => {
  const message = err instanceof Error ? err.message : 'An unexpected internal error occurred';
  console.error(`[Unhandled Server Error] [${req.requestId}]:`, err);
  res.status(500).json({
    error: message,
    code: 'INTERNAL_SERVER_ERROR',
    requestId: req.requestId,
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
