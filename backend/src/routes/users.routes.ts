import crypto from 'crypto';
import { Router } from 'express';
import { ResultSetHeader } from 'mysql2';
import { pool } from '../db/pool';
import { requireAuth, requireRole } from '../middleware/auth';

interface CreateUserBody {
  username?: string;
  password?: string;
  fullName?: string;
  role?: 'ADMIN' | 'PLAYER';
  jerseyNumber?: number | null;
  position?: 'SETTER' | 'OUTSIDE' | 'OPPOSITE' | 'MIDDLE' | 'LIBERO' | 'DEFENSIVE_SPECIALIST' | null;
}

const VALID_POSITIONS = new Set([
  'SETTER',
  'OUTSIDE',
  'OPPOSITE',
  'MIDDLE',
  'LIBERO',
  'DEFENSIVE_SPECIALIST'
]);

const usersRouter = Router();

usersRouter.use(requireAuth);
usersRouter.use(requireRole('ADMIN'));

usersRouter.post('/', async (req, res) => {
  const { username, password, fullName, role, jerseyNumber, position } = req.body as CreateUserBody;

  if (!username || !password || !fullName || !role) {
    res.status(400).json({ message: 'username, password, fullName and role are required' });
    return;
  }

  if (role !== 'ADMIN' && role !== 'PLAYER') {
    res.status(400).json({ message: 'role must be ADMIN or PLAYER' });
    return;
  }

  if (position !== undefined && position !== null && !VALID_POSITIONS.has(position)) {
    res.status(400).json({ message: 'Invalid position value' });
    return;
  }

  if (jerseyNumber !== undefined && jerseyNumber !== null) {
    if (!Number.isInteger(jerseyNumber) || jerseyNumber <= 0) {
      res.status(400).json({ message: 'jerseyNumber must be a positive integer' });
      return;
    }
  }

  const hashedPassword = crypto.createHash('sha256').update(password).digest('hex');
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [existingRows] = await connection.query(
      'SELECT id FROM users WHERE username = ? LIMIT 1',
      [username]
    );

    if (Array.isArray(existingRows) && existingRows.length > 0) {
      await connection.rollback();
      res.status(409).json({ message: 'Username already exists' });
      return;
    }

    const [insertUserResult] = await connection.query<ResultSetHeader>(
      `
        INSERT INTO users (username, password_hash, role, full_name)
        VALUES (?, ?, ?, ?)
      `,
      [username, hashedPassword, role, fullName]
    );

    const userId = insertUserResult.insertId;
    let playerId: number | null = null;

    if (role === 'PLAYER') {
      const [insertPlayerResult] = await connection.query<ResultSetHeader>(
        `
          INSERT INTO players (user_id, jersey_number, position)
          VALUES (?, ?, ?)
        `,
        [userId, jerseyNumber ?? null, position ?? null]
      );

      playerId = insertPlayerResult.insertId;
    }

    await connection.commit();

    res.status(201).json({
      message: 'User created successfully',
      user: {
        id: userId,
        username,
        fullName,
        role,
        playerId
      }
    });
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
});

export { usersRouter };
