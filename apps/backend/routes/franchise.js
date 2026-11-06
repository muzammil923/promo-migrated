const express = require('express');
const router = express.Router();
const db = require('../config/db');
const jwt = require('jsonwebtoken');
const { sendError } = require('../lib/apiError');
const env = require('../config/env');

// Middleware to verify franchise owner authentication
function franchiseAuth(req, res, next) {
  const token = (req.headers.authorization || '').split(' ')[1];
  if (!token) {
    return res.status(401).json({ success: false, message: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET);
    if (!decoded || !decoded.role || decoded.role !== 'business_owner') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    req.franchise = decoded;
    next();
  } catch (error) {
    res.status(403).json({ success: false, message: 'Invalid or expired token' });
  }
}

// GET /api/franchise/dashboard - Franchise owner dashboard
router.get('/dashboard', franchiseAuth, async (req, res) => {
  try {
    const { id: franchiseId, parent_id, role } = req.franchise;

    let queryString = `
      SELECT b.id, b.business_name, b.email, b.phone, b.is_active, 
             p.business_name as parent_name, 
             (SELECT COUNT(*) FROM business_owner_games WHERE business_owner_id = b.id) as game_count
      FROM business_owners b
      LEFT JOIN business_owners p ON b.parent_id = p.id
    `;

    const queryParams = [];
    const conditions = [];

    if (parent_id) {
      // Child franchise - see own info only
      conditions.push(`b.id = ?`);
      queryParams.push(franchiseId);
    } else {
      // Parent franchise - see all children
      conditions.push(`(b.id = ? OR b.parent_id = ?)`);
      queryParams.push(franchiseId, franchiseId);
    }

    if (conditions.length > 0) {
      queryString += ' WHERE ' + conditions.join(' AND ');
    }

    queryString += ' ORDER BY b.business_name';

    const [franchises] = await db.query(queryString, queryParams);

    const franchiseIds = franchises.map(f => f.id);
    const childFranchises = franchises.filter(f => f.parent_id && f.parent_id !== null);
    const allActiveFranchiseIds = [...franchiseIds, ...childFranchises.map(cf => cf.id)];

    const [games] = await db.query(
      `SELECT g.id, g.name, g.status, g.slug, g.created_at,
              g.game_logo_url, g.is_active,
              (
                SELECT COUNT(*)
                FROM player_sessions
                WHERE game_id = g.id AND completed = 1
              ) as play_count,
              (
                SELECT COUNT(*)
                FROM business_redemptions
                WHERE game_id = g.id AND business_owner_id IN (?)
              ) as redemption_count,
              b.business_name as franchise_name
       FROM games g
       JOIN business_owner_games bog ON g.id = bog.game_id
       JOIN business_owners b ON bog.business_owner_id = b.id
       WHERE b.id IN (?)
       ORDER BY g.created_at DESC`,
      [allActiveFranchiseIds, allActiveFranchiseIds]
    );

    return res.json({
      success: true,
      franchises: franchises,
      games: games,
      child_franchises: childFranchises,
      total_games: games.length,
      total_franchises: franchises.length
    });
  } catch (error) {
    console.error('❌ Franchise dashboard error:', error);
    return sendError(res, error);
  }
});

// GET /api/franchise/dashboard/:franchiseId/games - Games for specific franchise
router.get('/dashboard/:franchiseId/games', franchiseAuth, async (req, res) => {
  try {
    const { franchiseId } = req.params;
    let franchiseIds = [franchiseId];
    const franchiseRole = req.franchise;

    if (!franchiseRole.parent_id) {
      const [children] = await db.query(
        'SELECT id FROM business_owners WHERE parent_id = ?',
        [franchiseId]
      );
      franchiseIds = franchiseIds.concat(children.map(c => c.id));
    }

    const [games] = await db.query(
      `SELECT g.id, g.name, g.status, g.slug, g.created_at,
              g.game_logo_url, g.is_active,
              g.meta_description as description,
              (
                SELECT COUNT(*)
                FROM player_sessions
                WHERE game_id = g.id AND completed = 1
              ) as play_count,
              (
                SELECT COUNT(*)
                FROM business_redemptions
                WHERE game_id = g.id AND business_owner_id IN (?)
              ) as redemption_count,
              g.game_type, g.redirect_url,
              g.show_in_play_page, g.show_in_hero_page,
              (
                SELECT location_name
                FROM business_owner_games
                WHERE business_owner_id = ? AND game_id = g.id
                LIMIT 1
              ) as location_name
       FROM games g
       WHERE g.id IN (
         SELECT DISTINCT game_id
         FROM business_owner_games
         WHERE business_owner_id IN (?)
       )
       ORDER BY g.created_at DESC`,
      [franchiseIds, franchiseIds, franchiseIds]
    );

    const enrichedGames = games.map(game => ({
      ...game,
      can_manage: franchiseRole.parent_id || franchiseId === franchiseRole.id,
      franchise_access: franchiseRole.parent_id || franchiseId === franchiseRole.id
        ? 'full_access'
        : 'view_only'
    }));

    return res.json({
      success: true,
      games: enrichedGames,
      franchise_id: franchiseId,
      user_role: franchiseRole.parent_id ? 'child' : 'parent'
    });
  } catch (error) {
    console.error('❌ Franchise games error:', error);
    return sendError(res, error);
  }
});

// GET /api/franchise/franchises - List all franchises for dropdowns
router.get('/franchises', async (req, res) => {
  try {
    const [franchises] = await db.query(
      `SELECT id, business_name, email, phone, parent_id, is_active
       FROM business_owners
       ORDER BY business_name`
    );

    return res.json({
      success: true,
      franchises: franchises
    });
  } catch (error) {
    console.error('❌ Franchise list error:', error);
    return sendError(res, error);
  }
});

module.exports = router;
