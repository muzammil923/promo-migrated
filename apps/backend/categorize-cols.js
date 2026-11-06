require('dotenv').config();
const env = require('./config/env');
const mysql = require('mysql2/promise');
const db = mysql.createPool({
  host: env.DB_HOST,
  port: env.DB_PORT,
  user: env.DB_USER,
  password: env.DB_PASSWORD,
  database: env.DB_NAME,
  charset: 'utf8mb4'
});

(async () => {
  console.log('=== CHECKING TABLE COLUMNS ===\n');
  
  const tables = ['quiz_settings', 'spin_settings', 'crossword_settings'];
  
  for (const table of tables) {
    const [cols] = await db.query(`DESCRIBE ${table}`);
    console.log(`${table}:`);
    for (const col of cols) {
      console.log(`  ${col.Field} (${col.Type})`);
    }
    console.log();
  }
  
  await db.end();
})();
