require('dotenv').config();
const env = require('./env');
const mysql = require('mysql2/promise');
(async () => {
  const c = await mysql.createConnection({
    host: env.DB_HOST,
    port: env.DB_PORT,
    user: env.DB_USER,
    password: env.DB_PASSWORD,
  });
  await c.query('USE `' + env.DB_NAME + '`');
  try {
    await c.query("ALTER TABLE promo_players ADD COLUMN avatar_id VARCHAR(50) DEFAULT 'av-3'");
    console.log('✅ added avatar_id column');
  } catch (e) {
    console.log(e.message);
  }
  await c.end();
})();
