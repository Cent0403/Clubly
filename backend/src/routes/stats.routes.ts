import { Router } from 'express';
import { RowDataPacket } from 'mysql2';
import { pool } from '../db/pool';
import { requireAuth, requireRole } from '../middleware/auth';
import { ensureEfficiencySchema } from '../stats/efficiency';

const statsRouter = Router();

statsRouter.use(requireAuth);

async function getGlobalStatsPayload() {
  await ensureEfficiencySchema();

  const [teamRows] = await pool.query<RowDataPacket[]>(
    `
      SELECT
        ROUND(COALESCE(AVG(v.avg_overall), 0.0), 2) AS team_overall_avg,
        ROUND(COALESCE(AVG(v.avg_reception), 0.0), 2) AS team_reception_avg,
        ROUND(COALESCE(AVG(v.avg_serve), 0.0), 2) AS team_serve_avg,
        ROUND(COALESCE(AVG(v.avg_defense), 0.0), 2) AS team_defense_avg,
        ROUND(COALESCE(AVG(v.avg_attack), 0.0), 2) AS team_attack_avg,
        ROUND(COALESCE(AVG(v.avg_block), 0.0), 2) AS team_block_avg,
        ROUND(COALESCE(AVG(v.avg_setting), 0.0), 2) AS team_setting_avg,
        ROUND(COALESCE(AVG(v.avg_attack_points_per_set), 0.0), 2) AS team_attack_points_per_set_avg,
        COUNT(*) AS roster_size
      FROM (
        SELECT
          p.id AS player_id,
          ROUND(COALESCE(AVG(CASE WHEN r.minutes_played = 1 THEN r.overall_efficiency END), 0.0) * 100, 2) AS avg_overall,
          ROUND(COALESCE(AVG(CASE WHEN r.minutes_played = 1 THEN r.reception_efficiency END), 0.0) * 100, 2) AS avg_reception,
          ROUND(COALESCE(AVG(CASE WHEN r.minutes_played = 1 THEN r.serve_efficiency END), 0.0) * 100, 2) AS avg_serve,
          ROUND(COALESCE(AVG(CASE WHEN r.minutes_played = 1 THEN r.defense_efficiency END), 0.0) * 100, 2) AS avg_defense,
          ROUND(COALESCE(AVG(CASE WHEN r.minutes_played = 1 THEN r.attack_efficiency END), 0.0) * 100, 2) AS avg_attack,
          ROUND(COALESCE(AVG(CASE WHEN r.minutes_played = 1 THEN r.block_efficiency END), 0.0) * 100, 2) AS avg_block,
          ROUND(COALESCE(AVG(CASE WHEN r.minutes_played = 1 THEN r.setting_efficiency END), 0.0) * 100, 2) AS avg_setting,
          ROUND(COALESCE(AVG(CASE WHEN r.minutes_played = 1 THEN r.attack_points_per_set END), 0.0), 2) AS avg_attack_points_per_set
        FROM players p
        LEFT JOIN efficiency_ratings r ON r.player_id = p.id
        GROUP BY p.id
      ) v
    `
  );

  const [evolutionRows] = await pool.query<RowDataPacket[]>(
    `
      SELECT
        m.id AS match_id,
        m.match_date,
        m.opponent,
        m.tournament,
        ROUND(COALESCE(AVG(CASE WHEN r.minutes_played = 1 THEN r.overall_efficiency END), 0.0) * 100, 2) AS team_match_performance
      FROM matches m
      LEFT JOIN efficiency_ratings r ON r.match_id = m.id AND r.minutes_played = 1
      GROUP BY m.id, m.match_date, m.opponent, m.tournament
      ORDER BY m.match_date ASC, m.id ASC
    `
  );

  const [topReception] = await pool.query<RowDataPacket[]>(
    `
      SELECT
        u.full_name,
        ROUND(COALESCE(AVG(CASE WHEN r.minutes_played = 1 THEN r.reception_efficiency END), 0.0) * 100, 2) AS score
      FROM players p
      JOIN users u ON u.id = p.user_id
      LEFT JOIN efficiency_ratings r ON r.player_id = p.id
      GROUP BY p.id, u.full_name
      ORDER BY score DESC, u.full_name ASC
      LIMIT 5
    `
  );

  const [topServe] = await pool.query<RowDataPacket[]>(
    `
      SELECT
        u.full_name,
        ROUND(COALESCE(AVG(CASE WHEN r.minutes_played = 1 THEN r.serve_efficiency END), 0.0) * 100, 2) AS score
      FROM players p
      JOIN users u ON u.id = p.user_id
      LEFT JOIN efficiency_ratings r ON r.player_id = p.id
      GROUP BY p.id, u.full_name
      ORDER BY score DESC, u.full_name ASC
      LIMIT 5
    `
  );

  const [topDefense] = await pool.query<RowDataPacket[]>(
    `
      SELECT
        u.full_name,
        ROUND(COALESCE(AVG(CASE WHEN r.minutes_played = 1 THEN r.defense_efficiency END), 0.0) * 100, 2) AS score
      FROM players p
      JOIN users u ON u.id = p.user_id
      LEFT JOIN efficiency_ratings r ON r.player_id = p.id
      GROUP BY p.id, u.full_name
      ORDER BY score DESC, u.full_name ASC
      LIMIT 5
    `
  );

  const [topAttack] = await pool.query<RowDataPacket[]>(
    `
      SELECT
        u.full_name,
        ROUND(COALESCE(AVG(CASE WHEN r.minutes_played = 1 THEN r.attack_efficiency END), 0.0) * 100, 2) AS score
      FROM players p
      JOIN users u ON u.id = p.user_id
      LEFT JOIN efficiency_ratings r ON r.player_id = p.id
      GROUP BY p.id, u.full_name
      ORDER BY score DESC, u.full_name ASC
      LIMIT 5
    `
  );

  const [topBlock] = await pool.query<RowDataPacket[]>(
    `
      SELECT
        u.full_name,
        ROUND(COALESCE(AVG(CASE WHEN r.minutes_played = 1 THEN r.block_efficiency END), 0.0) * 100, 2) AS score
      FROM players p
      JOIN users u ON u.id = p.user_id
      LEFT JOIN efficiency_ratings r ON r.player_id = p.id
      GROUP BY p.id, u.full_name
      ORDER BY score DESC, u.full_name ASC
      LIMIT 5
    `
  );

  const [topSetting] = await pool.query<RowDataPacket[]>(
    `
      SELECT
        u.full_name,
        ROUND(COALESCE(AVG(CASE WHEN r.minutes_played = 1 THEN r.setting_efficiency END), 0.0) * 100, 2) AS score
      FROM players p
      JOIN users u ON u.id = p.user_id
      LEFT JOIN efficiency_ratings r ON r.player_id = p.id
      GROUP BY p.id, u.full_name
      ORDER BY score DESC, u.full_name ASC
      LIMIT 5
    `
  );

  return {
    teamOverview: teamRows[0] ?? null,
    evolution: evolutionRows,
    topPlayers: {
      reception: topReception,
      serve: topServe,
      defense: topDefense,
      attack: topAttack,
      block: topBlock,
      setting: topSetting
    }
  };
}

statsRouter.get('/me', requireRole('PLAYER'), async (req, res) => {
  await ensureEfficiencySchema();

  const playerId = req.user?.playerId;

  if (!playerId) {
    res.status(404).json({ message: 'Player profile not found for current user' });
    return;
  }

  const [summaryRows] = await pool.query<RowDataPacket[]>(
    `
      SELECT
        p.id AS player_id,
        u.full_name,
        u.username,
        ROUND(COALESCE(AVG(CASE WHEN r.minutes_played = 1 THEN r.overall_efficiency END), 0.0) * 100, 2) AS overall_score,
        ROUND(COALESCE(AVG(CASE WHEN r.minutes_played = 1 THEN r.reception_efficiency END), 0.0) * 100, 2) AS avg_reception,
        ROUND(COALESCE(AVG(CASE WHEN r.minutes_played = 1 THEN r.serve_efficiency END), 0.0) * 100, 2) AS avg_serve,
        ROUND(COALESCE(AVG(CASE WHEN r.minutes_played = 1 THEN r.defense_efficiency END), 0.0) * 100, 2) AS avg_defense,
        ROUND(COALESCE(AVG(CASE WHEN r.minutes_played = 1 THEN r.attack_efficiency END), 0.0) * 100, 2) AS avg_attack,
        ROUND(COALESCE(AVG(CASE WHEN r.minutes_played = 1 THEN r.block_efficiency END), 0.0) * 100, 2) AS avg_block,
        ROUND(COALESCE(AVG(CASE WHEN r.minutes_played = 1 THEN r.setting_efficiency END), 0.0) * 100, 2) AS avg_setting,
        ROUND(COALESCE(AVG(CASE WHEN r.minutes_played = 1 THEN r.attack_points_per_set END), 0.0), 2) AS avg_attack_points_per_set,
        COUNT(CASE WHEN r.minutes_played = 1 THEN 1 END) AS matches_rated
      FROM players p
      JOIN users u ON u.id = p.user_id
      LEFT JOIN efficiency_ratings r ON r.player_id = p.id
      WHERE p.id = ?
      GROUP BY p.id, u.full_name, u.username
    `,
    [playerId]
  );

  const [historyRows] = await pool.query<RowDataPacket[]>(
    `
      SELECT
        m.id AS match_id,
        m.match_date,
        m.opponent,
        m.tournament,
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
        COALESCE(r.overall_efficiency, 0) * 100 AS match_performance,
        r.sets_played,
        r.attack_points,
        r.attack_errors,
        r.attack_attempts,
        r.serve_aces,
        r.serve_errors,
        r.serve_attempts,
        r.block_kill,
        r.block_touch,
        r.block_error,
        r.defense_successes,
        r.defense_failures,
        r.reception_three,
        r.reception_two,
        r.reception_one,
        r.reception_zero,
        r.set_assists,
        r.set_errors,
        r.set_attempts
      FROM efficiency_ratings r
      JOIN matches m ON m.id = r.match_id
      WHERE r.player_id = ?
        AND r.minutes_played = 1
      ORDER BY m.match_date DESC, m.id DESC
    `,
    [playerId]
  );

  res.json({
    summary: summaryRows[0] ?? null,
    history: historyRows
  });
});

statsRouter.get('/player/:playerId', async (req, res) => {
  await ensureEfficiencySchema();

  const playerId = Number(req.params.playerId);

  if (!Number.isInteger(playerId) || playerId <= 0) {
    res.status(400).json({ message: 'Invalid player id' });
    return;
  }

  if (req.user?.role === 'PLAYER' && req.user.playerId !== playerId) {
    res.status(403).json({ message: 'Players can only view their own stats' });
    return;
  }

  const [summaryRows] = await pool.query<RowDataPacket[]>(
    `
      SELECT
        p.id AS player_id,
        u.full_name,
        u.username,
        ROUND(COALESCE(AVG(CASE WHEN r.minutes_played = 1 THEN r.overall_efficiency END), 0.0) * 100, 2) AS overall_score,
        ROUND(COALESCE(AVG(CASE WHEN r.minutes_played = 1 THEN r.reception_efficiency END), 0.0) * 100, 2) AS avg_reception,
        ROUND(COALESCE(AVG(CASE WHEN r.minutes_played = 1 THEN r.serve_efficiency END), 0.0) * 100, 2) AS avg_serve,
        ROUND(COALESCE(AVG(CASE WHEN r.minutes_played = 1 THEN r.defense_efficiency END), 0.0) * 100, 2) AS avg_defense,
        ROUND(COALESCE(AVG(CASE WHEN r.minutes_played = 1 THEN r.attack_efficiency END), 0.0) * 100, 2) AS avg_attack,
        ROUND(COALESCE(AVG(CASE WHEN r.minutes_played = 1 THEN r.block_efficiency END), 0.0) * 100, 2) AS avg_block,
        ROUND(COALESCE(AVG(CASE WHEN r.minutes_played = 1 THEN r.setting_efficiency END), 0.0) * 100, 2) AS avg_setting,
        ROUND(COALESCE(AVG(CASE WHEN r.minutes_played = 1 THEN r.attack_points_per_set END), 0.0), 2) AS avg_attack_points_per_set,
        COUNT(CASE WHEN r.minutes_played = 1 THEN 1 END) AS matches_rated
      FROM players p
      JOIN users u ON u.id = p.user_id
      LEFT JOIN efficiency_ratings r ON r.player_id = p.id
      WHERE p.id = ?
      GROUP BY p.id, u.full_name, u.username
    `,
    [playerId]
  );

  if (!summaryRows[0]) {
    res.status(404).json({ message: 'Player not found' });
    return;
  }

  const [historyRows] = await pool.query<RowDataPacket[]>(
    `
      SELECT
        m.id AS match_id,
        m.match_date,
        m.opponent,
        m.tournament,
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
        COALESCE(r.overall_efficiency, 0) * 100 AS match_performance,
        r.sets_played,
        r.attack_points,
        r.attack_errors,
        r.attack_attempts,
        r.serve_aces,
        r.serve_errors,
        r.serve_attempts,
        r.block_kill,
        r.block_touch,
        r.block_error,
        r.defense_successes,
        r.defense_failures,
        r.reception_three,
        r.reception_two,
        r.reception_one,
        r.reception_zero,
        r.set_assists,
        r.set_errors,
        r.set_attempts
      FROM efficiency_ratings r
      JOIN matches m ON m.id = r.match_id
      WHERE r.player_id = ?
        AND r.minutes_played = 1
      ORDER BY m.match_date DESC, m.id DESC
    `,
    [playerId]
  );

  res.json({
    summary: summaryRows[0],
    history: historyRows
  });
});

statsRouter.get('/global', requireRole('ADMIN'), async (_req, res) => {
  try {
    res.json(await getGlobalStatsPayload());
  } catch (error) {
    console.error('Failed to load /stats/global:', error);
    res.status(500).json({ message: 'Failed to load global stats' });
  }
});

statsRouter.get('/global-summary', async (_req, res) => {
  try {
    res.json(await getGlobalStatsPayload());
  } catch (error) {
    console.error('Failed to load /stats/global-summary:', error);
    res.status(500).json({ message: 'Failed to load global summary stats' });
  }
});

statsRouter.get('/top', async (_req, res) => {
  try {
    await ensureEfficiencySchema();

    const [rows] = await pool.query<RowDataPacket[]>(
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
        ORDER BY overall_score DESC, u.full_name ASC
      `
    );

    res.json({ players: rows });
  } catch (error) {
    console.error('Failed to load /stats/top:', error);
    res.status(500).json({ message: 'Failed to load top players' });
  }
});

export { statsRouter };
