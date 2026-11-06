require('dotenv').config();
const env = require('./config/env');
const mysql = require('mysql2/promise');

(async () => {
  try {
    const connection = await mysql.createConnection({
      host: env.DB_HOST,
      port: env.DB_PORT,
      user: env.DB_USER,
      password: env.DB_PASSWORD,
      database: env.DB_NAME,
      charset: 'utf8mb4',
      multipleStatements: true
    });
    
    const [rows] = await connection.query('SHOW COLUMNS FROM quiz_settings');
    console.log('=== quiz_settings ===');
    for (const row of rows) {
      console.log(row.Field + ' ' + row.Type);
    }
    
    const [rows2] = await connection.query('SHOW COLUMNS FROM spin_settings');
    console.log('\n=== spin_settings ===');
    for (const row of rows2) {
      console.log(row.Field + ' ' + row.Type);
    }
    
    const [rows3] = await connection.query('SHOW COLUMNS FROM crossword_settings');
    console.log('\n=== crossword_settings ===');
    for (const row of rows3) {
      console.log(row.Field + ' ' + row.Type);
    }
    
    const [rows4] = await connection.query('SHOW COLUMNS FROM math_settings');
    console.log('\n=== math_settings ===');
    for (const row of rows4) {
      console.log(row.Field + ' ' + row.Type);
    }
    
    const [rows5] = await connection.query('SHOW COLUMNS FROM soundify_settings');
    console.log('\n=== soundify_settings ===');
    for (const row of rows5) {
      console.log(row.Field + ' ' + row.Type);
    }
    
    const [rows6] = await connection.query('SHOW COLUMNS FROM stressbuster_settings');
    console.log('\n=== stressbuster_settings ===');
    for (const row of rows6) {
      console.log(row.Field + ' ' + row.Type);
    }
    
    await connection.end();
  } catch (e) {
    console.error('Error:', e.message);
    console.error('Stack:', e.stack);
  }
})();
