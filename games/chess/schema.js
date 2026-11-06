module.exports = {
  table: 'chess_settings',
  fields: [
    'difficulty', 'time_control', 'board_theme', 'primary_color', 'bg_color',
    'intro_text', 'outro_text', 'show_coordinates', 'piece_style', 'sound_enabled',
  ],
  uploads: [],
  defaults: {
    difficulty: 'medium',
    time_control: 600,
    board_theme: 'classic',
    primary_color: '#6366f1',
    bg_color: '#0f172a',
    show_coordinates: 1,
    piece_style: 'standard',
    sound_enabled: 1,
  },
  tables: {
    chess_settings: `
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
      )`,
    chess_rooms: `
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
      )`,
    chess_rooms_additive: [
      "ALTER TABLE chess_rooms ADD COLUMN IF NOT EXISTS rematch_status ENUM('none','requested','accepted','declined','expired') DEFAULT 'none'",
      "ALTER TABLE chess_rooms ADD COLUMN IF NOT EXISTS rematch_requested_by VARCHAR(100) DEFAULT NULL",
      "ALTER TABLE chess_rooms ADD COLUMN IF NOT EXISTS rematch_requested_by_id INT DEFAULT NULL",
      "ALTER TABLE chess_rooms ADD COLUMN IF NOT EXISTS rematch_requested_at TIMESTAMP NULL DEFAULT NULL",
      "ALTER TABLE chess_rooms ADD COLUMN IF NOT EXISTS rematch_new_room_code VARCHAR(6) DEFAULT NULL",
      "ALTER TABLE chess_rooms ADD COLUMN IF NOT EXISTS rematch_of_id INT DEFAULT NULL",
      "ALTER TABLE chess_rooms ADD COLUMN IF NOT EXISTS active_clock_color ENUM('white','black') DEFAULT 'white'",
      "ALTER TABLE chess_rooms ADD COLUMN IF NOT EXISTS clock_started_at TIMESTAMP NULL DEFAULT NULL",
    ],
    chess_moves: `
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
      )`,
    chess_messages: `
      CREATE TABLE IF NOT EXISTS chess_messages (
        id INT AUTO_INCREMENT PRIMARY KEY,
        room_id INT NOT NULL,
        sender_name VARCHAR(100) NOT NULL,
        message TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_msg_room (room_id)
      )`,
  },
};
