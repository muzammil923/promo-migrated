import 'dart:convert';
import 'package:sqflite/sqflite.dart';
import 'package:path/path.dart';

class LocalDbService {
  static final LocalDbService instance = LocalDbService._();
  LocalDbService._();

  Database? _db;
  Database get db => _db!;

  Future<void> initialize() async {
    if (_db != null) return;
    final dir = await getDatabasesPath();
    _db = await openDatabase(
      join(dir, 'promogames.db'),
      version: 3,
      onCreate: _create,
      onUpgrade: _upgrade,
    );
  }

  Future<void> _create(Database db, int version) async {
    await db.execute('''
      CREATE TABLE games (
        id INTEGER PRIMARY KEY,
        name TEXT,
        slug TEXT,
        category TEXT,
        game_type TEXT,
        client_slug TEXT,
        company_name TEXT,
        game_logo_url TEXT,
        bg_image_url TEXT,
        show_in_play_page INTEGER DEFAULT 0,
        is_active INTEGER DEFAULT 1,
        synced_at TEXT
      )
    ''');
    await db.execute('''
      CREATE TABLE transactions (
        id INTEGER PRIMARY KEY,
        player_id INTEGER,
        type TEXT,
        points INTEGER,
        game_id INTEGER,
        note TEXT,
        created_at TEXT
      )
    ''');
    await db.execute('''
      CREATE TABLE rewards (
        id INTEGER PRIMARY KEY,
        client_id INTEGER,
        title TEXT,
        description TEXT,
        pp_cost INTEGER,
        stock INTEGER DEFAULT -1,
        is_active INTEGER DEFAULT 1,
        brand TEXT,
        bg_color TEXT,
        text_color TEXT
      )
    ''');
    await db.execute('''
      CREATE TABLE leaderboard (
        id INTEGER PRIMARY KEY,
        name TEXT,
        username TEXT,
        pc_balance INTEGER,
        avatar_id TEXT
      )
    ''');
    await db.execute('''
      CREATE TABLE pending_sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        game_id INTEGER,
        score INTEGER DEFAULT 0,
        max_score INTEGER DEFAULT 0,
        utm_source TEXT,
        player_data TEXT,
        completed_at TEXT,
        synced INTEGER DEFAULT 0,
        sync_attempts INTEGER DEFAULT 0,
        last_error TEXT,
        promo_player_id INTEGER
      )
    ''');
    await db.execute('''
      CREATE TABLE player_profile (
        id INTEGER PRIMARY KEY,
        username TEXT,
        email TEXT,
        pc_balance INTEGER DEFAULT 0,
        avatar_id TEXT
      )
    ''');
    // New tables for v2
    await db.execute('''
      CREATE TABLE game_data_cache (
        game_id INTEGER PRIMARY KEY,
        data TEXT,
        cached_at TEXT
      )
    ''');
    await db.execute('''
      CREATE TABLE pc_transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        player_id INTEGER,
        type TEXT,
        points INTEGER,
        game_id INTEGER,
        note TEXT,
        created_at TEXT,
        synced INTEGER DEFAULT 0
      )
    ''');
  }

  Future<void> _upgrade(Database db, int oldVersion, int newVersion) async {
    if (oldVersion < 2) {
      // Add new columns to pending_sessions
      try {
        await db.execute('ALTER TABLE pending_sessions ADD COLUMN sync_attempts INTEGER DEFAULT 0');
      } catch (_) {}
      try {
        await db.execute('ALTER TABLE pending_sessions ADD COLUMN last_error TEXT');
      } catch (_) {}
      // New tables
      await db.execute('''
        CREATE TABLE IF NOT EXISTS game_data_cache (
          game_id INTEGER PRIMARY KEY,
          data TEXT,
          cached_at TEXT
        )
      ''');
      await db.execute('''
        CREATE TABLE IF NOT EXISTS pc_transactions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          player_id INTEGER,
          type TEXT,
          points INTEGER,
          game_id INTEGER,
          note TEXT,
          created_at TEXT,
          synced INTEGER DEFAULT 0
        )
      ''');
    }
    if (oldVersion < 3) {
      try {
        await db.execute('ALTER TABLE pending_sessions ADD COLUMN promo_player_id INTEGER');
      } catch (_) {}
    }
  }

  // ── Games ────────────────────────────────────────────────────────────
  Future<List<Map<String, dynamic>>> getGames() =>
      db.query('games', where: 'is_active = 1', orderBy: 'name ASC');

  Future<List<Map<String, dynamic>>> getBrandedGames() =>
      db.query('games', where: "game_type = 'branded' AND is_active = 1");

  Future<List<Map<String, dynamic>>> getPromoGames() =>
      db.query('games', where: "game_type = 'promogames' AND is_active = 1");

  Future<void> upsertGames(List<Map<String, dynamic>> games) async {
    final batch = db.batch();
    for (final g in games) {
      batch.insert('games', {
        'id': g['id'],
        'name': g['name'],
        'slug': g['slug'],
        'category': g['category'],
        'game_type': g['game_type'] ?? 'promogames',
        'client_slug': g['client_slug'],
        'company_name': g['company_name'],
        'game_logo_url': g['game_logo_url'],
        'bg_image_url': g['bg_image_url'],
        'show_in_play_page': g['show_in_play_page'] == 1 ? 1 : 0,
        'is_active': 1,
        'synced_at': DateTime.now().toIso8601String(),
      }, conflictAlgorithm: ConflictAlgorithm.replace);
    }
    await batch.commit(noResult: true);
  }

  // ── Game Data Cache ──────────────────────────────────────────────────
  Future<void> cacheGameConfig(int gameId, Map<String, dynamic> data) async {
    await db.insert('game_data_cache', {
      'game_id': gameId,
      'data': jsonEncode(data),
      'cached_at': DateTime.now().toIso8601String(),
    }, conflictAlgorithm: ConflictAlgorithm.replace);
  }

  Future<Map<String, dynamic>?> getCachedGameConfig(int gameId) async {
    final rows = await db.query('game_data_cache', where: 'game_id = ?', whereArgs: [gameId]);
    if (rows.isEmpty) return null;
    try {
      return jsonDecode(rows.first['data'] as String) as Map<String, dynamic>;
    } catch (_) {
      return null;
    }
  }

  // ── Transactions ─────────────────────────────────────────────────────
  Future<List<Map<String, dynamic>>> getTransactions() =>
      db.query('transactions', orderBy: 'created_at DESC', limit: 50);

  Future<void> upsertTransactions(List<Map<String, dynamic>> txs) async {
    final batch = db.batch();
    for (final t in txs) {
      batch.insert('transactions', {
        'id': t['id'],
        'player_id': t['player_id'],
        'type': t['type'],
        'points': t['points'],
        'game_id': t['game_id'],
        'note': t['note'],
        'created_at': t['created_at'] ?? DateTime.now().toIso8601String(),
      }, conflictAlgorithm: ConflictAlgorithm.replace);
    }
    await batch.commit(noResult: true);
  }

  // ── Rewards ──────────────────────────────────────────────────────────
  Future<List<Map<String, dynamic>>> getRewards() =>
      db.query('rewards', orderBy: 'pp_cost ASC');

  Future<void> upsertRewards(List<Map<String, dynamic>> rewards) async {
    final batch = db.batch();
    for (final r in rewards) {
      batch.insert('rewards', {
        'id': r['id'],
        'client_id': r['client_id'],
        'title': r['title'],
        'description': r['description'],
        'pp_cost': r['pp_cost'],
        'stock': r['stock'] ?? -1,
        'is_active': r['is_active'] ?? 1,
        'brand': r['brand'],
        'bg_color': r['bg_color'],
        'text_color': r['text_color'],
      }, conflictAlgorithm: ConflictAlgorithm.replace);
    }
    await batch.commit(noResult: true);
  }

  // ── Leaderboard ──────────────────────────────────────────────────────
  Future<List<Map<String, dynamic>>> getLeaderboard() =>
      db.query('leaderboard', orderBy: 'pc_balance DESC', limit: 50);

  Future<void> upsertLeaderboard(List<Map<String, dynamic>> entries) async {
    final batch = db.batch();
    for (final e in entries) {
      batch.insert('leaderboard', {
        'id': e['id'],
        'name': e['name'],
        'username': e['username'],
        'pc_balance': e['pc_balance'],
        'avatar_id': e['avatar_id'],
      }, conflictAlgorithm: ConflictAlgorithm.replace);
    }
    await batch.commit(noResult: true);
  }

  // ── Player Profile ───────────────────────────────────────────────────
  Future<Map<String, dynamic>?> getPlayerProfile() async {
    final rows = await db.query('player_profile', limit: 1);
    return rows.isNotEmpty ? rows.first : null;
  }

  Future<void> savePlayerProfile(Map<String, dynamic> player) async {
    await db.insert('player_profile', {
      'id': player['id'] ?? 1,
      'username': player['username'],
      'email': player['email'],
      'pc_balance': player['pc_balance'] ?? 0,
      'avatar_id': player['avatar_id'],
    }, conflictAlgorithm: ConflictAlgorithm.replace);
  }

  // ── PC Transactions (local ledger) ───────────────────────────────────
  Future<void> addPcTransaction({
    required int playerId,
    required String type,
    required int points,
    int? gameId,
    required String note,
  }) async {
    await db.insert('pc_transactions', {
      'player_id': playerId,
      'type': type,
      'points': points,
      'game_id': gameId,
      'note': note,
      'created_at': DateTime.now().toIso8601String(),
      'synced': 0,
    });
    // Also update local PC balance
    final rows = await db.rawQuery('SELECT pc_balance FROM player_profile WHERE id = ?', [playerId]);
    final current = (rows.isNotEmpty ? (rows.first['pc_balance'] as int?) : null) ?? 0;
    await db.rawUpdate('UPDATE player_profile SET pc_balance = ? WHERE id = ?', [current + points, playerId]);
  }

  Future<List<Map<String, dynamic>>> getUnsyncedPcTransactions() =>
      db.query('pc_transactions', where: 'synced = 0', orderBy: 'id ASC');

  Future<void> markPcTransactionSynced(int id) async {
    await db.update('pc_transactions', {'synced': 1}, where: 'id = ?', whereArgs: [id]);
  }

  // ── Pending Sessions (offline queue) ─────────────────────────────────
  Future<List<Map<String, dynamic>>> getPendingSessions() =>
      db.query('pending_sessions', where: 'synced = 0', orderBy: 'id ASC');

  Future<void> queueSession(Map<String, dynamic> session) async {
    await db.insert('pending_sessions', {
      'game_id': session['game_id'],
      'score': session['score'] ?? 0,
      'max_score': session['max_score'] ?? 0,
      'utm_source': session['utm_source'],
      'player_data': session['player_data'],
      'completed_at': DateTime.now().toIso8601String(),
      'synced': 0,
      'sync_attempts': 0,
      'promo_player_id': session['promo_player_id'],
    });
  }

  Future<void> markSessionSynced(int id) async {
    await db.update('pending_sessions', {'synced': 1}, where: 'id = ?', whereArgs: [id]);
  }

  Future<void> incrementSyncAttempt(int id, String error) async {
    await db.rawUpdate(
      'UPDATE pending_sessions SET sync_attempts = sync_attempts + 1, last_error = ? WHERE id = ?',
      [error, id],
    );
  }

  Future<void> clearSyncedSessions() async {
    await db.delete('pending_sessions', where: 'synced = 1');
  }

  int _pendingCount = 0;
  int get pendingCount => _pendingCount;

  Future<void> refreshPendingCount() async {
    final rows = await db.rawQuery('SELECT COUNT(*) as cnt FROM pending_sessions WHERE synced = 0');
    _pendingCount = (rows.first['cnt'] as int?) ?? 0;
  }

  // ── Clear tables for refresh ─────────────────────────────────────────
  Future<void> clearAll() async {
    await db.delete('games');
    await db.delete('transactions');
    await db.delete('rewards');
    await db.delete('leaderboard');
  }
}
