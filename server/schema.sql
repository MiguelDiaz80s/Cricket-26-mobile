CREATE DATABASE IF NOT EXISTS cricket26 CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE cricket26;

CREATE TABLE IF NOT EXISTS user_profiles (
  user_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  email VARCHAR(100) UNIQUE,
  account_created TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  current_xp INT UNSIGNED NOT NULL DEFAULT 0,
  soft_currency INT UNSIGNED NOT NULL DEFAULT 500,
  premium_currency INT UNSIGNED NOT NULL DEFAULT 0
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS batting_statistics (
  user_id INT UNSIGNED PRIMARY KEY,
  matches_played INT UNSIGNED NOT NULL DEFAULT 0,
  innings_batted INT UNSIGNED NOT NULL DEFAULT 0,
  total_runs BIGINT UNSIGNED NOT NULL DEFAULT 0,
  highest_score INT UNSIGNED NOT NULL DEFAULT 0,
  balls_faced BIGINT UNSIGNED NOT NULL DEFAULT 0,
  fifties INT UNSIGNED NOT NULL DEFAULT 0,
  hundreds INT UNSIGNED NOT NULL DEFAULT 0,
  fours_hit BIGINT UNSIGNED NOT NULL DEFAULT 0,
  sixes_hit BIGINT UNSIGNED NOT NULL DEFAULT 0,
  FOREIGN KEY (user_id) REFERENCES user_profiles(user_id) ON DELETE CASCADE,
  INDEX idx_batting_total_runs (total_runs),
  INDEX idx_batting_highest_score (highest_score)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS bowling_statistics (
  user_id INT UNSIGNED PRIMARY KEY,
  matches_played INT UNSIGNED NOT NULL DEFAULT 0,
  balls_bowled BIGINT UNSIGNED NOT NULL DEFAULT 0,
  runs_conceded BIGINT UNSIGNED NOT NULL DEFAULT 0,
  wickets_taken BIGINT UNSIGNED NOT NULL DEFAULT 0,
  five_wicket_hauls INT UNSIGNED NOT NULL DEFAULT 0,
  FOREIGN KEY (user_id) REFERENCES user_profiles(user_id) ON DELETE CASCADE,
  INDEX idx_bowling_wickets (wickets_taken),
  INDEX idx_bowling_runs (runs_conceded)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS matches (
  match_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL,
  format_name ENUM('T20','ODI','TEST') NOT NULL,
  home_team VARCHAR(50) NOT NULL,
  away_team VARCHAR(50) NOT NULL,
  result VARCHAR(30) NOT NULL,
  user_runs INT UNSIGNED NOT NULL DEFAULT 0,
  user_wickets INT UNSIGNED NOT NULL DEFAULT 0,
  completed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES user_profiles(user_id) ON DELETE CASCADE,
  INDEX idx_matches_user_time (user_id, completed_at)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS match_delivery_logs (
  delivery_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  match_id BIGINT UNSIGNED NOT NULL,
  over_number INT UNSIGNED NOT NULL,
  ball_number INT UNSIGNED NOT NULL,
  bowler_variation ENUM('Straight','Slower','Reverse swing','Out swing','In swing','Off cutter','Leg cutter') NOT NULL,
  shot_selection ENUM('LOFT','STROKE','PUSH') DEFAULT NULL,
  timed_action ENUM('FRONT_FOOT','BACK_FOOT','LEAVE','SPECIAL') DEFAULT NULL,
  timing_quality ENUM('Early','Good','Perfect','Late','Missed') DEFAULT NULL,
  dismissal_type ENUM('Bowled','Caught','LBW','Run Out') DEFAULT NULL,
  runs_scored INT UNSIGNED NOT NULL DEFAULT 0,
  FOREIGN KEY (match_id) REFERENCES matches(match_id) ON DELETE CASCADE,
  INDEX idx_delivery_match_over (match_id, over_number, ball_number)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS player_campaign_progress (
  user_id INT UNSIGNED PRIMARY KEY,
  active_mode ENUM('Career','Tournament','QuickPlay') NOT NULL DEFAULT 'QuickPlay',
  current_tournament_id INT UNSIGNED DEFAULT NULL,
  tournament_stage INT UNSIGNED NOT NULL DEFAULT 1,
  career_season INT UNSIGNED NOT NULL DEFAULT 1,
  total_matches_won INT UNSIGNED NOT NULL DEFAULT 0,
  total_matches_lost INT UNSIGNED NOT NULL DEFAULT 0,
  FOREIGN KEY (user_id) REFERENCES user_profiles(user_id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS inventory (
  user_id INT UNSIGNED NOT NULL,
  item_id VARCHAR(80) NOT NULL,
  unlocked_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, item_id),
  FOREIGN KEY (user_id) REFERENCES user_profiles(user_id) ON DELETE CASCADE
) ENGINE=InnoDB;
