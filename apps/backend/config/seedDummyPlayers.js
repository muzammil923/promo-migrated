require('dotenv').config();
const env = require('./env');
const mysql = require('mysql2/promise');

const players = [
  { name: 'Muzammil', username: 'muzammil', email: 'muzammil@test.com', pc_balance: 3250, avatar_id: 'av-3' },
  { name: 'Saleek', username: 'saleek', email: 'saleek@test.com', pc_balance: 2450, avatar_id: 'av-1' },
  { name: 'Yasd', username: 'yasd', email: 'yasd@test.com', pc_balance: 1980, avatar_id: 'av-6' },
  { name: 'Parvathi', username: 'parvathi', email: 'parvathi@test.com', pc_balance: 1760, avatar_id: 'av-2' },
  { name: 'E. M. Venugopal', username: 'venugopal', email: 'venugopal@test.com', pc_balance: 1450, avatar_id: 'av-4' },
  { name: 'Rohit Gamer', username: 'rohitgamer', email: 'rohit@test.com', pc_balance: 1320, avatar_id: 'av-5' },
  { name: 'Alpha Wolf', username: 'alphawolf', email: 'alphawolf@test.com', pc_balance: 1180, avatar_id: 'av-6' },
  { name: 'Shadow Knight', username: 'shadowknight', email: 'shadow@test.com', pc_balance: 1050, avatar_id: 'av-1' },
  { name: 'Neon Blaze', username: 'neonblaze', email: 'neon@test.com', pc_balance: 920, avatar_id: 'av-2' },
  { name: 'Cyber Queen', username: 'cyberqueen', email: 'cyber@test.com', pc_balance: 870, avatar_id: 'av-3' },
  { name: 'Pixel Storm', username: 'pixelstorm', email: 'pixel@test.com', pc_balance: 750, avatar_id: 'av-4' },
  { name: 'Dragon Fury', username: 'dragonfury', email: 'dragon@test.com', pc_balance: 680, avatar_id: 'av-5' },
  { name: 'Nova Star', username: 'novastar', email: 'nova@test.com', pc_balance: 590, avatar_id: 'av-6' },
  { name: 'Thunder Bite', username: 'thunderbite', email: 'thunder@test.com', pc_balance: 520, avatar_id: 'av-1' },
  { name: 'Iron Pulse', username: 'ironpulse', email: 'iron@test.com', pc_balance: 430, avatar_id: 'av-2' },
  { name: 'Void Walker', username: 'voidwalker', email: 'void@test.com', pc_balance: 380, avatar_id: 'av-3' },
  { name: 'Blaze Runner', username: 'blazerunner', email: 'blaze@test.com', pc_balance: 310, avatar_id: 'av-4' },
  { name: 'Frost Byte', username: 'frostbyte', email: 'frost@test.com', pc_balance: 250, avatar_id: 'av-5' },
  { name: 'Storm Chaser', username: 'stormchaser', email: 'storm@test.com', pc_balance: 180, avatar_id: 'av-6' },
  { name: 'Lightning Ace', username: 'lightningace', email: 'lightning@test.com', pc_balance: 120, avatar_id: 'av-1' },
];

async function seed() {
  const conn = await mysql.createConnection({
    host: env.DB_HOST,
    port: env.DB_PORT,
    user: env.DB_USER,
    password: env.DB_PASSWORD,
    charset: 'utf8mb4',
  });

  const dbName = env.DB_NAME;
  await conn.query(`USE \`${dbName}\``);

  for (const p of players) {
    try {
      await conn.query(
        `INSERT INTO promo_players (name, username, email, pc_balance, avatar_id)
         VALUES (?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE pc_balance = VALUES(pc_balance), avatar_id = VALUES(avatar_id)`,
        [p.name, p.username, p.email, p.pc_balance, p.avatar_id]
      );
      console.log(`✅ ${p.name}`);
    } catch (e) {
      console.error(`❌ ${p.name}: ${e.message}`);
    }
  }

  await conn.end();
  console.log('\n🎉 Done!');
}

seed().catch(e => { console.error(e); process.exit(1); });
