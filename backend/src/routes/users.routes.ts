import crypto from 'crypto';
import { Router } from 'express';
import { ResultSetHeader, RowDataPacket } from 'mysql2';
import { pool } from '../db/pool';
import { requireAuth, requireRole } from '../middleware/auth';

interface CreateUserBody {
  username?: string;
  password?: string;
  fullName?: string;
  role?: 'ADMIN' | 'PLAYER';
  jerseyNumber?: number | null;
  position?: 'SETTER' | 'OUTSIDE' | 'OPPOSITE' | 'MIDDLE' | 'LIBERO' | null;
}

interface UpdateUserBody {
  username?: string;
  password?: string;
  fullName?: string;
  role?: 'ADMIN' | 'PLAYER';
  jerseyNumber?: number | null;
  position?: 'SETTER' | 'OUTSIDE' | 'OPPOSITE' | 'MIDDLE' | 'LIBERO' | null;
}

interface AdminUserRow extends RowDataPacket {
  id: number;
  username: string;
  full_name: string;
  role: 'ADMIN' | 'PLAYER';
  player_id: number | null;
  jersey_number: number | null;
  position: string | null;
}

const VALID_POSITIONS = new Set([
  'SETTER',
  'OUTSIDE',
  'OPPOSITE',
  'MIDDLE',
  'LIBERO'
]);

const usersRouter = Router();

usersRouter.use(requireAuth);
usersRouter.use(requireRole('ADMIN'));

usersRouter.get('/', async (_req, res) => {
  const [rows] = await pool.query<AdminUserRow[]>(
    `
      SELECT
        u.id,
        u.username,
        u.full_name,
        u.role,
        p.id AS player_id,
        p.jersey_number,
        p.position
      FROM users u
      LEFT JOIN players p ON p.user_id = u.id
      ORDER BY u.full_name ASC, u.id ASC
    `
  );

  res.json({ users: rows });
});

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

usersRouter.patch('/:id', async (req, res) => {
  const userId = Number(req.params.id);
  if (!Number.isInteger(userId) || userId <= 0) {
    res.status(400).json({ message: 'Invalid user id' });
    return;
  }

  const { username, password, fullName, role, jerseyNumber, position } = req.body as UpdateUserBody;
  const hasAtLeastOneField =
    username !== undefined ||
    password !== undefined ||
    fullName !== undefined ||
    role !== undefined ||
    jerseyNumber !== undefined ||
    position !== undefined;

  if (!hasAtLeastOneField) {
    res.status(400).json({ message: 'Provide at least one field to update' });
    return;
  }

  const nextUsername = username?.trim();
  const nextPassword = password?.trim();
  const nextFullName = fullName?.trim();

  if (username !== undefined && !nextUsername) {
    res.status(400).json({ message: 'username cannot be empty' });
    return;
  }

  if (password !== undefined && !nextPassword) {
    res.status(400).json({ message: 'password cannot be empty' });
    return;
  }

  if (fullName !== undefined && !nextFullName) {
    res.status(400).json({ message: 'fullName cannot be empty' });
    return;
  }

  if (role !== undefined && role !== 'ADMIN' && role !== 'PLAYER') {
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

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [existingRows] = await connection.query<AdminUserRow[]>(
      `
        SELECT
          u.id,
          u.username,
          u.full_name,
          u.role,
          p.id AS player_id,
          p.jersey_number,
          p.position
        FROM users u
        LEFT JOIN players p ON p.user_id = u.id
        WHERE u.id = ?
        LIMIT 1
      `,
      [userId]
    );

    const existingUser = existingRows[0];

    if (!existingUser) {
      await connection.rollback();
      res.status(404).json({ message: 'User not found' });
      return;
    }

    const targetRole = role ?? existingUser.role;

    if (targetRole === 'ADMIN' && (jerseyNumber !== undefined || position !== undefined)) {
      await connection.rollback();
      res.status(400).json({ message: 'jerseyNumber and position can only be updated for PLAYER role' });
      return;
    }

    if (nextUsername && nextUsername !== existingUser.username) {
      const [duplicatedRows] = await connection.query<RowDataPacket[]>(
        'SELECT id FROM users WHERE username = ? AND id <> ? LIMIT 1',
        [nextUsername, userId]
      );

      if (duplicatedRows.length > 0) {
        await connection.rollback();
        res.status(409).json({ message: 'Username already exists' });
        return;
      }
    }

    const userFields: string[] = [];
    const userValues: Array<string | number> = [];

    if (nextUsername) {
      userFields.push('username = ?');
      userValues.push(nextUsername);
    }

    if (nextFullName) {
      userFields.push('full_name = ?');
      userValues.push(nextFullName);
    }

    if (nextPassword) {
      const hashedPassword = crypto.createHash('sha256').update(nextPassword).digest('hex');
      userFields.push('password_hash = ?');
      userValues.push(hashedPassword);
    }

    if (role) {
      userFields.push('role = ?');
      userValues.push(role);
    }

    if (userFields.length > 0) {
      userValues.push(userId);

      await connection.query(
        `
          UPDATE users
          SET ${userFields.join(', ')}
          WHERE id = ?
        `,
        userValues
      );
    }

    if (targetRole === 'PLAYER') {
      if (!existingUser.player_id) {
        await connection.query<ResultSetHeader>(
          `
            INSERT INTO players (user_id, jersey_number, position)
            VALUES (?, ?, ?)
          `,
          [userId, jerseyNumber ?? null, position ?? null]
        );
      } else if (jerseyNumber !== undefined || position !== undefined) {
        await connection.query(
          `
            UPDATE players
            SET jersey_number = ?, position = ?
            WHERE user_id = ?
          `,
          [jerseyNumber ?? null, position ?? null, userId]
        );
      }
    } else if (existingUser.player_id) {
      await connection.query('DELETE FROM players WHERE user_id = ?', [userId]);
    }

    const [updatedRows] = await connection.query<AdminUserRow[]>(
      `
        SELECT
          u.id,
          u.username,
          u.full_name,
          u.role,
          p.id AS player_id,
          p.jersey_number,
          p.position
        FROM users u
        LEFT JOIN players p ON p.user_id = u.id
        WHERE u.id = ?
        LIMIT 1
      `,
      [userId]
    );

    await connection.commit();

    res.json({
      message: 'User updated successfully',
      user: updatedRows[0]
    });
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
});

usersRouter.delete('/:id', async (req, res) => {
  const userId = Number(req.params.id);
  if (!Number.isInteger(userId) || userId <= 0) {
    res.status(400).json({ message: 'Invalid user id' });
    return;
  }

  if (req.user?.userId === userId) {
    res.status(400).json({ message: 'You cannot delete your own active account' });
    return;
  }

  try {
    const [result] = await pool.query<ResultSetHeader>('DELETE FROM users WHERE id = ?', [userId]);

    if (result.affectedRows === 0) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    const sqlError = error as { code?: string };

    if (sqlError.code === 'ER_ROW_IS_REFERENCED_2' || sqlError.code === 'ER_ROW_IS_REFERENCED') {
      res.status(409).json({
        message: 'This user cannot be deleted because it is referenced by existing matches or ratings'
      });
      return;
    }

    throw error;
  }
});

export { usersRouter };
