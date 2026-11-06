const express = require('express')
const router  = express.Router()
const db      = require('../config/db')
const { requireAdmin } = require('../middleware/auth')
const { sendError } = require('../lib/apiError');

router.use(requireAdmin)

// ── GET / ──
router.get('/', async (req, res) => {
  try {
    const [players] = await db.query(`
      SELECT id, name, username, email, whatsapp, city, pincode,
             pc_balance, dob, avatar_id, created_at
      FROM promo_players ORDER BY created_at DESC
    `)
    const [[stats]] = await db.query(`
      SELECT COUNT(*) AS total,
             SUM(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN 1 ELSE 0 END) AS new_month,
             SUM(pc_balance) AS total_pc,
             ROUND(AVG(pc_balance)) AS avg_pc
      FROM promo_players
    `)
    res.json({ success: true, players, stats })
  } catch (err) {
    console.error('players-admin GET /', err)
    res.status(500).json({ success: false, message: 'Failed to load players' })
  }
})

// ── GET /:id/transactions ──
router.get('/:id/transactions', async (req, res) => {
  try {
    const { id } = req.params
    const [[player]] = await db.query(
      'SELECT id, name, email, pc_balance FROM promo_players WHERE id = ?', [id]
    )
    if (!player) return res.status(404).json({ success: false, message: 'Player not found' })
    const [transactions] = await db.query(`
      SELECT id, type, points, note, created_at
      FROM pc_transactions WHERE player_id = ?
      ORDER BY created_at DESC LIMIT 100
    `, [id])
    res.json({ success: true, player, transactions })
  } catch (err) {
    console.error('players-admin GET /:id/transactions', err)
    res.status(500).json({ success: false, message: 'Failed to load transactions' })
  }
})

// ── PUT /:id — edit player ──
router.put('/:id', async (req, res) => {
  try {
    const { name, email, whatsapp, city, pincode, dob } = req.body
    const [[existing]] = await db.query('SELECT id FROM promo_players WHERE id = ?', [req.params.id])
    if (!existing) return res.status(404).json({ success: false, message: 'Player not found' })
    await db.query(
      'UPDATE promo_players SET name=?, email=?, whatsapp=?, city=?, pincode=?, dob=? WHERE id=?',
      [name, email, whatsapp||null, city||null, pincode||null, dob||null, req.params.id]
    )
    const [[updated]] = await db.query('SELECT * FROM promo_players WHERE id=?', [req.params.id])
    res.json({ success: true, player: updated })
  } catch (err) {
    console.error('players-admin PUT /:id', err)
    sendError(res, err);
  }
})

// ── DELETE /:id — delete player ──
router.delete('/:id', async (req, res) => {
  try {
    const [[existing]] = await db.query('SELECT id FROM promo_players WHERE id = ?', [req.params.id])
    if (!existing) return res.status(404).json({ success: false, message: 'Player not found' })
    await db.query('DELETE FROM pc_transactions WHERE player_id = ?', [req.params.id])
    await db.query('DELETE FROM promo_players WHERE id = ?', [req.params.id])
    res.json({ success: true, message: 'Player deleted' })
  } catch (err) {
    console.error('players-admin DELETE /:id', err)
    sendError(res, err);
  }
})

// ── POST /:id/adjust-pc — add or deduct PC ──
router.post('/:id/adjust-pc', async (req, res) => {
  try {
    const { amount, note } = req.body
    const num = Number(amount)
    if (!num) return res.status(400).json({ success: false, message: 'Amount required' })
    const [[existing]] = await db.query('SELECT id, pc_balance FROM promo_players WHERE id = ?', [req.params.id])
    if (!existing) return res.status(404).json({ success: false, message: 'Player not found' })
    if (num < 0 && Math.abs(num) > existing.pc_balance) {
      return res.status(400).json({ success: false, message: 'Cannot deduct more than available balance' })
    }
    const type = num > 0 ? 'bonus' : 'spend'
    const connection = await db.getConnection()
    try {
      await connection.beginTransaction()
      await connection.query(
        'INSERT INTO pc_transactions (player_id, type, points, note) VALUES (?, ?, ?, ?)',
        [req.params.id, type, num, note || (num > 0 ? 'Admin bonus' : 'Admin deduction')]
      )
      await connection.query(
        'UPDATE promo_players SET pc_balance = pc_balance + ? WHERE id = ?',
        [num, req.params.id]
      )
      await connection.commit()
    } catch (e) {
      await connection.rollback()
      throw e
    } finally {
      connection.release()
    }
    const [[updated]] = await db.query('SELECT id, pc_balance FROM promo_players WHERE id=?', [req.params.id])
    res.json({ success: true, pc_balance: updated.pc_balance })
  } catch (err) {
    console.error('players-admin POST /:id/adjust-pc', err)
    sendError(res, err);
  }
})

module.exports = router