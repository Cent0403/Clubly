import { Router } from 'express';
import { ResultSetHeader, RowDataPacket } from 'mysql2';
import { pool } from '../db/pool';
import { requireAuth, requireRole } from '../middleware/auth';

interface CreateMatchBody {
  matchDate?: string;
  opponent?: string;
  tournament?: string;
  location?: string;
  notes?: string;
}

interface AssignPlayersBody {
  playerIds?: number[];
}

interface RatingInput {
  playerId: number;
  minutesPlayed: boolean;
  attackPoints: number;
  attackErrors: number;
  serveAces: number;
  serveErrors: number;
  blockPoints: number;
  blockTouches: number;
  defenseSuccesses: number;
  receptionPerfect: number;
  receptionGood: number;
  receptionBad: number;
  receptionError: number;
  setAssists: number;
  setErrors: number;
}

interface SaveRatingsBody {
  ratings?: RatingInput[];
}

interface MatchRow extends RowDataPacket {
  id: number;
  match_date: string;
  opponent: string;
  tournament: string;
  location: string | null;
  notes: string | null;
  created_by: number;
}

const matchesRouter = Router();

function isNonNegativeNumber(value: number): boolean {
  return Number.isFinite(value) && value >= 0;
}

function clampScore(value: number): number {
  return Math.max(0, Math.min(10, value));
}

function calculateNetContribution(item: RatingInput): number {
  const positivePoints =
    item.attackPoints * 1.0 +
    item.serveAces * 1.0 +
    item.blockPoints * 1.0 +
    item.blockTouches * 0.2 +
    item.defenseSuccesses * 0.4 +
    item.receptionPerfect * 1.0 +
    item.receptionGood * 0.5 +
    item.receptionBad * 0.25 +
    item.setAssists * 0.25;

  const negativePoints =
    item.attackErrors * 0.5 +
    item.serveErrors * 0.5 +
    item.receptionError * 0.75 +
    item.setErrors * 0.6;

  return positivePoints - negativePoints;
}

let receptionSchemaReady: Promise<void> | null = null;

async function ensureReceptionSchema(): Promise<void> {
  if (!receptionSchemaReady) {
    receptionSchemaReady = (async () => {
      const [columnRows] = await pool.query<RowDataPacket[]>(
        `
          SELECT COLUMN_NAME
          FROM information_schema.columns
          WHERE table_schema = DATABASE()
            AND table_name = 'ratings'
            AND COLUMN_NAME IN ('reception_good', 'reception_bad', 'reception_error', 'reception_errors')
        `
      );

      const existingColumns = new Set(columnRows.map((row) => String(row.COLUMN_NAME)));
      const hasNewColumns = existingColumns.has('reception_good') && existingColumns.has('reception_bad') && existingColumns.has('reception_error');

      if (!hasNewColumns) {
        await pool.query(`ALTER TABLE ratings ADD COLUMN reception_good INT UNSIGNED NOT NULL DEFAULT 0 AFTER reception_perfect`);
        await pool.query(`ALTER TABLE ratings ADD COLUMN reception_bad INT UNSIGNED NOT NULL DEFAULT 0 AFTER reception_good`);
        await pool.query(`ALTER TABLE ratings ADD COLUMN reception_error INT UNSIGNED NOT NULL DEFAULT 0 AFTER reception_bad`);

        if (existingColumns.has('reception_errors')) {
          await pool.query(`UPDATE ratings SET reception_error = reception_errors WHERE reception_errors IS NOT NULL`);
        }
      }

      await pool.query(`
        ALTER TABLE ratings
        MODIFY COLUMN match_performance DECIMAL(7,2) GENERATED ALWAYS AS (
          CASE
            WHEN minutes_played = 1 THEN LEAST(
              10.00,
              GREATEST(
                1.00,
                ROUND(
                  5.00 + (
                    (
                      attack_points * 1.00 +
                      serve_aces * 1.00 +
                      block_points * 1.00 +
                      block_touches * 0.20 +
                      defense_successes * 0.40 +
                      reception_perfect * 1.00 +
                      reception_good * 0.50 +
                      reception_bad * 0.25 +
                      set_assists * 0.25 -
                      attack_errors * 0.50 -
                      serve_errors * 0.50 -
                      reception_error * 0.75 -
                      set_errors * 0.60
                    ) / 2
                  ),
                  2
                )
              )
            )
            ELSE NULL
          END
        ) STORED
      `);
    })().catch((error) => {
      receptionSchemaReady = null;
      throw error;
    });
  }

  await receptionSchemaReady;
}

function calculateScores(item: RatingInput) {
  return {
    reception: Number(
      clampScore(
        item.receptionPerfect * 1.0 +
          item.receptionGood * 0.5 +
          item.receptionBad * 0.25 -
          item.receptionError * 0.75
      ).toFixed(2)
    ),
    serve: Number(clampScore(item.serveAces * 1.0 - item.serveErrors * 0.5).toFixed(2)),
    defense: Number(clampScore(item.defenseSuccesses * 0.4).toFixed(2)),
    attack: Number(clampScore(item.attackPoints * 1.0 - item.attackErrors * 0.5).toFixed(2)),
    blockScore: Number(clampScore(item.blockPoints * 1.0 + item.blockTouches * 0.2).toFixed(2)),
    settingScore: Number(clampScore(item.setAssists * 0.25 - item.setErrors * 0.6).toFixed(2))
  };
}

matchesRouter.use(requireAuth);

matchesRouter.get('/', async (_req, res) => {
  const [rows] = await pool.query<RowDataPacket[]>(
    `
      SELECT
        m.id,
        m.match_date,
        m.opponent,
        m.tournament,
        m.location,
        COUNT(mp.player_id) AS participant_count
      FROM matches m
      LEFT JOIN match_participants mp ON mp.match_id = m.id
      GROUP BY m.id
      ORDER BY m.match_date DESC, m.id DESC
    `
  );

  res.json({ matches: rows });
});

matchesRouter.post('/', requireRole('ADMIN'), async (req, res) => {
  const { matchDate, opponent, tournament, location, notes } = req.body as CreateMatchBody;

  if (!matchDate || !opponent || !tournament) {
    res.status(400).json({ message: 'matchDate, opponent and tournament are required' });
    return;
  }

  const [result] = await pool.query<ResultSetHeader>(
    `
      INSERT INTO matches (match_date, opponent, tournament, location, notes, created_by)
      VALUES (?, ?, ?, ?, ?, ?)
    `,
    [matchDate, opponent, tournament, location ?? null, notes ?? null, req.user!.userId]
  );

  res.status(201).json({ id: result.insertId, message: 'Match created' });
});

matchesRouter.put('/:id', requireRole('ADMIN'), async (req, res) => {
  const matchId = Number(req.params.id);
  const { matchDate, opponent, tournament, location, notes } = req.body as CreateMatchBody;

  if (!Number.isInteger(matchId) || matchId <= 0) {
    res.status(400).json({ message: 'Invalid match id' });
    return;
  }

  if (!matchDate || !opponent || !tournament) {
    res.status(400).json({ message: 'matchDate, opponent and tournament are required' });
    return;
  }

  const [result] = await pool.query<ResultSetHeader>(
    `
      UPDATE matches
      SET match_date = ?, opponent = ?, tournament = ?, location = ?, notes = ?
      WHERE id = ?
    `,
    [matchDate, opponent, tournament, location ?? null, notes ?? null, matchId]
  );

  if (result.affectedRows === 0) {
    res.status(404).json({ message: 'Match not found' });
    return;
  }

  res.json({ message: 'Match updated' });
});

matchesRouter.delete('/:id', requireRole('ADMIN'), async (req, res) => {
  const matchId = Number(req.params.id);

  if (!Number.isInteger(matchId) || matchId <= 0) {
    res.status(400).json({ message: 'Invalid match id' });
    return;
  }

  const [result] = await pool.query<ResultSetHeader>('DELETE FROM matches WHERE id = ?', [matchId]);

  if (result.affectedRows === 0) {
    res.status(404).json({ message: 'Match not found' });
    return;
  }

  res.json({ message: 'Match deleted' });
});

matchesRouter.post('/:id/players', requireRole('ADMIN'), async (req, res) => {
  const matchId = Number(req.params.id);
  const { playerIds } = req.body as AssignPlayersBody;

  if (!Number.isInteger(matchId) || matchId <= 0) {
    res.status(400).json({ message: 'Invalid match id' });
    return;
  }

  if (!Array.isArray(playerIds) || playerIds.length === 0) {
    res.status(400).json({ message: 'playerIds must be a non-empty array' });
    return;
  }

  const sanitizedPlayerIds = [...new Set(playerIds.map(Number).filter((id) => Number.isInteger(id) && id > 0))];

  if (sanitizedPlayerIds.length === 0) {
    res.status(400).json({ message: 'No valid player IDs provided' });
    return;
  }

  const [matchRows] = await pool.query<MatchRow[]>('SELECT id FROM matches WHERE id = ? LIMIT 1', [matchId]);
  if (!matchRows[0]) {
    res.status(404).json({ message: 'Match not found' });
    return;
  }

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();
    await connection.query('DELETE FROM match_participants WHERE match_id = ?', [matchId]);

    for (const playerId of sanitizedPlayerIds) {
      await connection.query(
        'INSERT INTO match_participants (match_id, player_id) VALUES (?, ?)',
        [matchId, playerId]
      );
    }

    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }

  res.json({ message: 'Players assigned successfully', playerIds: sanitizedPlayerIds });
});

matchesRouter.post('/:id/ratings', requireRole('ADMIN'), async (req, res) => {
  const matchId = Number(req.params.id);
  const { ratings } = req.body as SaveRatingsBody;

  if (!Number.isInteger(matchId) || matchId <= 0) {
    res.status(400).json({ message: 'Invalid match id' });
    return;
  }

  if (!Array.isArray(ratings) || ratings.length === 0) {
    res.status(400).json({ message: 'ratings must be a non-empty array' });
    return;
  }

  await ensureReceptionSchema();

  for (const item of ratings) {
    if (
      !Number.isInteger(item.playerId) ||
      item.playerId <= 0 ||
      typeof item.minutesPlayed !== 'boolean' ||
      !isNonNegativeNumber(item.attackPoints) ||
      !isNonNegativeNumber(item.attackErrors) ||
      !isNonNegativeNumber(item.serveAces) ||
      !isNonNegativeNumber(item.serveErrors) ||
      !isNonNegativeNumber(item.blockPoints) ||
      !isNonNegativeNumber(item.blockTouches) ||
      !isNonNegativeNumber(item.defenseSuccesses) ||
      !isNonNegativeNumber(item.receptionPerfect) ||
      !isNonNegativeNumber(item.receptionGood) ||
      !isNonNegativeNumber(item.receptionBad) ||
      !isNonNegativeNumber(item.receptionError) ||
      !isNonNegativeNumber(item.setAssists) ||
      !isNonNegativeNumber(item.setErrors)
    ) {
      res.status(400).json({
        message: 'Each rating must include non-negative event counters and a valid playerId'
      });
      return;
    }
  }

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [matchRows] = await connection.query<MatchRow[]>('SELECT id FROM matches WHERE id = ? LIMIT 1', [matchId]);
    if (!matchRows[0]) {
      await connection.rollback();
      res.status(404).json({ message: 'Match not found' });
      return;
    }

    for (const item of ratings) {
      const calculated = calculateScores(item);

      await connection.query(
        `
          INSERT INTO match_participants (match_id, player_id)
          VALUES (?, ?)
          ON DUPLICATE KEY UPDATE player_id = VALUES(player_id)
        `,
        [matchId, item.playerId]
      );

      await connection.query(
        `
          INSERT INTO ratings (
            match_id,
            player_id,
            minutes_played,
            attack_points,
            attack_errors,
            serve_aces,
            serve_errors,
            block_points,
            block_touches,
            defense_successes,
            reception_perfect,
            reception_good,
            reception_bad,
            reception_error,
            set_assists,
            set_errors,
            reception,
            serve,
            defense,
            attack,
            block_score,
            setting_score,
            created_by
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE
            minutes_played = VALUES(minutes_played),
            attack_points = VALUES(attack_points),
            attack_errors = VALUES(attack_errors),
            serve_aces = VALUES(serve_aces),
            serve_errors = VALUES(serve_errors),
            block_points = VALUES(block_points),
            block_touches = VALUES(block_touches),
            defense_successes = VALUES(defense_successes),
            reception_perfect = VALUES(reception_perfect),
            reception_good = VALUES(reception_good),
            reception_bad = VALUES(reception_bad),
            reception_error = VALUES(reception_error),
            set_assists = VALUES(set_assists),
            set_errors = VALUES(set_errors),
            reception = VALUES(reception),
            serve = VALUES(serve),
            defense = VALUES(defense),
            attack = VALUES(attack),
            block_score = VALUES(block_score),
            setting_score = VALUES(setting_score),
            created_by = VALUES(created_by)
        `,
        [
          matchId,
          item.playerId,
          item.minutesPlayed ? 1 : 0,
          item.attackPoints,
          item.attackErrors,
          item.serveAces,
          item.serveErrors,
          item.blockPoints,
          item.blockTouches,
          item.defenseSuccesses,
          item.receptionPerfect,
          item.receptionGood,
          item.receptionBad,
          item.receptionError,
          item.setAssists,
          item.setErrors,
          calculated.reception,
          calculated.serve,
          calculated.defense,
          calculated.attack,
          calculated.blockScore,
          calculated.settingScore,
          req.user!.userId
        ]
      );
    }

    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }

  res.json({ message: 'Ratings saved successfully', ratedPlayers: ratings.length });
});

matchesRouter.get('/:id/ratings', async (req, res) => {
  const matchId = Number(req.params.id);

  if (!Number.isInteger(matchId) || matchId <= 0) {
    res.status(400).json({ message: 'Invalid match id' });
    return;
  }

  await ensureReceptionSchema();

  const [rows] = await pool.query<RowDataPacket[]>(
    `
      SELECT
        r.match_id,
        r.player_id,
        u.full_name,
        r.minutes_played,
        r.attack_points,
        r.attack_errors,
        r.serve_aces,
        r.serve_errors,
        r.block_points,
        r.block_touches,
        r.defense_successes,
        r.reception_perfect,
          r.reception_good,
          r.reception_bad,
          r.reception_error,
        r.set_assists,
        r.set_errors,
        r.reception,
        r.serve,
        r.defense,
        r.attack,
        r.block_score,
        r.setting_score,
        r.match_performance,
        r.updated_at
      FROM ratings r
      JOIN players p ON p.id = r.player_id
      JOIN users u ON u.id = p.user_id
      WHERE r.match_id = ?
      ORDER BY u.full_name ASC
    `,
    [matchId]
  );

  res.json({ ratings: rows });
});

export { matchesRouter };
