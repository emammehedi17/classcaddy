import express, { Request, Response } from 'express';
import path from 'path';
import crypto from 'crypto';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const PORT = 3000;
const HOST = '0.0.0.0';

// Server-only administrative password configuration
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Mehedi@#23877';

// In-memory active session tokens (token -> expiration timestamp)
const activeSessions = new Map<string, number>();

// Rate-limiting tracking (IP -> { count: number, resetTime: number })
const failedAttempts = new Map<string, { count: number; resetTime: number }>();

function getClientIp(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0].trim();
  }
  return req.socket.remoteAddress || 'unknown';
}

function verifyAdminPassword(inputPassword: string): boolean {
  if (typeof inputPassword !== 'string' || !inputPassword) {
    return false;
  }
  // Constant-time SHA-256 hash comparison prevents timing attacks and side-channels
  const expectedHash = crypto.createHash('sha256').update(ADMIN_PASSWORD).digest();
  const inputHash = crypto.createHash('sha256').update(inputPassword).digest();
  return crypto.timingSafeEqual(expectedHash, inputHash);
}

// Clean up expired sessions and rate limit records periodically
setInterval(() => {
  const now = Date.now();
  for (const [token, exp] of activeSessions.entries()) {
    if (exp <= now) {
      activeSessions.delete(token);
    }
  }
  for (const [ip, data] of failedAttempts.entries()) {
    if (data.resetTime <= now) {
      failedAttempts.delete(ip);
    }
  }
}, 60000);

async function startServer() {
  const app = express();

  // Middleware
  app.use(express.json());

  // Health check
  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok' });
  });

  // Admin authentication verification endpoint
  app.post('/api/admin/verify', (req: Request, res: Response): void => {
    const ip = getClientIp(req);
    const now = Date.now();

    // Check rate limit (max 10 attempts per 5 minutes per IP)
    const rateData = failedAttempts.get(ip);
    if (rateData && rateData.resetTime > now && rateData.count >= 10) {
      const waitSeconds = Math.ceil((rateData.resetTime - now) / 1000);
      res.status(429).json({
        success: false,
        message: `Too many failed attempts. Please try again in ${waitSeconds} seconds.`,
      });
      return;
    }

    const { password } = req.body;

    if (!password || typeof password !== 'string') {
      res.status(400).json({ success: false, message: 'Password is required' });
      return;
    }

    const isValid = verifyAdminPassword(password);

    if (isValid) {
      // Clear failed attempts on success
      failedAttempts.delete(ip);

      // Generate secure cryptographic session token valid for 4 hours
      const token = crypto.randomBytes(32).toString('hex');
      const expiresAt = now + 4 * 60 * 60 * 1000;
      activeSessions.set(token, expiresAt);

      res.json({
        success: true,
        token,
        message: 'Admin authentication verified',
      });
    } else {
      // Record failed attempt
      const existing = failedAttempts.get(ip);
      if (existing && existing.resetTime > now) {
        existing.count += 1;
      } else {
        failedAttempts.set(ip, { count: 1, resetTime: now + 5 * 60 * 1000 });
      }

      res.status(401).json({
        success: false,
        message: 'Incorrect administrator password.',
      });
    }
  });

  // Check if session token is still valid
  app.post('/api/admin/check-session', (req: Request, res: Response) => {
    const authHeader = req.headers.authorization;
    const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;
    const token = bearerToken || req.body?.token;

    if (!token || typeof token !== 'string') {
      res.json({ valid: false });
      return;
    }

    const exp = activeSessions.get(token);
    if (exp && exp > Date.now()) {
      res.json({ valid: true });
    } else {
      if (exp) activeSessions.delete(token);
      res.json({ valid: false });
    }
  });

  // Logout / invalidate session
  app.post('/api/admin/logout', (req: Request, res: Response) => {
    const authHeader = req.headers.authorization;
    const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;
    const token = bearerToken || req.body?.token;

    if (token && typeof token === 'string') {
      activeSessions.delete(token);
    }

    res.json({ success: true });
  });



  // Vite development middleware or static production serving
  if (process.env.NODE_ENV !== 'production') {
    app.use((req, res, next) => {
      // Very basic extensionless to .html rewrite for development
      if (!req.url.includes('.') && req.url !== '/' && !req.url.startsWith('/api')) {
        req.url += '.html';
      }
      next();
    });
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath, { extensions: ["html"] }));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, HOST, () => {
    console.log(`Class Caddy Server running on http://${HOST}:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
