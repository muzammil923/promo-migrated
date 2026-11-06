-- =====================================================================
--  SPOT REGISTRATION (QR-gated multi-station data collection)
--  Reference DDL — identical to what apps/backend/config/initDB.js creates.
--
--  A player registers once, then walks a set of physical stations. Each
--  station has a printed QR code; scanning it unlocks that station's form.
--  Used at medical camps (height/weight/BP desks) and similar walk-throughs.
--  station_code is the secret embedded in the printed QR and is NEVER sent
--  to the player before it is scanned.
--
--  Safe to run repeatedly (CREATE TABLE IF NOT EXISTS).
--  Requires an existing `games` table and `player_sessions` table.
-- =====================================================================

CREATE TABLE IF NOT EXISTS spotreg_settings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  game_id INT UNIQUE,
  bg_color VARCHAR(20) DEFAULT '#f4f6ff',
  primary_color VARCHAR(20) DEFAULT '#4F46E5',
  font_family VARCHAR(100) DEFAULT 'DM Sans',
  /* Registration screen */
  heading_1 VARCHAR(500),
  heading_2 VARCHAR(500),
  heading_3 VARCHAR(500),
  description_text TEXT,
  heading_1_color VARCHAR(20) DEFAULT '#1a1a2e',
  heading_2_color VARCHAR(20) DEFAULT '#666666',
  heading_3_color VARCHAR(20) DEFAULT '#777777',
  description_color VARCHAR(20) DEFAULT '#888888',
  label_color VARCHAR(20) DEFAULT '#6b7280',
  field_border_color VARCHAR(20) DEFAULT '#e5e7eb',
  card_bg_color VARCHAR(20) DEFAULT '#ffffff',
  card_radius VARCHAR(10) DEFAULT '20',
  /* Station list screen */
  stations_heading VARCHAR(500) DEFAULT 'Find your next station',
  stations_subheading TEXT,
  station_done_color VARCHAR(20) DEFAULT '#15803d',
  bg_image_url VARCHAR(500),
  game_logo_url VARCHAR(500),
  station_bg_image_url VARCHAR(500),
  thankyou_bg_image_url VARCHAR(500),
  intro_text TEXT,
  outro_text TEXT,
  intro_text_color VARCHAR(20) DEFAULT NULL,
  outro_text_color VARCHAR(20) DEFAULT NULL,
  /* Buttons: text + colours are independently editable per button */
  start_button_text VARCHAR(500) DEFAULT 'Start Registration',
  start_button_text_color VARCHAR(20) DEFAULT '#ffffff',
  start_button_bg_color VARCHAR(20) DEFAULT '#4F46E5',
  scan_button_text VARCHAR(500) DEFAULT 'Scan Station QR Code',
  scan_button_text_color VARCHAR(20) DEFAULT '#ffffff',
  scan_button_bg_color VARCHAR(20) DEFAULT '#4F46E5',
  submit_button_text VARCHAR(500) DEFAULT 'Save & Continue',
  submit_button_text_color VARCHAR(20) DEFAULT '#ffffff',
  submit_button_bg_color VARCHAR(20) DEFAULT '#4F46E5',
  skip_button_text VARCHAR(500) DEFAULT 'Skip for now',
  skip_button_text_color VARCHAR(20) DEFAULT '#6b7280',
  skip_button_bg_color VARCHAR(20) DEFAULT 'transparent',
  /* Thank-you screen */
  thankyou_heading VARCHAR(500) DEFAULT 'All Stations Complete!',
  thankyou_text TEXT,
  thankyou_heading_color VARCHAR(20) DEFAULT '#1a1a2e',
  thankyou_text_color VARCHAR(20) DEFAULT '#4b5563',
  thankyou_summary_heading VARCHAR(500) DEFAULT 'Your entries',
  show_entries_summary TINYINT(1) DEFAULT 1,
  /* Kept for backwards compatibility with the original column names */
  complete_heading VARCHAR(500) DEFAULT 'All Stations Complete!',
  complete_text TEXT,
  scan_hint_text VARCHAR(500) DEFAULT 'Point your camera at the QR code on this station.',
  require_order TINYINT(1) DEFAULT 1,
  require_qr TINYINT(1) DEFAULT 1,
  show_progress TINYINT(1) DEFAULT 1,
  allow_rescan TINYINT(1) DEFAULT 1,
  terms_enabled TINYINT(1) DEFAULT 0,
  terms_text TEXT,
  terms_url VARCHAR(500),
  meta_description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS spotreg_stations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  game_id INT NOT NULL,
  station_name VARCHAR(255) NOT NULL,
  station_code VARCHAR(40) UNIQUE,
  station_order INT DEFAULT 0,
  icon VARCHAR(16),
  heading_1 VARCHAR(500),
  description_text TEXT,
  image_url VARCHAR(500),
  is_active TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS spotreg_station_fields (
  id INT AUTO_INCREMENT PRIMARY KEY,
  station_id INT NOT NULL,
  field_label VARCHAR(255),
  field_type VARCHAR(50) DEFAULT 'text',
  field_options JSON,
  is_required TINYINT(1) DEFAULT 0,
  field_order INT DEFAULT 0,
  FOREIGN KEY (station_id) REFERENCES spotreg_stations(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS spotreg_progress (
  id INT AUTO_INCREMENT PRIMARY KEY,
  session_id INT NOT NULL,
  station_id INT NOT NULL,
  scanned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP NULL,
  answers JSON,
  UNIQUE KEY session_station (session_id, station_id),
  FOREIGN KEY (session_id) REFERENCES player_sessions(id) ON DELETE CASCADE,
  FOREIGN KEY (station_id) REFERENCES spotreg_stations(id) ON DELETE CASCADE
);

-- BMI RESULTS — computed once, at the end of a run, and never shown on the
-- thank-you screen; it exists so the emailed report is reproducible.
CREATE TABLE IF NOT EXISTS spotreg_bmi (
  id INT AUTO_INCREMENT PRIMARY KEY,
  session_id INT UNIQUE,
  bmi_value DECIMAL(5,2),
  bmi_category VARCHAR(100),
  bmi_percentile DECIMAL(5,2) NULL,
  height_cm DECIMAL(6,2) NULL,
  weight_kg DECIMAL(6,2) NULL,
  age_years DECIMAL(4,1) NULL,
  gender VARCHAR(20),
  is_adult TINYINT(1) DEFAULT 1,
  source JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (session_id) REFERENCES player_sessions(id) ON DELETE CASCADE
);

-- Design + email settings for this game type. Kept in its own table so the
-- generic email_templates flow (which is quiz-shaped) stays untouched.
CREATE TABLE IF NOT EXISTS spotreg_email_settings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  game_id INT UNIQUE,
  is_enabled TINYINT(1) DEFAULT 0,
  subject VARCHAR(500) DEFAULT 'Your Health Checkup Report',
  sender_name VARCHAR(200) DEFAULT 'Health Camp',
  sender_email VARCHAR(200),
  header_text VARCHAR(500) DEFAULT '🩺 Your Health Report',
  header_color VARCHAR(20) DEFAULT '#4F46E5',
  body_html MEDIUMTEXT,
  footer_text TEXT,
  accent_color VARCHAR(20) DEFAULT '#4F46E5',
  show_bmi_block TINYINT(1) DEFAULT 1,
  show_entries_table TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE
);

-- =====================================================================
--  Additive columns (added after the original release).
--  MySQL has no "ADD COLUMN IF NOT EXISTS" before 8.0.29 — use
--  sql/migrate-spotreg.js (or your migration runner) which checks first.
-- =====================================================================
-- spotreg_settings:
--   label_color              VARCHAR(20) DEFAULT '#6b7280'
--   field_border_color       VARCHAR(20) DEFAULT '#e5e7eb'
--   card_bg_color            VARCHAR(20) DEFAULT '#ffffff'
--   card_radius              VARCHAR(10) DEFAULT '20'
--   stations_heading         VARCHAR(500) DEFAULT 'Find your next station'
--   stations_subheading      TEXT
--   station_done_color       VARCHAR(20) DEFAULT '#15803d'
--   start_button_text_color  VARCHAR(20) DEFAULT '#ffffff'
--   start_button_bg_color    VARCHAR(20) DEFAULT '#4F46E5'
--   scan_button_text_color   VARCHAR(20) DEFAULT '#ffffff'
--   scan_button_bg_color     VARCHAR(20) DEFAULT '#4F46E5'
--   submit_button_text_color VARCHAR(20) DEFAULT '#ffffff'
--   submit_button_bg_color   VARCHAR(20) DEFAULT '#4F46E5'
--   skip_button_text_color   VARCHAR(20) DEFAULT '#6b7280'
--   skip_button_bg_color     VARCHAR(20) DEFAULT 'transparent'
--   thankyou_heading         VARCHAR(500) DEFAULT 'All Stations Complete!'
--   thankyou_text            TEXT
--   thankyou_heading_color   VARCHAR(20) DEFAULT '#1a1a2e'
--   thankyou_text_color      VARCHAR(20) DEFAULT '#4b5563'
--   thankyou_summary_heading VARCHAR(500) DEFAULT 'Your entries'
--   show_entries_summary     TINYINT(1) DEFAULT 1
--   heading_1_size           VARCHAR(10)
--   heading_2_size           VARCHAR(10)
--   heading_3_size           VARCHAR(10)
--   description_size         VARCHAR(10)
--   thankyou_heading_size    VARCHAR(10)
--   thankyou_text_size       VARCHAR(10)
--   finish_button_text       VARCHAR(500) DEFAULT 'Finish'
--   finish_button_text_color VARCHAR(20) DEFAULT '#6b7280'
--   finish_button_bg_color   VARCHAR(20) DEFAULT '#f3f4f6'
--   require_qr               TINYINT(1) DEFAULT 1
--
-- spotreg_email_settings:
--   sender_account    VARCHAR(100) NULL
--   show_disclaimer   TINYINT(1) DEFAULT 1
--   disclaimer_text   TEXT NULL
--   use_full_html     TINYINT(1) DEFAULT 0
--
-- games.category ENUM must contain 'spotregistration'
--   ALTER TABLE games MODIFY COLUMN category ENUM(..., 'spotregistration') DEFAULT 'quiz';
