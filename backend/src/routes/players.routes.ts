import { Router } from 'express';
import crypto from 'crypto';
import { RowDataPacket } from 'mysql2';
import { pool } from '../db/pool';
import { requireAuth, requireRole } from '../middleware/auth';
import { ensureEfficiencySchema } from '../stats/efficiency';

interface PlayerRow extends RowDataPacket {
  player_id: number;
  user_id: number;
  username: string;
  full_name: string;
  jersey_number: number | null;
  position: string | null;
  overall_score: number;
}

interface UpdateMyProfileBody {
  fullName?: string;
  password?: string;
}

const playersRouter = Router();

playersRouter.use(requireAuth);

playersRouter.get('/', requireRole('ADMIN'), async (_req, res) => {
  await ensureEfficiencySchema();

  const [rows] = await pool.query<PlayerRow[]>(
    `
      SELECT
        p.id AS player_id,
        u.id AS user_id,
        u.username,
        u.full_name,
        p.jersey_number,
        p.position,
        ROUND(COALESCE(AVG(CASE WHEN r.minutes_played = 1 THEN r.overall_efficiency END), 0.0) * 100, 2) AS overall_score
      FROM players p
      JOIN users u ON u.id = p.user_id
      LEFT JOIN efficiency_ratings r ON r.player_id = p.id
      GROUP BY p.id, u.id, u.username, u.full_name, p.jersey_number, p.position
      ORDER BY u.full_name ASC
    `
  );

  res.json({ players: rows });
});

playersRouter.get('/me', requireRole('PLAYER'), async (req, res) => {
  await ensureEfficiencySchema();

  if (!req.user?.playerId) {
    res.status(404).json({ message: 'Player profile not found for user' });
    return;
  }

  const [rows] = await pool.query<PlayerRow[]>(
    `
      SELECT
        p.id AS player_id,
        u.id AS user_id,
        u.username,
        u.full_name,
        p.jersey_number,
        p.position,
        ROUND(COALESCE(AVG(CASE WHEN r.minutes_played = 1 THEN r.overall_efficiency END), 0.0) * 100, 2) AS overall_score
      FROM players p
      JOIN users u ON u.id = p.user_id
      LEFT JOIN efficiency_ratings r ON r.player_id = p.id
      WHERE p.id = ?
      GROUP BY p.id, u.id, u.username, u.full_name, p.jersey_number, p.position
      LIMIT 1
    `,
    [req.user.playerId]
  );

  const player = rows[0];

  if (!player) {
    res.status(404).json({ message: 'Player not found' });
    return;
  }

  res.json({ player });
});

playersRouter.patch('/me', requireRole('PLAYER'), async (req, res) => {
  await ensureEfficiencySchema();

  if (!req.user?.userId || !req.user?.playerId) {
    res.status(404).json({ message: 'Player profile not found for user' });
    return;
  }

  const { fullName, password } = req.body as UpdateMyProfileBody;
  const nextFullName = fullName?.trim();
  const nextPassword = password?.trim();

  if (!nextFullName && !nextPassword) {
    res.status(400).json({ message: 'Provide fullName or password to update profile' });
    return;
  }

  const fields: string[] = [];
  const values: Array<string | number> = [];

  if (nextFullName) {
    fields.push('full_name = ?');
    values.push(nextFullName);
  }

  if (nextPassword) {
    const hashedPassword = crypto.createHash('sha256').update(nextPassword).digest('hex');
    fields.push('password_hash = ?');
    values.push(hashedPassword);
  }

  values.push(req.user.userId);

  await pool.query(
    `
      UPDATE users
      SET ${fields.join(', ')}
      WHERE id = ?
    `,
    values
  );

  const [rows] = await pool.query<PlayerRow[]>(
    `
      SELECT
        p.id AS player_id,
        u.id AS user_id,
        u.username,
        u.full_name,
        p.jersey_number,
        p.position,
        ROUND(COALESCE(AVG(CASE WHEN r.minutes_played = 1 THEN r.overall_efficiency END), 0.0) * 100, 2) AS overall_score
      FROM players p
      JOIN users u ON u.id = p.user_id
      LEFT JOIN efficiency_ratings r ON r.player_id = p.id
      WHERE p.id = ?
      GROUP BY p.id, u.id, u.username, u.full_name, p.jersey_number, p.position
      LIMIT 1
    `,
    [req.user.playerId]
  );

  res.json({
    message: 'Profile updated successfully',
    player: rows[0] ?? null
  });
});

export { playersRouter };
