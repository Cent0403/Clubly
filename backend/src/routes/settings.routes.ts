import { Router } from 'express';
import { ResultSetHeader, RowDataPacket } from 'mysql2';
import { pool } from '../db/pool';
import { requireAuth, requireRole } from '../middleware/auth';

interface SettingsRow extends RowDataPacket {
  id: number;
  team_name: string;
  team_logo_url: string | null;
}

interface UpdateSettingsBody {
  teamName?: string;
  teamLogoUrl?: string | null;
}

const settingsRouter = Router();

async function ensureSettingsTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS app_settings (
      id TINYINT UNSIGNED NOT NULL PRIMARY KEY,
      team_name VARCHAR(120) NOT NULL DEFAULT 'Clubly',
      team_logo_url LONGTEXT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB
  `);

  await pool.query(`
    INSERT INTO app_settings (id, team_name)
    VALUES (1, 'Clubly')
    ON DUPLICATE KEY UPDATE id = id
  `);
}

settingsRouter.get('/', async (_req, res) => {
  await ensureSettingsTable();

  const [rows] = await pool.query<SettingsRow[]>(
    `
      SELECT id, team_name, team_logo_url
      FROM app_settings
      WHERE id = 1
      LIMIT 1
    `
  );

  const settings = rows[0] ?? { id: 1, team_name: 'Clubly', team_logo_url: null };

  res.json({
    settings: {
      teamName: settings.team_name,
      teamLogoUrl: settings.team_logo_url
    }
  });
});

settingsRouter.put('/', requireAuth, requireRole('ADMIN'), async (req, res) => {
  await ensureSettingsTable();

  const { teamName, teamLogoUrl } = req.body as UpdateSettingsBody;
  const nextTeamName = teamName?.trim();
  const hasTeamName = typeof nextTeamName === 'string' && nextTeamName.length > 0;
  const hasLogoField = typeof teamLogoUrl !== 'undefined';

  if (!hasTeamName && !hasLogoField) {
    res.status(400).json({ message: 'Provide teamName or teamLogoUrl to update settings' });
    return;
  }

  const updates: string[] = [];
  const values: Array<string | null | number> = [];

  if (hasTeamName) {
    updates.push('team_name = ?');
    values.push(nextTeamName as string);
  }

  if (hasLogoField) {
    if (teamLogoUrl === null || teamLogoUrl === '') {
      updates.push('team_logo_url = NULL');
    } else {
      updates.push('team_logo_url = ?');
      values.push(teamLogoUrl as string);
    }
  }

  values.push(1);

  const sql = `
    UPDATE app_settings
    SET ${updates.join(', ')}
    WHERE id = ?
  `;

  await pool.query<ResultSetHeader>(sql, values);

  const [rows] = await pool.query<SettingsRow[]>(
    `
      SELECT id, team_name, team_logo_url
      FROM app_settings
      WHERE id = 1
      LIMIT 1
    `
  );

  const settings = rows[0] ?? { id: 1, team_name: 'Clubly', team_logo_url: null };

  res.json({
    message: 'Team settings updated successfully',
    settings: {
      teamName: settings.team_name,
      teamLogoUrl: settings.team_logo_url
    }
  });
});

export { settingsRouter };
