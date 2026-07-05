-- TiDB Cloud compatible schema for Clubly
-- Run this inside the target database (for example: clubly)

-- Optional, if your SQL editor is not already scoped to the DB:
-- USE clubly;

-- =============================================
-- Core tables
-- =============================================

CREATE TABLE IF NOT EXISTS users (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  password_hash CHAR(64) NOT NULL,
  role ENUM('ADMIN', 'PLAYER') NOT NULL,
  full_name VARCHAR(120) NOT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS app_settings (
  id TINYINT UNSIGNED NOT NULL PRIMARY KEY,
  team_name VARCHAR(120) NOT NULL DEFAULT 'Clubly',
  team_logo_url LONGTEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS players (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL UNIQUE,
  jersey_number INT UNSIGNED NULL,
  position ENUM('SETTER', 'OUTSIDE', 'OPPOSITE', 'MIDDLE', 'LIBERO') NULL,
  overall_score DECIMAL(6,2) NOT NULL DEFAULT 5.00,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_players_user FOREIGN KEY (user_id)
    REFERENCES users(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS matches (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  match_date DATE NOT NULL,
  opponent VARCHAR(120) NOT NULL,
  tournament VARCHAR(120) NOT NULL,
  location VARCHAR(120) NULL,
  notes TEXT NULL,
  created_by INT UNSIGNED NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_matches_created_by FOREIGN KEY (created_by)
    REFERENCES users(id)
    ON DELETE RESTRICT
    ON UPDATE CASCADE,
  INDEX idx_matches_date (match_date)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS match_participants (
  match_id INT UNSIGNED NOT NULL,
  player_id INT UNSIGNED NOT NULL,
  PRIMARY KEY (match_id, player_id),
  CONSTRAINT fk_participants_match FOREIGN KEY (match_id)
    REFERENCES matches(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT fk_participants_player FOREIGN KEY (player_id)
    REFERENCES players(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS ratings (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  match_id INT UNSIGNED NOT NULL,
  player_id INT UNSIGNED NOT NULL,
  minutes_played TINYINT(1) NOT NULL DEFAULT 1,

  attack_points INT UNSIGNED NOT NULL DEFAULT 0,
  attack_complicated INT UNSIGNED NOT NULL DEFAULT 0,
  attack_errors INT UNSIGNED NOT NULL DEFAULT 0,
  serve_aces INT UNSIGNED NOT NULL DEFAULT 0,
  serve_complicated INT UNSIGNED NOT NULL DEFAULT 0,
  serve_pasarlo INT UNSIGNED NOT NULL DEFAULT 0,
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

  -- Match overall note: fundamentals sum / 4 + 5, null if no minutes.
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
  CONSTRAINT fk_ratings_match FOREIGN KEY (match_id)
    REFERENCES matches(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT fk_ratings_player FOREIGN KEY (player_id)
    REFERENCES players(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT fk_ratings_created_by FOREIGN KEY (created_by)
    REFERENCES users(id)
    ON DELETE RESTRICT
    ON UPDATE CASCADE,
  CONSTRAINT uq_ratings_match_player UNIQUE (match_id, player_id),
  INDEX idx_ratings_player (player_id),
  INDEX idx_ratings_match (match_id)
) ENGINE=InnoDB;

-- =============================================
-- Seed data
-- =============================================

INSERT INTO users (username, password_hash, role, full_name)
VALUES ('admin', SHA2('shadows123@', 256), 'ADMIN', 'admin')
ON DUPLICATE KEY UPDATE
  full_name = VALUES(full_name),
  role = VALUES(role),
  is_active = 1;

INSERT INTO app_settings (id, team_name, team_logo_url)
VALUES (1, 'Clubly', NULL)
ON DUPLICATE KEY UPDATE
  team_name = VALUES(team_name),
  team_logo_url = VALUES(team_logo_url);

-- Optional analytics view
CREATE OR REPLACE VIEW v_player_fundament_averages AS
SELECT
  p.id AS player_id,
  u.full_name,
  u.username,
  LEAST(10.00, ROUND(COALESCE(AVG(CASE WHEN r.minutes_played = 1 THEN r.reception END), 0.0), 2)) AS avg_reception,
  LEAST(10.00, ROUND(COALESCE(AVG(CASE WHEN r.minutes_played = 1 THEN r.serve END), 0.0), 2)) AS avg_serve,
  LEAST(10.00, ROUND(COALESCE(AVG(CASE WHEN r.minutes_played = 1 THEN r.defense END), 0.0), 2)) AS avg_defense,
  LEAST(10.00, ROUND(COALESCE(AVG(CASE WHEN r.minutes_played = 1 THEN r.attack END), 0.0), 2)) AS avg_attack,
  LEAST(10.00, ROUND(COALESCE(AVG(CASE WHEN r.minutes_played = 1 THEN r.block_score END), 0.0), 2)) AS avg_block,
  LEAST(10.00, ROUND(COALESCE(AVG(CASE WHEN r.minutes_played = 1 THEN r.setting_score END), 0.0), 2)) AS avg_setting,
  ROUND(COALESCE(AVG(CASE WHEN r.minutes_played = 1 THEN r.match_performance END), 5.0), 2) AS avg_overall
FROM players p
JOIN users u ON u.id = p.user_id
LEFT JOIN ratings r ON r.player_id = p.id
GROUP BY p.id, u.full_name, u.username;
