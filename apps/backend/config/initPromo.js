require('dotenv').config();
const env = require('./env');
const mysql = require('mysql2/promise');

async function safeQuery(conn, sql, label) {
  try {
    await conn.query(sql);
    if (label) console.log(`✅ ${label}`);
  } catch (err) {
    console.error(`❌ ${label || 'Query failed'}:`, err.message);
  }
}

async function initPromo() {
  const connection = await mysql.createConnection({
    host: env.DB_HOST,
    port: env.DB_PORT,
    user: env.DB_USER,
    password: env.DB_PASSWORD,
    multipleStatements: true,
    charset: 'utf8mb4',
  });

  const dbName = env.DB_NAME;
  await connection.query(`USE \`${dbName}\``);

  console.log('🚀 Running PromoPlayer migration...');

  // ── 1. PROMO PLAYERS ──────────────────────────────────────────────────────
  await safeQuery(connection, `
    CREATE TABLE IF NOT EXISTS promo_players (
      id           INT AUTO_INCREMENT PRIMARY KEY,
      name         VARCHAR(100)  NOT NULL,
      username     VARCHAR(50)   DEFAULT NULL UNIQUE,
      username_changed_at DATETIME DEFAULT NULL,
      age          INT,
      dob          DATE,
      email        VARCHAR(150)  NOT NULL UNIQUE,
      whatsapp     VARCHAR(20),
      city         VARCHAR(100),
      pincode      VARCHAR(10),
      pc_balance   INT           NOT NULL DEFAULT 100,
      created_at   TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
      updated_at   TIMESTAMP     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `, 'promo_players table');

  // Migration: add username columns to existing databases
  // Use separate queries to avoid issues with UNIQUE constraint
  try {
    await connection.query(`ALTER TABLE promo_players ADD COLUMN username VARCHAR(50) DEFAULT NULL`);
    console.log('✅ Added username column');
  } catch (e) {
    if (e.message.includes('Duplicate column')) console.log('ℹ️ username column already exists');
    else console.error('❌ username migration:', e.message);
  }
  try {
    await connection.query(`ALTER TABLE promo_players ADD COLUMN username_changed_at DATETIME DEFAULT NULL`);
    console.log('✅ Added username_changed_at column');
  } catch (e) {
    if (e.message.includes('Duplicate column')) console.log('ℹ️ username_changed_at column already exists');
    else console.error('❌ username_changed_at migration:', e.message);
  }
  try {
    await connection.query(`ALTER TABLE promo_players ADD UNIQUE INDEX idx_username (username)`);
    console.log('✅ Added username unique index');
  } catch (e) {
    if (e.message.includes('Duplicate key') || e.message.includes('Duplicate')) console.log('ℹ️ username index already exists');
    else console.error('❌ username index migration:', e.message);
  }

  // ── 2. OTP TOKENS ─────────────────────────────────────────────────────────
  await safeQuery(connection, `
    CREATE TABLE IF NOT EXISTS otp_tokens (
      id         INT AUTO_INCREMENT PRIMARY KEY,
      email      VARCHAR(150) NOT NULL,
      otp_code   VARCHAR(10)  NOT NULL,
      expires_at DATETIME     NOT NULL,
      used       TINYINT(1)   DEFAULT 0,
      created_at TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_email (email)
    )
  `, 'otp_tokens table');

  // ── 3. TRUSTED DEVICES (admin auto-login) ─────────────────────────────────
  await safeQuery(connection, `
    CREATE TABLE IF NOT EXISTS trusted_devices (
      id           INT AUTO_INCREMENT PRIMARY KEY,
      user_id      INT          NOT NULL,
      device_token VARCHAR(255) NOT NULL UNIQUE,
      ip_last_seen VARCHAR(50),
      last_login   TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      created_at   TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      INDEX idx_device_token (device_token)
    )
  `, 'trusted_devices table');

  // ── 4. PC TRANSACTIONS ────────────────────────────────────────────────────
  await safeQuery(connection, `
    CREATE TABLE IF NOT EXISTS pc_transactions (
      id         INT AUTO_INCREMENT PRIMARY KEY,
      player_id  INT          NOT NULL,
      type       ENUM('earn','spend','reset') NOT NULL,
      points     INT          NOT NULL,
      game_id    INT          DEFAULT NULL,
      note       VARCHAR(255),
      created_at TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (player_id) REFERENCES promo_players(id) ON DELETE CASCADE,
      INDEX idx_player (player_id)
    )
  `, 'pc_transactions table');

  // ── 5. BRAND REWARDS ──────────────────────────────────────────────────────
  await safeQuery(connection, `
    CREATE TABLE IF NOT EXISTS brand_rewards (
      id          INT AUTO_INCREMENT PRIMARY KEY,
      client_id   INT          NOT NULL,
      title       VARCHAR(255) NOT NULL,
      description TEXT,
      pp_cost     INT          NOT NULL DEFAULT 0,
      stock       INT          DEFAULT -1,
      is_active   TINYINT(1)   DEFAULT 1,
      created_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
      updated_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
    )
  `, 'brand_rewards table');

  // ── 6. REDEMPTIONS ────────────────────────────────────────────────────────
  await safeQuery(connection, `
    CREATE TABLE IF NOT EXISTS redemptions (
      id          INT AUTO_INCREMENT PRIMARY KEY,
      player_id   INT          NOT NULL,
      reward_id   INT          NOT NULL,
      pp_spent    INT          NOT NULL,
      status      ENUM('pending','confirmed','cancelled') DEFAULT 'pending',
      redeemed_at TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (player_id) REFERENCES promo_players(id) ON DELETE CASCADE,
      FOREIGN KEY (reward_id) REFERENCES brand_rewards(id) ON DELETE CASCADE,
      INDEX idx_player_redemptions (player_id)
    )
  `, 'redemptions table');

  // ── 7. RESET LOG ──────────────────────────────────────────────────────────
  await safeQuery(connection, `
    CREATE TABLE IF NOT EXISTS reset_log (
      id INT PRIMARY KEY DEFAULT 1,
      last_reset_at TIMESTAMP NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `, 'reset_log table');
  await safeQuery(connection, 'INSERT IGNORE INTO reset_log (id, last_reset_at) VALUES (1, NULL)', 'reset_log seed');

  // ── 8. Auto-assign usernames to existing players without one ──
  try {
    const [players] = await connection.query(`SELECT id, name, email FROM promo_players WHERE username IS NULL OR username = ''`);
    if (players.length > 0) {
      // Fetch all existing usernames to avoid collisions
      const [existing] = await connection.query(`SELECT username FROM promo_players WHERE username IS NOT NULL AND username != ''`);
      const taken = new Set(existing.map(r => r.username));

      for (const p of players) {
        let base = (p.name || p.email?.split('@')[0] || 'user')
          .toLowerCase()
          .replace(/[^a-z0-9]/g, '')
          .slice(0, 20) || 'player';
        let username = base;
        let suffix = 1;
        while (taken.has(username)) {
          username = base + suffix;
          suffix++;
        }
        taken.add(username);
        await connection.query(`UPDATE promo_players SET username = ? WHERE id = ?`, [username, p.id]);
      }
      console.log(`✅ Assigned usernames to ${players.length} existing players`);
    }
  } catch (err) {
    console.error('❌ Username migration:', err.message);
  }

  // ── 9. Rename pp_balance → pc_balance ──────────────────────────────────────
  try {
    const [ppCol] = await connection.query(`SHOW COLUMNS FROM \`promo_players\` LIKE 'pp_balance'`);
    if (ppCol.length > 0) {
      const [pcCol] = await connection.query(`SHOW COLUMNS FROM \`promo_players\` LIKE 'pc_balance'`);
      if (pcCol.length === 0) {
        await connection.query('ALTER TABLE promo_players CHANGE pp_balance pc_balance INT NOT NULL DEFAULT 100');
        console.log("✅ promo_players.pp_balance → pc_balance");
      }
    }
  } catch (err) {
    console.error("❌ pp_balance migration:", err.message);
  }

  // ── 9. Rename player_sessions.pp_awarded → pc_awarded ──────────────────────
  try {
    const [ppAw] = await connection.query(`SHOW COLUMNS FROM \`player_sessions\` LIKE 'pp_awarded'`);
    if (ppAw.length > 0) {
      const [pcAw] = await connection.query(`SHOW COLUMNS FROM \`player_sessions\` LIKE 'pc_awarded'`);
      if (pcAw.length === 0) {
        await connection.query('ALTER TABLE player_sessions CHANGE pp_awarded pc_awarded TINYINT(1) DEFAULT 0');
        console.log("✅ player_sessions.pp_awarded → pc_awarded");
      }
    }
  } catch (err) {
    console.error("❌ pp_awarded migration:", err.message);
  }

  // ── 10. Rename pp_transactions table → pc_transactions ─────────────────────
  try {
    const [ppTable] = await connection.query(`SELECT COUNT(*) as cnt FROM information_schema.tables WHERE table_schema = ? AND table_name = 'pp_transactions'`, [dbName]);
    if (ppTable[0].cnt > 0) {
      const [pcTable] = await connection.query(`SELECT COUNT(*) as cnt FROM information_schema.tables WHERE table_schema = ? AND table_name = 'pc_transactions'`, [dbName]);
      if (pcTable[0].cnt === 0) {
        await connection.query('RENAME TABLE pp_transactions TO pc_transactions');
        console.log("✅ pp_transactions → pc_transactions");
      }
    }
  } catch (err) {
    console.error("❌ pp_transactions rename:", err.message);
  }

  // ── 11. Add game_type column to games (branded vs promogames) ──────────────
  try {
    const [cols] = await connection.query(`SHOW COLUMNS FROM \`games\` LIKE 'game_type'`);
    if (cols.length === 0) {
      await connection.query(`
        ALTER TABLE \`games\`
        ADD COLUMN \`game_type\` ENUM('promogames','branded') NOT NULL DEFAULT 'promogames'
      `);
      console.log("✅ games.game_type column added");
    } else {
      console.log("ℹ️  games.game_type already exists");
    }
  } catch (err) {
    console.error("❌ games.game_type migration:", err.message);
  }

  // ── 8. Add pc_awarded column to player_sessions ───────────────────────────
  try {
    const [cols] = await connection.query(`SHOW COLUMNS FROM \`player_sessions\` LIKE 'pc_awarded'`);
    if (cols.length === 0) {
      await connection.query(`
        ALTER TABLE \`player_sessions\`
        ADD COLUMN \`pc_awarded\`    TINYINT(1) DEFAULT 0,
        ADD COLUMN \`promo_player_id\` INT DEFAULT NULL
      `);
      console.log("✅ player_sessions.pc_awarded + promo_player_id columns added");
    } else {
      console.log("ℹ️  player_sessions.pc_awarded already exists");
    }
  } catch (err) {
    console.error("❌ player_sessions migration:", err.message);
  }

  // ── 12. INTERNAL TEAM ──────────────────────────────────────────────────────
  await safeQuery(connection, `
    CREATE TABLE IF NOT EXISTS internal_team (
      id           INT AUTO_INCREMENT PRIMARY KEY,
      name         VARCHAR(100)  NOT NULL,
      email        VARCHAR(150)  NOT NULL UNIQUE,
      role         VARCHAR(50)   DEFAULT 'member',
      created_at   TIMESTAMP     DEFAULT CURRENT_TIMESTAMP
    )
  `, 'internal_team table');

  await connection.end();
  console.log('\n🎉 PromoPlayer migration completed successfully!');
  console.log('Tables created: promo_players, otp_tokens, trusted_devices, pc_transactions, brand_rewards, redemptions, internal_team');
  console.log('Columns added: games.game_type, player_sessions.pc_awarded, player_sessions.promo_player_id');
}

initPromo().catch(err => {
  console.error('❌ Migration failed:', err);
  process.exit(1);
});