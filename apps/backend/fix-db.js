require('dotenv').config();
const env = require('./config/env');
const mysql = require('mysql2/promise');

(async () => {
  const connection = await mysql.createConnection({
    host: env.DB_HOST,
    port: env.DB_PORT,
    user: env.DB_USER,
    password: env.DB_PASSWORD,
    database: env.DB_NAME,
    charset: 'utf8mb4',
  });

  console.log('Adding missing columns to quiz_settings...');

  const queries = [
    'ALTER TABLE quiz_settings ADD COLUMN IF NOT EXISTS `heading_1_color` VARCHAR(20) DEFAULT \'#1a1a2e`',
    'ALTER TABLE quiz_settings ADD COLUMN IF NOT EXISTS `heading_2_color` VARCHAR(20) DEFAULT \'#1a1a2e`',
    'ALTER TABLE quiz_settings ADD COLUMN IF NOT EXISTS `intro_text_color` VARCHAR(20) DEFAULT \'#666666`',
    'ALTER TABLE quiz_settings ADD COLUMN IF NOT EXISTS `title_color` VARCHAR(20) DEFAULT \'#1a1a2e`',
    'ALTER TABLE quiz_settings ADD COLUMN IF NOT EXISTS `description_color` VARCHAR(20) DEFAULT \'#666666`',
    'ALTER TABLE quiz_settings ADD COLUMN IF NOT EXISTS `start_button_text` VARCHAR(100)',
    'ALTER TABLE quiz_settings ADD COLUMN IF NOT EXISTS `next_button_text` VARCHAR(100)',
    'ALTER TABLE quiz_settings ADD COLUMN IF NOT EXISTS `submit_button_text` VARCHAR(100)',
    'ALTER TABLE quiz_settings ADD COLUMN IF NOT EXISTS `continue_button_text` VARCHAR(100)',
    'ALTER TABLE quiz_settings ADD COLUMN IF NOT EXISTS `start_button_text_color` VARCHAR(20) DEFAULT \'#ffffff`',
    'ALTER TABLE quiz_settings ADD COLUMN IF NOT EXISTS `next_button_text_color` VARCHAR(20) DEFAULT \'#ffffff`',
    'ALTER TABLE quiz_settings ADD COLUMN IF NOT EXISTS `submit_button_text_color` VARCHAR(20) DEFAULT \'#ffffff`',
    'ALTER TABLE quiz_settings ADD COLUMN IF NOT EXISTS `continue_button_text_color` VARCHAR(20) DEFAULT \'#ffffff`',
    'ALTER TABLE quiz_settings ADD COLUMN IF NOT EXISTS `start_button_bg_color` VARCHAR(20)',
    'ALTER TABLE quiz_settings ADD COLUMN IF NOT EXISTS `next_button_bg_color` VARCHAR(20)',
    'ALTER TABLE quiz_settings ADD COLUMN IF NOT EXISTS `submit_button_bg_color` VARCHAR(20)',
    'ALTER TABLE quiz_settings ADD COLUMN IF NOT EXISTS `continue_button_bg_color` VARCHAR(20)',
    'ALTER TABLE quiz_settings ADD COLUMN IF NOT EXISTS `meta_description` TEXT',
  ];

  for (const q of queries) {
    try {
      await connection.query(q);
      console.log('✅ Query executed:', q);
    } catch (err) {
      if (err.code === 'ER_DUP_FIELDNAME') {
        const col = q.match(/ADD COLUMN IF NOT EXISTS `(\w+)`/)[1];
        console.log('ℹ️ Column already exists:', col);
      } else {
        console.error('❌ Failed:', q, '\nError:', err.message);
      }
    }
  }

  // Now check what's in the table
  const [cols] = await connection.query('DESCRIBE quiz_settings');
  console.log('\n=== quiz_settings columns ===');
  for (const col of cols) {
    console.log(col.Field + ' ' + col.Type);
  }

  await connection.end();
  console.log('\n🎉 Done!');
})();
