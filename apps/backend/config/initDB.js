require('dotenv').config();
const env = require('./env');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

/* ================= HELPERS ================= */

async function columnExists(conn, table, column) {
  const [rows] = await conn.query(`SHOW COLUMNS FROM \`${table}\` LIKE ?`, [column]);
  return rows.length > 0;
}

async function addColumn(conn, table, column, definition) {
  try {
    const exists = await columnExists(conn, table, column);
    if (!exists) {
      await conn.query(`ALTER TABLE \`${table}\` ADD COLUMN \`${column}\` ${definition}`);
      console.log(`✅ Added ${table}.${column}`);
    }
  } catch (err) {
    console.error(`❌ Failed adding ${table}.${column}:`, err.message);
  }
}

async function safeQuery(conn, sql, label) {
  try {
    await conn.query(sql);
    if (label) console.log(`✅ ${label}`);
  } catch (err) {
    console.error(`❌ ${label || 'Query failed'}:`, err.message);
  }
}

/* ================= MAIN ================= */

async function initDB() {
  const connection = await mysql.createConnection({
    host: env.DB_HOST,
    port: env.DB_PORT,
    user: env.DB_USER,
    password: env.DB_PASSWORD,
    multipleStatements: true,
    charset: 'utf8mb4'
  });

  console.log('🔧 Initializing database...');
  const dbName = env.DB_NAME;

  await safeQuery(connection, `CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`, 'Database ready');
  await connection.query(`USE \`${dbName}\``);

  console.log('📦 Creating base tables...');

  /* USERS */
  await safeQuery(connection, `
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(100),
      email VARCHAR(150) UNIQUE,
      password VARCHAR(255),
      role VARCHAR(50),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `, 'users table');

  /* GAMES */
  await safeQuery(connection, `
    CREATE TABLE IF NOT EXISTS games (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255),
      company_name VARCHAR(255),
      category VARCHAR(50) DEFAULT 'quiz',
      game_logo_url VARCHAR(500),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `, 'games table');

  /* QUIZ SETTINGS */
  await safeQuery(connection, `
    CREATE TABLE IF NOT EXISTS quiz_settings (
      id INT AUTO_INCREMENT PRIMARY KEY,
      game_id INT,
      primary_color VARCHAR(20),
      bg_color VARCHAR(20),
      intro_text TEXT,
      outro_text TEXT,
      show_progress TINYINT(1) DEFAULT 1,
      FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE
    )
  `, 'quiz_settings table');

  /* QUESTIONS */
  await safeQuery(connection, `
    CREATE TABLE IF NOT EXISTS questions (
      id INT AUTO_INCREMENT PRIMARY KEY,
      game_id INT NOT NULL,
      question_text TEXT NOT NULL,
      question_image_url VARCHAR(500),
      question_type ENUM('right_wrong','opinion') DEFAULT 'right_wrong',
      question_color VARCHAR(20) DEFAULT '#1a1a2e',
      question_order INT DEFAULT 0,
      num_options INT DEFAULT 4,
      FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE
    )
  `, 'questions table');

  /* OPTIONS */
  await safeQuery(connection, `
    CREATE TABLE IF NOT EXISTS options (
      id INT AUTO_INCREMENT PRIMARY KEY,
      question_id INT NOT NULL,
      option_text VARCHAR(500),
      option_image_url VARCHAR(500),
      is_correct TINYINT(1) DEFAULT 0,
      option_order INT DEFAULT 0,
      FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
    )
  `, 'options table');

  console.log('🚀 Running migrations...');

  /* CLIENTS */
  await safeQuery(connection, `
    CREATE TABLE IF NOT EXISTS clients (
      id INT AUTO_INCREMENT PRIMARY KEY,
      company_name VARCHAR(255) NOT NULL,
      contact_name VARCHAR(255),
      email VARCHAR(150),
      phone VARCHAR(50),
      address TEXT,
      notes TEXT,
      slug VARCHAR(255) UNIQUE,
      logo_url VARCHAR(500),
      created_by INT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `, 'clients table');

  /* CANVAS LAYOUT (draggable graph node positions per client) */
  await safeQuery(connection, `
    CREATE TABLE IF NOT EXISTS canvas_layout (
      client_id INT PRIMARY KEY,
      positions JSON,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
    )
  `, 'canvas_layout table');

  /* SOUNDS */
  await safeQuery(connection, `
    CREATE TABLE IF NOT EXISTS sounds (
      id INT AUTO_INCREMENT PRIMARY KEY,
      game_id INT NOT NULL,
      name VARCHAR(255) NOT NULL,
      sound_type VARCHAR(50),
      file_url VARCHAR(500) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE
    )
  `, 'sounds table');

  /* FORM FIELDS */
  await safeQuery(connection, `
    CREATE TABLE IF NOT EXISTS form_fields (
      id INT AUTO_INCREMENT PRIMARY KEY,
      game_id INT NOT NULL,
      field_label VARCHAR(255),
      field_type VARCHAR(50) DEFAULT 'text',
      field_options JSON,
      is_required TINYINT(1) DEFAULT 0,
      field_order INT DEFAULT 0,
      FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE
    )
  `, 'form_fields table');

  /* EMAIL TEMPLATES */
  await safeQuery(connection, `
    CREATE TABLE IF NOT EXISTS email_templates (
      id INT AUTO_INCREMENT PRIMARY KEY,
      game_id INT UNIQUE,
      sender_name VARCHAR(255),
      sender_email VARCHAR(255),
      subject VARCHAR(500),
      header_color VARCHAR(20) DEFAULT '#6366f1',
      header_text VARCHAR(500),
      body_html TEXT,
      footer_text TEXT,
      is_enabled TINYINT(1) DEFAULT 1,
      FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE
    )
  `, 'email_templates table');

  /* PLAYER SESSIONS */
  await safeQuery(connection, `
    CREATE TABLE IF NOT EXISTS player_sessions (
      id INT AUTO_INCREMENT PRIMARY KEY,
      game_id INT NOT NULL,
      session_token VARCHAR(255) UNIQUE,
      player_data JSON,
      score INT DEFAULT 0,
      total_scoreable INT DEFAULT 0,
      completed TINYINT(1) DEFAULT 0,
      email_sent TINYINT(1) DEFAULT 0,
      source_type VARCHAR(20) DEFAULT 'direct',
      completed_at TIMESTAMP NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE
    )
  `, 'player_sessions table');

  /* PLAYER ANSWERS */
  await safeQuery(connection, `
    CREATE TABLE IF NOT EXISTS player_answers (
      id INT AUTO_INCREMENT PRIMARY KEY,
      session_id INT NOT NULL,
      question_id INT DEFAULT NULL,
      crossword_word_id INT DEFAULT NULL,
      option_id INT DEFAULT NULL,
      answer_text VARCHAR(500),
      is_correct TINYINT(1) DEFAULT 0,
      question_type VARCHAR(50),
      answered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (session_id) REFERENCES player_sessions(id) ON DELETE CASCADE
    )
  `, 'player_answers table');

  /* ── NEW: CROSSWORD TABLES ── */
  console.log('🔤 Creating crossword tables...');

  await safeQuery(connection, `
    CREATE TABLE IF NOT EXISTS crossword_words (
      id INT AUTO_INCREMENT PRIMARY KEY,
      game_id INT NOT NULL,
      word_text VARCHAR(255) NOT NULL,
      clue_text TEXT,
      start_row INT DEFAULT 0,
      start_col INT DEFAULT 0,
      direction ENUM('across','down') DEFAULT 'across',
      word_order INT DEFAULT 0,
      word_color VARCHAR(20) DEFAULT '#7c6ff7',
      overlay_image_url VARCHAR(500),
      sound_correct_id INT DEFAULT NULL,
      sound_wrong_id INT DEFAULT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE
    )
  `, 'crossword_words table');

  await safeQuery(connection, `
    CREATE TABLE IF NOT EXISTS crossword_settings (
      id INT AUTO_INCREMENT PRIMARY KEY,
      game_id INT UNIQUE,
      grid_rows INT DEFAULT 10,
      grid_cols INT DEFAULT 10,
      cell_size INT DEFAULT 40,
      show_timer TINYINT(1) DEFAULT 1,
      time_limit_seconds INT DEFAULT 0,
      allow_hints TINYINT(1) DEFAULT 1,
      heading_1 VARCHAR(500),
      heading_2 VARCHAR(500),
      heading_3 VARCHAR(500),
      description_text TEXT,
      bg_color VARCHAR(20) DEFAULT '#f8f8ff',
      primary_color VARCHAR(20) DEFAULT '#7c6ff7',
      bg_image_url VARCHAR(500),
      thankyou_bg_image_url VARCHAR(500),
      game_logo_url VARCHAR(500),
      font_family VARCHAR(100) DEFAULT 'DM Sans',
      sound_correct_id INT DEFAULT NULL,
      sound_wrong_id INT DEFAULT NULL, 
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE
    )
  `, 'crossword_settings table');

  /* ── MEMORY MATCH TABLES ── */
  console.log('🧩 Creating memory match tables...');

  await safeQuery(connection, `
    CREATE TABLE IF NOT EXISTS memory_settings (
      id INT AUTO_INCREMENT PRIMARY KEY,
      game_id INT UNIQUE,
      card_shape VARCHAR(50) DEFAULT 'rounded',
      card_radius INT DEFAULT 8,
      grid_cols INT DEFAULT 4,
      grid_rows INT DEFAULT 4,
      show_timer TINYINT(1) DEFAULT 1,
      time_limit_seconds INT DEFAULT 0,
      timer_position VARCHAR(20) DEFAULT 'top_center',
      heading_1 VARCHAR(500),
      heading_2 VARCHAR(500),
      heading_3 VARCHAR(500),
      heading_1_color VARCHAR(20) DEFAULT '#1a1a2e',
      heading_2_color VARCHAR(20) DEFAULT '#666666',
      heading_3_color VARCHAR(20) DEFAULT '#777777',
      description_text TEXT,
      description_color VARCHAR(20) DEFAULT '#888888',
      intro_text TEXT,
      outro_text TEXT,
      bg_color VARCHAR(20) DEFAULT '#f8f8ff',
      primary_color VARCHAR(20) DEFAULT '#7c6ff7',
      bg_image_url VARCHAR(500),
      thankyou_bg_image_url VARCHAR(500),
      game_logo_url VARCHAR(500),
      card_cover_image_url VARCHAR(500),
      overlay_image_url VARCHAR(500),
      overlay_animation_in VARCHAR(50) DEFAULT 'flyFromBottom',
      overlay_animation_out VARCHAR(50) DEFAULT 'flyToTop',
      overlay_idle_time INT DEFAULT 3,
      overlay_duration INT DEFAULT 3,
      submit_confirm_gif_url VARCHAR(500),
      gif_url VARCHAR(500),
      thankyou_subtitle VARCHAR(500),
      font_family VARCHAR(100) DEFAULT 'DM Sans',
      sound_flip_id INT DEFAULT NULL,
      sound_match_id INT DEFAULT NULL,
      sound_nomatch_id INT DEFAULT NULL,
      submit_button_text VARCHAR(500),
      start_button_text VARCHAR(500),
      start_button_text_color VARCHAR(20) DEFAULT '#ffffff',
      start_button_bg_color VARCHAR(20),
      continue_button_text VARCHAR(100) DEFAULT 'Continue Now →',
      continue_button_text_color VARCHAR(20) DEFAULT '#ffffff',
      continue_button_bg_color VARCHAR(20),
      next_button_text VARCHAR(100) DEFAULT 'Next',
      next_button_text_color VARCHAR(20) DEFAULT '#ffffff',
      next_button_bg_color VARCHAR(20),
      terms_enabled TINYINT(1) DEFAULT 0,
      terms_text TEXT,
      terms_url VARCHAR(500),
      meta_description TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE
    )
  `, 'memory_settings table');

  await safeQuery(connection, `
    CREATE TABLE IF NOT EXISTS memory_tiles (
      id INT AUTO_INCREMENT PRIMARY KEY,
      game_id INT NOT NULL,
      image_url VARCHAR(500) NOT NULL,
      tile_label VARCHAR(255),
      pair_id INT DEFAULT NULL,
      tile_order INT DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE
    )
  `, 'memory_tiles table');

  /* ── MATH TABLES ── */
  console.log('🔢 Creating math tables...');

  await safeQuery(connection, `
    CREATE TABLE IF NOT EXISTS math_settings (
      id INT AUTO_INCREMENT PRIMARY KEY,
      game_id INT UNIQUE,
      total_levels INT DEFAULT 100,
      questions_per_level INT DEFAULT 5,
      operations VARCHAR(100) DEFAULT '+,-,×',
      number_range_start INT DEFAULT 1,
      number_range_end INT DEFAULT 100,
      allow_negative TINYINT(1) DEFAULT 0,
      show_timer TINYINT(1) DEFAULT 1,
      time_per_question INT DEFAULT 0,
      pass_threshold INT DEFAULT 5,
      heading_1 VARCHAR(500),
      heading_2 VARCHAR(500),
      heading_3 VARCHAR(500),
      heading_1_color VARCHAR(20) DEFAULT '#1a1a2e',
      heading_2_color VARCHAR(20) DEFAULT '#666666',
      heading_3_color VARCHAR(20) DEFAULT '#777777',
      description_text TEXT,
      description_color VARCHAR(20) DEFAULT '#888888',
      intro_text TEXT,
      outro_text TEXT,
      bg_color VARCHAR(20) DEFAULT '#f0fdf4',
      primary_color VARCHAR(20) DEFAULT '#22c55e',
      font_family VARCHAR(100) DEFAULT 'DM Sans',
      sound_correct_id INT DEFAULT NULL,
      sound_wrong_id INT DEFAULT NULL,
      overlay_animation_in VARCHAR(50) DEFAULT 'flyFromBottom',
      overlay_animation_out VARCHAR(50) DEFAULT 'flyToTop',
      submit_button_text VARCHAR(500),
      start_button_text VARCHAR(500),
      continue_button_text VARCHAR(100) DEFAULT 'Continue →',
      terms_enabled TINYINT(1) DEFAULT 0,
      terms_text TEXT,
      terms_url VARCHAR(500),
      meta_description TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE
    )
  `, 'math_settings table');

  await safeQuery(connection, `
    CREATE TABLE IF NOT EXISTS math_progress (
      id INT AUTO_INCREMENT PRIMARY KEY,
      game_id INT NOT NULL,
      session_token VARCHAR(255) NOT NULL,
      current_level INT DEFAULT 1,
      current_question INT DEFAULT 0,
      total_correct INT DEFAULT 0,
      completed_levels JSON,
      last_played_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE,
      UNIQUE KEY unique_game_session (game_id, session_token)
    )
  `, 'math_progress table');

  /* ── MAZE TABLES ── */
  console.log('🗺️ Creating maze tables...');

  await safeQuery(connection, `
    CREATE TABLE IF NOT EXISTS maze_settings (
      id INT AUTO_INCREMENT PRIMARY KEY,
      game_id INT UNIQUE,
      total_levels INT DEFAULT 50,
      grid_size_min INT DEFAULT 5,
      grid_size_max INT DEFAULT 20,
      show_timer TINYINT(1) DEFAULT 1,
      time_limit_seconds INT DEFAULT 0,
      collectible_count INT DEFAULT 3,
      collectible_label VARCHAR(100) DEFAULT '★',
      collectible_images JSON,
      heading_1 VARCHAR(500),
      heading_2 VARCHAR(500),
      heading_3 VARCHAR(500),
      heading_1_color VARCHAR(20) DEFAULT '#1a1a2e',
      heading_2_color VARCHAR(20) DEFAULT '#666666',
      heading_3_color VARCHAR(20) DEFAULT '#777777',
      description_text TEXT,
      description_color VARCHAR(20) DEFAULT '#888888',
      intro_text TEXT,
      outro_text TEXT,
      bg_color VARCHAR(20) DEFAULT '#0f172a',
      primary_color VARCHAR(20) DEFAULT '#6366f1',
      wall_color VARCHAR(20) DEFAULT '#1e293b',
      path_color VARCHAR(20) DEFAULT '#ffffff',
      font_family VARCHAR(100) DEFAULT 'DM Sans',
      sound_collect_id INT DEFAULT NULL,
      sound_complete_id INT DEFAULT NULL,
      overlay_animation_in VARCHAR(50) DEFAULT 'flyFromBottom',
      overlay_animation_out VARCHAR(50) DEFAULT 'flyToTop',
      submit_button_text VARCHAR(500),
      start_button_text VARCHAR(500),
      continue_button_text VARCHAR(100) DEFAULT 'Continue →',
      terms_enabled TINYINT(1) DEFAULT 0,
      terms_text TEXT,
      terms_url VARCHAR(500),
      meta_description TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE
    )
  `, 'maze_settings table');

  await safeQuery(connection, `
    CREATE TABLE IF NOT EXISTS maze_progress (
      id INT AUTO_INCREMENT PRIMARY KEY,
      game_id INT NOT NULL,
      session_token VARCHAR(255) NOT NULL,
      current_level INT DEFAULT 1,
      completed_levels JSON,
      total_collectibles INT DEFAULT 0,
      best_time INT DEFAULT NULL,
      last_played_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE,
      UNIQUE KEY unique_game_session (game_id, session_token)
    )
  `, 'maze_progress table');

  /* ── STICKMAZE TABLES ── */
  console.log('🕹️ Creating stickmaze tables...');

  await safeQuery(connection, `
    CREATE TABLE IF NOT EXISTS stickmaze_settings (
      id INT AUTO_INCREMENT PRIMARY KEY,
      game_id INT UNIQUE,
      total_levels INT DEFAULT 50,
      grid_size_min INT DEFAULT 5,
      grid_size_max INT DEFAULT 20,
      show_timer TINYINT(1) DEFAULT 1,
      time_limit_seconds INT DEFAULT 0,
      collectible_count INT DEFAULT 3,
      collectible_label VARCHAR(100) DEFAULT '★',
      collectible_images JSON,
      heading_1 VARCHAR(500),
      heading_2 VARCHAR(500),
      heading_3 VARCHAR(500),
      heading_1_color VARCHAR(20) DEFAULT '#1a1a2e',
      heading_2_color VARCHAR(20) DEFAULT '#666666',
      heading_3_color VARCHAR(20) DEFAULT '#777777',
      description_text TEXT,
      description_color VARCHAR(20) DEFAULT '#888888',
      intro_text TEXT,
      outro_text TEXT,
      bg_color VARCHAR(20) DEFAULT '#0f172a',
      primary_color VARCHAR(20) DEFAULT '#6366f1',
      wall_color VARCHAR(20) DEFAULT '#64748b',
      path_color VARCHAR(20) DEFAULT '#ffffff',
      font_family VARCHAR(100) DEFAULT 'DM Sans',
      sound_collect_id INT DEFAULT NULL,
      sound_complete_id INT DEFAULT NULL,
      overlay_animation_in VARCHAR(50) DEFAULT 'flyFromBottom',
      overlay_animation_out VARCHAR(50) DEFAULT 'flyToTop',
      submit_button_text VARCHAR(500),
      start_button_text VARCHAR(500),
      continue_button_text VARCHAR(100) DEFAULT 'Continue →',
      terms_enabled TINYINT(1) DEFAULT 0,
      terms_text TEXT,
      terms_url VARCHAR(500),
      meta_description TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE
    )
  `, 'stickmaze_settings table');

  await safeQuery(connection, `
    CREATE TABLE IF NOT EXISTS stickmaze_progress (
      id INT AUTO_INCREMENT PRIMARY KEY,
      game_id INT NOT NULL,
      session_token VARCHAR(255) NOT NULL,
      current_level INT DEFAULT 1,
      completed_levels JSON,
      total_collectibles INT DEFAULT 0,
      best_time INT DEFAULT NULL,
      last_played_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE,
      UNIQUE KEY unique_game_session (game_id, session_token)
    )
  `, 'stickmaze_progress table');

   /* ── MEMORY SETTINGS COLUMN MIGRATIONS (ensure ALL columns exist) ── */
  const memCols = [
    ['grid_rows', 'INT DEFAULT 4'],
    ['heading_1_color', "VARCHAR(20) DEFAULT '#1a1a2e'"],
    ['heading_2_color', "VARCHAR(20) DEFAULT '#666666'"],
    ['heading_3_color', "VARCHAR(20) DEFAULT '#777777'"],
    ['description_color', "VARCHAR(20) DEFAULT '#888888'"],
    ['start_button_text_color', "VARCHAR(20) DEFAULT '#ffffff'"],
    ['start_button_bg_color', 'VARCHAR(20)'],
    ['submit_button_text_color', "VARCHAR(20) DEFAULT '#ffffff'"],
    ['submit_button_bg_color', 'VARCHAR(20)'],
    ['submit_confirm_gif_url', 'VARCHAR(500)'],
    ['continue_button_text', "VARCHAR(100) DEFAULT 'Continue Now →'"],
    ['continue_button_text_color', "VARCHAR(20) DEFAULT '#ffffff'"],
    ['continue_button_bg_color', 'VARCHAR(20)'],
    ['next_button_text', "VARCHAR(100) DEFAULT 'Next'"],
    ['next_button_text_color', "VARCHAR(20) DEFAULT '#ffffff'"],
    ['next_button_bg_color', 'VARCHAR(20)'],
    ['heading_3', 'VARCHAR(500)'],
    ['overlay_duration', 'INT DEFAULT 3'],
    ['intro_text', 'TEXT'],
    ['outro_text', 'TEXT'],
    ['submit_button_text', 'VARCHAR(500)'],
    ['start_button_text', 'VARCHAR(500)'],
    ['meta_description', 'TEXT'],
    ['terms_enabled', 'TINYINT(1) DEFAULT 0'],
    ['terms_text', 'TEXT'],
    ['terms_url', 'VARCHAR(500)'],
    ['redirect_url', 'VARCHAR(500)'],
    ['redirect_delay', 'INT DEFAULT 3'],
    ['redirect_open_new_tab', 'TINYINT(1) DEFAULT 0'],
  ];
  for (const [col, def] of memCols) {
    await addColumn(connection, 'memory_settings', col, def);
  }

  /* ── JIGSAW PUZZLE TABLES ── */
  console.log('🧩 Creating jigsaw puzzle tables...');

  await safeQuery(connection, `
    CREATE TABLE IF NOT EXISTS jigsaw_settings (
      id INT AUTO_INCREMENT PRIMARY KEY,
      game_id INT UNIQUE,
      grid_cols INT DEFAULT 4,
      grid_rows INT DEFAULT 4,
      show_timer TINYINT(1) DEFAULT 1,
      time_limit_seconds INT DEFAULT 0,
      heading_1 VARCHAR(500),
      heading_2 VARCHAR(500),
      heading_3 VARCHAR(500),
      description_text TEXT,
      heading_1_color VARCHAR(20) DEFAULT '#1a1a2e',
      heading_2_color VARCHAR(20) DEFAULT '#666666',
      heading_3_color VARCHAR(20) DEFAULT '#777777',
      description_color VARCHAR(20) DEFAULT '#888888',
      bg_color VARCHAR(20) DEFAULT '#f8f8ff',
      primary_color VARCHAR(20) DEFAULT '#6366f1',
      bg_image_url VARCHAR(500),
      thankyou_bg_image_url VARCHAR(500),
      game_logo_url VARCHAR(500),
      puzzle_image_url VARCHAR(500),
      submit_confirm_gif_url VARCHAR(500),
      font_family VARCHAR(100) DEFAULT 'DM Sans',
      sound_correct_id INT DEFAULT NULL,
      sound_wrong_id INT DEFAULT NULL,
      intro_text TEXT,
      outro_text TEXT,
      submit_button_text VARCHAR(500),
      continue_button_text VARCHAR(100) DEFAULT 'Continue Now →',
      start_button_text VARCHAR(500),
      terms_enabled TINYINT(1) DEFAULT 0,
      terms_text TEXT,
      terms_url VARCHAR(500),
      meta_description TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE
    )
  `, 'jigsaw_settings table');

  /* ── JIGSAW SETTINGS — missing column allow_difficulty_selection ── */
  await addColumn(connection, 'jigsaw_settings', 'allow_difficulty_selection', 'TINYINT(1) DEFAULT 0');
  await addColumn(connection, 'jigsaw_settings', 'start_button_text_color', "VARCHAR(20) DEFAULT '#ffffff'");
  await addColumn(connection, 'jigsaw_settings', 'start_button_bg_color', 'VARCHAR(20)');
  await addColumn(connection, 'jigsaw_settings', 'submit_button_text_color', "VARCHAR(20) DEFAULT '#ffffff'");
  await addColumn(connection, 'jigsaw_settings', 'submit_button_bg_color', 'VARCHAR(20)');
  await addColumn(connection, 'jigsaw_settings', 'outro_text_color', "VARCHAR(20) DEFAULT '#1a1a2e'");
  await addColumn(connection, 'jigsaw_settings', 'continue_button_text_color', "VARCHAR(20) DEFAULT '#ffffff'");
  await addColumn(connection, 'jigsaw_settings', 'continue_button_bg_color', 'VARCHAR(20)');
  await addColumn(connection, 'jigsaw_settings', 'thankyou_heading_text', 'VARCHAR(500)');
  await addColumn(connection, 'jigsaw_settings', 'thankyou_heading_color', "VARCHAR(20) DEFAULT '#1a1a2e'");
  await addColumn(connection, 'jigsaw_settings', 'thankyou_subtitle_text', 'VARCHAR(500)');
  await addColumn(connection, 'jigsaw_settings', 'thankyou_subtitle_color', "VARCHAR(20) DEFAULT '#444444'");
  await addColumn(connection, 'jigsaw_settings', 'submit_btn_text', 'VARCHAR(500)');
  await addColumn(connection, 'jigsaw_settings', 'submit_btn_text_color', "VARCHAR(20) DEFAULT '#ffffff'");
  await addColumn(connection, 'jigsaw_settings', 'submit_btn_bg_color', 'VARCHAR(20)');
  await addColumn(connection, 'jigsaw_settings', 'continue_now_btn_text', "VARCHAR(100) DEFAULT 'Continue Now →'");
  await addColumn(connection, 'jigsaw_settings', 'continue_now_btn_text_color', "VARCHAR(20) DEFAULT '#ffffff'");
  await addColumn(connection, 'jigsaw_settings', 'continue_now_btn_bg_color', 'VARCHAR(20)');
  await addColumn(connection, 'jigsaw_settings', 'description_color', "VARCHAR(20) DEFAULT '#888888'");
  await addColumn(connection, 'jigsaw_settings', 'submit_confirm_gif_url', 'VARCHAR(500)');

  /* ── WORD SEARCH TABLES ── */
  console.log('🔍 Creating word search tables...');

  await safeQuery(connection, `
    CREATE TABLE IF NOT EXISTS wordsearch_settings (
      id INT AUTO_INCREMENT PRIMARY KEY,
      game_id INT UNIQUE,
      grid_rows INT DEFAULT 12,
      grid_cols INT DEFAULT 12,
      show_timer TINYINT(1) DEFAULT 1,
      time_limit_seconds INT DEFAULT 0,
      allow_hints TINYINT(1) DEFAULT 1,
      heading_1 VARCHAR(500),
      heading_2 VARCHAR(500),
      heading_3 VARCHAR(500),
      description_text TEXT,
      heading_1_color VARCHAR(20) DEFAULT '#1a1a2e',
      heading_2_color VARCHAR(20) DEFAULT '#666666',
      heading_3_color VARCHAR(20) DEFAULT '#777777',
      description_color VARCHAR(20) DEFAULT '#888888',
      bg_color VARCHAR(20) DEFAULT '#f8f8ff',
      primary_color VARCHAR(20) DEFAULT '#6366f1',
      bg_image_url VARCHAR(500),
      thankyou_bg_image_url VARCHAR(500),
      game_logo_url VARCHAR(500),
      submit_confirm_gif_url VARCHAR(500),
      font_family VARCHAR(100) DEFAULT 'DM Sans',
      sound_correct_id INT DEFAULT NULL,
      sound_wrong_id INT DEFAULT NULL,
      intro_text TEXT,
      outro_text TEXT,
      submit_button_text VARCHAR(500),
      continue_button_text VARCHAR(100) DEFAULT 'Continue Now →',
      start_button_text VARCHAR(500),
      terms_enabled TINYINT(1) DEFAULT 0,
      terms_text TEXT,
      terms_url VARCHAR(500),
      meta_description TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE
    )
  `, 'wordsearch_settings table');

  await safeQuery(connection, `
    CREATE TABLE IF NOT EXISTS wordsearch_words (
      id INT AUTO_INCREMENT PRIMARY KEY,
      game_id INT NOT NULL,
      word_text VARCHAR(255) NOT NULL,
      clue_text TEXT,
      word_order INT DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE
    )
  `, 'wordsearch_words table');

  /* ── POURING WATER TABLES ── */
  console.log('💧 Creating pouring water tables...');

  await safeQuery(connection, `
    CREATE TABLE IF NOT EXISTS pouring_settings (
      id INT AUTO_INCREMENT PRIMARY KEY,
      game_id INT UNIQUE,
      target_ml INT DEFAULT 50,
      tolerance_ml INT DEFAULT 5,
      max_ml INT DEFAULT 200,
      pour_speed DECIMAL(3,2) DEFAULT 1.00,
      viscosity DECIMAL(3,2) DEFAULT 1.00,
      water_color VARCHAR(20) DEFAULT '#4da6ff',
      show_timer TINYINT(1) DEFAULT 1,
      time_limit_seconds INT DEFAULT 0,
      allow_retries TINYINT(1) DEFAULT 1,
      max_retries INT DEFAULT 3,
      heading_1 VARCHAR(500),
      heading_2 VARCHAR(500),
      heading_3 VARCHAR(500),
      description_text TEXT,
      heading_1_color VARCHAR(20) DEFAULT '#1a1a2e',
      heading_2_color VARCHAR(20) DEFAULT '#666666',
      heading_3_color VARCHAR(20) DEFAULT '#777777',
      description_color VARCHAR(20) DEFAULT '#888888',
      bg_color VARCHAR(20) DEFAULT '#f0f4ff',
      primary_color VARCHAR(20) DEFAULT '#6366f1',
      bg_image_url VARCHAR(500),
      thankyou_bg_image_url VARCHAR(500),
      game_logo_url VARCHAR(500),
      submit_confirm_gif_url VARCHAR(500),
      font_family VARCHAR(100) DEFAULT 'DM Sans',
      sound_correct_id INT DEFAULT NULL,
      sound_wrong_id INT DEFAULT NULL,
      sound_pour_id INT DEFAULT NULL,
      intro_text TEXT,
      outro_text TEXT,
      submit_button_text VARCHAR(500),
      continue_button_text VARCHAR(100) DEFAULT 'Continue Now →',
      start_button_text VARCHAR(500),
      terms_enabled TINYINT(1) DEFAULT 0,
      terms_text TEXT,
      terms_url VARCHAR(500),
      meta_description TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE
    )
  `, 'pouring_settings table');

  /* ── SPEED TYPER TABLES ── */
  console.log('⌨️ Creating speed typer tables...');

  await safeQuery(connection, `
    CREATE TABLE IF NOT EXISTS typer_settings (
      id INT AUTO_INCREMENT PRIMARY KEY,
      game_id INT UNIQUE,
      fall_speed INT DEFAULT 2,
      max_simultaneous INT DEFAULT 3,
      difficulty_mode VARCHAR(20) DEFAULT 'progressive',
      time_limit_seconds INT DEFAULT 60,
      max_misses INT DEFAULT 5,
      target_words INT DEFAULT 0,
      word_category VARCHAR(50) DEFAULT 'mixed',
      show_timer TINYINT(1) DEFAULT 1,
      heading_1 VARCHAR(500),
      heading_2 VARCHAR(500),
      heading_3 VARCHAR(500),
      description_text TEXT,
      heading_1_color VARCHAR(20) DEFAULT '#1a1a2e',
      heading_2_color VARCHAR(20) DEFAULT '#666666',
      heading_3_color VARCHAR(20) DEFAULT '#777777',
      description_color VARCHAR(20) DEFAULT '#888888',
      bg_color VARCHAR(20) DEFAULT '#0f172a',
      primary_color VARCHAR(20) DEFAULT '#6366f1',
      bg_image_url VARCHAR(500),
      thankyou_bg_image_url VARCHAR(500),
      game_logo_url VARCHAR(500),
      submit_confirm_gif_url VARCHAR(500),
      font_family VARCHAR(100) DEFAULT 'DM Sans',
      sound_correct_id INT DEFAULT NULL,
      sound_wrong_id INT DEFAULT NULL,
      sound_combo_id INT DEFAULT NULL,
      sound_gameover_id INT DEFAULT NULL,
      intro_text TEXT,
      outro_text TEXT,
      submit_button_text VARCHAR(500),
      continue_button_text VARCHAR(100) DEFAULT 'Continue Now →',
      start_button_text VARCHAR(500),
      terms_enabled TINYINT(1) DEFAULT 0,
      terms_text TEXT,
      terms_url VARCHAR(500),
      meta_description TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE
    )
  `, 'typer_settings table');

  await safeQuery(connection, `
    CREATE TABLE IF NOT EXISTS typer_words (
      id INT AUTO_INCREMENT PRIMARY KEY,
      game_id INT NOT NULL,
      word_text VARCHAR(255) NOT NULL,
      difficulty VARCHAR(20) DEFAULT 'medium',
      word_order INT DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE
    )
  `, 'typer_words table');

  /* ── SCREW & REVEAL TABLES ── */
  console.log('🔩 Creating screw & reveal tables...');

  await safeQuery(connection, `
    CREATE TABLE IF NOT EXISTS screw_settings (
      id INT AUTO_INCREMENT PRIMARY KEY,
      game_id INT UNIQUE,
      board_rows INT DEFAULT 6,
      board_cols INT DEFAULT 6,
      block_colors VARCHAR(500) DEFAULT '#c0392b,#2980b9,#27ae60,#f39c12,#8e44ad',
      screws_per_block INT DEFAULT 2,
      empty_holes INT DEFAULT 3,
      difficulty VARCHAR(20) DEFAULT 'medium',
      show_timer TINYINT(1) DEFAULT 1,
      time_limit_seconds INT DEFAULT 120,
      heading_1 VARCHAR(500),
      heading_2 VARCHAR(500),
      heading_3 VARCHAR(500),
      description_text TEXT,
      heading_1_color VARCHAR(20) DEFAULT '#1a1a2e',
      heading_2_color VARCHAR(20) DEFAULT '#666666',
      heading_3_color VARCHAR(20) DEFAULT '#777777',
      description_color VARCHAR(20) DEFAULT '#888888',
      bg_color VARCHAR(20) DEFAULT '#f0e6d3',
      primary_color VARCHAR(20) DEFAULT '#8B4513',
      bg_image_url VARCHAR(500),
      thankyou_bg_image_url VARCHAR(500),
      game_logo_url VARCHAR(500),
      reveal_image_url VARCHAR(500),
      submit_confirm_gif_url VARCHAR(500),
      font_family VARCHAR(100) DEFAULT 'DM Sans',
      sound_screw_id INT DEFAULT NULL,
      sound_fall_id INT DEFAULT NULL,
      sound_reveal_id INT DEFAULT NULL,
      intro_text TEXT,
      outro_text TEXT,
      submit_button_text VARCHAR(500),
      continue_button_text VARCHAR(100) DEFAULT 'Continue Now →',
      start_button_text VARCHAR(500),
      reveal_text VARCHAR(500),
      terms_enabled TINYINT(1) DEFAULT 0,
      terms_text TEXT,
      terms_url VARCHAR(500),
      meta_description TEXT,
      start_button_text_color VARCHAR(20) DEFAULT NULL,
      start_button_bg_color VARCHAR(20) DEFAULT NULL,
      submit_button_text_color VARCHAR(20) DEFAULT NULL,
      submit_button_bg_color VARCHAR(20) DEFAULT NULL,
      continue_button_text_color VARCHAR(20) DEFAULT NULL,
      continue_button_bg_color VARCHAR(20) DEFAULT NULL,
      thankyou_subtitle VARCHAR(500) DEFAULT NULL,
      thankyou_subtitle_color VARCHAR(20) DEFAULT NULL,
      outro_text_color VARCHAR(20) DEFAULT NULL,
      intro_text_color VARCHAR(20) DEFAULT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE
    )
  `, 'screw_settings table');

  /* TOWER SETTINGS */
  await safeQuery(connection, `
    CREATE TABLE IF NOT EXISTS tower_settings (
      id INT AUTO_INCREMENT PRIMARY KEY,
      game_id INT UNIQUE,
      target_score INT DEFAULT 1000,
      heading_1 VARCHAR(500),
      heading_2 VARCHAR(500),
      heading_1_color VARCHAR(20) DEFAULT '#1a1a2e',
      heading_2_color VARCHAR(20) DEFAULT '#666666',
      bg_color VARCHAR(20) DEFAULT '#f95240',
      primary_color VARCHAR(20) DEFAULT '#ff735c',
      bg_image_url VARCHAR(500),
      thankyou_bg_image_url VARCHAR(500),
      game_logo_url VARCHAR(500),
      font_family VARCHAR(100) DEFAULT 'DM Sans',
      start_button_text VARCHAR(500),
      meta_description TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE
    )
  `, 'tower_settings table');

  /* ── SNAKE TABLES ── */
  console.log('🐍 Creating snake tables...');
  await safeQuery(connection, `
    CREATE TABLE IF NOT EXISTS snake_settings (
      id INT AUTO_INCREMENT PRIMARY KEY, game_id INT UNIQUE,
      board_width INT DEFAULT 20, board_height INT DEFAULT 20, speed INT DEFAULT 5,
      snake_color VARCHAR(20) DEFAULT '#22c55e', food_color VARCHAR(20) DEFAULT '#ef4444',
      wall_mode VARCHAR(20) DEFAULT 'wall', show_timer TINYINT(1) DEFAULT 1, time_limit_seconds INT DEFAULT 0,
      heading_1 VARCHAR(500), heading_2 VARCHAR(500), heading_3 VARCHAR(500), description_text TEXT,
      heading_1_color VARCHAR(20) DEFAULT '#1a1a2e', heading_2_color VARCHAR(20) DEFAULT '#666666',
      heading_3_color VARCHAR(20) DEFAULT '#777777', description_color VARCHAR(20) DEFAULT '#888888',
      bg_color VARCHAR(20) DEFAULT '#0f172a', primary_color VARCHAR(20) DEFAULT '#22c55e',
      bg_image_url VARCHAR(500), thankyou_bg_image_url VARCHAR(500), game_logo_url VARCHAR(500),
      submit_confirm_gif_url VARCHAR(500), font_family VARCHAR(100) DEFAULT 'DM Sans',
      sound_eat_id INT DEFAULT NULL, sound_gameover_id INT DEFAULT NULL,
      intro_text TEXT, outro_text TEXT, submit_button_text VARCHAR(500),
      continue_button_text VARCHAR(100) DEFAULT 'Continue Now →', start_button_text VARCHAR(500),
      reveal_text VARCHAR(500), terms_enabled TINYINT(1) DEFAULT 0, terms_text TEXT,
      terms_url VARCHAR(500), meta_description TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE
    )
  `, 'snake_settings table');

  /* ── NAGARAJA TABLE ── */
  console.log('🐍 Creating nagaraja tables...');
  await safeQuery(connection, `
    CREATE TABLE IF NOT EXISTS nagaraja_settings (
      id INT AUTO_INCREMENT PRIMARY KEY, game_id INT UNIQUE,
      world_width INT DEFAULT 1600, world_height INT DEFAULT 1200, speed INT DEFAULT 5,
      snake_color VARCHAR(20) DEFAULT '#22c55e',
      ai_snake_count INT DEFAULT 6, ai_speed INT DEFAULT 3, gift_count INT DEFAULT 40,
      gifts_json MEDIUMTEXT,
      boost_enabled TINYINT(1) DEFAULT 1, show_timer TINYINT(1) DEFAULT 0, time_limit_seconds INT DEFAULT 0,
      heading_1 VARCHAR(500), heading_2 VARCHAR(500), heading_3 VARCHAR(500), description_text TEXT,
      heading_1_color VARCHAR(20) DEFAULT '#1a1a2e', heading_2_color VARCHAR(20) DEFAULT '#666666',
      heading_3_color VARCHAR(20) DEFAULT '#777777', description_color VARCHAR(20) DEFAULT '#888888',
      bg_color VARCHAR(20) DEFAULT '#0d0a1a', primary_color VARCHAR(20) DEFAULT '#8b5cf6',
      bg_image_url VARCHAR(500), thankyou_bg_image_url VARCHAR(500), game_logo_url VARCHAR(500),
      submit_confirm_gif_url VARCHAR(500), font_family VARCHAR(100) DEFAULT 'DM Sans',
      sound_eat_id INT DEFAULT NULL, sound_gameover_id INT DEFAULT NULL,
      intro_text TEXT, outro_text TEXT, submit_button_text VARCHAR(500),
      continue_button_text VARCHAR(100) DEFAULT 'Continue Now →', start_button_text VARCHAR(500),
      reveal_text VARCHAR(500), terms_enabled TINYINT(1) DEFAULT 0, terms_text TEXT,
      terms_url VARCHAR(500), meta_description TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE
    )
  `, 'nagaraja_settings table');

  /* ── SNAKE & LADDER TABLE ── */
  console.log('🐍 Creating snake & ladder tables...');
  await safeQuery(connection, `
    CREATE TABLE IF NOT EXISTS snake_ladder_settings (
      id INT AUTO_INCREMENT PRIMARY KEY, game_id INT UNIQUE,
      heading_1 VARCHAR(500), heading_2 VARCHAR(500), heading_3 VARCHAR(500), description_text TEXT,
      heading_1_color VARCHAR(20) DEFAULT '#1a1a2e', heading_2_color VARCHAR(20) DEFAULT '#666666',
      heading_3_color VARCHAR(20) DEFAULT '#777777', description_color VARCHAR(20) DEFAULT '#888888',
      intro_text TEXT, intro_text_color VARCHAR(20) DEFAULT '#444444',
      outro_text TEXT, outro_text_color VARCHAR(20) DEFAULT '#444444',
      thankyou_subtitle VARCHAR(500), thankyou_subtitle_color VARCHAR(20) DEFAULT '#444444',
      bg_color VARCHAR(20) DEFAULT '#0f172a', primary_color VARCHAR(20) DEFAULT '#6366f1',
      bg_image_url VARCHAR(500), thankyou_bg_image_url VARCHAR(500), game_logo_url VARCHAR(500),
      submit_confirm_gif_url VARCHAR(500), font_family VARCHAR(100) DEFAULT 'DM Sans',
      show_timer TINYINT(1) DEFAULT 1, time_limit_seconds INT DEFAULT 0,
      submit_button_text VARCHAR(500), submit_button_text_color VARCHAR(20) DEFAULT '#ffffff',
      submit_button_bg_color VARCHAR(20),
      continue_button_text VARCHAR(100) DEFAULT 'Continue Now →',
      continue_button_text_color VARCHAR(20) DEFAULT '#ffffff', continue_button_bg_color VARCHAR(20),
      start_button_text VARCHAR(500), start_button_text_color VARCHAR(20) DEFAULT '#ffffff',
      start_button_bg_color VARCHAR(20),
      reveal_text VARCHAR(500), terms_enabled TINYINT(1) DEFAULT 0, terms_text TEXT,
      terms_url VARCHAR(500), meta_description TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE
    )
  `, 'snake_ladder_settings table');

  /* ── LUDO TABLE ── */
  console.log('🎲 Creating ludo tables...');
  await safeQuery(connection, `
    CREATE TABLE IF NOT EXISTS ludo_settings (
      id INT AUTO_INCREMENT PRIMARY KEY, game_id INT UNIQUE,
      heading_1 VARCHAR(500), heading_2 VARCHAR(500), heading_3 VARCHAR(500), description_text TEXT,
      heading_1_color VARCHAR(20) DEFAULT '#1a1a2e', heading_2_color VARCHAR(20) DEFAULT '#666666',
      heading_3_color VARCHAR(20) DEFAULT '#777777', description_color VARCHAR(20) DEFAULT '#888888',
      intro_text TEXT, intro_text_color VARCHAR(20) DEFAULT '#444444',
      outro_text TEXT, outro_text_color VARCHAR(20) DEFAULT '#444444',
      thankyou_subtitle VARCHAR(500), thankyou_subtitle_color VARCHAR(20) DEFAULT '#444444',
      bg_color VARCHAR(20) DEFAULT '#0f172a', primary_color VARCHAR(20) DEFAULT '#6366f1',
      bg_image_url VARCHAR(500), thankyou_bg_image_url VARCHAR(500), game_logo_url VARCHAR(500),
      submit_confirm_gif_url VARCHAR(500), font_family VARCHAR(100) DEFAULT 'DM Sans',
      show_timer TINYINT(1) DEFAULT 1, time_limit_seconds INT DEFAULT 0,
      submit_button_text VARCHAR(500), submit_button_text_color VARCHAR(20) DEFAULT '#ffffff',
      submit_button_bg_color VARCHAR(20),
      continue_button_text VARCHAR(100) DEFAULT 'Continue Now →',
      continue_button_text_color VARCHAR(20) DEFAULT '#ffffff', continue_button_bg_color VARCHAR(20),
      start_button_text VARCHAR(500), start_button_text_color VARCHAR(20) DEFAULT '#ffffff',
      start_button_bg_color VARCHAR(20),
      reveal_text VARCHAR(500), terms_enabled TINYINT(1) DEFAULT 0, terms_text TEXT,
      terms_url VARCHAR(500), meta_description TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE
    )
  `, 'ludo_settings table');

  /* ── Carrom TABLE ── */
  console.log('🎱 Creating Carrom tables...');
  await safeQuery(connection, `
    CREATE TABLE IF NOT EXISTS Carrom_settings (
      id INT AUTO_INCREMENT PRIMARY KEY, game_id INT UNIQUE,
      heading_1 VARCHAR(500), heading_2 VARCHAR(500), heading_3 VARCHAR(500), description_text TEXT,
      heading_1_color VARCHAR(20) DEFAULT '#1a1a2e', heading_2_color VARCHAR(20) DEFAULT '#666666',
      heading_3_color VARCHAR(20) DEFAULT '#777777', description_color VARCHAR(20) DEFAULT '#888888',
      intro_text TEXT, intro_text_color VARCHAR(20) DEFAULT '#444444',
      outro_text TEXT, outro_text_color VARCHAR(20) DEFAULT '#444444',
      thankyou_subtitle VARCHAR(500), thankyou_subtitle_color VARCHAR(20) DEFAULT '#444444',
      bg_color VARCHAR(20) DEFAULT '#0f172a', primary_color VARCHAR(20) DEFAULT '#6366f1',
      bg_image_url VARCHAR(500), thankyou_bg_image_url VARCHAR(500), game_logo_url VARCHAR(500),
      submit_confirm_gif_url VARCHAR(500), font_family VARCHAR(100) DEFAULT 'DM Sans',
      show_timer TINYINT(1) DEFAULT 1, time_limit_seconds INT DEFAULT 0,
      submit_button_text VARCHAR(500), submit_button_text_color VARCHAR(20) DEFAULT '#ffffff',
      submit_button_bg_color VARCHAR(20),
      continue_button_text VARCHAR(100) DEFAULT 'Continue Now →',
      continue_button_text_color VARCHAR(20) DEFAULT '#ffffff', continue_button_bg_color VARCHAR(20),
      start_button_text VARCHAR(500), start_button_text_color VARCHAR(20) DEFAULT '#ffffff',
      start_button_bg_color VARCHAR(20),
      reveal_text VARCHAR(500), terms_enabled TINYINT(1) DEFAULT 0, terms_text TEXT,
      terms_url VARCHAR(500), meta_description TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE
    )
  `, 'Carrom_settings table');

  /* ── TIC TAC TOE MULTIPLAYER TABLE ── */
  console.log('🎮 Creating tictactoe multiplayer tables...');
  await safeQuery(connection, `
    CREATE TABLE IF NOT EXISTS tictactoe_multi_settings (
      id INT AUTO_INCREMENT PRIMARY KEY, game_id INT UNIQUE,
      heading_1 VARCHAR(500), heading_2 VARCHAR(500), heading_3 VARCHAR(500), description_text TEXT,
      heading_1_color VARCHAR(20) DEFAULT '#1a1a2e', heading_2_color VARCHAR(20) DEFAULT '#666666',
      heading_3_color VARCHAR(20) DEFAULT '#777777', description_color VARCHAR(20) DEFAULT '#888888',
      intro_text TEXT, intro_text_color VARCHAR(20) DEFAULT '#444444',
      outro_text TEXT, outro_text_color VARCHAR(20) DEFAULT '#444444',
      thankyou_subtitle VARCHAR(500), thankyou_subtitle_color VARCHAR(20) DEFAULT '#444444',
      bg_color VARCHAR(20) DEFAULT '#0f172a', primary_color VARCHAR(20) DEFAULT '#6366f1',
      bg_image_url VARCHAR(500), thankyou_bg_image_url VARCHAR(500), game_logo_url VARCHAR(500),
      submit_confirm_gif_url VARCHAR(500), font_family VARCHAR(100) DEFAULT 'DM Sans',
      show_timer TINYINT(1) DEFAULT 1, time_limit_seconds INT DEFAULT 0,
      submit_button_text VARCHAR(500), submit_button_text_color VARCHAR(20) DEFAULT '#ffffff',
      submit_button_bg_color VARCHAR(20),
      continue_button_text VARCHAR(100) DEFAULT 'Continue Now →',
      continue_button_text_color VARCHAR(20) DEFAULT '#ffffff', continue_button_bg_color VARCHAR(20),
      start_button_text VARCHAR(500), start_button_text_color VARCHAR(20) DEFAULT '#ffffff',
      start_button_bg_color VARCHAR(20),
      reveal_text VARCHAR(500), terms_enabled TINYINT(1) DEFAULT 0, terms_text TEXT,
      terms_url VARCHAR(500), meta_description TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE
    )
  `, 'tictactoe_multi_settings table');

  /* ── CATCH FALLING OBJECTS TABLES ── */
  console.log('🧺 Creating catch tables...');
  await safeQuery(connection, `
    CREATE TABLE IF NOT EXISTS catch_settings (
      id INT AUTO_INCREMENT PRIMARY KEY, game_id INT UNIQUE,
      spawn_rate INT DEFAULT 1000, fall_speed INT DEFAULT 2, max_misses INT DEFAULT 5,
      time_limit_seconds INT DEFAULT 60, item_type VARCHAR(50) DEFAULT 'emoji',
      basket_color VARCHAR(20) DEFAULT '#8B5CF6',
      show_timer TINYINT(1) DEFAULT 1,
      heading_1 VARCHAR(500), heading_2 VARCHAR(500), heading_3 VARCHAR(500), description_text TEXT,
      heading_1_color VARCHAR(20) DEFAULT '#1a1a2e', heading_2_color VARCHAR(20) DEFAULT '#666666',
      heading_3_color VARCHAR(20) DEFAULT '#777777', description_color VARCHAR(20) DEFAULT '#888888',
      bg_color VARCHAR(20) DEFAULT '#f8f8ff', primary_color VARCHAR(20) DEFAULT '#8B5CF6',
      bg_image_url VARCHAR(500), thankyou_bg_image_url VARCHAR(500), game_logo_url VARCHAR(500),
      submit_confirm_gif_url VARCHAR(500), font_family VARCHAR(100) DEFAULT 'DM Sans',
      sound_catch_id INT DEFAULT NULL, sound_miss_id INT DEFAULT NULL, sound_gameover_id INT DEFAULT NULL,
      intro_text TEXT, outro_text TEXT, submit_button_text VARCHAR(500),
      continue_button_text VARCHAR(100) DEFAULT 'Continue Now →', start_button_text VARCHAR(500),
      terms_enabled TINYINT(1) DEFAULT 0, terms_text TEXT,
      terms_url VARCHAR(500), meta_description TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE
    )
  `, 'catch_settings table');

  /* ── REACTION TIME TABLES ── */
  console.log('⚡ Creating reaction tables...');
  await safeQuery(connection, `
    CREATE TABLE IF NOT EXISTS reaction_settings (
      id INT AUTO_INCREMENT PRIMARY KEY, game_id INT UNIQUE,
      rounds INT DEFAULT 5, color_change_delay INT DEFAULT 2000,
      target_color VARCHAR(20) DEFAULT '#22c55e', show_leaderboard TINYINT(1) DEFAULT 1,
      show_timer TINYINT(1) DEFAULT 1,
      heading_1 VARCHAR(500), heading_2 VARCHAR(500), heading_3 VARCHAR(500), description_text TEXT,
      heading_1_color VARCHAR(20) DEFAULT '#1a1a2e', heading_2_color VARCHAR(20) DEFAULT '#666666',
      heading_3_color VARCHAR(20) DEFAULT '#777777', description_color VARCHAR(20) DEFAULT '#888888',
      bg_color VARCHAR(20) DEFAULT '#0f172a', primary_color VARCHAR(20) DEFAULT '#ef4444',
      bg_image_url VARCHAR(500), thankyou_bg_image_url VARCHAR(500), game_logo_url VARCHAR(500),
      submit_confirm_gif_url VARCHAR(500), font_family VARCHAR(100) DEFAULT 'DM Sans',
      sound_correct_id INT DEFAULT NULL, sound_wrong_id INT DEFAULT NULL,
      intro_text TEXT, outro_text TEXT, submit_button_text VARCHAR(500),
      continue_button_text VARCHAR(100) DEFAULT 'Continue Now →', start_button_text VARCHAR(500),
      terms_enabled TINYINT(1) DEFAULT 0, terms_text TEXT,
      terms_url VARCHAR(500), meta_description TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE
    )
  `, 'reaction_settings table');

  /* ── SIMON SAYS TABLES ── */
  console.log('🎯 Creating simon tables...');
  await safeQuery(connection, `
    CREATE TABLE IF NOT EXISTS simon_settings (
      id INT AUTO_INCREMENT PRIMARY KEY, game_id INT UNIQUE,
      num_rounds INT DEFAULT 8, num_colors INT DEFAULT 4, speed VARCHAR(20) DEFAULT 'medium',
      color_1 VARCHAR(20) DEFAULT '#ef4444', color_2 VARCHAR(20) DEFAULT '#3b82f6',
      color_3 VARCHAR(20) DEFAULT '#22c55e', color_4 VARCHAR(20) DEFAULT '#f59e0b',
      color_5 VARCHAR(20) DEFAULT '#8b5cf6', color_6 VARCHAR(20) DEFAULT '#ec4899',
      show_timer TINYINT(1) DEFAULT 0, time_limit_seconds INT DEFAULT 0,
      heading_1 VARCHAR(500), heading_2 VARCHAR(500), heading_3 VARCHAR(500), description_text TEXT,
      heading_1_color VARCHAR(20) DEFAULT '#1a1a2e', heading_2_color VARCHAR(20) DEFAULT '#666666',
      heading_3_color VARCHAR(20) DEFAULT '#777777', description_color VARCHAR(20) DEFAULT '#888888',
      bg_color VARCHAR(20) DEFAULT '#1a1a2e', primary_color VARCHAR(20) DEFAULT '#6366f1',
      bg_image_url VARCHAR(500), thankyou_bg_image_url VARCHAR(500), game_logo_url VARCHAR(500),
      submit_confirm_gif_url VARCHAR(500), font_family VARCHAR(100) DEFAULT 'DM Sans',
      sound_correct_id INT DEFAULT NULL, sound_wrong_id INT DEFAULT NULL, sound_gameover_id INT DEFAULT NULL,
      intro_text TEXT, outro_text TEXT, submit_button_text VARCHAR(500),
      continue_button_text VARCHAR(100) DEFAULT 'Continue Now →', start_button_text VARCHAR(500),
      terms_enabled TINYINT(1) DEFAULT 0, terms_text TEXT,
      terms_url VARCHAR(500), meta_description TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE
    )
  `, 'simon_settings table');

  /* ── CONNECT 4 TABLES ── */
  console.log('🔴 Creating connect 4 tables...');
  await safeQuery(connection, `
    CREATE TABLE IF NOT EXISTS connect4_settings (
      id INT AUTO_INCREMENT PRIMARY KEY, game_id INT UNIQUE,
      board_rows INT DEFAULT 6, board_cols INT DEFAULT 7, win_count INT DEFAULT 4,
      player_color VARCHAR(20) DEFAULT '#ef4444', ai_color VARCHAR(20) DEFAULT '#fbbf24',
      board_color VARCHAR(20) DEFAULT '#3b82f6', difficulty VARCHAR(20) DEFAULT 'medium',
      show_timer TINYINT(1) DEFAULT 1, time_limit_seconds INT DEFAULT 0,
      heading_1 VARCHAR(500), heading_2 VARCHAR(500), heading_3 VARCHAR(500), description_text TEXT,
      heading_1_color VARCHAR(20) DEFAULT '#1a1a2e', heading_2_color VARCHAR(20) DEFAULT '#666666',
      heading_3_color VARCHAR(20) DEFAULT '#777777', description_color VARCHAR(20) DEFAULT '#888888',
      bg_color VARCHAR(20) DEFAULT '#0f172a', primary_color VARCHAR(20) DEFAULT '#3b82f6',
      bg_image_url VARCHAR(500), thankyou_bg_image_url VARCHAR(500), game_logo_url VARCHAR(500),
      submit_confirm_gif_url VARCHAR(500), font_family VARCHAR(100) DEFAULT 'DM Sans',
      sound_drop_id INT DEFAULT NULL, sound_win_id INT DEFAULT NULL, sound_draw_id INT DEFAULT NULL,
      intro_text TEXT, intro_text_color VARCHAR(20) DEFAULT NULL,
      outro_text TEXT, outro_text_color VARCHAR(20) DEFAULT NULL,
      submit_button_text VARCHAR(500), continue_button_text VARCHAR(100) DEFAULT 'Continue →',
      start_button_text VARCHAR(500),
      start_button_text_color VARCHAR(20) DEFAULT NULL, start_button_bg_color VARCHAR(20) DEFAULT NULL,
      submit_button_text_color VARCHAR(20) DEFAULT NULL, submit_button_bg_color VARCHAR(20) DEFAULT NULL,
      continue_button_text_color VARCHAR(20) DEFAULT NULL, continue_button_bg_color VARCHAR(20) DEFAULT NULL,
      thankyou_subtitle VARCHAR(500) DEFAULT NULL, thankyou_subtitle_color VARCHAR(20) DEFAULT NULL,
      terms_enabled TINYINT(1) DEFAULT 0, terms_text TEXT, terms_url VARCHAR(500), meta_description TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE
    )
  `, 'connect4_settings table');

  await safeQuery(connection, `
    CREATE TABLE IF NOT EXISTS candyblast_settings (
      id INT AUTO_INCREMENT PRIMARY KEY, game_id INT UNIQUE,
      grid_size INT DEFAULT 8,
      logo_url VARCHAR(500) DEFAULT '',
      logo_name VARCHAR(255) DEFAULT '',
      levels_json TEXT,
      candy_types INT DEFAULT 6,
      match_score INT DEFAULT 10,
      combo_multiplier INT DEFAULT 40,
      special_spawn_rate DECIMAL(4,2) DEFAULT 0.17,
      is_active TINYINT(1) DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE
    )
  `, 'candyblast_settings table');

  await safeQuery(connection, `
    CREATE TABLE IF NOT EXISTS flappy_settings (
      id INT AUTO_INCREMENT PRIMARY KEY, game_id INT UNIQUE,
      gravity DECIMAL(3,2) DEFAULT 0.50, flap_strength DECIMAL(4,2) DEFAULT -8.00,
      pipe_speed INT DEFAULT 3, pipe_gap INT DEFAULT 150, pipe_width INT DEFAULT 60,
      bird_color VARCHAR(20) DEFAULT '#f59e0b', pipe_color VARCHAR(20) DEFAULT '#22c55e',
      ground_color VARCHAR(20) DEFAULT '#8B4513', sky_color VARCHAR(20) DEFAULT '#87CEEB',
      show_timer TINYINT(1) DEFAULT 1, time_limit_seconds INT DEFAULT 0,
      heading_1 VARCHAR(500), heading_2 VARCHAR(500), heading_3 VARCHAR(500), description_text TEXT,
      heading_1_color VARCHAR(20) DEFAULT '#1a1a2e', heading_2_color VARCHAR(20) DEFAULT '#666666',
      heading_3_color VARCHAR(20) DEFAULT '#777777', description_color VARCHAR(20) DEFAULT '#888888',
      bg_color VARCHAR(20) DEFAULT '#87CEEB', primary_color VARCHAR(20) DEFAULT '#f59e0b',
      bg_image_url VARCHAR(500), thankyou_bg_image_url VARCHAR(500), game_logo_url VARCHAR(500),
      submit_confirm_gif_url VARCHAR(500), font_family VARCHAR(100) DEFAULT 'DM Sans',
      sound_flap_id INT DEFAULT NULL, sound_score_id INT DEFAULT NULL, sound_gameover_id INT DEFAULT NULL,
      intro_text TEXT, intro_text_color VARCHAR(20) DEFAULT NULL,
      outro_text TEXT, outro_text_color VARCHAR(20) DEFAULT NULL,
      submit_button_text VARCHAR(500), continue_button_text VARCHAR(100) DEFAULT 'Continue →',
      start_button_text VARCHAR(500),
      start_button_text_color VARCHAR(20) DEFAULT NULL, start_button_bg_color VARCHAR(20) DEFAULT NULL,
      submit_button_text_color VARCHAR(20) DEFAULT NULL, submit_button_bg_color VARCHAR(20) DEFAULT NULL,
      continue_button_text_color VARCHAR(20) DEFAULT NULL, continue_button_bg_color VARCHAR(20) DEFAULT NULL,
      thankyou_subtitle VARCHAR(500) DEFAULT NULL, thankyou_subtitle_color VARCHAR(20) DEFAULT NULL,
      terms_enabled TINYINT(1) DEFAULT 0, terms_text TEXT, terms_url VARCHAR(500), meta_description TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE
    )
  `, 'flappy_settings table');

  await safeQuery(connection, `
    CREATE TABLE IF NOT EXISTS game2048_settings (
      id INT AUTO_INCREMENT PRIMARY KEY,
      game_id INT UNIQUE,
      grid_size INT DEFAULT 4,
      target_number INT DEFAULT 2048,
      tile_colors JSON,
      show_timer TINYINT(1) DEFAULT 0,
      time_limit_seconds INT DEFAULT 0,
      heading_1 VARCHAR(500),
      heading_2 VARCHAR(500),
      heading_3 VARCHAR(500),
      heading_1_color VARCHAR(20) DEFAULT '#776e65',
      heading_2_color VARCHAR(20) DEFAULT '#776e65',
      heading_3_color VARCHAR(20) DEFAULT '#776e65',
      description_text TEXT,
      description_color VARCHAR(20) DEFAULT '#776e65',
      bg_color VARCHAR(20) DEFAULT '#faf8ef',
      primary_color VARCHAR(20) DEFAULT '#8f7a66',
      bg_image_url VARCHAR(500),
      thankyou_bg_image_url VARCHAR(500),
      game_logo_url VARCHAR(500),
      submit_confirm_gif_url VARCHAR(500),
      font_family VARCHAR(100) DEFAULT 'DM Sans',
      sound_slide_id INT DEFAULT NULL,
      sound_merge_id INT DEFAULT NULL,
      sound_win_id INT DEFAULT NULL,
      sound_lose_id INT DEFAULT NULL,
      intro_text TEXT,
      intro_text_color VARCHAR(20) DEFAULT '#776e65',
      outro_text TEXT,
      outro_text_color VARCHAR(20) DEFAULT '#776e65',
      thankyou_subtitle TEXT,
      thankyou_subtitle_color VARCHAR(20) DEFAULT '#444444',
      submit_button_text VARCHAR(500),
      submit_button_text_color VARCHAR(20) DEFAULT '#ffffff',
      submit_button_bg_color VARCHAR(20),
      continue_button_text VARCHAR(100) DEFAULT 'Continue →',
      continue_button_text_color VARCHAR(20) DEFAULT '#ffffff',
      continue_button_bg_color VARCHAR(20),
      start_button_text VARCHAR(500),
      start_button_text_color VARCHAR(20) DEFAULT '#ffffff',
      start_button_bg_color VARCHAR(20),
      terms_enabled TINYINT(1) DEFAULT 0,
      terms_text TEXT,
      terms_url VARCHAR(500),
      meta_description TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE
    )
  `, 'game2048_settings table');

  await safeQuery(connection, `
    CREATE TABLE IF NOT EXISTS game2048_scores (
      id INT AUTO_INCREMENT PRIMARY KEY,
      game_id INT,
      session_token VARCHAR(255),
      score INT DEFAULT 0,
      best_score INT DEFAULT 0,
      moves INT DEFAULT 0,
      grid_state JSON,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY (game_id, session_token)
    )
  `, 'game2048_scores table');

  /* ── CROSSWORD SETTINGS — missing columns for saving all settings ── */
  await addColumn(connection, 'crossword_settings', 'heading_1_color', "VARCHAR(20) DEFAULT '#1a1a2e'");
  await addColumn(connection, 'crossword_settings', 'heading_2_color', "VARCHAR(20) DEFAULT '#666666'");
  await addColumn(connection, 'crossword_settings', 'heading_3_color', "VARCHAR(20) DEFAULT '#777777'");
  await addColumn(connection, 'crossword_settings', 'description_color', "VARCHAR(20) DEFAULT '#888888'");
  await addColumn(connection, 'crossword_settings', 'blank_cell_image_url', 'VARCHAR(500)');
  await addColumn(connection, 'crossword_settings', 'submit_confirm_gif_url', 'VARCHAR(500)');
  await addColumn(connection, 'crossword_settings', 'auto_size', 'TINYINT(1) DEFAULT 0');
  await addColumn(connection, 'crossword_settings', 'intro_text', 'TEXT');
  await addColumn(connection, 'crossword_settings', 'outro_text', 'TEXT');
  await addColumn(connection, 'crossword_settings', 'submit_button_text', 'VARCHAR(500)');
  await addColumn(connection, 'crossword_settings', 'continue_button_text', "VARCHAR(100) DEFAULT 'Continue →'");
  await addColumn(connection, 'crossword_settings', 'start_button_text', 'VARCHAR(500)');
  await addColumn(connection, 'crossword_settings', 'terms_enabled', 'TINYINT(1) DEFAULT 0');
  await addColumn(connection, 'crossword_settings', 'terms_text', 'TEXT');
  await addColumn(connection, 'crossword_settings', 'terms_url', 'VARCHAR(500)');
  await addColumn(connection, 'crossword_settings', 'meta_description', 'TEXT');

  /* ── EXISTING COLUMN MIGRATIONS (all from your original, unchanged) ── */
  console.log('🔄 Running column migrations...');

  /* QUESTIONS */
  await addColumn(connection, 'questions', 'question_bg_image_url', 'VARCHAR(500)');
  await addColumn(connection, 'questions', 'sound_correct', 'VARCHAR(500)');
  await addColumn(connection, 'questions', 'sound_wrong', 'VARCHAR(500)');
  await addColumn(connection, 'questions', 'sound_neutral', 'VARCHAR(500)');
  await addColumn(connection, 'questions', 'sound_correct_id', 'INT DEFAULT NULL');
  await addColumn(connection, 'questions', 'sound_wrong_id', 'INT DEFAULT NULL');
  await addColumn(connection, 'questions', 'sound_neutral_id', 'INT DEFAULT NULL');
  await addColumn(connection, 'questions', 'overlay_duration', 'INT DEFAULT 3');
  await addColumn(connection, 'questions', 'overlay_idle_time', 'INT DEFAULT 3');
  await addColumn(connection, 'questions', 'overlay_animation_in', "VARCHAR(50) DEFAULT 'flyFromBottom'");
  await addColumn(connection, 'questions', 'overlay_animation_out', "VARCHAR(50) DEFAULT 'flyToTop'");
  await addColumn(connection, 'questions', 'question_image_animation', "VARCHAR(50) DEFAULT 'float'");

  /* OPTIONS */
  await addColumn(connection, 'options', 'option_overlay_image_url', 'VARCHAR(500)');
  await addColumn(connection, 'options', 'option_color', "VARCHAR(20) DEFAULT '#1a1a2e'");
  await addColumn(connection, 'options', 'option_text_color', "VARCHAR(20) DEFAULT '#ffffff'");
  await addColumn(connection, 'options', 'option_border_color', "VARCHAR(20) DEFAULT 'transparent'");
  await addColumn(connection, 'options', 'option_border_width', 'INT DEFAULT 0');
  await addColumn(connection, 'options', 'option_border_radius', 'INT DEFAULT 12');
  await addColumn(connection, 'options', 'option_font_gradient', 'VARCHAR(500)');
  await addColumn(connection, 'options', 'option_bg_gradient', 'VARCHAR(500)');
  await addColumn(connection, 'options', 'option_border_gradient', 'VARCHAR(500)');
  await addColumn(connection, 'options', 'option_corners_json', 'VARCHAR(500)');

  /* QUIZ SETTINGS — global default option styling (applies to all options in this game) */
  await addColumn(connection, 'quiz_settings', 'default_option_color', "VARCHAR(20) DEFAULT '#1a1a2e'");
  await addColumn(connection, 'quiz_settings', 'default_option_text_color', "VARCHAR(20) DEFAULT '#ffffff'");
  await addColumn(connection, 'quiz_settings', 'default_option_border_color', "VARCHAR(20) DEFAULT 'transparent'");
  await addColumn(connection, 'quiz_settings', 'default_option_border_width', 'INT DEFAULT 0');
  await addColumn(connection, 'quiz_settings', 'default_option_border_radius', 'INT DEFAULT 12');
  await addColumn(connection, 'quiz_settings', 'default_option_font_gradient', 'VARCHAR(500)');
  await addColumn(connection, 'quiz_settings', 'default_option_bg_json', 'VARCHAR(2000)');
  await addColumn(connection, 'quiz_settings', 'default_option_font_json', 'VARCHAR(2000)');
  await addColumn(connection, 'quiz_settings', 'default_option_bg_gradient', 'VARCHAR(500)');
  await addColumn(connection, 'quiz_settings', 'default_option_border_json', 'VARCHAR(2000)');
  await addColumn(connection, 'quiz_settings', 'default_option_corners_json', 'VARCHAR(500)');

  /* QUESTIONS — open-ended / math question fields */
  await addColumn(connection, 'questions', 'expected_answer', 'VARCHAR(500) DEFAULT NULL');
  await addColumn(connection, 'questions', 'comparison_type', "VARCHAR(20) DEFAULT 'exact'");
  await addColumn(connection, 'questions', 'answer_text', 'VARCHAR(500) DEFAULT NULL');
  await addColumn(connection, 'questions', 'answer_is_number', 'TINYINT(1) DEFAULT 0');

  /* QUIZ SETTINGS */
  await addColumn(connection, 'quiz_settings', 'bg_image_url', 'VARCHAR(500)');
  await addColumn(connection, 'quiz_settings', 'thankyou_bg_image_url', 'VARCHAR(500)');
  await addColumn(connection, 'quiz_settings', 'terms_enabled', 'TINYINT(1) DEFAULT 0');
  await addColumn(connection, 'quiz_settings', 'terms_text', 'TEXT');
  await addColumn(connection, 'quiz_settings', 'terms_url', 'VARCHAR(500)');
  await addColumn(connection, 'quiz_settings', 'send_email', 'TINYINT(1) DEFAULT 1');
  await addColumn(connection, 'quiz_settings', 'win_sound_url', 'VARCHAR(500)');
  await addColumn(connection, 'quiz_settings', 'win_sound_id', 'INT DEFAULT NULL');
  await addColumn(connection, 'quiz_settings', 'lose_sound_id', 'INT DEFAULT NULL');
  await addColumn(connection, 'quiz_settings', 'sound_correct_id', 'INT DEFAULT NULL');
  await addColumn(connection, 'quiz_settings', 'sound_wrong_id', 'INT DEFAULT NULL');
  await addColumn(connection, 'quiz_settings', 'sound_neutral_id', 'INT DEFAULT NULL');
  await addColumn(connection, 'quiz_settings', 'game_logo_url', 'VARCHAR(500)');
  await addColumn(connection, 'quiz_settings', 'font_family', "VARCHAR(100) DEFAULT 'DM Sans'");
  await addColumn(connection, 'quiz_settings', 'submit_confirm_gif_url', 'VARCHAR(500)');
  await addColumn(connection, 'quiz_settings', 'allow_back', 'TINYINT(1) DEFAULT 0');
  await addColumn(connection, 'quiz_settings', 'time_per_question', 'INT DEFAULT 0');
  await addColumn(connection, 'quiz_settings', 'heading_1', 'VARCHAR(500)');
  await addColumn(connection, 'quiz_settings', 'heading_2', 'VARCHAR(500)');
  await addColumn(connection, 'quiz_settings', 'heading_1_color', "VARCHAR(20) DEFAULT '#1a1a2e'");
  await addColumn(connection, 'quiz_settings', 'heading_2_color', "VARCHAR(20) DEFAULT '#1a1a2e'");
  await addColumn(connection, 'quiz_settings', 'intro_text_color', "VARCHAR(20) DEFAULT '#444444'");
  await addColumn(connection, 'quiz_settings', 'thankyou_subtitle', 'VARCHAR(500)');
  await addColumn(connection, 'quiz_settings', 'outro_text_color', "VARCHAR(20) DEFAULT '#1a1a2e'");
  await addColumn(connection, 'quiz_settings', 'thankyou_subtitle_color', "VARCHAR(20) DEFAULT '#444444'");
  await addColumn(connection, 'quiz_settings', 'start_button_text_color', "VARCHAR(20) DEFAULT '#ffffff'");
  await addColumn(connection, 'quiz_settings', 'start_button_bg_color', 'VARCHAR(20)');
  await addColumn(connection, 'quiz_settings', 'submit_button_text_color', "VARCHAR(20) DEFAULT '#ffffff'");
  await addColumn(connection, 'quiz_settings', 'submit_button_bg_color', 'VARCHAR(20)');
  await addColumn(connection, 'quiz_settings', 'continue_button_text_color', "VARCHAR(20) DEFAULT '#ffffff'");
  await addColumn(connection, 'quiz_settings', 'continue_button_bg_color', 'VARCHAR(20)');
  await addColumn(connection, 'quiz_settings', 'next_button_text', "VARCHAR(100) DEFAULT 'Next →'");
  await addColumn(connection, 'quiz_settings', 'next_button_text_color', "VARCHAR(20) DEFAULT '#ffffff'");
  await addColumn(connection, 'quiz_settings', 'next_button_bg_color', 'VARCHAR(20)');
  await addColumn(connection, 'quiz_settings', 'start_button_text', 'VARCHAR(500)');
  await addColumn(connection, 'quiz_settings', 'submit_button_text', 'VARCHAR(500)');
  await addColumn(connection, 'quiz_settings', 'continue_button_text', 'VARCHAR(500)');
  await addColumn(connection, 'quiz_settings', 'randomize_questions', 'TINYINT(1) DEFAULT 0');
  await addColumn(connection, 'quiz_settings', 'questions_per_session', 'INT DEFAULT 0');

  /* QUIZ SETTINGS — Mascot & Voice (TTS) */
  await addColumn(connection, 'quiz_settings', 'enable_mascot', 'TINYINT(1) DEFAULT 0');
  await addColumn(connection, 'quiz_settings', 'enable_speech', 'TINYINT(1) DEFAULT 0');
  await addColumn(connection, 'quiz_settings', 'speech_language', "VARCHAR(20) DEFAULT 'en'");
  await addColumn(connection, 'quiz_settings', 'speech_rate', 'FLOAT DEFAULT 1');
  await addColumn(connection, 'quiz_settings', 'speech_pitch', 'FLOAT DEFAULT 1');

  /* GAMES */
  // Widen the category ENUM to every known game type PLUS whatever values
  // already exist in the table. A single legacy row with an unlisted value
  // used to abort the whole ALTER ("Data truncated for column 'category'").
  try {
    const KNOWN_CATEGORIES = ['quiz','survey','poll','crossword','spin','memory','jigsaw','wordsearch','pouring','typer','math','maze','screw','tower','2048','snake','nagaraja','catch','reaction','simon','flappy','bounce','space','connect4','bejeweled','tetris','stack','bowling','sudoku','minesweeper','wordscramble','rps','whackamole','hanoi','breakout','bubbleshooter','carlaunch','frustration','stressbuster','soundify','tictactoe','arrowescape','chess','snakeandladder','ludo','Carrom','tictactoemultiplayer','candyblast','blockblaster','classicmaze','stickmaze','spotregistration'];
    let existing = [];
    try {
      const [rows] = await connection.query("SELECT DISTINCT category FROM games WHERE category IS NOT NULL");
      existing = rows.map(r => r.category).filter(Boolean);
    } catch { /* table may not exist yet on first boot */ }
    const merged = [...new Set([...KNOWN_CATEGORIES, ...existing])];
    await connection.query(
      `ALTER TABLE games MODIFY COLUMN category ENUM(${merged.map(v => `'${String(v).replace(/'/g, "''")}'`).join(',')}) DEFAULT 'quiz'`
    );
    console.log(`✅ games.category ENUM covers ${merged.length} types`);
  } catch (err) {
    console.error('❌ games.category ENUM widening failed:', err.message);
  }
  await addColumn(connection, 'games', 'client_id', 'INT');
  await addColumn(connection, 'games', 'slug', 'VARCHAR(255)');
  await addColumn(connection, 'games', 'description', 'TEXT');
  await addColumn(connection, 'games', 'redirect_url', 'VARCHAR(500)');
  await addColumn(connection, 'games', 'is_active', 'TINYINT(1) DEFAULT 1');
  await addColumn(connection, 'games', 'game_logo_url', 'VARCHAR(500)');
  await addColumn(connection, 'games', 'show_in_play_page', 'TINYINT(1) DEFAULT 0');
  await addColumn(connection, 'games', 'show_in_hero_page', 'TINYINT(1) DEFAULT 0');
  await addColumn(connection, 'games', 'force_login', 'TINYINT(1) DEFAULT 1');
  await safeQuery(connection, 'UPDATE games SET force_login = 1 WHERE force_login IS NULL');
  await addColumn(connection, 'games', 'testing_started_at', 'DATETIME NULL');
  await addColumn(connection, 'games', 'created_by', 'INT');
  await addColumn(connection, 'games', 'updated_at', 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP');
  await addColumn(connection, 'games', 'updated_by', 'INT DEFAULT NULL');
  await addColumn(connection, 'games', 'meta_description', 'TEXT');

  /* TEMPLATES — reusable player skins (look, fonts, animations, language, TTS, mascot) */
  await safeQuery(connection, `
    CREATE TABLE IF NOT EXISTS templates (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      client_id INT DEFAULT NULL,
      is_default TINYINT(1) DEFAULT 0,
      config_json JSON,
      preview_image_url VARCHAR(500),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `, 'templates table');

  /* GAMES — template link + intro video */
  await addColumn(connection, 'games', 'template_id', 'INT DEFAULT NULL');
  await addColumn(connection, 'games', 'intro_video_url', 'VARCHAR(500)');
  await addColumn(connection, 'games', 'thumbnail_url', 'VARCHAR(500)');

  /* QUIZ SETTINGS — animation/timing overrides (merged over template) */
  await addColumn(connection, 'quiz_settings', 'anim_config_json', 'JSON');

  /* BUSINESS OWNERS — link to client */
  await addColumn(connection, 'business_owners', 'client_id', 'INT DEFAULT NULL');
  await addColumn(connection, 'business_owners', 'phone', 'VARCHAR(20) DEFAULT NULL');
  await addColumn(connection, 'business_owners', 'pincode', 'VARCHAR(10) DEFAULT NULL');

  /* GAMES — location/parent columns */
  await addColumn(connection, 'games', 'parent_game_id', 'INT DEFAULT NULL');
  await addColumn(connection, 'games', 'location_name', 'VARCHAR(255) DEFAULT NULL');
  await addColumn(connection, 'games', 'business_owner_id', 'INT DEFAULT NULL');

  /* SPIN SEGMENTS */
  await addColumn(connection, 'spin_segments', 'win_message', 'TEXT');
  await addColumn(connection, 'spin_segments', 'lose_message', 'TEXT');

  /* PLAYER SESSIONS */
  await addColumn(connection, 'player_sessions', 'source_type', "VARCHAR(20) DEFAULT 'direct'");
  await addColumn(connection, 'player_sessions', 'completed_at', 'TIMESTAMP NULL');
  await addColumn(connection, 'player_sessions', 'email_sent', 'TINYINT(1) DEFAULT 0');
  await addColumn(connection, 'player_sessions', 'utm_source', 'VARCHAR(255)');
  await addColumn(connection, 'player_sessions', 'utm_medium', 'VARCHAR(255)');
  await addColumn(connection, 'player_sessions', 'utm_campaign', 'VARCHAR(255)');
  await addColumn(connection, 'player_sessions', 'utm_term', 'VARCHAR(255)');
  await addColumn(connection, 'player_sessions', 'utm_content', 'VARCHAR(255)');
  await addColumn(connection, 'player_sessions', 'selected_question_ids', 'JSON DEFAULT NULL');
  await addColumn(connection, 'player_sessions', 'promo_player_id', 'INT');
  await addColumn(connection, 'player_sessions', 'referred_by', 'INT DEFAULT NULL');
  await addColumn(connection, 'player_sessions', 'device_id', 'VARCHAR(255)');

  /* SOUNDS — url column used by sounds.js route */
  await addColumn(connection, 'sounds', 'url', 'VARCHAR(500)');

  /* SCREW SETTINGS — missing fields */
  await addColumn(connection, 'screw_settings', 'start_button_text_color', "VARCHAR(20) DEFAULT NULL");
  await addColumn(connection, 'screw_settings', 'start_button_bg_color', "VARCHAR(20) DEFAULT NULL");
  await addColumn(connection, 'screw_settings', 'submit_button_text_color', "VARCHAR(20) DEFAULT NULL");
  await addColumn(connection, 'screw_settings', 'submit_button_bg_color', "VARCHAR(20) DEFAULT NULL");
  await addColumn(connection, 'screw_settings', 'continue_button_text_color', "VARCHAR(20) DEFAULT NULL");
  await addColumn(connection, 'screw_settings', 'continue_button_bg_color', "VARCHAR(20) DEFAULT NULL");
  await addColumn(connection, 'screw_settings', 'thankyou_subtitle', "VARCHAR(500) DEFAULT NULL");
  await addColumn(connection, 'screw_settings', 'thankyou_subtitle_color', "VARCHAR(20) DEFAULT NULL");
  await addColumn(connection, 'screw_settings', 'outro_text_color', "VARCHAR(20) DEFAULT NULL");
  await addColumn(connection, 'screw_settings', 'intro_text_color', "VARCHAR(20) DEFAULT NULL");

  /* ── SIMON SETTINGS — missing button/thankyou color fields ── */
  await addColumn(connection, 'simon_settings', 'intro_text_color', "VARCHAR(20) DEFAULT NULL");
  await addColumn(connection, 'simon_settings', 'outro_text_color', "VARCHAR(20) DEFAULT NULL");
  await addColumn(connection, 'simon_settings', 'thankyou_subtitle', "VARCHAR(500) DEFAULT NULL");
  await addColumn(connection, 'simon_settings', 'thankyou_subtitle_color', "VARCHAR(20) DEFAULT NULL");
  await addColumn(connection, 'simon_settings', 'submit_button_text_color', "VARCHAR(20) DEFAULT NULL");
  await addColumn(connection, 'simon_settings', 'submit_button_bg_color', "VARCHAR(20) DEFAULT NULL");
  await addColumn(connection, 'simon_settings', 'continue_button_text_color', "VARCHAR(20) DEFAULT NULL");
  await addColumn(connection, 'simon_settings', 'continue_button_bg_color', "VARCHAR(20) DEFAULT NULL");
  await addColumn(connection, 'simon_settings', 'start_button_text_color', "VARCHAR(20) DEFAULT NULL");
  await addColumn(connection, 'simon_settings', 'start_button_bg_color', "VARCHAR(20) DEFAULT NULL");

  /* ── SNAKE SETTINGS — missing button/thankyou color fields + reveal_image_url ── */
  await addColumn(connection, 'snake_settings', 'intro_text_color', "VARCHAR(20) DEFAULT NULL");
  await addColumn(connection, 'snake_settings', 'outro_text_color', "VARCHAR(20) DEFAULT NULL");
  await addColumn(connection, 'snake_settings', 'thankyou_subtitle', "VARCHAR(500) DEFAULT NULL");
  await addColumn(connection, 'snake_settings', 'thankyou_subtitle_color', "VARCHAR(20) DEFAULT NULL");
  await addColumn(connection, 'snake_settings', 'submit_button_text_color', "VARCHAR(20) DEFAULT NULL");
  await addColumn(connection, 'snake_settings', 'submit_button_bg_color', "VARCHAR(20) DEFAULT NULL");
  await addColumn(connection, 'snake_settings', 'continue_button_text_color', "VARCHAR(20) DEFAULT NULL");
  await addColumn(connection, 'snake_settings', 'continue_button_bg_color', "VARCHAR(20) DEFAULT NULL");
  await addColumn(connection, 'snake_settings', 'start_button_text_color', "VARCHAR(20) DEFAULT NULL");
  await addColumn(connection, 'snake_settings', 'start_button_bg_color', "VARCHAR(20) DEFAULT NULL");
  await addColumn(connection, 'snake_settings', 'reveal_image_url', "VARCHAR(500) DEFAULT NULL");

  /* ── CATCH SETTINGS — missing button/thankyou color fields ── */
  await addColumn(connection, 'catch_settings', 'intro_text_color', "VARCHAR(20) DEFAULT NULL");
  await addColumn(connection, 'catch_settings', 'outro_text_color', "VARCHAR(20) DEFAULT NULL");
  await addColumn(connection, 'catch_settings', 'thankyou_subtitle', "VARCHAR(500) DEFAULT NULL");
  await addColumn(connection, 'catch_settings', 'thankyou_subtitle_color', "VARCHAR(20) DEFAULT NULL");
  await addColumn(connection, 'catch_settings', 'submit_button_text_color', "VARCHAR(20) DEFAULT NULL");
  await addColumn(connection, 'catch_settings', 'submit_button_bg_color', "VARCHAR(20) DEFAULT NULL");
  await addColumn(connection, 'catch_settings', 'continue_button_text_color', "VARCHAR(20) DEFAULT NULL");
  await addColumn(connection, 'catch_settings', 'continue_button_bg_color', "VARCHAR(20) DEFAULT NULL");
  await addColumn(connection, 'catch_settings', 'start_button_text_color', "VARCHAR(20) DEFAULT NULL");
  await addColumn(connection, 'catch_settings', 'start_button_bg_color', "VARCHAR(20) DEFAULT NULL");

  /* ── REACTION SETTINGS — missing button/thankyou color fields + time_limit_seconds ── */
  await addColumn(connection, 'reaction_settings', 'intro_text_color', "VARCHAR(20) DEFAULT NULL");
  await addColumn(connection, 'reaction_settings', 'outro_text_color', "VARCHAR(20) DEFAULT NULL");
  await addColumn(connection, 'reaction_settings', 'thankyou_subtitle', "VARCHAR(500) DEFAULT NULL");
  await addColumn(connection, 'reaction_settings', 'thankyou_subtitle_color', "VARCHAR(20) DEFAULT NULL");
  await addColumn(connection, 'reaction_settings', 'submit_button_text_color', "VARCHAR(20) DEFAULT NULL");
  await addColumn(connection, 'reaction_settings', 'submit_button_bg_color', "VARCHAR(20) DEFAULT NULL");
  await addColumn(connection, 'reaction_settings', 'continue_button_text_color', "VARCHAR(20) DEFAULT NULL");
  await addColumn(connection, 'reaction_settings', 'continue_button_bg_color', "VARCHAR(20) DEFAULT NULL");
  await addColumn(connection, 'reaction_settings', 'start_button_text_color', "VARCHAR(20) DEFAULT NULL");
  await addColumn(connection, 'reaction_settings', 'start_button_bg_color', "VARCHAR(20) DEFAULT NULL");
  await addColumn(connection, 'reaction_settings', 'time_limit_seconds', "INT DEFAULT 0");

  /* ── GAME2048 SETTINGS — missing fields read by player ── */
  await addColumn(connection, 'game2048_settings', 'overlay_animation_in', "VARCHAR(50) DEFAULT 'flyFromBottom'");
  await addColumn(connection, 'game2048_settings', 'keep_going_button_text', "VARCHAR(100) DEFAULT 'Keep Going'");
  await addColumn(connection, 'game2048_settings', 'claim_prize_button_text', "VARCHAR(100) DEFAULT 'Claim Prize →'");
  await addColumn(connection, 'game2048_settings', 'new_game_button_text', "VARCHAR(100) DEFAULT '↻ New Game'");

  /* ── QUESTIONS — short answer support ── */
  await addColumn(connection, 'questions', 'answer_text', "VARCHAR(500) DEFAULT NULL");
  await addColumn(connection, 'questions', 'answer_is_number', "TINYINT(1) DEFAULT 0");
  // Change question_type from ENUM to VARCHAR so it can hold 'short_answer'
  await safeQuery(connection, `ALTER TABLE questions MODIFY COLUMN question_type VARCHAR(50) DEFAULT 'right_wrong'`, 'questions.question_type → VARCHAR(50)');

  /* ── PLAYER ANSWERS — multi-select support (checkbox/select capture choices) ── */
  await addColumn(connection, 'player_answers', 'option_ids', 'JSON');

  /* ── BOUNCE GAME TABLES ── */
  await safeQuery(connection, `
    CREATE TABLE IF NOT EXISTS bounce_settings (
      id INT AUTO_INCREMENT PRIMARY KEY,
      game_id INT NOT NULL,
      primary_color VARCHAR(20) DEFAULT '#e53935',
      bg_color VARCHAR(20) DEFAULT '#f5f5f5',
      bg_image_url VARCHAR(500),
      ball_image_url VARCHAR(500),
      ball_color VARCHAR(20) DEFAULT '#e53935',
      ball_size INT DEFAULT 24,
      gravity FLOAT DEFAULT 0.5,
      jump_force FLOAT DEFAULT -12,
      friction FLOAT DEFAULT 0.85,
      max_speed FLOAT DEFAULT 8,
      intro_text TEXT,
      intro_text_color VARCHAR(20) DEFAULT '#1a1a2e',
      outro_text TEXT,
      outro_text_color VARCHAR(20) DEFAULT '#1a1a2e',
      time_limit_seconds INT DEFAULT 0,
      show_timer TINYINT(1) DEFAULT 1,
      sound_jump_id INT DEFAULT NULL,
      sound_coin_id INT DEFAULT NULL,
      sound_hit_id INT DEFAULT NULL,
      sound_win_id INT DEFAULT NULL,
      sound_lose_id INT DEFAULT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE
    )
  `, 'bounce_settings table');

  await safeQuery(connection, `
    CREATE TABLE IF NOT EXISTS bounce_levels (
      id INT AUTO_INCREMENT PRIMARY KEY,
      game_id INT NOT NULL,
      level_order INT DEFAULT 0,
      level_name VARCHAR(100) DEFAULT 'Level',
      width INT DEFAULT 3000,
      height INT DEFAULT 600,
      bg_color VARCHAR(20),
      bg_image_url VARCHAR(500),
      parallax_bg_url VARCHAR(500),
      time_limit_seconds INT DEFAULT 0,
      target_score INT DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE
    )
  `, 'bounce_levels table');

  await safeQuery(connection, `
    CREATE TABLE IF NOT EXISTS bounce_objects (
      id INT AUTO_INCREMENT PRIMARY KEY,
      level_id INT NOT NULL,
      type ENUM('platform','moving_platform','spike','spring','coin','goal','wall','death_zone') DEFAULT 'platform',
      x INT DEFAULT 0,
      y INT DEFAULT 0,
      width INT DEFAULT 100,
      height INT DEFAULT 20,
      color VARCHAR(20) DEFAULT '#333',
      image_url VARCHAR(500),
      -- Moving platform properties
      move_type ENUM('horizontal','vertical','none') DEFAULT 'none',
      move_distance INT DEFAULT 200,
      move_speed FLOAT DEFAULT 1,
      move_start_offset INT DEFAULT 0,
      -- Spring properties
      spring_force FLOAT DEFAULT -18,
      -- Coin properties
      coin_value INT DEFAULT 10,
      -- Goal properties
      goal_text VARCHAR(50) DEFAULT 'FINISH',
      -- Z-index for rendering order
      z_index INT DEFAULT 0,
      object_order INT DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (level_id) REFERENCES bounce_levels(id) ON DELETE CASCADE
    )
  `, 'bounce_objects table');

  await safeQuery(connection, `
    CREATE TABLE IF NOT EXISTS bounce_progress (
      id INT AUTO_INCREMENT PRIMARY KEY,
      session_id INT NOT NULL,
      level_id INT NOT NULL,
      score INT DEFAULT 0,
      coins_collected INT DEFAULT 0,
      time_elapsed INT DEFAULT 0,
      completed TINYINT(1) DEFAULT 0,
      deaths INT DEFAULT 0,
      best_time INT DEFAULT NULL,
      best_score INT DEFAULT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (session_id) REFERENCES player_sessions(id) ON DELETE CASCADE,
      FOREIGN KEY (level_id) REFERENCES bounce_levels(id) ON DELETE CASCADE,
      UNIQUE KEY unique_session_level (session_id, level_id)
    )
  `, 'bounce_progress table');

  /* ── SPACE SHOOTER GAME TABLES ── */
  await safeQuery(connection, `
    CREATE TABLE IF NOT EXISTS space_settings (
      id INT AUTO_INCREMENT PRIMARY KEY,
      game_id INT NOT NULL,
      primary_color VARCHAR(20) DEFAULT '#3b82f6',
      secondary_color VARCHAR(20) DEFAULT '#1e40af',
      accent_color VARCHAR(20) DEFAULT '#fbbf24',
      bg_color VARCHAR(20) DEFAULT '#0f172a',
      bg_image_url VARCHAR(500),
      star_density INT DEFAULT 50,
      enemy_speed INT DEFAULT 2,
      player_speed INT DEFAULT 4,
      laser_speed INT DEFAULT 6,
      intro_text TEXT,
      intro_text_color VARCHAR(20) DEFAULT '#e2e8f0',
      outro_text TEXT,
      outro_text_color VARCHAR(20) DEFAULT '#e2e8f0',
      time_limit_seconds INT DEFAULT 0,
      show_timer TINYINT(1) DEFAULT 1,
      sound_laser_id INT DEFAULT NULL,
      sound_explosion_id INT DEFAULT NULL,
      sound_hit_id INT DEFAULT NULL,
      sound_powerup_id INT DEFAULT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE
    )
  `, 'space_settings table');

  await safeQuery(connection, `
    CREATE TABLE IF NOT EXISTS space_ships (
      id INT AUTO_INCREMENT PRIMARY KEY,
      game_id INT NOT NULL,
      ship_name VARCHAR(100) NOT NULL,
      image_url VARCHAR(500),
      width INT DEFAULT 40,
      height INT DEFAULT 40,
      color VARCHAR(20) DEFAULT '#3b82f6',
      speed INT DEFAULT 4,
      laser_speed INT DEFAULT 6,
      laser_width INT DEFAULT 4,
      laser_damage INT DEFAULT 1,
      shield_points INT DEFAULT 100,
      is_default TINYINT(1) DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE
    )
  `, 'space_ships table');

  await safeQuery(connection, `
    CREATE TABLE IF NOT EXISTS space_weapons (
      id INT AUTO_INCREMENT PRIMARY KEY,
      game_id INT NOT NULL,
      weapon_name VARCHAR(100) NOT NULL,
      image_url VARCHAR(500),
      laser_speed INT DEFAULT 6,
      laser_width INT DEFAULT 4,
      laser_damage INT DEFAULT 1,
      fire_rate INT DEFAULT 200,
      cost INT DEFAULT 0,
      description TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE
    )
  `, 'space_weapons table');

  await safeQuery(connection, `
    CREATE TABLE IF NOT EXISTS space_enemies (
      id INT AUTO_INCREMENT PRIMARY KEY,
      game_id INT NOT NULL,
      enemy_name VARCHAR(100) NOT NULL,
      image_url VARCHAR(500),
      width INT DEFAULT 30,
      height INT DEFAULT 30,
      color VARCHAR(20) DEFAULT '#ef4444',
      speed INT DEFAULT 2,
      hp INT DEFAULT 1,
      points_value INT DEFAULT 10,
      attack_damage INT DEFAULT 1,
      move_pattern ENUM('straight','zigzag','circle','sine','random') DEFAULT 'straight',
      shoot_pattern ENUM('none','single','double','spread') DEFAULT 'none',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE
    )
  `, 'space_enemies table');

  await safeQuery(connection, `
    CREATE TABLE IF NOT EXISTS space_levels (
      id INT AUTO_INCREMENT PRIMARY KEY,
      game_id INT NOT NULL,
      level_order INT DEFAULT 0,
      level_name VARCHAR(100) DEFAULT 'Level',
      width INT DEFAULT 800,
      height INT DEFAULT 600,
      bg_color VARCHAR(20),
      bg_image_url VARCHAR(500),
      time_limit_seconds INT DEFAULT 0,
      target_score INT DEFAULT 0,
      enemy_spawn_rate INT DEFAULT 1000,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE
    )
  `, 'space_levels table');

  await safeQuery(connection, `
    CREATE TABLE IF NOT EXISTS space_progress (
      id INT AUTO_INCREMENT PRIMARY KEY,
      session_id INT NOT NULL,
      level_id INT NOT NULL,
      score INT DEFAULT 0,
      kills INT DEFAULT 0,
      time_elapsed INT DEFAULT 0,
      completed TINYINT(1) DEFAULT 0,
      deaths INT DEFAULT 0,
      best_time INT DEFAULT NULL,
      best_score INT DEFAULT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (session_id) REFERENCES player_sessions(id) ON DELETE CASCADE,
      FOREIGN KEY (level_id) REFERENCES space_levels(id) ON DELETE CASCADE,
      UNIQUE KEY unique_session_level (session_id, level_id)
    )
  `, 'space_progress table');

   /* ── BOWLING TABLES ── */
  console.log('🎳 Creating bowling tables...');
  await safeQuery(connection, `
    CREATE TABLE IF NOT EXISTS bowling_settings (
      id INT AUTO_INCREMENT PRIMARY KEY, game_id INT UNIQUE,
      frames INT DEFAULT 10, pins INT DEFAULT 10,
      difficulty VARCHAR(20) DEFAULT 'medium',
      show_timer TINYINT(1) DEFAULT 1, time_limit_seconds INT DEFAULT 0,
      heading_1 VARCHAR(500), heading_2 VARCHAR(500), heading_3 VARCHAR(500), description_text TEXT,
      heading_1_color VARCHAR(20) DEFAULT '#1a1a2e', heading_2_color VARCHAR(20) DEFAULT '#666666',
      heading_3_color VARCHAR(20) DEFAULT '#777777', description_color VARCHAR(20) DEFAULT '#888888',
      bg_color VARCHAR(20) DEFAULT '#0f172a', primary_color VARCHAR(20) DEFAULT '#f59e0b',
      bg_image_url VARCHAR(500), thankyou_bg_image_url VARCHAR(500), game_logo_url VARCHAR(500),
      submit_confirm_gif_url VARCHAR(500), font_family VARCHAR(100) DEFAULT 'DM Sans',
      sound_roll_id INT DEFAULT NULL, sound_strike_id INT DEFAULT NULL, sound_spare_id INT DEFAULT NULL,
      intro_text TEXT, intro_text_color VARCHAR(20) DEFAULT NULL,
      outro_text TEXT, outro_text_color VARCHAR(20) DEFAULT NULL,
      submit_button_text VARCHAR(500), continue_button_text VARCHAR(100) DEFAULT 'Continue →',
      start_button_text VARCHAR(500),
      start_button_text_color VARCHAR(20) DEFAULT NULL, start_button_bg_color VARCHAR(20) DEFAULT NULL,
      submit_button_text_color VARCHAR(20) DEFAULT NULL, submit_button_bg_color VARCHAR(20) DEFAULT NULL,
      continue_button_text_color VARCHAR(20) DEFAULT NULL, continue_button_bg_color VARCHAR(20) DEFAULT NULL,
      thankyou_subtitle VARCHAR(500) DEFAULT NULL, thankyou_subtitle_color VARCHAR(20) DEFAULT NULL,
      terms_enabled TINYINT(1) DEFAULT 0, terms_text TEXT, terms_url VARCHAR(500), meta_description TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE
    )
  `, 'bowling_settings table');

  /* ── SUDOKU TABLES ── */
  console.log('🔢 Creating sudoku tables...');
  await safeQuery(connection, `
    CREATE TABLE IF NOT EXISTS sudoku_settings (
      id INT AUTO_INCREMENT PRIMARY KEY, game_id INT UNIQUE,
      difficulty VARCHAR(20) DEFAULT 'medium', grid_size INT DEFAULT 9,
      show_timer TINYINT(1) DEFAULT 1, time_limit_seconds INT DEFAULT 0,
      heading_1 VARCHAR(500), heading_2 VARCHAR(500), heading_3 VARCHAR(500), description_text TEXT,
      heading_1_color VARCHAR(20) DEFAULT '#1a1a2e', heading_2_color VARCHAR(20) DEFAULT '#666666',
      heading_3_color VARCHAR(20) DEFAULT '#777777', description_color VARCHAR(20) DEFAULT '#888888',
      bg_color VARCHAR(20) DEFAULT '#0f172a', primary_color VARCHAR(20) DEFAULT '#3b82f6',
      bg_image_url VARCHAR(500), thankyou_bg_image_url VARCHAR(500), game_logo_url VARCHAR(500),
      submit_confirm_gif_url VARCHAR(500), font_family VARCHAR(100) DEFAULT 'DM Sans',
      sound_correct_id INT DEFAULT NULL, sound_wrong_id INT DEFAULT NULL,
      intro_text TEXT, intro_text_color VARCHAR(20) DEFAULT NULL,
      outro_text TEXT, outro_text_color VARCHAR(20) DEFAULT NULL,
      submit_button_text VARCHAR(500), continue_button_text VARCHAR(100) DEFAULT 'Continue →',
      start_button_text VARCHAR(500),
      start_button_text_color VARCHAR(20) DEFAULT NULL, start_button_bg_color VARCHAR(20) DEFAULT NULL,
      submit_button_text_color VARCHAR(20) DEFAULT NULL, submit_button_bg_color VARCHAR(20) DEFAULT NULL,
      continue_button_text_color VARCHAR(20) DEFAULT NULL, continue_button_bg_color VARCHAR(20) DEFAULT NULL,
      thankyou_subtitle VARCHAR(500) DEFAULT NULL, thankyou_subtitle_color VARCHAR(20) DEFAULT NULL,
      terms_enabled TINYINT(1) DEFAULT 0, terms_text TEXT, terms_url VARCHAR(500), meta_description TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE
    )
  `, 'sudoku_settings table');

  /* ── MINESWEEPER TABLES ── */
  console.log('💣 Creating minesweeper tables...');
  await safeQuery(connection, `
    CREATE TABLE IF NOT EXISTS minesweeper_settings (
      id INT AUTO_INCREMENT PRIMARY KEY, game_id INT UNIQUE,
      grid_rows INT DEFAULT 9, grid_cols INT DEFAULT 9, mines INT DEFAULT 10,
      difficulty VARCHAR(20) DEFAULT 'medium',
      show_timer TINYINT(1) DEFAULT 1, time_limit_seconds INT DEFAULT 0,
      heading_1 VARCHAR(500), heading_2 VARCHAR(500), heading_3 VARCHAR(500), description_text TEXT,
      heading_1_color VARCHAR(20) DEFAULT '#1a1a2e', heading_2_color VARCHAR(20) DEFAULT '#666666',
      heading_3_color VARCHAR(20) DEFAULT '#777777', description_color VARCHAR(20) DEFAULT '#888888',
      bg_color VARCHAR(20) DEFAULT '#0f172a', primary_color VARCHAR(20) DEFAULT '#22c55e',
      bg_image_url VARCHAR(500), thankyou_bg_image_url VARCHAR(500), game_logo_url VARCHAR(500),
      submit_confirm_gif_url VARCHAR(500), font_family VARCHAR(100) DEFAULT 'DM Sans',
      sound_click_id INT DEFAULT NULL, sound_explode_id INT DEFAULT NULL, sound_win_id INT DEFAULT NULL,
      intro_text TEXT, intro_text_color VARCHAR(20) DEFAULT NULL,
      outro_text TEXT, outro_text_color VARCHAR(20) DEFAULT NULL,
      submit_button_text VARCHAR(500), continue_button_text VARCHAR(100) DEFAULT 'Continue →',
      start_button_text VARCHAR(500),
      start_button_text_color VARCHAR(20) DEFAULT NULL, start_button_bg_color VARCHAR(20) DEFAULT NULL,
      submit_button_text_color VARCHAR(20) DEFAULT NULL, submit_button_bg_color VARCHAR(20) DEFAULT NULL,
      continue_button_text_color VARCHAR(20) DEFAULT NULL, continue_button_bg_color VARCHAR(20) DEFAULT NULL,
      thankyou_subtitle VARCHAR(500) DEFAULT NULL, thankyou_subtitle_color VARCHAR(20) DEFAULT NULL,
      terms_enabled TINYINT(1) DEFAULT 0, terms_text TEXT, terms_url VARCHAR(500), meta_description TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE
    )
  `, 'minesweeper_settings table');

  /* ── WORD SCRAMBLE TABLES ── */
  console.log('🔤 Creating word scramble tables...');
  await safeQuery(connection, `
    CREATE TABLE IF NOT EXISTS wordscramble_settings (
      id INT AUTO_INCREMENT PRIMARY KEY, game_id INT UNIQUE,
      rounds INT DEFAULT 10, time_per_word INT DEFAULT 30,
      difficulty VARCHAR(20) DEFAULT 'medium',
      show_timer TINYINT(1) DEFAULT 1, time_limit_seconds INT DEFAULT 0,
      heading_1 VARCHAR(500), heading_2 VARCHAR(500), heading_3 VARCHAR(500), description_text TEXT,
      heading_1_color VARCHAR(20) DEFAULT '#1a1a2e', heading_2_color VARCHAR(20) DEFAULT '#666666',
      heading_3_color VARCHAR(20) DEFAULT '#777777', description_color VARCHAR(20) DEFAULT '#888888',
      bg_color VARCHAR(20) DEFAULT '#0f172a', primary_color VARCHAR(20) DEFAULT '#8b5cf6',
      bg_image_url VARCHAR(500), thankyou_bg_image_url VARCHAR(500), game_logo_url VARCHAR(500),
      submit_confirm_gif_url VARCHAR(500), font_family VARCHAR(100) DEFAULT 'DM Sans',
      sound_correct_id INT DEFAULT NULL, sound_wrong_id INT DEFAULT NULL,
      intro_text TEXT, intro_text_color VARCHAR(20) DEFAULT NULL,
      outro_text TEXT, outro_text_color VARCHAR(20) DEFAULT NULL,
      submit_button_text VARCHAR(500), continue_button_text VARCHAR(100) DEFAULT 'Continue →',
      start_button_text VARCHAR(500),
      start_button_text_color VARCHAR(20) DEFAULT NULL, start_button_bg_color VARCHAR(20) DEFAULT NULL,
      submit_button_text_color VARCHAR(20) DEFAULT NULL, submit_button_bg_color VARCHAR(20) DEFAULT NULL,
      continue_button_text_color VARCHAR(20) DEFAULT NULL, continue_button_bg_color VARCHAR(20) DEFAULT NULL,
      thankyou_subtitle VARCHAR(500) DEFAULT NULL, thankyou_subtitle_color VARCHAR(20) DEFAULT NULL,
      terms_enabled TINYINT(1) DEFAULT 0, terms_text TEXT, terms_url VARCHAR(500), meta_description TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE
    )
  `, 'wordscramble_settings table');

  await safeQuery(connection, `
    CREATE TABLE IF NOT EXISTS wordscramble_words (
      id INT AUTO_INCREMENT PRIMARY KEY, game_id INT NOT NULL,
      word_text VARCHAR(255) NOT NULL, hint_text VARCHAR(500),
      word_order INT DEFAULT 0, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE
    )
  `, 'wordscramble_words table');

  /* ── ROCK PAPER SCISSORS TABLES ── */
  console.log('✊ Creating rock paper scissors tables...');
  await safeQuery(connection, `
    CREATE TABLE IF NOT EXISTS rps_settings (
      id INT AUTO_INCREMENT PRIMARY KEY, game_id INT UNIQUE,
      rounds INT DEFAULT 5, difficulty VARCHAR(20) DEFAULT 'medium',
      show_timer TINYINT(1) DEFAULT 1, time_limit_seconds INT DEFAULT 0,
      heading_1 VARCHAR(500), heading_2 VARCHAR(500), heading_3 VARCHAR(500), description_text TEXT,
      heading_1_color VARCHAR(20) DEFAULT '#1a1a2e', heading_2_color VARCHAR(20) DEFAULT '#666666',
      heading_3_color VARCHAR(20) DEFAULT '#777777', description_color VARCHAR(20) DEFAULT '#888888',
      bg_color VARCHAR(20) DEFAULT '#0f172a', primary_color VARCHAR(20) DEFAULT '#ef4444',
      bg_image_url VARCHAR(500), thankyou_bg_image_url VARCHAR(500), game_logo_url VARCHAR(500),
      submit_confirm_gif_url VARCHAR(500), font_family VARCHAR(100) DEFAULT 'DM Sans',
      sound_win_id INT DEFAULT NULL, sound_lose_id INT DEFAULT NULL, sound_draw_id INT DEFAULT NULL,
      intro_text TEXT, intro_text_color VARCHAR(20) DEFAULT NULL,
      outro_text TEXT, outro_text_color VARCHAR(20) DEFAULT NULL,
      submit_button_text VARCHAR(500), continue_button_text VARCHAR(100) DEFAULT 'Continue →',
      start_button_text VARCHAR(500),
      start_button_text_color VARCHAR(20) DEFAULT NULL, start_button_bg_color VARCHAR(20) DEFAULT NULL,
      submit_button_text_color VARCHAR(20) DEFAULT NULL, submit_button_bg_color VARCHAR(20) DEFAULT NULL,
      continue_button_text_color VARCHAR(20) DEFAULT NULL, continue_button_bg_color VARCHAR(20) DEFAULT NULL,
      thankyou_subtitle VARCHAR(500) DEFAULT NULL, thankyou_subtitle_color VARCHAR(20) DEFAULT NULL,
      terms_enabled TINYINT(1) DEFAULT 0, terms_text TEXT, terms_url VARCHAR(500), meta_description TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE
    )
  `, 'rps_settings table');

  /* ── ARROW ESCAPE TABLES ── */
  console.log(' arrow escape tables...');
  await safeQuery(connection, `
    CREATE TABLE IF NOT EXISTS arrowescape_settings (
      id INT AUTO_INCREMENT PRIMARY KEY, game_id INT UNIQUE,
      grid_rows INT DEFAULT 8, grid_cols INT DEFAULT 8,
      difficulty VARCHAR(20) DEFAULT 'medium',
      show_timer TINYINT(1) DEFAULT 1, time_limit_seconds INT DEFAULT 0,
      heading_1 VARCHAR(500), heading_2 VARCHAR(500), heading_3 VARCHAR(500), description_text TEXT,
      heading_1_color VARCHAR(20) DEFAULT '#1a1a2e', heading_2_color VARCHAR(20) DEFAULT '#666666',
      heading_3_color VARCHAR(20) DEFAULT '#777777', description_color VARCHAR(20) DEFAULT '#888888',
      bg_color VARCHAR(20) DEFAULT '#0f172a', primary_color VARCHAR(20) DEFAULT '#f59e0b',
      bg_image_url VARCHAR(500), thankyou_bg_image_url VARCHAR(500), game_logo_url VARCHAR(500),
      submit_confirm_gif_url VARCHAR(500), font_family VARCHAR(100) DEFAULT 'DM Sans',
      sound_move_id INT DEFAULT NULL, sound_win_id INT DEFAULT NULL, sound_lose_id INT DEFAULT NULL,
      intro_text TEXT, intro_text_color VARCHAR(20) DEFAULT NULL,
      outro_text TEXT, outro_text_color VARCHAR(20) DEFAULT NULL,
      submit_button_text VARCHAR(500), continue_button_text VARCHAR(100) DEFAULT 'Continue →',
      start_button_text VARCHAR(500),
      start_button_text_color VARCHAR(20) DEFAULT NULL, start_button_bg_color VARCHAR(20) DEFAULT NULL,
      submit_button_text_color VARCHAR(20) DEFAULT NULL, submit_button_bg_color VARCHAR(20) DEFAULT NULL,
      continue_button_text_color VARCHAR(20) DEFAULT NULL, continue_button_bg_color VARCHAR(20) DEFAULT NULL,
      thankyou_subtitle VARCHAR(500) DEFAULT NULL, thankyou_subtitle_color VARCHAR(20) DEFAULT NULL,
      terms_enabled TINYINT(1) DEFAULT 0, terms_text TEXT, terms_url VARCHAR(500), meta_description TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE
    )
  `, 'arrowescape_settings table');

  await safeQuery(connection, `
    CREATE TABLE IF NOT EXISTS arrowescape_levels (
      id INT AUTO_INCREMENT PRIMARY KEY,
      game_id INT NOT NULL,
      level_name VARCHAR(255) DEFAULT 'Level 1',
      level_order INT DEFAULT 1,
      grid_rows INT DEFAULT 8,
      grid_cols INT DEFAULT 8,
      walls JSON,
      arrows JSON,
      exits JSON,
      obstacles JSON,
      is_active TINYINT(1) DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE
    )
  `, 'arrowescape_levels table');

  /* ── BRICK IMAGES TABLE ── */
   console.log('🧱 Creating brick images table...');
   await safeQuery(connection, `
     CREATE TABLE IF NOT EXISTS brick_images (
       id INT AUTO_INCREMENT PRIMARY KEY,
       image_url VARCHAR(500) NOT NULL,
       name VARCHAR(255) DEFAULT 'Brick Image',
       is_active TINYINT(1) DEFAULT 1,
       sort_order INT DEFAULT 0,
       created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
       updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
     )
   `, 'brick_images table');

   /* ── BEJEWELED GAME TABLES ── */
   console.log('💎 Creating bejeweled game tables...');
   await safeQuery(connection, `
     CREATE TABLE IF NOT EXISTS bejeweled_settings (
       id INT AUTO_INCREMENT PRIMARY KEY,
       game_id INT,
       grid_size INT DEFAULT 8,
       logo_url VARCHAR(500),
       logo_name VARCHAR(255),
       theme_colors JSON,
       match_score INT DEFAULT 10,
       chain_score_multiplier INT DEFAULT 2,
       is_active TINYINT(1) DEFAULT 1,
       created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
       updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
       FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE
     )
   `, 'bejeweled_settings table');

   await safeQuery(connection, `
     CREATE TABLE IF NOT EXISTS bejeweled_sessions (
       id INT AUTO_INCREMENT PRIMARY KEY,
       settings_id INT,
       player_id VARCHAR(100) UNIQUE,
       score INT DEFAULT 0,
       moves INT DEFAULT 0,
       start_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
       end_time TIMESTAMP NULL,
       status ENUM('active', 'completed', 'abandoned') DEFAULT 'active',
       FOREIGN KEY (settings_id) REFERENCES bejeweled_settings(id) ON DELETE CASCADE
     )
   `, 'bejeweled_sessions table');

   await safeQuery(connection, `
     CREATE TABLE IF NOT EXISTS bejeweled_moves (
       id INT AUTO_INCREMENT PRIMARY KEY,
       session_id INT,
       move_type ENUM('swap', 'match'),
       position_x INT,
       position_y INT,
       timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
       FOREIGN KEY (session_id) REFERENCES bejeweled_sessions(id) ON DELETE CASCADE
     )
    `, 'bejeweled_moves table');

   /* ── TETRIS TABLES ── */
   console.log('🧱 Creating tetris tables...');
   await safeQuery(connection, `
     CREATE TABLE IF NOT EXISTS tetris_settings (
       id INT AUTO_INCREMENT PRIMARY KEY, game_id INT UNIQUE,
       grid_width INT DEFAULT 10, grid_height INT DEFAULT 20,
       block_colors VARCHAR(200) DEFAULT '{"I":"#00f0f0","O":"#f0f000","T":"#a000f0","S":"#00f000","Z":"#f00000","J":"#0000f0","L":"#f0a000"}',
       level_speed_mult DECIMAL(4,2) DEFAULT 0.85,
       starting_level INT DEFAULT 1,
       show_timer TINYINT(1) DEFAULT 1, time_limit_seconds INT DEFAULT 0,
       heading_1 VARCHAR(500), heading_2 VARCHAR(500), heading_3 VARCHAR(500), description_text TEXT,
       heading_1_color VARCHAR(20) DEFAULT '#1a1a2e', heading_2_color VARCHAR(20) DEFAULT '#666666',
       heading_3_color VARCHAR(20) DEFAULT '#777777', description_color VARCHAR(20) DEFAULT '#888888',
       bg_color VARCHAR(20) DEFAULT '#1a1a2e', primary_color VARCHAR(20) DEFAULT '#00f0f0',
       bg_image_url VARCHAR(500), thankyou_bg_image_url VARCHAR(500), game_logo_url VARCHAR(500),
       submit_confirm_gif_url VARCHAR(500), font_family VARCHAR(100) DEFAULT 'DM Sans',
       sound_rotate_id INT DEFAULT NULL, sound_clear_id INT DEFAULT NULL,
       sound_drop_id INT DEFAULT NULL, sound_gameover_id INT DEFAULT NULL,
       intro_text TEXT, intro_text_color VARCHAR(20) DEFAULT NULL,
       outro_text TEXT, outro_text_color VARCHAR(20) DEFAULT NULL,
       submit_button_text VARCHAR(500), continue_button_text VARCHAR(100) DEFAULT 'Continue →',
       start_button_text VARCHAR(500),
       start_button_text_color VARCHAR(20) DEFAULT NULL, start_button_bg_color VARCHAR(20) DEFAULT NULL,
       submit_button_text_color VARCHAR(20) DEFAULT NULL, submit_button_bg_color VARCHAR(20) DEFAULT NULL,
       continue_button_text_color VARCHAR(20) DEFAULT NULL, continue_button_bg_color VARCHAR(20) DEFAULT NULL,
       thankyou_subtitle VARCHAR(500) DEFAULT NULL, thankyou_subtitle_color VARCHAR(20) DEFAULT NULL,
       terms_enabled TINYINT(1) DEFAULT 0, terms_text TEXT, terms_url VARCHAR(500), meta_description TEXT,
       created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
       FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE
     )
   `, 'tetris_settings table');

   await safeQuery(connection, `
     CREATE TABLE IF NOT EXISTS tetris_scores (
       id INT AUTO_INCREMENT PRIMARY KEY, settings_id INT NOT NULL,
       player_id VARCHAR(100), score INT DEFAULT 0, lines_cleared INT DEFAULT 0,
       level INT DEFAULT 1, timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
       FOREIGN KEY (settings_id) REFERENCES tetris_settings(id) ON DELETE CASCADE
     )
   `, 'tetris_scores table');

   /* ── STACK TABLES ── */
   console.log('🏗️ Creating stack tables...');
   await safeQuery(connection, `
     CREATE TABLE IF NOT EXISTS stack_settings (
       id INT AUTO_INCREMENT PRIMARY KEY, game_id INT UNIQUE,
       block_width INT DEFAULT 200, block_height INT DEFAULT 30,
       base_speed DECIMAL(4,2) DEFAULT 3.00, speed_increase DECIMAL(4,2) DEFAULT 0.15,
       show_timer TINYINT(1) DEFAULT 1, time_limit_seconds INT DEFAULT 0,
       block_color VARCHAR(20) DEFAULT '#6366f1', block_color_2 VARCHAR(20) DEFAULT '#4f46e5',
       heading_1 VARCHAR(500), heading_2 VARCHAR(500), heading_3 VARCHAR(500), description_text TEXT,
       heading_1_color VARCHAR(20) DEFAULT '#1a1a2e', heading_2_color VARCHAR(20) DEFAULT '#666666',
       heading_3_color VARCHAR(20) DEFAULT '#777777', description_color VARCHAR(20) DEFAULT '#888888',
       bg_color VARCHAR(20) DEFAULT '#0f172a', primary_color VARCHAR(20) DEFAULT '#6366f1',
       bg_image_url VARCHAR(500), thankyou_bg_image_url VARCHAR(500), game_logo_url VARCHAR(500),
       submit_confirm_gif_url VARCHAR(500), font_family VARCHAR(100) DEFAULT 'DM Sans',
       sound_place_id INT DEFAULT NULL, sound_slice_id INT DEFAULT NULL,
       sound_gameover_id INT DEFAULT NULL,
       intro_text TEXT, intro_text_color VARCHAR(20) DEFAULT NULL,
       outro_text TEXT, outro_text_color VARCHAR(20) DEFAULT NULL,
       submit_button_text VARCHAR(500), continue_button_text VARCHAR(100) DEFAULT 'Continue →',
       start_button_text VARCHAR(500),
       start_button_text_color VARCHAR(20) DEFAULT NULL, start_button_bg_color VARCHAR(20) DEFAULT NULL,
       submit_button_text_color VARCHAR(20) DEFAULT NULL, submit_button_bg_color VARCHAR(20) DEFAULT NULL,
       continue_button_text_color VARCHAR(20) DEFAULT NULL, continue_button_bg_color VARCHAR(20) DEFAULT NULL,
       thankyou_subtitle VARCHAR(500) DEFAULT NULL, thankyou_subtitle_color VARCHAR(20) DEFAULT NULL,
       terms_enabled TINYINT(1) DEFAULT 0, terms_text TEXT, terms_url VARCHAR(500), meta_description TEXT,
       created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
       FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE
     )
   `, 'stack_settings table');

   /* ── WHACK A MOLE TABLES ── */
   console.log('🔨 Creating whack a mole tables...');
   await safeQuery(connection, `
     CREATE TABLE IF NOT EXISTS whackamole_settings (
       id INT AUTO_INCREMENT PRIMARY KEY, game_id INT UNIQUE,
       grid_size INT DEFAULT 3, mole_count INT DEFAULT 3,
       mole_time_ms INT DEFAULT 1000, game_duration_sec INT DEFAULT 30,
       difficulty VARCHAR(20) DEFAULT 'medium',
       show_timer TINYINT(1) DEFAULT 1, time_limit_seconds INT DEFAULT 0,
       heading_1 VARCHAR(500), heading_2 VARCHAR(500), heading_3 VARCHAR(500), description_text TEXT,
       heading_1_color VARCHAR(20) DEFAULT '#1a1a2e', heading_2_color VARCHAR(20) DEFAULT '#666666',
       heading_3_color VARCHAR(20) DEFAULT '#777777', description_color VARCHAR(20) DEFAULT '#888888',
       bg_color VARCHAR(20) DEFAULT '#0f172a', primary_color VARCHAR(20) DEFAULT '#f59e0b',
       bg_image_url VARCHAR(500), thankyou_bg_image_url VARCHAR(500), game_logo_url VARCHAR(500),
       submit_confirm_gif_url VARCHAR(500), font_family VARCHAR(100) DEFAULT 'DM Sans',
       sound_whack_id INT DEFAULT NULL, sound_miss_id INT DEFAULT NULL, sound_gameover_id INT DEFAULT NULL,
       intro_text TEXT, intro_text_color VARCHAR(20) DEFAULT NULL,
       outro_text TEXT, outro_text_color VARCHAR(20) DEFAULT NULL,
       submit_button_text VARCHAR(500), continue_button_text VARCHAR(100) DEFAULT 'Continue →',
       start_button_text VARCHAR(500),
       start_button_text_color VARCHAR(20) DEFAULT NULL, start_button_bg_color VARCHAR(20) DEFAULT NULL,
       submit_button_text_color VARCHAR(20) DEFAULT NULL, submit_button_bg_color VARCHAR(20) DEFAULT NULL,
       continue_button_text_color VARCHAR(20) DEFAULT NULL, continue_button_bg_color VARCHAR(20) DEFAULT NULL,
       thankyou_subtitle VARCHAR(500) DEFAULT NULL, thankyou_subtitle_color VARCHAR(20) DEFAULT NULL,
       terms_enabled TINYINT(1) DEFAULT 0, terms_text TEXT, terms_url VARCHAR(500), meta_description TEXT,
       created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
       FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE
     )
   `, 'whackamole_settings table');

   await safeQuery(connection, `
     CREATE TABLE IF NOT EXISTS whackamole_scores (
       id INT AUTO_INCREMENT PRIMARY KEY, settings_id INT NOT NULL,
       player_id VARCHAR(100), score INT DEFAULT 0, moles_whacked INT DEFAULT 0,
       timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
       FOREIGN KEY (settings_id) REFERENCES whackamole_settings(id) ON DELETE CASCADE
     )
   `, 'whackamole_scores table');

   /* ── HANOI TOWER TABLES ── */
   console.log('🗼 Creating hanoi tower tables...');
   await safeQuery(connection, `
     CREATE TABLE IF NOT EXISTS hanoi_settings (
       id INT AUTO_INCREMENT PRIMARY KEY, game_id INT UNIQUE,
       disks INT DEFAULT 4, difficulty VARCHAR(20) DEFAULT 'medium',
       show_timer TINYINT(1) DEFAULT 1, time_limit_seconds INT DEFAULT 0,
       heading_1 VARCHAR(500), heading_2 VARCHAR(500), heading_3 VARCHAR(500), description_text TEXT,
       heading_1_color VARCHAR(20) DEFAULT '#1a1a2e', heading_2_color VARCHAR(20) DEFAULT '#666666',
       heading_3_color VARCHAR(20) DEFAULT '#777777', description_color VARCHAR(20) DEFAULT '#888888',
       bg_color VARCHAR(20) DEFAULT '#0f172a', primary_color VARCHAR(20) DEFAULT '#6366f1',
       bg_image_url VARCHAR(500), thankyou_bg_image_url VARCHAR(500), game_logo_url VARCHAR(500),
       submit_confirm_gif_url VARCHAR(500), font_family VARCHAR(100) DEFAULT 'DM Sans',
       sound_move_id INT DEFAULT NULL, sound_complete_id INT DEFAULT NULL, sound_gameover_id INT DEFAULT NULL,
       intro_text TEXT, intro_text_color VARCHAR(20) DEFAULT NULL,
       outro_text TEXT, outro_text_color VARCHAR(20) DEFAULT NULL,
       submit_button_text VARCHAR(500), continue_button_text VARCHAR(100) DEFAULT 'Continue →',
       start_button_text VARCHAR(500),
       start_button_text_color VARCHAR(20) DEFAULT NULL, start_button_bg_color VARCHAR(20) DEFAULT NULL,
       submit_button_text_color VARCHAR(20) DEFAULT NULL, submit_button_bg_color VARCHAR(20) DEFAULT NULL,
       continue_button_text_color VARCHAR(20) DEFAULT NULL, continue_button_bg_color VARCHAR(20) DEFAULT NULL,
       thankyou_subtitle VARCHAR(500) DEFAULT NULL, thankyou_subtitle_color VARCHAR(20) DEFAULT NULL,
       terms_enabled TINYINT(1) DEFAULT 0, terms_text TEXT, terms_url VARCHAR(500), meta_description TEXT,
       created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
       FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE
     )
   `, 'hanoi_settings table');

   await safeQuery(connection, `
     CREATE TABLE IF NOT EXISTS hanoi_scores (
       id INT AUTO_INCREMENT PRIMARY KEY, settings_id INT NOT NULL,
       player_id VARCHAR(100), score INT DEFAULT 0, moves INT DEFAULT 0, completed TINYINT(1) DEFAULT 0,
       timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
       FOREIGN KEY (settings_id) REFERENCES hanoi_settings(id) ON DELETE CASCADE
     )
   `, 'hanoi_scores table');

   /* ── BREAKOUT TABLES ── */
   console.log('🧱 Creating breakout tables...');
   await safeQuery(connection, `
     CREATE TABLE IF NOT EXISTS breakout_settings (
       id INT AUTO_INCREMENT PRIMARY KEY, game_id INT UNIQUE,
       brick_rows INT DEFAULT 5, brick_cols INT DEFAULT 8,
       ball_speed DECIMAL(4,2) DEFAULT 3.00, paddle_width INT DEFAULT 120,
       lives INT DEFAULT 3, difficulty VARCHAR(20) DEFAULT 'medium',
       show_timer TINYINT(1) DEFAULT 1, time_limit_seconds INT DEFAULT 0,
       heading_1 VARCHAR(500), heading_2 VARCHAR(500), heading_3 VARCHAR(500), description_text TEXT,
       heading_1_color VARCHAR(20) DEFAULT '#1a1a2e', heading_2_color VARCHAR(20) DEFAULT '#666666',
       heading_3_color VARCHAR(20) DEFAULT '#777777', description_color VARCHAR(20) DEFAULT '#888888',
       bg_color VARCHAR(20) DEFAULT '#0f172a', primary_color VARCHAR(20) DEFAULT '#f43f5e',
       bg_image_url VARCHAR(500), thankyou_bg_image_url VARCHAR(500), game_logo_url VARCHAR(500),
       submit_confirm_gif_url VARCHAR(500), font_family VARCHAR(100) DEFAULT 'DM Sans',
       sound_hit_id INT DEFAULT NULL, sound_brick_id INT DEFAULT NULL, sound_lose_id INT DEFAULT NULL, sound_win_id INT DEFAULT NULL,
       intro_text TEXT, intro_text_color VARCHAR(20) DEFAULT NULL,
       outro_text TEXT, outro_text_color VARCHAR(20) DEFAULT NULL,
       submit_button_text VARCHAR(500), continue_button_text VARCHAR(100) DEFAULT 'Continue →',
       start_button_text VARCHAR(500),
       start_button_text_color VARCHAR(20) DEFAULT NULL, start_button_bg_color VARCHAR(20) DEFAULT NULL,
       submit_button_text_color VARCHAR(20) DEFAULT NULL, submit_button_bg_color VARCHAR(20) DEFAULT NULL,
       continue_button_text_color VARCHAR(20) DEFAULT NULL, continue_button_bg_color VARCHAR(20) DEFAULT NULL,
       thankyou_subtitle VARCHAR(500) DEFAULT NULL, thankyou_subtitle_color VARCHAR(20) DEFAULT NULL,
       terms_enabled TINYINT(1) DEFAULT 0, terms_text TEXT, terms_url VARCHAR(500), meta_description TEXT,
       created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
       FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE
     )
   `, 'breakout_settings table');

   await safeQuery(connection, `
     CREATE TABLE IF NOT EXISTS breakout_scores (
       id INT AUTO_INCREMENT PRIMARY KEY, settings_id INT NOT NULL,
       player_id VARCHAR(100), score INT DEFAULT 0, bricks_destroyed INT DEFAULT 0, level INT DEFAULT 1,
       timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
       FOREIGN KEY (settings_id) REFERENCES breakout_settings(id) ON DELETE CASCADE
     )
   `, 'breakout_scores table');

   /* ── BUBBLE SHOOTER TABLES ── */
   console.log('🫧 Creating bubble shooter tables...');
   await safeQuery(connection, `
     CREATE TABLE IF NOT EXISTS bubbleshooter_settings (
       id INT AUTO_INCREMENT PRIMARY KEY, game_id INT UNIQUE,
       grid_rows INT DEFAULT 8, grid_cols INT DEFAULT 8,
       num_colors INT DEFAULT 5, difficulty VARCHAR(20) DEFAULT 'medium',
       show_timer TINYINT(1) DEFAULT 1, time_limit_seconds INT DEFAULT 0,
       heading_1 VARCHAR(500), heading_2 VARCHAR(500), heading_3 VARCHAR(500), description_text TEXT,
       heading_1_color VARCHAR(20) DEFAULT '#1a1a2e', heading_2_color VARCHAR(20) DEFAULT '#666666',
       heading_3_color VARCHAR(20) DEFAULT '#777777', description_color VARCHAR(20) DEFAULT '#888888',
       bg_color VARCHAR(20) DEFAULT '#0f172a', primary_color VARCHAR(20) DEFAULT '#06b6d4',
       bg_image_url VARCHAR(500), thankyou_bg_image_url VARCHAR(500), game_logo_url VARCHAR(500),
       submit_confirm_gif_url VARCHAR(500), font_family VARCHAR(100) DEFAULT 'DM Sans',
       sound_shoot_id INT DEFAULT NULL, sound_pop_id INT DEFAULT NULL, sound_gameover_id INT DEFAULT NULL,
       intro_text TEXT, intro_text_color VARCHAR(20) DEFAULT NULL,
       outro_text TEXT, outro_text_color VARCHAR(20) DEFAULT NULL,
       submit_button_text VARCHAR(500), continue_button_text VARCHAR(100) DEFAULT 'Continue →',
       start_button_text VARCHAR(500),
       start_button_text_color VARCHAR(20) DEFAULT NULL, start_button_bg_color VARCHAR(20) DEFAULT NULL,
       submit_button_text_color VARCHAR(20) DEFAULT NULL, submit_button_bg_color VARCHAR(20) DEFAULT NULL,
       continue_button_text_color VARCHAR(20) DEFAULT NULL, continue_button_bg_color VARCHAR(20) DEFAULT NULL,
       thankyou_subtitle VARCHAR(500) DEFAULT NULL, thankyou_subtitle_color VARCHAR(20) DEFAULT NULL,
       terms_enabled TINYINT(1) DEFAULT 0, terms_text TEXT, terms_url VARCHAR(500), meta_description TEXT,
       created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
       FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE
     )
   `, 'bubbleshooter_settings table');

   await safeQuery(connection, `
     CREATE TABLE IF NOT EXISTS bubbleshooter_scores (
       id INT AUTO_INCREMENT PRIMARY KEY, settings_id INT NOT NULL,
       player_id VARCHAR(100), score INT DEFAULT 0,
       timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
       FOREIGN KEY (settings_id) REFERENCES bubbleshooter_settings(id) ON DELETE CASCADE
     )
   `, 'bubbleshooter_scores table');

   /* ── CAR LAUNCH TABLES ── */
   console.log('🏎️ Creating car launch tables...');
   await safeQuery(connection, `
     CREATE TABLE IF NOT EXISTS carlaunch_settings (
       id INT AUTO_INCREMENT PRIMARY KEY, game_id INT UNIQUE,
       car_make VARCHAR(100) DEFAULT '', car_model VARCHAR(100) DEFAULT '',
       car_year INT DEFAULT 2024, car_trim VARCHAR(100) DEFAULT '',
       engine_hp DECIMAL(7,2) DEFAULT 0, engine_torque DECIMAL(7,2) DEFAULT 0,
       engine_cylinders INT DEFAULT 0, engine_displacement DECIMAL(5,2) DEFAULT 0,
       weight_kg INT DEFAULT 1500, drivetrain VARCHAR(20) DEFAULT 'RWD',
       transmission_type VARCHAR(20) DEFAULT 'Automatic', gears INT DEFAULT 8,
       zero_to_60 DECIMAL(4,2) DEFAULT 0, quarter_mile DECIMAL(5,2) DEFAULT 0,
       car_model_url VARCHAR(500) DEFAULT NULL,
       color_options JSON DEFAULT NULL, default_color VARCHAR(20) DEFAULT '#ef4444',
       heading_1 VARCHAR(500), heading_2 VARCHAR(500), heading_3 VARCHAR(500), description_text TEXT,
       heading_1_color VARCHAR(20) DEFAULT '#1a1a2e', heading_2_color VARCHAR(20) DEFAULT '#666666',
       heading_3_color VARCHAR(20) DEFAULT '#777777', description_color VARCHAR(20) DEFAULT '#888888',
       bg_color VARCHAR(20) DEFAULT '#0f172a', primary_color VARCHAR(20) DEFAULT '#ef4444',
       bg_image_url VARCHAR(500), thankyou_bg_image_url VARCHAR(500), game_logo_url VARCHAR(500),
       submit_confirm_gif_url VARCHAR(500), font_family VARCHAR(100) DEFAULT 'DM Sans',
        sound_start_id INT DEFAULT NULL, sound_shift_id INT DEFAULT NULL, sound_finish_id INT DEFAULT NULL,
        show_timer TINYINT(1) DEFAULT 1, time_limit_seconds INT DEFAULT 0,
        intro_text TEXT, intro_text_color VARCHAR(20) DEFAULT NULL,
       outro_text TEXT, outro_text_color VARCHAR(20) DEFAULT NULL,
       submit_button_text VARCHAR(500), continue_button_text VARCHAR(100) DEFAULT 'Continue →',
       start_button_text VARCHAR(500),
       start_button_text_color VARCHAR(20) DEFAULT NULL, start_button_bg_color VARCHAR(20) DEFAULT NULL,
       submit_button_text_color VARCHAR(20) DEFAULT NULL, submit_button_bg_color VARCHAR(20) DEFAULT NULL,
       continue_button_text_color VARCHAR(20) DEFAULT NULL, continue_button_bg_color VARCHAR(20) DEFAULT NULL,
       thankyou_subtitle VARCHAR(500) DEFAULT NULL, thankyou_subtitle_color VARCHAR(20) DEFAULT NULL,
       terms_enabled TINYINT(1) DEFAULT 0, terms_text TEXT, terms_url VARCHAR(500), meta_description TEXT,
       created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
       FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE
     )
   `, 'carlaunch_settings table');

  /* STRESSBUSTER (FRUSTRATION) SETTINGS */
  await safeQuery(connection, `
    CREATE TABLE IF NOT EXISTS stressbuster_settings (
      id INT AUTO_INCREMENT PRIMARY KEY,
      game_id INT UNIQUE,
      heading_1 VARCHAR(500),
      heading_2 VARCHAR(500),
      heading_3 VARCHAR(500),
      description_text TEXT,
      heading_1_color VARCHAR(20) DEFAULT '#1a1a2e',
      heading_2_color VARCHAR(20) DEFAULT '#1a1a2e',
      heading_3_color VARCHAR(20) DEFAULT '#444444',
      description_color VARCHAR(20) DEFAULT '#666666',
      custom_win_msg VARCHAR(500),
      try_again_btn_text VARCHAR(100),
      try_again_text_color VARCHAR(20) DEFAULT '#ffffff',
      try_again_bg_color VARCHAR(20),
      continue_btn_text VARCHAR(100),
      continue_btn_text_color VARCHAR(20) DEFAULT '#ffffff',
      continue_btn_bg_color VARCHAR(20),
      bg_color VARCHAR(20) DEFAULT '#f4f6fb',
      primary_color VARCHAR(20) DEFAULT '#9333ea',
      board_cell_color VARCHAR(20),
      font_family VARCHAR(100) DEFAULT 'DM Sans',
      meta_description TEXT,
      sound_correct_id INT DEFAULT NULL,
      sound_wrong_id INT DEFAULT NULL,
      win_sound_id INT DEFAULT NULL,
      lose_sound_id INT DEFAULT NULL,
      game_mode VARCHAR(50),
      difficulty VARCHAR(50),
      target_count INT DEFAULT 20,
      time_limit INT DEFAULT 0,
      terms_enabled TINYINT(1) DEFAULT 0,
      terms_text VARCHAR(255),
      terms_url VARCHAR(500),
      start_button_text VARCHAR(100),
      start_button_text_color VARCHAR(20) DEFAULT '#ffffff',
      start_button_bg_color VARCHAR(20),
      thankyou_heading_text VARCHAR(500),
      thankyou_heading_color VARCHAR(20),
      thankyou_subtitle_text VARCHAR(500),
      thankyou_subtitle_color VARCHAR(20),
      submit_btn_text VARCHAR(100),
      submit_btn_text_color VARCHAR(20) DEFAULT '#ffffff',
      submit_btn_bg_color VARCHAR(20),
      redirect_url VARCHAR(500),
      continue_now_btn_text VARCHAR(100),
      continue_now_btn_text_color VARCHAR(20) DEFAULT '#ffffff',
      continue_now_btn_bg_color VARCHAR(20),
      click_limit INT DEFAULT 21,
      timer_enabled TINYINT(1) DEFAULT 0,
      show_click_count TINYINT(1) DEFAULT 1,
      click_mode VARCHAR(50),
      frustration_enabled TINYINT(1) DEFAULT 0,
      show_click_speed TINYINT(1) DEFAULT 0,
      show_frustration_result TINYINT(1) DEFAULT 0,
      cat_health INT DEFAULT 20,
      millisecond_display TINYINT(1) DEFAULT 0,
      frustration_mode TINYINT(1) DEFAULT 0,
      bg_image_url VARCHAR(500),
      thankyou_bg_image_url VARCHAR(500),
      game_logo_url VARCHAR(500),
      submit_confirm_gif_url VARCHAR(500),
      o_image_url VARCHAR(500),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `, 'stressbuster_settings table');

  /* SOUNDIFY SETTINGS */
  await safeQuery(connection, `
    CREATE TABLE IF NOT EXISTS soundify_settings (
      id INT AUTO_INCREMENT PRIMARY KEY,
      game_id INT UNIQUE,
      heading_1 VARCHAR(500),
      heading_2 VARCHAR(500),
      heading_3 VARCHAR(500),
      description_text TEXT,
      heading_1_color VARCHAR(20) DEFAULT '#1a1a2e',
      heading_2_color VARCHAR(20) DEFAULT '#1a1a2e',
      heading_3_color VARCHAR(20) DEFAULT '#444444',
      description_color VARCHAR(20) DEFAULT '#666666',
      custom_win_msg VARCHAR(500),
      custom_lose_msg VARCHAR(500),
      try_again_btn_text VARCHAR(100),
      try_again_text_color VARCHAR(20) DEFAULT '#ffffff',
      try_again_bg_color VARCHAR(20),
      continue_btn_text VARCHAR(100),
      continue_btn_text_color VARCHAR(20) DEFAULT '#ffffff',
      continue_btn_bg_color VARCHAR(20),
      bg_color VARCHAR(20) DEFAULT '#1a1a2e',
      primary_color VARCHAR(20) DEFAULT '#8b5cf6',
      font_family VARCHAR(100) DEFAULT 'DM Sans',
      meta_description TEXT,
      sound_correct_id INT DEFAULT NULL,
      sound_wrong_id INT DEFAULT NULL,
      win_sound_id INT DEFAULT NULL,
      lose_sound_id INT DEFAULT NULL,
      terms_enabled TINYINT(1) DEFAULT 0,
      terms_text VARCHAR(255),
      terms_url VARCHAR(500),
      start_button_text VARCHAR(100),
      start_button_text_color VARCHAR(20) DEFAULT '#ffffff',
      start_button_bg_color VARCHAR(20),
      thankyou_heading_text VARCHAR(500),
      thankyou_heading_color VARCHAR(20),
      thankyou_subtitle_text VARCHAR(500),
      thankyou_subtitle_color VARCHAR(20),
      submit_btn_text VARCHAR(100),
      submit_btn_text_color VARCHAR(20) DEFAULT '#ffffff',
      submit_btn_bg_color VARCHAR(20),
      redirect_url VARCHAR(500),
      continue_now_btn_text VARCHAR(100),
      continue_now_btn_text_color VARCHAR(20) DEFAULT '#ffffff',
      continue_now_btn_bg_color VARCHAR(20),
      time_per_question INT DEFAULT 30,
      max_sound_replays INT DEFAULT 1,
      bg_image_url VARCHAR(500),
      thankyou_bg_image_url VARCHAR(500),
      game_logo_url VARCHAR(500),
      submit_confirm_gif_url VARCHAR(500),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `, 'soundify_settings table');

  /* SOUNDIFY SONGS */
  await safeQuery(connection, `
    CREATE TABLE IF NOT EXISTS soundify_songs (
      id INT AUTO_INCREMENT PRIMARY KEY,
      game_id INT NOT NULL,
      song_title VARCHAR(500),
      song_url VARCHAR(500),
      option_1 VARCHAR(500),
      option_2 VARCHAR(500),
      option_3 VARCHAR(500),
      option_4 VARCHAR(500),
      correct_option INT DEFAULT 1,
      song_order INT DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `, 'soundify_songs table');

await safeQuery(connection, `
    CREATE TABLE IF NOT EXISTS tictactoe_settings (
      id INT AUTO_INCREMENT PRIMARY KEY,
      game_id INT NOT NULL UNIQUE,
      heading_1 VARCHAR(255) DEFAULT NULL,
      heading_2 VARCHAR(255) DEFAULT NULL,
      heading_3 VARCHAR(255) DEFAULT NULL,
      description_text TEXT DEFAULT NULL,
      heading_1_color VARCHAR(20) DEFAULT '#1a1a2e',
      heading_2_color VARCHAR(20) DEFAULT '#666666',
      heading_3_color VARCHAR(20) DEFAULT '#777777',
      description_color VARCHAR(20) DEFAULT '#888888',
      custom_win_msg VARCHAR(255) DEFAULT NULL,
      try_again_btn_text VARCHAR(100) DEFAULT NULL,
      try_again_text_color VARCHAR(20) DEFAULT '#ffffff',
      try_again_bg_color VARCHAR(20) DEFAULT NULL,
      continue_btn_text VARCHAR(100) DEFAULT NULL,
      continue_btn_text_color VARCHAR(20) DEFAULT '#ffffff',
      continue_btn_bg_color VARCHAR(20) DEFAULT NULL,
      bg_color VARCHAR(20) DEFAULT '#1e293b',
      primary_color VARCHAR(20) DEFAULT '#6366f1',
      board_cell_color VARCHAR(20) DEFAULT '#ffffff',
      bg_image_url VARCHAR(500) DEFAULT NULL,
      thankyou_bg_image_url VARCHAR(500) DEFAULT NULL,
      game_logo_url VARCHAR(500) DEFAULT NULL,
      font_family VARCHAR(100) DEFAULT 'DM Sans',
      meta_description TEXT DEFAULT NULL,
      submit_confirm_gif_url VARCHAR(500) DEFAULT NULL,
      o_image_url VARCHAR(500) DEFAULT NULL,
      enable_board_selection TINYINT(1) DEFAULT 1,
      enable_level_selection TINYINT(1) DEFAULT 1,
      board_size VARCHAR(10) DEFAULT '3',
      difficulty VARCHAR(20) DEFAULT 'easy',
      terms_enabled TINYINT(1) DEFAULT 0,
      terms_text TEXT DEFAULT NULL,
      terms_url VARCHAR(500) DEFAULT NULL,
      start_button_text VARCHAR(100) DEFAULT 'Start Game',
      start_button_text_color VARCHAR(20) DEFAULT '#ffffff',
      start_button_bg_color VARCHAR(20) DEFAULT NULL,
      sound_correct_id INT DEFAULT NULL,
      sound_wrong_id INT DEFAULT NULL,
      win_sound_id INT DEFAULT NULL,
      lose_sound_id INT DEFAULT NULL,
      thankyou_heading_text VARCHAR(255) DEFAULT NULL,
      thankyou_heading_color VARCHAR(20) DEFAULT '#1a1a2e',
      thankyou_subtitle_text TEXT DEFAULT NULL,
      thankyou_subtitle_color VARCHAR(20) DEFAULT '#444444',
      submit_btn_text VARCHAR(100) DEFAULT NULL,
      submit_btn_text_color VARCHAR(20) DEFAULT '#ffffff',
      submit_btn_bg_color VARCHAR(20) DEFAULT '#000000',
      redirect_url VARCHAR(500) DEFAULT NULL,
      continue_now_btn_text VARCHAR(100) DEFAULT NULL,
      continue_now_btn_text_color VARCHAR(20) DEFAULT '#ffffff',
      continue_now_btn_bg_color VARCHAR(20) DEFAULT '#000000',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `, 'tictactoe_settings table');

   /* ── BUSINESS DEVELOPERS ── */
   await safeQuery(connection, `
     CREATE TABLE IF NOT EXISTS business_developers (
       id INT AUTO_INCREMENT PRIMARY KEY,
       name VARCHAR(100) NOT NULL,
       email VARCHAR(150) NOT NULL UNIQUE,
       phone VARCHAR(50),
       password VARCHAR(255),
       created_by INT,
       is_active TINYINT(1) DEFAULT 1,
       created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
       updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
     )
   `, 'business_developers table');

   /* ── BD REQUESTS ── */
   await safeQuery(connection, `
     CREATE TABLE IF NOT EXISTS bd_requests (
       id INT AUTO_INCREMENT PRIMARY KEY,
       bd_id INT NOT NULL,
       business_name VARCHAR(255) NOT NULL,
       gmaps_url VARCHAR(500),
       social_url VARCHAR(500),
       game_category VARCHAR(50) NOT NULL,
       status ENUM('pending','approved','started_working','game_creating','testing','live','rejected') DEFAULT 'pending',
       client_id INT DEFAULT NULL,
       game_id INT DEFAULT NULL,
       created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
       updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
       FOREIGN KEY (bd_id) REFERENCES business_developers(id) ON DELETE CASCADE
     )
   `, 'bd_requests table');

   /* ── BUSINESS OWNERS (replaces BD) ── */
   await safeQuery(connection, `
     CREATE TABLE IF NOT EXISTS business_owners (
       id INT AUTO_INCREMENT PRIMARY KEY,
       parent_id INT DEFAULT NULL,
       business_name VARCHAR(255) NOT NULL UNIQUE,
       email VARCHAR(255) NOT NULL,
       password VARCHAR(255) NOT NULL,
       is_active TINYINT(1) DEFAULT 1,
       created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
       updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
       FOREIGN KEY (parent_id) REFERENCES business_owners(id) ON DELETE SET NULL
     )
   `, 'business_owners table');

   /* ── BUSINESS OWNER GAMES (links BO to games with location + reward) ── */
   await safeQuery(connection, `
     CREATE TABLE IF NOT EXISTS business_owner_games (
       id INT AUTO_INCREMENT PRIMARY KEY,
       business_owner_id INT NOT NULL,
       game_id INT NOT NULL,
       location_name VARCHAR(255) DEFAULT '',
       reward_text TEXT DEFAULT NULL,
       parent_id INT DEFAULT NULL,
       created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
       FOREIGN KEY (business_owner_id) REFERENCES business_owners(id) ON DELETE CASCADE,
       FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE,
       FOREIGN KEY (parent_id) REFERENCES business_owner_games(id) ON DELETE SET NULL
     )
   `, 'business_owner_games table');

   /* Migrate: add parent_id to existing business_owner_games */
   try {
     await connection.query("ALTER TABLE business_owner_games ADD COLUMN parent_id INT DEFAULT NULL AFTER reward_text");
     console.log('✅ Added business_owner_games.parent_id column');
   } catch (err) {
     // Column might already exist
   }

   /* ── BUSINESS REDEMPTIONS (6-digit code + redemption flow) ── */
   await safeQuery(connection, `
     CREATE TABLE IF NOT EXISTS business_redemptions (
       id INT AUTO_INCREMENT PRIMARY KEY,
       business_owner_id INT NOT NULL,
       game_id INT NOT NULL,
       session_id INT DEFAULT NULL,
       code VARCHAR(6) DEFAULT NULL,
       player_name VARCHAR(255) DEFAULT '',
       player_phone VARCHAR(50) DEFAULT '',
       player_email VARCHAR(255) DEFAULT '',
       is_player TINYINT(1) DEFAULT 0,
       status ENUM('pending','code_revealed','code_entered','player_confirmed','completed') DEFAULT 'pending',
       offer_details TEXT DEFAULT NULL,
       created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
       updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
       FOREIGN KEY (business_owner_id) REFERENCES business_owners(id) ON DELETE CASCADE,
       FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE
     )
   `, 'business_redemptions table');

   /* BUSINESS REDEMPTIONS — migrate existing tables */
   try {
     await connection.query("ALTER TABLE business_redemptions MODIFY COLUMN code VARCHAR(6) DEFAULT NULL");
     console.log('✅ Made business_redemptions.code nullable');
   } catch (err) {
     // Column might already be nullable
   }
   try {
     await connection.query("ALTER TABLE business_redemptions MODIFY COLUMN status ENUM('pending','code_revealed','code_entered','player_confirmed','completed') DEFAULT 'pending'");
     console.log('✅ Updated business_redemptions.status ENUM');
   } catch (err) {
     // ENUM might already be correct
   }
   await addColumn(connection, 'business_redemptions', 'promo_player_id', 'INT DEFAULT NULL');
   try {
     await connection.query("ALTER TABLE business_redemptions MODIFY COLUMN status ENUM('pending','code_revealed','code_entered','player_confirmed','completed') DEFAULT 'pending'");
     console.log('✅ Updated business_redemptions.status ENUM');
   } catch (err) {
     // ENUM might already be correct
   }

   /* GAMES — add status column */
   try {
     const exists = await columnExists(connection, 'games', 'status');
     if (!exists) {
       await connection.query("ALTER TABLE games ADD COLUMN status ENUM('development','testing','live') DEFAULT 'development'");
       console.log('✅ Added games.status column');
     }
   } catch (err) {
     console.error('❌ Failed adding games.status:', err.message);
   }

   /* BUSINESS REDEMPTIONS — add data privacy & accept/reject columns */
   try {
     await connection.query("ALTER TABLE business_redemptions MODIFY COLUMN status ENUM('pending','code_revealed','code_entered','player_confirmed','completed','rejected') DEFAULT 'pending'");
     console.log('✅ Added rejected to business_redemptions.status ENUM');
   } catch (err) { /* already added */ }
   await addColumn(connection, 'business_redemptions', 'accepted_by', 'INT DEFAULT NULL');
   await addColumn(connection, 'business_redemptions', 'accepted_at', 'DATETIME DEFAULT NULL');
   await addColumn(connection, 'business_redemptions', 'rejected_by', 'INT DEFAULT NULL');
   await addColumn(connection, 'business_redemptions', 'rejected_at', 'DATETIME DEFAULT NULL');
  await addColumn(connection, 'business_redemptions', 'reject_reason', 'VARCHAR(500) DEFAULT NULL');
  await addColumn(connection, 'business_redemptions', 'table_number', 'VARCHAR(50) DEFAULT NULL');

  // ── Geo columns for map-based location manager (pincode → lat/lng) ──
  await addColumn(connection, 'business_owners', 'latitude', 'DECIMAL(10,7) DEFAULT NULL');
  await addColumn(connection, 'business_owners', 'longitude', 'DECIMAL(10,7) DEFAULT NULL');

   /* GAMES — add email_settings JSON column */
   await addColumn(connection, 'games', 'email_settings', "JSON DEFAULT NULL");

   /* GAMES — add game_type column for branded/promogames distinction */
   await addColumn(connection, 'games', 'game_type', "VARCHAR(50) DEFAULT 'promogames'");

   /* PROMO_PLAYERS — ensure required columns exist */
   await addColumn(connection, 'promo_players', 'username', "VARCHAR(100) DEFAULT NULL");
   await addColumn(connection, 'promo_players', 'avatar_id', "VARCHAR(50) DEFAULT NULL");

   /* PROMO_PLAYERS — ensure username unique index exists */
   try {
     const [[idx]] = await connection.query(
       `SELECT COUNT(*) AS cnt FROM information_schema.STATISTICS
        WHERE table_schema = ? AND table_name = 'promo_players' AND index_name = 'idx_username'`,
       [dbName]
     );
     if (idx.cnt === 0) {
       await connection.query('ALTER TABLE promo_players ADD UNIQUE INDEX idx_username (username)');
       console.log('✅ Added promo_players.username unique index');
     }
   } catch (err) {
     console.error('❌ username unique index:', err.message);
   }

   /* PC_TRANSACTIONS — add referral_bonus type + session_id column */
   try {
     await connection.query("ALTER TABLE pc_transactions MODIFY COLUMN type ENUM('earn','spend','reset','referral_bonus') NOT NULL");
   } catch (err) { /* may already be updated */ }
   await addColumn(connection, 'pc_transactions', 'session_id', 'INT DEFAULT NULL');

   /* PC_TRANSACTIONS — game category on the earnings row (audit + display) */
   await addColumn(connection, 'pc_transactions', 'game_type', "VARCHAR(50) DEFAULT NULL");

   /* PC_TRANSACTIONS — level number for per-level earn rows (0 = full-session
      completion, >=1 = level-based reward from progress endpoints) */
   await addColumn(connection, 'pc_transactions', 'level', "INT NOT NULL DEFAULT 0");

   /* PC_TRANSACTIONS — idempotency backstop: one 'earn' row per session+level.
      Crediting happens inside a row-locked transaction (lib/promocoins.js),
      but this unique index makes a racing double-award impossible at the DB
      level too. It also de-dupes referral_bonus per session (already guarded
      in code, now enforced by the schema). NULL session_id rows (spend/reset)
      are unaffected — MySQL unique indexes ignore NULLs. */
   try {
     const [[oldIx]] = await connection.query(
       `SELECT COUNT(*) AS cnt FROM information_schema.STATISTICS
        WHERE table_schema = ? AND table_name = 'pc_transactions' AND index_name = 'uniq_pc_earn_session'`,
       [dbName]
     );
     if (oldIx.cnt > 0) {
       await connection.query('ALTER TABLE pc_transactions DROP INDEX uniq_pc_earn_session');
       console.log('♻️  Dropped old pc_transactions.uniq_pc_earn_session (session_id, type) index');
     }
   } catch (err) { /* index didn't exist — nothing to drop */ }
   try {
     const [[pcIx]] = await connection.query(
       `SELECT COUNT(*) AS cnt FROM information_schema.STATISTICS
        WHERE table_schema = ? AND table_name = 'pc_transactions' AND index_name = 'uniq_pc_earn_session_level'`,
       [dbName]
     );
     if (pcIx.cnt === 0) {
       await connection.query('ALTER TABLE pc_transactions ADD UNIQUE INDEX uniq_pc_earn_session_level (session_id, type, level)');
       console.log('✅ Added pc_transactions.uniq_pc_earn_session_level unique index');
     }
   } catch (err) {
     // Pre-existing duplicate earn rows for a session would block the index.
     // That should never happen (pc_awarded has always guarded crediting), but
     // log it loudly so it can be reconciled instead of silently skipping.
     console.error('❌ uniq_pc_earn_session_level unique index:', err.message);
   }

   /* INTERNAL_TEAM — ensure password/phone/permissions columns exist */
   await addColumn(connection, 'internal_team', 'phone', 'VARCHAR(50) DEFAULT NULL');
   await addColumn(connection, 'internal_team', 'password', 'VARCHAR(255) DEFAULT NULL');
   await addColumn(connection, 'internal_team', 'permissions', 'TEXT DEFAULT NULL');

   /* BD_REQUESTS — add assigned_to for internal team */
   await addColumn(connection, 'bd_requests', 'assigned_to', 'INT DEFAULT NULL');

   /* NOTIFICATIONS TABLE */
   await safeQuery(connection, `
     CREATE TABLE IF NOT EXISTS notifications (
       id INT AUTO_INCREMENT PRIMARY KEY,
       user_id INT NOT NULL,
        user_type ENUM('admin','it','bd','business_owner') NOT NULL,
       type VARCHAR(20) DEFAULT 'info',
       title VARCHAR(255) NOT NULL,
       message TEXT,
       link VARCHAR(500),
       read_at TIMESTAMP NULL DEFAULT NULL,
       created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
       INDEX idx_notif_user (user_id, user_type, read_at)
     )
   `, 'notifications table');

   /* CHESS SETTINGS */
   await safeQuery(connection, `
     CREATE TABLE IF NOT EXISTS chess_settings (
       id INT AUTO_INCREMENT PRIMARY KEY,
       game_id INT NOT NULL,
       difficulty ENUM('easy','medium','hard','master') DEFAULT 'medium',
       time_control INT DEFAULT 0,
       board_theme VARCHAR(50) DEFAULT 'classic',
       primary_color VARCHAR(20) DEFAULT '#7B3EFF',
       bg_color VARCHAR(20) DEFAULT '#0f0f23',
       intro_text TEXT,
       outro_text TEXT,
       show_coordinates TINYINT(1) DEFAULT 1,
       piece_style VARCHAR(50) DEFAULT 'classic',
       sound_enabled TINYINT(1) DEFAULT 1,
       created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
       UNIQUE KEY uk_chess_game (game_id)
     )
   `, 'chess_settings table');

   /* CHESS ROOMS (multiplayer) */
   await safeQuery(connection, `
     CREATE TABLE IF NOT EXISTS chess_rooms (
       id INT AUTO_INCREMENT PRIMARY KEY,
       room_code VARCHAR(6) NOT NULL UNIQUE,
       game_id INT NOT NULL,
       player1_id INT DEFAULT NULL,
       player2_id INT DEFAULT NULL,
       player1_name VARCHAR(100) DEFAULT 'Player 1',
       player2_name VARCHAR(100) DEFAULT 'Player 2',
       status ENUM('waiting','active','finished') DEFAULT 'waiting',
       current_turn ENUM('white','black') DEFAULT 'white',
       fen VARCHAR(200) DEFAULT 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
       result ENUM('ongoing','white','black','draw') DEFAULT 'ongoing',
       time_control INT DEFAULT 0,
       white_time_left INT DEFAULT 0,
       black_time_left INT DEFAULT 0,
       created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
       updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
       INDEX idx_room_code (room_code),
       INDEX idx_room_game (game_id),
       INDEX idx_room_status (status)
     )
   `, 'chess_rooms table');

   /* CHESS MOVES */
   await safeQuery(connection, `
     CREATE TABLE IF NOT EXISTS chess_moves (
       id INT AUTO_INCREMENT PRIMARY KEY,
       room_id INT NOT NULL,
       move_number INT NOT NULL,
       notation VARCHAR(20) NOT NULL,
       fen_before VARCHAR(200),
       fen_after VARCHAR(200),
       player_id INT DEFAULT NULL,
       player_color ENUM('white','black') NOT NULL,
       time_spent INT DEFAULT 0,
       created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
       INDEX idx_moves_room (room_id)
     )
   `, 'chess_moves table');

   console.log('👤 Creating admin user...');

  const adminEmail = process.env.ADMIN_EMAIL || 'admin@yourdomain.com';
  const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@123';
  const hashedPassword = await bcrypt.hash(adminPassword, 10);

  try {
    const [existingAdmin] = await connection.query('SELECT id FROM users WHERE email = ?', [adminEmail]);
    if (existingAdmin.length === 0) {
      await connection.query('INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)', ['Admin', adminEmail, hashedPassword, 'admin']);
      console.log(`✅ Admin created: ${adminEmail}`);
    } else {
      console.log('ℹ️ Admin already exists');
    }
  } catch (err) {
    console.error('❌ Admin creation failed:', err.message);
  }

  /* TOWER GAME SEED */
  try {
    const [existingTower] = await connection.query('SELECT id FROM games WHERE slug = ?', ['tower']);
    if (existingTower.length === 0) {
      const [clientRows] = await connection.query("SELECT id FROM clients WHERE slug = 'promo' LIMIT 1");
      let clientId = clientRows.length > 0 ? clientRows[0].id : null;
      if (!clientId) {
        const [anyClients] = await connection.query('SELECT id FROM clients LIMIT 1');
        clientId = anyClients.length > 0 ? anyClients[0].id : null;
      }
      if (clientId) {
        await connection.query(
          `INSERT INTO games (name, category, game_type, slug, client_id, is_active, show_in_play_page, status)
           VALUES ('Tower Building', 'tower', 'promogames', 'tower', ?, 1, 1, 'live')`,
          [clientId]
        );
        console.log('✅ Tower game seeded');
      }
    }
  } catch (err) {
    console.error('❌ Tower game seed failed:', err.message);
  }

  /* ================= PLAYER ENGAGEMENT: high scores & best scores ================= */

  // games.high_score — all-time high score per game
  await addColumn(connection, 'games', 'high_score', 'INT DEFAULT 0');

  // player_best_scores — per-player best score per game (upserted with GREATEST).
  // No FKs on purpose: promo_players is created by config/initPromo.js which may
  // run separately; integrity is enforced at the API layer.
  await safeQuery(connection, `
    CREATE TABLE IF NOT EXISTS player_best_scores (
      id INT AUTO_INCREMENT PRIMARY KEY,
      promo_player_id INT NOT NULL,
      game_id INT NOT NULL,
      best_score INT DEFAULT 0,
      plays INT DEFAULT 1,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY uniq_player_game (promo_player_id, game_id),
      KEY idx_game_score (game_id, best_score)
    )
  `, 'player_best_scores table');

  // promo_players.profile_complete — 0 for instant-OTP signups until they set
  // name + username (dashboards use it to nudge profile completion)
  await addColumn(connection, 'promo_players', 'profile_complete', 'TINYINT(1) DEFAULT 0');

  // Composite index powering every play-count subquery (arcade / hero / play-count)
  try {
    const [idxRows] = await connection.query(
      "SHOW INDEX FROM player_sessions WHERE Key_name = 'idx_ps_game_completed'"
    );
    if (idxRows.length === 0) {
      await connection.query('CREATE INDEX idx_ps_game_completed ON player_sessions (game_id, completed)');
      console.log('✅ Added player_sessions(game_id, completed) index');
    }
  } catch (err) {
    console.error('❌ player_sessions index:', err.message);
  }

  // Spot registration schema (idempotent)
  try { await require('../sql/migrate-spotreg')(); } catch (e) { console.error('Spotreg migration:', e.message); }

  await connection.end();
  console.log('✅ Migration completed successfully!');
}

/* ================= EXPORT ================= */

module.exports = initDB;

/* ================= RUN (when called directly) ================= */

if (require.main === module) {
  initDB().catch(err => {
    console.error('❌ Migration failed:', err);
    process.exit(1);
  });
}
