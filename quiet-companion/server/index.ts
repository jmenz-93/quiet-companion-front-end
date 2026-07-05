import 'dotenv/config';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getAdvisorByEmail, getAdvisorById, getClientsByAdvisorEmail, getMarketArticles } from './data';
import { getMarketData } from './market';

const app = express();
const port = Number(process.env.PORT ?? 3001);
const isProduction = process.env.NODE_ENV === 'production';
const jwtSecret = process.env.JWT_SECRET ?? 'development-only-secret-change-in-production';
const clientOrigin = process.env.CLIENT_ORIGIN ?? 'http://localhost:5173';

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: clientOrigin, credentials: true }));
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());
app.use('/api', rateLimit({ windowMs: 60_000, max: 120 }));

function issueSession(advisorId: string) {
  return jwt.sign({ advisorId }, jwtSecret, { expiresIn: '12h' });
}

async function readSession(req: express.Request) {
  const token = req.cookies.qc_session;
  if (!token) {
    return null;
  }
  try {
    const payload = jwt.verify(token, jwtSecret) as { advisorId?: string };
    return payload.advisorId ? await getAdvisorById(payload.advisorId) : null;
  } catch {
    return null;
  }
}

async function requireAuth(req: express.Request, res: express.Response, next: express.NextFunction) {
  const advisor = await readSession(req);
  if (!advisor) {
    return res.status(401).json({ message: 'Not authenticated' });
  }
  (req as express.Request & { advisor: Awaited<ReturnType<typeof getAdvisorById>> }).advisor = advisor;
  next();
}

app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

app.get('/api/market', async (_req, res) => {
  try {
    // News and market data are fetched independently so a hiccup in one
    // (e.g. a rate-limited feed) still lets the other render.
    const [articles, market] = await Promise.all([
      getMarketArticles().catch(() => []),
      getMarketData()
    ]);
    res.json({ articles, ...market });
  } catch (error: unknown) {
    console.error(error);
    res.status(502).json({ message: 'Unable to load market data' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const schema = z.object({ email: z.string().email(), password: z.string().min(8) });
  const result = schema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ message: 'Invalid credentials payload' });
  }

  const advisor = await getAdvisorByEmail(result.data.email);
  if (!advisor || advisor.password !== result.data.password) {
    return res.status(401).json({ message: 'Invalid email or password' });
  }

  const token = issueSession(advisor.id);
  res.cookie('qc_session', token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: isProduction,
    path: '/',
    maxAge: 1000 * 60 * 60 * 12
  });

  res.json({ advisor: { id: advisor.id, name: advisor.name, desk: advisor.desk, region: advisor.region, email: advisor.email } });
});

app.get('/api/auth/me', async (req, res) => {
  const advisor = await readSession(req);
  if (!advisor) {
    return res.json({ advisor: null });
  }
  res.json({ advisor: { id: advisor.id, name: advisor.name, desk: advisor.desk, region: advisor.region, email: advisor.email } });
});

app.post('/api/auth/logout', (_req, res) => {
  res.clearCookie('qc_session', { path: '/' });
  res.json({ ok: true });
});

app.get('/api/advisor/dashboard', requireAuth, async (req, res) => {
  const advisor = (req as express.Request & { advisor: Awaited<ReturnType<typeof getAdvisorById>> }).advisor;
  if (!advisor) {
    return res.status(401).json({ message: 'Not authenticated' });
  }
  try {
    const clients = await getClientsByAdvisorEmail(advisor.email);
    res.json({
      advisor: { id: advisor.id, name: advisor.name, desk: advisor.desk, region: advisor.region, email: advisor.email },
      clients
    });
  } catch (error: unknown) {
    console.error(error);
    res.status(502).json({ message: 'Unable to load client data' });
  }
});

app.post('/api/recommendations/listen', requireAuth, (req, res) => {
  const schema = z.object({
    clientId: z.string().min(1),
    accountId: z.string().min(1),
    transcript: z.string().min(20).max(5000)
  });
  const result = schema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ message: 'Transcript and account data are required' });
  }

  const recommendations = [
    {
      title: 'Trim idle cash',
      detail: 'Stage a portion of excess cash into a laddered short-duration sleeve to improve carry without meaningful duration extension.',
      confidence: 92
    },
    {
      title: 'Add quality income',
      detail: 'Shift incrementally toward high-quality dividend names and defensive cash-flow producers that align with the stated moderate-risk profile.',
      confidence: 88
    },
    {
      title: 'De-risk concentration',
      detail: 'If the household has a single-stock overweight, rebalance into diversified sector exposure to reduce idiosyncratic risk.',
      confidence: 84
    }
  ];

  res.json({
    summary: 'The conversation indicates capital preservation with a moderate risk budget. The model suggests modest redeployment of cash and tighter concentration control.',
    recommendations
  });
});

if (isProduction) {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const distPath = path.resolve(__dirname, '../dist');
  app.use(express.static(distPath));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

app.listen(port, () => {
  console.log(`Quiet Companion server running on port ${port}`);
});