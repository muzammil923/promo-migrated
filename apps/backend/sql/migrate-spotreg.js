/**
 * migrate-spotreg.js
 * ---------------------------------------------------------------------------
 * Standalone installer for the SPOT REGISTRATION (spotreg) feature.
 *
 * Run it once inside the target backend folder:
 *     cd <target>/apps/backend
 *     node migrate-spotreg.js
 *
 * It is idempotent — safe to run repeatedly. It:
 *   1. creates the 6 spotreg_* tables,
 *   2. adds the additive spotreg_settings / spotreg_email_settings columns,
 *   3. adds 'spotregistration' to the games.category ENUM (keeping every
 *      value that already exists in the target database).
 *
 * It expects ./config/env.js + ./config/db.js (mysql2 pool) to exist, i.e. the
 * same DB wiring the rest of the backend uses. DB credentials come from the
 * backend .env file.
 * ---------------------------------------------------------------------------
 */

require('dotenv').config();
const mysql = require('mysql2/promise');
const env = require('../config/env');

const TABLES = [
  `CREATE TABLE IF NOT EXISTS spotreg_settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    game_id INT UNIQUE,
    bg_color VARCHAR(20) DEFAULT '#f4f6ff',
    primary_color VARCHAR(20) DEFAULT '#4F46E5',
    font_family VARCHAR(100) DEFAULT 'DM Sans',
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
    thankyou_heading VARCHAR(500) DEFAULT 'All Stations Complete!',
    thankyou_text TEXT,
    thankyou_heading_color VARCHAR(20) DEFAULT '#1a1a2e',
    thankyou_text_color VARCHAR(20) DEFAULT '#4b5563',
    thankyou_summary_heading VARCHAR(500) DEFAULT 'Your entries',
    show_entries_summary TINYINT(1) DEFAULT 1,
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
  )`,

  `CREATE TABLE IF NOT EXISTS spotreg_stations (
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
  )`,

  `CREATE TABLE IF NOT EXISTS spotreg_station_fields (
    id INT AUTO_INCREMENT PRIMARY KEY,
    station_id INT NOT NULL,
    field_label VARCHAR(255),
    field_type VARCHAR(50) DEFAULT 'text',
    field_options JSON,
    is_required TINYINT(1) DEFAULT 0,
    field_order INT DEFAULT 0,
    FOREIGN KEY (station_id) REFERENCES spotreg_stations(id) ON DELETE CASCADE
  )`,

  `CREATE TABLE IF NOT EXISTS spotreg_progress (
    id INT AUTO_INCREMENT PRIMARY KEY,
    session_id INT NOT NULL,
    station_id INT NOT NULL,
    scanned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP NULL,
    answers JSON,
    UNIQUE KEY session_station (session_id, station_id),
    FOREIGN KEY (session_id) REFERENCES player_sessions(id) ON DELETE CASCADE,
    FOREIGN KEY (station_id) REFERENCES spotreg_stations(id) ON DELETE CASCADE
  )`,

  `CREATE TABLE IF NOT EXISTS spotreg_bmi (
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
  )`,

  `CREATE TABLE IF NOT EXISTS spotreg_email_settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    game_id INT UNIQUE,
    is_enabled TINYINT(1) DEFAULT 0,
    subject VARCHAR(500) DEFAULT 'Your Health Checkup Report',
    sender_name VARCHAR(200) DEFAULT 'Health Camp',
    sender_email VARCHAR(200),
    header_text VARCHAR(500) DEFAULT 'Your Health Report',
    header_color VARCHAR(20) DEFAULT '#4F46E5',
    body_html MEDIUMTEXT,
    footer_text TEXT,
    accent_color VARCHAR(20) DEFAULT '#4F46E5',
    show_bmi_block TINYINT(1) DEFAULT 1,
    show_entries_table TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE
  )`,
];

const SETTINGS_COLUMNS = [
  ['label_color', "VARCHAR(20) DEFAULT '#6b7280'"],
  ['field_border_color', "VARCHAR(20) DEFAULT '#e5e7eb'"],
  ['card_bg_color', "VARCHAR(20) DEFAULT '#ffffff'"],
  ['card_radius', "VARCHAR(10) DEFAULT '20'"],
  ['stations_heading', "VARCHAR(500) DEFAULT 'Find your next station'"],
  ['stations_subheading', 'TEXT'],
  ['station_done_color', "VARCHAR(20) DEFAULT '#15803d'"],
  ['start_button_text_color', "VARCHAR(20) DEFAULT '#ffffff'"],
  ['start_button_bg_color', "VARCHAR(20) DEFAULT '#4F46E5'"],
  ['scan_button_text_color', "VARCHAR(20) DEFAULT '#ffffff'"],
  ['scan_button_bg_color', "VARCHAR(20) DEFAULT '#4F46E5'"],
  ['submit_button_text_color', "VARCHAR(20) DEFAULT '#ffffff'"],
  ['submit_button_bg_color', "VARCHAR(20) DEFAULT '#4F46E5'"],
  ['skip_button_text_color', "VARCHAR(20) DEFAULT '#6b7280'"],
  ['skip_button_bg_color', "VARCHAR(20) DEFAULT 'transparent'"],
  ['thankyou_heading', "VARCHAR(500) DEFAULT 'All Stations Complete!'"],
  ['thankyou_text', 'TEXT'],
  ['thankyou_heading_color', "VARCHAR(20) DEFAULT '#1a1a2e'"],
  ['thankyou_text_color', "VARCHAR(20) DEFAULT '#4b5563'"],
  ['thankyou_summary_heading', "VARCHAR(500) DEFAULT 'Your entries'"],
  ['show_entries_summary', 'TINYINT(1) DEFAULT 1'],
  ['heading_1_size', 'VARCHAR(10)'],
  ['heading_2_size', 'VARCHAR(10)'],
  ['heading_3_size', 'VARCHAR(10)'],
  ['description_size', 'VARCHAR(10)'],
  ['thankyou_heading_size', 'VARCHAR(10)'],
  ['thankyou_text_size', 'VARCHAR(10)'],
  ['finish_button_text', "VARCHAR(500) DEFAULT 'Finish'"],
  ['finish_button_text_color', "VARCHAR(20) DEFAULT '#6b7280'"],
  ['finish_button_bg_color', "VARCHAR(20) DEFAULT '#f3f4f6'"],
  ['require_qr', 'TINYINT(1) DEFAULT 1'],
];

const EMAIL_COLUMNS = [
  ['sender_account', 'VARCHAR(100) NULL'],
  ['show_disclaimer', 'TINYINT(1) DEFAULT 1'],
  ['disclaimer_text', 'TEXT NULL'],
  ['use_full_html', 'TINYINT(1) DEFAULT 0'],
];

async function columnExists(conn, table, column) {
  const [rows] = await conn.query(`SHOW COLUMNS FROM \`${table}\` LIKE ?`, [column]);
  return rows.length > 0;
}

async function addColumn(conn, table, column, definition) {
  if (await columnExists(conn, table, column)) return false;
  await conn.query(`ALTER TABLE \`${table}\` ADD COLUMN \`${column}\` ${definition}`);
  console.log(`  + ${table}.${column}`);
  return true;
}

async function patchGameCategoryEnum(conn) {
  const [rows] = await conn.query("SHOW COLUMNS FROM `games` LIKE 'category'");
  if (!rows.length) {
    console.warn('  ! games.category column not found — skipped');
    return;
  }
  const type = rows[0].Type; // enum('a','b',...)
  const values = (type.match(/'([^']*)'/g) || []).map((v) => v.replace(/'/g, ''));
  if (values.includes('spotregistration')) {
    console.log('  = games.category already contains spotregistration');
    return;
  }
  const next = [...values, 'spotregistration'];
  const def = rows[0].Default === null ? '' : ` DEFAULT '${rows[0].Default}'`;
  const nullable = rows[0].Null === 'YES' ? ' NULL' : ' NOT NULL';
  await conn.query(
    `ALTER TABLE \`games\` MODIFY COLUMN \`category\` ENUM(${next.map((v) => `'${v}'`).join(',')})${nullable}${def}`
  );
  console.log('  + games.category ENUM += spotregistration');
}

async function main() {
  const connection = await mysql.createConnection({
    host: env.DB_HOST,
    port: env.DB_PORT,
    user: env.DB_USER,
    password: env.DB_PASSWORD,
    database: env.DB_NAME,
    multipleStatements: true,
    charset: 'utf8mb4',
  });

  console.log(`📍 Migrating spot registration into DB "${env.DB_NAME}" ...`);

  console.log('\n▸ Tables');
  for (const ddl of TABLES) {
    await connection.query(ddl);
  }
  console.log('  = 6 spotreg_* tables ensured');

  console.log('\n▸ Additive columns');
  for (const [col, def] of SETTINGS_COLUMNS) {
    await addColumn(connection, 'spotreg_settings', col, def);
  }
  for (const [col, def] of EMAIL_COLUMNS) {
    await addColumn(connection, 'spotreg_email_settings', col, def);
  }

  console.log('\n▸ games.category enum');
  await patchGameCategoryEnum(connection);

  console.log('\n✅ Spot registration schema is ready.\n');
  await connection.end();
}

if (require.main === module) {
  main().catch((err) => {
    console.error('❌ Spot registration migration failed:', err.message);
    process.exit(1);
  });
}

module.exports = main;
