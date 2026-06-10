-- TiDB migration: rebuild ratings table to update generated column formula
-- New formula: ((reception + serve + defense + attack + block_score + setting_score) / 4) + 5
--
-- Recommended execution window: low traffic / maintenance mode
--
-- Steps:
-- 1) Create ratings_v2 with the new generated formula.
-- 2) Copy all data from ratings.
-- 3) Align AUTO_INCREMENT.
-- 4) Swap table names.
-- 5) Validate counts.
-- 6) Drop backup table when verified.

-- Safety cleanup from previous failed attempts
DROP TABLE IF EXISTS ratings_v2;

CREATE TABLE ratings_v2 (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  match_id INT UNSIGNED NOT NULL,
  player_id INT UNSIGNED NOT NULL,
  minutes_played TINYINT(1) NOT NULL DEFAULT 1,

  attack_points INT UNSIGNED NOT NULL DEFAULT 0,
  attack_errors INT UNSIGNED NOT NULL DEFAULT 0,
  serve_aces INT UNSIGNED NOT NULL DEFAULT 0,
  serve_errors INT UNSIGNED NOT NULL DEFAULT 0,
  block_points INT UNSIGNED NOT NULL DEFAULT 0,
  block_touches INT UNSIGNED NOT NULL DEFAULT 0,
  defense_successes INT UNSIGNED NOT NULL DEFAULT 0,
  reception_perfect INT UNSIGNED NOT NULL DEFAULT 0,
  reception_good INT UNSIGNED NOT NULL DEFAULT 0,
  reception_bad INT UNSIGNED NOT NULL DEFAULT 0,
  reception_error INT UNSIGNED NOT NULL DEFAULT 0,
  set_assists INT UNSIGNED NOT NULL DEFAULT 0,
  set_errors INT UNSIGNED NOT NULL DEFAULT 0,

  reception DECIMAL(6,2) NOT NULL,
  serve DECIMAL(6,2) NOT NULL,
  defense DECIMAL(6,2) NOT NULL,
  attack DECIMAL(6,2) NOT NULL,
  block_score DECIMAL(6,2) NOT NULL,
  setting_score DECIMAL(6,2) NOT NULL,

  match_performance DECIMAL(7,2) GENERATED ALWAYS AS (
    CASE
      WHEN minutes_played = 1 THEN ROUND(
        ((reception + serve + defense + attack + block_score + setting_score) / 4) + 5,
        2
      )
      ELSE NULL
    END
  ) STORED,

  created_by INT UNSIGNED NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  CONSTRAINT fk_ratings_v2_match FOREIGN KEY (match_id)
    REFERENCES matches(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT fk_ratings_v2_player FOREIGN KEY (player_id)
    REFERENCES players(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT fk_ratings_v2_created_by FOREIGN KEY (created_by)
    REFERENCES users(id)
    ON DELETE RESTRICT
    ON UPDATE CASCADE,
  CONSTRAINT uq_ratings_v2_match_player UNIQUE (match_id, player_id),
  INDEX idx_ratings_v2_player (player_id),
  INDEX idx_ratings_v2_match (match_id)
) ENGINE=InnoDB;

INSERT INTO ratings_v2 (
  id,
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
  created_by,
  created_at,
  updated_at
)
SELECT
  id,
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
  created_by,
  created_at,
  updated_at
FROM ratings;

SET @next_id = (SELECT IFNULL(MAX(id), 0) + 1 FROM ratings_v2);
SET @sql = CONCAT('ALTER TABLE ratings_v2 AUTO_INCREMENT = ', @next_id);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Swap tables
DROP TABLE IF EXISTS ratings_old;
RENAME TABLE ratings TO ratings_old, ratings_v2 TO ratings;

-- Validation checks
SELECT COUNT(*) AS old_count FROM ratings_old;
SELECT COUNT(*) AS new_count FROM ratings;

-- Spot check formula values
SELECT
  id,
  minutes_played,
  reception,
  serve,
  defense,
  attack,
  block_score,
  setting_score,
  match_performance
FROM ratings
ORDER BY id DESC
LIMIT 10;

-- If everything is OK, run this manually:
-- DROP TABLE ratings_old;
