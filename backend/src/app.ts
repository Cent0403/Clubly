import cors from 'cors';
import express from 'express';
import { authRouter } from './routes/auth.routes';
import { matchesRouter } from './routes/matches.routes';
import { playersRouter } from './routes/players.routes';
import { settingsRouter } from './routes/settings.routes';
import { statsRouter } from './routes/stats.routes';
import { usersRouter } from './routes/users.routes';

export const app = express();

const allowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'https://volitics.vercel.app',
  process.env.FRONTEND_URL
].filter((origin): origin is string => Boolean(origin));

const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    if (!origin) {
      callback(null, true);
      return;
    }

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }

    callback(new Error(`CORS blocked for origin: ${origin}`));
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use(express.json({ limit: '10mb' }));

app.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'volleyball-stats-api' });
});

app.use('/api/auth', authRouter);
app.use('/api/settings', settingsRouter);
app.use('/api/users', usersRouter);
app.use('/api/players', playersRouter);
app.use('/api/matches', matchesRouter);
app.use('/api/stats', statsRouter);

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  const errorWithStatus = err as Error & { status?: number; type?: string };

  if (errorWithStatus.status === 413 || errorWithStatus.type === 'entity.too.large') {
    res.status(413).json({ message: 'Image is too large. Please upload a smaller file.' });
    return;
  }

  console.error(err);
  res.status(500).json({ message: 'Internal server error' });
});
