import { Router } from 'express';
import { RowDataPacket } from 'mysql2';
import { pool } from '../db/pool';
import { requireAuth, requireRole } from '../middleware/auth';

const statsRouter = Router();

statsRouter.use(requireAuth);

statsRouter.get('/me', requireRole('PLAYER'), async (req, res) => {
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
        LEAST(
          10.00,
          GREATEST(
            1.00,
            ROUND(COALESCE(AVG(CASE WHEN r.minutes_played = 1 THEN r.match_performance END), 5.0), 2)
          )
        ) AS overall_score,
        LEAST(10.00, ROUND(COALESCE(AVG(CASE WHEN r.minutes_played = 1 THEN r.reception END), 0.0), 2)) AS avg_reception,
        LEAST(10.00, ROUND(COALESCE(AVG(CASE WHEN r.minutes_played = 1 THEN r.serve END), 0.0), 2)) AS avg_serve,
        LEAST(10.00, ROUND(COALESCE(AVG(CASE WHEN r.minutes_played = 1 THEN r.defense END), 0.0), 2)) AS avg_defense,
        LEAST(10.00, ROUND(COALESCE(AVG(CASE WHEN r.minutes_played = 1 THEN r.attack END), 0.0), 2)) AS avg_attack,
        LEAST(10.00, ROUND(COALESCE(AVG(CASE WHEN r.minutes_played = 1 THEN r.block_score END), 0.0), 2)) AS avg_block,
        LEAST(10.00, ROUND(COALESCE(AVG(CASE WHEN r.minutes_played = 1 THEN r.setting_score END), 0.0), 2)) AS avg_setting,
        COUNT(CASE WHEN r.minutes_played = 1 THEN 1 END) AS matches_rated
      FROM players p
      JOIN users u ON u.id = p.user_id
      LEFT JOIN ratings r ON r.player_id = p.id
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
        r.reception,
        r.serve,
        r.defense,
        r.attack,
        r.block_score,
        r.setting_score,
        LEAST(10.00, GREATEST(1.00, r.match_performance)) AS match_performance,
        r.attack_points,
        r.attack_complicated,
        r.attack_errors,
        r.serve_aces,
        r.serve_complicated,
        r.serve_pasarlo,
        r.serve_errors,
        r.block_points,
        r.block_touches,
        r.defense_successes,
        r.reception_perfect,
        r.reception_good,
        r.reception_bad,
        r.reception_error,
        r.set_assists,
        r.set_errors
      FROM ratings r
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
        LEAST(
          10.00,
          GREATEST(
            1.00,
            ROUND(COALESCE(AVG(CASE WHEN r.minutes_played = 1 THEN r.match_performance END), 5.0), 2)
          )
        ) AS overall_score,
        LEAST(10.00, ROUND(COALESCE(AVG(CASE WHEN r.minutes_played = 1 THEN r.reception END), 0.0), 2)) AS avg_reception,
        LEAST(10.00, ROUND(COALESCE(AVG(CASE WHEN r.minutes_played = 1 THEN r.serve END), 0.0), 2)) AS avg_serve,
        LEAST(10.00, ROUND(COALESCE(AVG(CASE WHEN r.minutes_played = 1 THEN r.defense END), 0.0), 2)) AS avg_defense,
        LEAST(10.00, ROUND(COALESCE(AVG(CASE WHEN r.minutes_played = 1 THEN r.attack END), 0.0), 2)) AS avg_attack,
        LEAST(10.00, ROUND(COALESCE(AVG(CASE WHEN r.minutes_played = 1 THEN r.block_score END), 0.0), 2)) AS avg_block,
        LEAST(10.00, ROUND(COALESCE(AVG(CASE WHEN r.minutes_played = 1 THEN r.setting_score END), 0.0), 2)) AS avg_setting,
        COUNT(CASE WHEN r.minutes_played = 1 THEN 1 END) AS matches_rated
      FROM players p
      JOIN users u ON u.id = p.user_id
      LEFT JOIN ratings r ON r.player_id = p.id
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
        r.reception,
        r.serve,
        r.defense,
        r.attack,
        r.block_score,
        r.setting_score,
        LEAST(10.00, GREATEST(1.00, r.match_performance)) AS match_performance,
        r.attack_points,
        r.attack_complicated,
        r.attack_errors,
        r.serve_aces,
        r.serve_complicated,
        r.serve_pasarlo,
        r.serve_errors,
        r.block_points,
        r.block_touches,
        r.defense_successes,
        r.reception_perfect,
        r.reception_good,
        r.reception_bad,
        r.reception_error,
        r.set_assists,
        r.set_errors
      FROM ratings r
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
  const [teamRows] = await pool.query<RowDataPacket[]>(
    `
      SELECT
        ROUND(COALESCE(AVG(LEAST(10.00, GREATEST(1.00, v.avg_overall))), 5.0), 2) AS team_overall_avg,
        LEAST(10.00, ROUND(COALESCE(AVG(v.avg_reception), 0.0), 2)) AS team_reception_avg,
        LEAST(10.00, ROUND(COALESCE(AVG(v.avg_serve), 0.0), 2)) AS team_serve_avg,
        LEAST(10.00, ROUND(COALESCE(AVG(v.avg_defense), 0.0), 2)) AS team_defense_avg,
        LEAST(10.00, ROUND(COALESCE(AVG(v.avg_attack), 0.0), 2)) AS team_attack_avg,
        LEAST(10.00, ROUND(COALESCE(AVG(v.avg_block), 0.0), 2)) AS team_block_avg,
        LEAST(10.00, ROUND(COALESCE(AVG(v.avg_setting), 0.0), 2)) AS team_setting_avg,
        COUNT(*) AS roster_size
      FROM players p
      JOIN v_player_fundament_averages v ON v.player_id = p.id
    `
  );

  const [evolutionRows] = await pool.query<RowDataPacket[]>(
    `
      SELECT
        m.id AS match_id,
        m.match_date,
        m.opponent,
        m.tournament,
        ROUND(COALESCE(AVG(LEAST(10.00, GREATEST(1.00, r.match_performance))), 5.0), 2) AS team_match_performance
      FROM matches m
      LEFT JOIN ratings r ON r.match_id = m.id AND r.minutes_played = 1
      GROUP BY m.id, m.match_date, m.opponent, m.tournament
      ORDER BY m.match_date ASC, m.id ASC
    `
  );

  const [topReception] = await pool.query<RowDataPacket[]>(
    `
      SELECT full_name, LEAST(10.00, avg_reception) AS score
      FROM v_player_fundament_averages
      ORDER BY avg_reception DESC, full_name ASC
      LIMIT 3
    `
  );

  const [topServe] = await pool.query<RowDataPacket[]>(
    `
      SELECT full_name, LEAST(10.00, avg_serve) AS score
      FROM v_player_fundament_averages
      ORDER BY avg_serve DESC, full_name ASC
      LIMIT 3
    `
  );

  const [topDefense] = await pool.query<RowDataPacket[]>(
    `
      SELECT full_name, LEAST(10.00, avg_defense) AS score
      FROM v_player_fundament_averages
      ORDER BY avg_defense DESC, full_name ASC
      LIMIT 3
    `
  );

  const [topAttack] = await pool.query<RowDataPacket[]>(
    `
      SELECT full_name, LEAST(10.00, avg_attack) AS score
      FROM v_player_fundament_averages
      ORDER BY avg_attack DESC, full_name ASC
      LIMIT 3
    `
  );

  const [topBlock] = await pool.query<RowDataPacket[]>(
    `
      SELECT full_name, LEAST(10.00, avg_block) AS score
      FROM v_player_fundament_averages
      ORDER BY avg_block DESC, full_name ASC
      LIMIT 3
    `
  );

  const [topSetting] = await pool.query<RowDataPacket[]>(
    `
      SELECT full_name, LEAST(10.00, avg_setting) AS score
      FROM v_player_fundament_averages
      ORDER BY avg_setting DESC, full_name ASC
      LIMIT 3
    `
  );

  res.json({
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
  });
});

statsRouter.get('/top', async (_req, res) => {
  const [rows] = await pool.query<RowDataPacket[]>(
    `
      SELECT
        p.id AS player_id,
        u.id AS user_id,
        u.username,
        u.full_name,
        p.jersey_number,
        p.position,
        LEAST(
          10.00,
          GREATEST(
            1.00,
            ROUND(COALESCE(AVG(CASE WHEN r.minutes_played = 1 THEN r.match_performance END), 5.0), 2)
          )
        ) AS overall_score
      FROM players p
      JOIN users u ON u.id = p.user_id
      LEFT JOIN ratings r ON r.player_id = p.id
      GROUP BY p.id, u.id, u.username, u.full_name, p.jersey_number, p.position
      ORDER BY overall_score DESC, u.full_name ASC
    `
  );

  res.json({ players: rows });
});

export { statsRouter };
