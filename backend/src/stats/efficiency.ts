import { RowDataPacket } from 'mysql2';
import { pool } from '../db/pool';

export interface EfficiencyRatingInput {
  playerId: number;
  minutesPlayed: boolean;
  setsPlayed: number;
  attackPoints: number;
  attackErrors: number;
  attackAttempts: number;
  serveAces: number;
  serveErrors: number;
  serveAttempts: number;
  receptionThree: number;
  receptionTwo: number;
  receptionOne: number;
  receptionZero: number;
  setAssists: number;
  setErrors: number;
  setAttempts: number;
  defenseSuccesses: number;
  defenseFailures: number;
  blockKill: number;
  blockTouch: number;
  blockError: number;
}

interface EfficiencyMetrics {
  attackEfficiency: number | null;
  attackPointsPerSet: number | null;
  serveInPercentage: number | null;
  serveEfficiency: number | null;
  receptionAttempts: number;
  receptionEfficiency: number | null;
  settingEfficiency: number | null;
  defenseEfficiency: number | null;
  blockTotal: number;
  blockEfficiency: number | null;
  overallEfficiency: number;
}

function roundMetric(value: number | null): number | null {
  return value === null ? null : Number(value.toFixed(4));
}

function safeDivide(numerator: number, denominator: number): number | null {
  if (denominator <= 0) {
    return null;
  }

  return numerator / denominator;
}

function calculateOverallEfficiency(values: Array<number | null>): number {
  const total = values.reduce<number>((sum, value) => sum + (value ?? 0), 0);
  return Number(Math.min(1, total / 4).toFixed(4));
}

let efficiencySchemaReady: Promise<void> | null = null;

interface ColumnTypeRow extends RowDataPacket {
  COLUMN_TYPE: string;
}

async function syncStoredEfficiencyMetrics(): Promise<void> {
  await pool.query(`
    UPDATE efficiency_ratings
    SET
      defense_efficiency = CASE
        WHEN (defense_successes + defense_failures) > 0
          THEN ROUND(
            (CAST(defense_successes AS SIGNED) - CAST(defense_failures AS SIGNED)) /
            (defense_successes + defense_failures),
            4
          )
        ELSE NULL
      END,
      overall_efficiency = ROUND(
        LEAST(
          1,
          (
            COALESCE(attack_efficiency, 0) +
            COALESCE(serve_efficiency, 0) +
            COALESCE(reception_efficiency, 0) +
            COALESCE(setting_efficiency, 0) +
            COALESCE(
              CASE
                WHEN (defense_successes + defense_failures) > 0
                  THEN
                    (CAST(defense_successes AS SIGNED) - CAST(defense_failures AS SIGNED)) /
                    (defense_successes + defense_failures)
                ELSE NULL
              END,
              0
            ) +
            COALESCE(block_efficiency, 0)
          ) / 4
        ),
        4
      )
  `);
}

export async function ensureEfficiencySchema(): Promise<void> {
  if (!efficiencySchemaReady) {
    efficiencySchemaReady = (async () => {
      const [matchTypeRows] = await pool.query<ColumnTypeRow[]>(
        `
          SELECT COLUMN_TYPE
          FROM information_schema.columns
          WHERE table_schema = DATABASE()
            AND table_name = 'matches'
            AND column_name = 'id'
          LIMIT 1
        `
      );

      const [playerTypeRows] = await pool.query<ColumnTypeRow[]>(
        `
          SELECT COLUMN_TYPE
          FROM information_schema.columns
          WHERE table_schema = DATABASE()
            AND table_name = 'players'
            AND column_name = 'id'
          LIMIT 1
        `
      );

      const matchIdColumnType = String(matchTypeRows[0]?.COLUMN_TYPE ?? 'int').toUpperCase();
      const playerIdColumnType = String(playerTypeRows[0]?.COLUMN_TYPE ?? 'int unsigned').toUpperCase();

      await pool.query(`
        CREATE TABLE IF NOT EXISTS efficiency_ratings (
          id INT AUTO_INCREMENT PRIMARY KEY,
          match_id ${matchIdColumnType} NOT NULL,
          player_id ${playerIdColumnType} NOT NULL,
          minutes_played TINYINT(1) NOT NULL DEFAULT 1,
          sets_played INT UNSIGNED NOT NULL DEFAULT 0,
          attack_points INT UNSIGNED NOT NULL DEFAULT 0,
          attack_errors INT UNSIGNED NOT NULL DEFAULT 0,
          attack_attempts INT UNSIGNED NOT NULL DEFAULT 0,
          serve_aces INT UNSIGNED NOT NULL DEFAULT 0,
          serve_errors INT UNSIGNED NOT NULL DEFAULT 0,
          serve_attempts INT UNSIGNED NOT NULL DEFAULT 0,
          reception_three INT UNSIGNED NOT NULL DEFAULT 0,
          reception_two INT UNSIGNED NOT NULL DEFAULT 0,
          reception_one INT UNSIGNED NOT NULL DEFAULT 0,
          reception_zero INT UNSIGNED NOT NULL DEFAULT 0,
          set_assists INT UNSIGNED NOT NULL DEFAULT 0,
          set_errors INT UNSIGNED NOT NULL DEFAULT 0,
          set_attempts INT UNSIGNED NOT NULL DEFAULT 0,
          defense_successes INT UNSIGNED NOT NULL DEFAULT 0,
          defense_failures INT UNSIGNED NOT NULL DEFAULT 0,
          block_kill INT UNSIGNED NOT NULL DEFAULT 0,
          block_touch INT UNSIGNED NOT NULL DEFAULT 0,
          block_error INT UNSIGNED NOT NULL DEFAULT 0,
          attack_efficiency DECIMAL(7, 4) NULL,
          attack_points_per_set DECIMAL(7, 4) NULL,
          serve_in_percentage DECIMAL(7, 4) NULL,
          serve_efficiency DECIMAL(7, 4) NULL,
          reception_efficiency DECIMAL(7, 4) NULL,
          setting_efficiency DECIMAL(7, 4) NULL,
          defense_efficiency DECIMAL(7, 4) NULL,
          block_efficiency DECIMAL(7, 4) NULL,
          overall_efficiency DECIMAL(7, 4) NOT NULL DEFAULT 0.0000,
          created_by INT NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          CONSTRAINT fk_efficiency_ratings_match
            FOREIGN KEY (match_id) REFERENCES matches(id)
            ON DELETE CASCADE
            ON UPDATE CASCADE,
          CONSTRAINT fk_efficiency_ratings_player
            FOREIGN KEY (player_id) REFERENCES players(id)
            ON DELETE CASCADE
            ON UPDATE CASCADE,
          UNIQUE KEY uq_efficiency_ratings_match_player (match_id, player_id),
          KEY idx_efficiency_ratings_player (player_id),
          KEY idx_efficiency_ratings_match (match_id),
          KEY idx_efficiency_ratings_minutes (minutes_played)
        ) ENGINE=InnoDB
      `);

      await syncStoredEfficiencyMetrics();
    })().catch((error) => {
      efficiencySchemaReady = null;
      throw error;
    });
  }

  await efficiencySchemaReady;
}

export function calculateEfficiencyMetrics(item: EfficiencyRatingInput): EfficiencyMetrics {
  const receptionAttempts = item.receptionThree + item.receptionTwo + item.receptionOne + item.receptionZero;
  const blockTotal = item.blockKill + item.blockTouch + item.blockError;
  const defenseTotal = item.defenseSuccesses + item.defenseFailures;

  const attackEfficiency = roundMetric(safeDivide(item.attackPoints - item.attackErrors, item.attackAttempts));
  const attackPointsPerSet = roundMetric(safeDivide(item.attackPoints, item.setsPlayed));
  const serveInPercentage = roundMetric(safeDivide(item.serveAttempts - item.serveErrors, item.serveAttempts));
  const serveEfficiency = roundMetric(safeDivide(item.serveAces - item.serveErrors, item.serveAttempts));
  const receptionEfficiency = roundMetric(
    safeDivide(
      item.receptionThree * 3 + item.receptionTwo * 2 + item.receptionOne,
      receptionAttempts * 3
    )
  );
  const settingEfficiency = roundMetric(safeDivide(item.setAssists - item.setErrors, item.setAttempts));
  const defenseEfficiency = roundMetric(
    safeDivide(item.defenseSuccesses - item.defenseFailures, defenseTotal)
  );
  const blockWeightedAverage = safeDivide(item.blockKill * 2 + item.blockTouch, blockTotal);
  const blockEfficiency = roundMetric(
    blockWeightedAverage === null ? null : blockWeightedAverage / 2
  );

  return {
    attackEfficiency,
    attackPointsPerSet,
    serveInPercentage,
    serveEfficiency,
    receptionAttempts,
    receptionEfficiency,
    settingEfficiency,
    defenseEfficiency,
    blockTotal,
    blockEfficiency,
    overallEfficiency: calculateOverallEfficiency([
      attackEfficiency,
      serveEfficiency,
      receptionEfficiency,
      settingEfficiency,
      defenseEfficiency,
      blockEfficiency
    ])
  };
}