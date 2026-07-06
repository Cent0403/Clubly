import { Router } from 'express';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { RowDataPacket } from 'mysql2';
import { env } from '../config/env';
import { pool } from '../db/pool';
import { requireAuth } from '../middleware/auth';

interface LoginRow extends RowDataPacket {
  id: number;
  username: string;
  full_name: string;
  role: 'ADMIN' | 'PLAYER';
  player_id: number | null;
  password_hash: string;
}

const authRouter = Router();

authRouter.post('/login', async (req, res) => {
  const { username = '', password = '' } = req.body as { username?: string; password?: string };

  const hashedPassword = crypto.createHash('sha256').update(password).digest('hex');

  const [rows] = await pool.query<LoginRow[]>(
    `
      SELECT
        u.id,
        u.username,
        u.full_name,
        u.role,
        p.id AS player_id,
        u.password_hash
      FROM users u
      LEFT JOIN players p ON p.user_id = u.id
      WHERE u.username = ?
      LIMIT 1
    `,
    [username]
  );

  const user = rows[0];

  if (!user || user.password_hash !== hashedPassword) {
    res.status(401).json({ message: 'Credenciales inválidas' });
    return;
  }

  const signOptions: jwt.SignOptions = {
    expiresIn: env.jwtExpiresIn as jwt.SignOptions['expiresIn']
  };

  const token = jwt.sign(
    {
      userId: user.id,
      username: user.username,
      fullName: user.full_name,
      role: user.role,
      playerId: user.player_id
    },
    env.jwtSecret,
    signOptions
  );

  res.json({
    token,
    user: {
      id: user.id,
      username: user.username,
      fullName: user.full_name,
      role: user.role,
      playerId: user.player_id
    }
  });
});

authRouter.get('/me', requireAuth, async (req, res) => {
  res.json({ user: req.user });
});

export { authRouter };
