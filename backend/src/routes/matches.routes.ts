import { Router } from 'express';
import { ResultSetHeader, RowDataPacket } from 'mysql2';
import { pool } from '../db/pool';
import { requireAuth, requireRole } from '../middleware/auth';
import { calculateEfficiencyMetrics, EfficiencyRatingInput, ensureEfficiencySchema } from '../stats/efficiency';

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

interface SaveRatingsBody {
  ratings?: EfficiencyRatingInput[];
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

function isNonNegativeInteger(value: number): boolean {
  return Number.isInteger(value) && value >= 0;
}

function normalizeEfficiencyRatingInput(item: EfficiencyRatingInput): EfficiencyRatingInput {
  return {
    ...item,
    attackAttempts: Math.max(item.attackAttempts, item.attackPoints + item.attackErrors),
    serveAttempts: Math.max(item.serveAttempts, item.serveAces + item.serveErrors),
    setAttempts: Math.max(item.setAttempts, item.setAssists + item.setErrors)
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
    res.status(400).json({ message: 'matchDate, opponent y tournament son obligatorios' });
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
    res.status(400).json({ message: 'ID de partido inválido' });
    return;
  }

  if (!matchDate || !opponent || !tournament) {
    res.status(400).json({ message: 'matchDate, opponent y tournament son obligatorios' });
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
    res.status(400).json({ message: 'ID de partido inválido' });
    return;
  }

  const [result] = await pool.query<ResultSetHeader>('DELETE FROM matches WHERE id = ?', [matchId]);

  if (result.affectedRows === 0) {
    res.status(404).json({ message: 'Partido no encontrado' });
    return;
  }

  res.json({ message: 'Partido eliminado exitosamente' });
});

matchesRouter.post('/:id/players', requireRole('ADMIN'), async (req, res) => {
  const matchId = Number(req.params.id);
  const { playerIds } = req.body as AssignPlayersBody;

  if (!Number.isInteger(matchId) || matchId <= 0) {
    res.status(400).json({ message: 'ID de partido inválido' });
    return;
  }

  if (!Array.isArray(playerIds) || playerIds.length === 0) {
    res.status(400).json({ message: 'playerIds debe ser un array no vacío' });
    return;
  }

  const sanitizedPlayerIds = [...new Set(playerIds.map(Number).filter((id) => Number.isInteger(id) && id > 0))];

  if (sanitizedPlayerIds.length === 0) {
    res.status(400).json({ message: 'No se proporcionaron IDs de jugadores válidos' });
    return;
  }

  const [matchRows] = await pool.query<MatchRow[]>('SELECT id FROM matches WHERE id = ? LIMIT 1', [matchId]);
  if (!matchRows[0]) {
    res.status(404).json({ message: 'Partido no encontrado' });
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

  res.json({ message: 'Jugadores asignados exitosamente', playerIds: sanitizedPlayerIds });
});

matchesRouter.post('/:id/ratings', requireRole('ADMIN'), async (req, res) => {
  const matchId = Number(req.params.id);
  const { ratings } = req.body as SaveRatingsBody;

  if (!Number.isInteger(matchId) || matchId <= 0) {
    res.status(400).json({ message: 'ID de partido inválido' });
    return;
  }

  if (!Array.isArray(ratings) || ratings.length === 0) {
    res.status(400).json({ message: 'ratings debe ser un array no vacío' });
    return;
  }

  await ensureEfficiencySchema();

  const normalizedRatings = ratings.map(normalizeEfficiencyRatingInput);

  for (const item of normalizedRatings) {
    if (
      !Number.isInteger(item.playerId) ||
      item.playerId <= 0 ||
      typeof item.minutesPlayed !== 'boolean' ||
      !isNonNegativeInteger(item.setsPlayed) ||
      !isNonNegativeInteger(item.attackPoints) ||
      !isNonNegativeInteger(item.attackErrors) ||
      !isNonNegativeInteger(item.attackAttempts) ||
      !isNonNegativeInteger(item.serveAces) ||
      !isNonNegativeInteger(item.serveErrors) ||
      !isNonNegativeInteger(item.serveAttempts) ||
      !isNonNegativeInteger(item.receptionThree) ||
      !isNonNegativeInteger(item.receptionTwo) ||
      !isNonNegativeInteger(item.receptionOne) ||
      !isNonNegativeInteger(item.receptionZero) ||
      !isNonNegativeInteger(item.setAssists) ||
      !isNonNegativeInteger(item.setErrors) ||
      !isNonNegativeInteger(item.setAttempts) ||
      !isNonNegativeInteger(item.defenseSuccesses) ||
      !isNonNegativeInteger(item.defenseFailures) ||
      !isNonNegativeInteger(item.blockKill) ||
      !isNonNegativeInteger(item.blockTouch) ||
      !isNonNegativeInteger(item.blockError)
    ) {
      res.status(400).json({
        message: 'Cada calificación debe incluir contadores no negativos válidos, intentos y un playerId válido'
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
      res.status(404).json({ message: 'Partido no encontrado' });
      return;
    }

    for (const item of normalizedRatings) {
      const calculated = calculateEfficiencyMetrics(item);

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
          INSERT INTO efficiency_ratings (
            match_id,
            player_id,
            minutes_played,
            sets_played,
            attack_points,
            attack_errors,
            attack_attempts,
            serve_aces,
            serve_errors,
            serve_attempts,
            reception_three,
            reception_two,
            reception_one,
            reception_zero,
            set_assists,
            set_errors,
            set_attempts,
            defense_successes,
            defense_failures,
            block_kill,
            block_touch,
            block_error,
            attack_efficiency,
            attack_points_per_set,
            serve_in_percentage,
            serve_efficiency,
            reception_efficiency,
            setting_efficiency,
            defense_efficiency,
            block_efficiency,
            overall_efficiency,
            created_by
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE
            minutes_played = VALUES(minutes_played),
            sets_played = VALUES(sets_played),
            attack_points = VALUES(attack_points),
            attack_errors = VALUES(attack_errors),
            attack_attempts = VALUES(attack_attempts),
            serve_aces = VALUES(serve_aces),
            serve_errors = VALUES(serve_errors),
            serve_attempts = VALUES(serve_attempts),
            reception_three = VALUES(reception_three),
            reception_two = VALUES(reception_two),
            reception_one = VALUES(reception_one),
            reception_zero = VALUES(reception_zero),
            set_assists = VALUES(set_assists),
            set_errors = VALUES(set_errors),
            set_attempts = VALUES(set_attempts),
            defense_successes = VALUES(defense_successes),
            defense_failures = VALUES(defense_failures),
            block_kill = VALUES(block_kill),
            block_touch = VALUES(block_touch),
            block_error = VALUES(block_error),
            attack_efficiency = VALUES(attack_efficiency),
            attack_points_per_set = VALUES(attack_points_per_set),
            serve_in_percentage = VALUES(serve_in_percentage),
            serve_efficiency = VALUES(serve_efficiency),
            reception_efficiency = VALUES(reception_efficiency),
            setting_efficiency = VALUES(setting_efficiency),
            defense_efficiency = VALUES(defense_efficiency),
            block_efficiency = VALUES(block_efficiency),
            overall_efficiency = VALUES(overall_efficiency),
            created_by = VALUES(created_by)
        `,
        [
          matchId,
          item.playerId,
          item.minutesPlayed ? 1 : 0,
          item.setsPlayed,
          item.attackPoints,
          item.attackErrors,
          item.attackAttempts,
          item.serveAces,
          item.serveErrors,
          item.serveAttempts,
          item.receptionThree,
          item.receptionTwo,
          item.receptionOne,
          item.receptionZero,
          item.setAssists,
          item.setErrors,
          item.setAttempts,
          item.defenseSuccesses,
          item.defenseFailures,
          item.blockKill,
          item.blockTouch,
          item.blockError,
          calculated.attackEfficiency,
          calculated.attackPointsPerSet,
          calculated.serveInPercentage,
          calculated.serveEfficiency,
          calculated.receptionEfficiency,
          calculated.settingEfficiency,
          calculated.defenseEfficiency,
          calculated.blockEfficiency,
          calculated.overallEfficiency,
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

  res.json({ message: 'Calificaciones guardadas exitosamente', ratedPlayers: normalizedRatings.length });
});

matchesRouter.get('/:id/ratings', async (req, res) => {
  const matchId = Number(req.params.id);

  if (!Number.isInteger(matchId) || matchId <= 0) {
    res.status(400).json({ message: 'ID de partido inválido' });
    return;
  }

  await ensureEfficiencySchema();

  const [rows] = await pool.query<RowDataPacket[]>(
    `
      SELECT
        r.match_id,
        r.player_id,
        u.full_name,
        r.minutes_played,
        r.sets_played,
        r.attack_points,
        r.attack_errors,
        r.attack_attempts,
        r.serve_aces,
        r.serve_errors,
        r.serve_attempts,
        r.reception_three,
        r.reception_two,
        r.reception_one,
        r.reception_zero,
        r.set_assists,
        r.set_errors,
        r.set_attempts,
        r.defense_successes,
        r.defense_failures,
        r.block_kill,
        r.block_touch,
        r.block_error,
        COALESCE(r.attack_efficiency, 0) * 100 AS attack_efficiency,
        COALESCE(r.attack_points_per_set, 0) AS attack_points_per_set,
        COALESCE(r.serve_in_percentage, 0) * 100 AS serve_in_percentage,
        COALESCE(r.serve_efficiency, 0) * 100 AS serve_efficiency,
        (r.reception_three + r.reception_two + r.reception_one + r.reception_zero) AS reception_attempts,
        COALESCE(r.reception_efficiency, 0) * 100 AS reception_efficiency,
        COALESCE(r.setting_efficiency, 0) * 100 AS setting_efficiency,
        COALESCE(r.defense_efficiency, 0) * 100 AS defense_efficiency,
        (r.block_kill + r.block_touch + r.block_error) AS block_total,
        COALESCE(r.block_efficiency, 0) * 100 AS block_efficiency,
        COALESCE(r.overall_efficiency, 0) * 100 AS overall_efficiency,
        COALESCE(r.overall_efficiency, 0) * 100 AS match_performance,
        r.updated_at
      FROM efficiency_ratings r
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
