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
  secondary_position: string | null;
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
        p.secondary_position,
        ROUND(COALESCE(AVG(CASE WHEN r.minutes_played = 1 THEN r.overall_efficiency END), 0.0) * 100, 2) AS overall_score
      FROM players p
      JOIN users u ON u.id = p.user_id
      LEFT JOIN efficiency_ratings r ON r.player_id = p.id
      GROUP BY p.id, u.id, u.username, u.full_name, p.jersey_number, p.position, p.secondary_position
      ORDER BY u.full_name ASC
    `
  );

  res.json({ players: rows });
});

playersRouter.get('/me', requireRole('PLAYER'), async (req, res) => {
  await ensureEfficiencySchema();

  if (!req.user?.playerId) {
    res
      .status(404)
      .json({ message: 'Perfil de jugador no encontrado para el usuario' });
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
        p.secondary_position,
        ROUND(COALESCE(AVG(CASE WHEN r.minutes_played = 1 THEN r.overall_efficiency END), 0.0) * 100, 2) AS overall_score
      FROM players p
      JOIN users u ON u.id = p.user_id
      LEFT JOIN efficiency_ratings r ON r.player_id = p.id
      WHERE p.id = ?
      GROUP BY p.id, u.id, u.username, u.full_name, p.jersey_number, p.position, p.secondary_position
      LIMIT 1
    `,
    [req.user.playerId]
  );

  const player = rows[0];

  if (!player) {
    res.status(404).json({ message: 'Jugador no encontrado' });
    return;
  }

  res.json({ player });
});

playersRouter.patch('/me', requireRole('PLAYER'), async (req, res) => {
  await ensureEfficiencySchema();

  if (!req.user?.userId || !req.user?.playerId) {
    res
      .status(404)
      .json({ message: 'Perfil de jugador no encontrado para el usuario' });
    return;
  }

  const { fullName, password } = req.body as UpdateMyProfileBody;
  const nextFullName = fullName?.trim();
  const nextPassword = password?.trim();

  if (!nextFullName && !nextPassword) {
    res.status(400).json({
      message: 'Proporcione fullName o password para actualizar el perfil',
    });
    return;
  }

  const fields: string[] = [];
  const values: Array<string | number> = [];

  if (nextFullName) {
    fields.push('full_name = ?');
    values.push(nextFullName);
  }

  if (nextPassword) {
    const hashedPassword = crypto
      .createHash('sha256')
      .update(nextPassword)
      .digest('hex');
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
        p.secondary_position,
        ROUND(COALESCE(AVG(CASE WHEN r.minutes_played = 1 THEN r.overall_efficiency END), 0.0) * 100, 2) AS overall_score
      FROM players p
      JOIN users u ON u.id = p.user_id
      LEFT JOIN efficiency_ratings r ON r.player_id = p.id
      WHERE p.id = ?
      GROUP BY p.id, u.id, u.username, u.full_name, p.jersey_number, p.position, p.secondary_position
      LIMIT 1
    `,
    [req.user.playerId]
  );

  res.json({
    message: 'Perfil actualizado exitosamente',
    player: rows[0] ?? null,
  });
});

export { playersRouter };
