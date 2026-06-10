import { Router } from 'express';
import crypto from 'crypto';
import { RowDataPacket } from 'mysql2';
import { pool } from '../db/pool';
import { requireAuth, requireRole } from '../middleware/auth';

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
  const [rows] = await pool.query<PlayerRow[]>(
    `
      SELECT
        p.id AS player_id,
        u.id AS user_id,
        u.username,
        u.full_name,
        p.jersey_number,
        p.position,
        p.overall_score
      FROM players p
      JOIN users u ON u.id = p.user_id
      ORDER BY u.full_name ASC
    `
  );

  res.json({ players: rows });
});

playersRouter.get('/me', requireRole('PLAYER'), async (req, res) => {
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
        p.overall_score
      FROM players p
      JOIN users u ON u.id = p.user_id
      WHERE p.id = ?
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
        p.overall_score
      FROM players p
      JOIN users u ON u.id = p.user_id
      WHERE p.id = ?
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
