import cors from 'cors';
import express from 'express';
import { authRouter } from './routes/auth.routes';
import { matchesRouter } from './routes/matches.routes';
import { playersRouter } from './routes/players.routes';
import { statsRouter } from './routes/stats.routes';
import { usersRouter } from './routes/users.routes';

export const app = express();

app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'volleyball-stats-api' });
});

app.use('/api/auth', authRouter);
app.use('/api/users', usersRouter);
app.use('/api/players', playersRouter);
app.use('/api/matches', matchesRouter);
app.use('/api/stats', statsRouter);

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ message: 'Internal server error' });
});
