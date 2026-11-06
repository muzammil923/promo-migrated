import 'dart:async';
import 'package:flutter/foundation.dart';
import 'api_service.dart';
import 'local_db_service.dart';
import 'sync_service.dart';
import '../models/user.dart';
import '../core/data/mock_data.dart';

class PlayerProvider extends ChangeNotifier {
  User? _user;
  List<Map<String, dynamic>> _brandedGames = [];
  List<Map<String, dynamic>> _promoGames = [];
  List<Map<String, dynamic>> _transactions = [];
  List<Map<String, dynamic>> _rewards = [];
  List<Map<String, dynamic>> _leaderboard = [];
  bool _loading = true;
  bool _offline = false;
  int _pendingCount = 0;
  Timer? _pollTimer;

  User? get user => _user;
  List<Map<String, dynamic>> get brandedGames => _brandedGames;
  List<Map<String, dynamic>> get promoGames => _promoGames;
  List<Map<String, dynamic>> get transactions => _transactions;
  List<Map<String, dynamic>> get rewards => _rewards;
  List<Map<String, dynamic>> get leaderboard => _leaderboard;
  bool get loading => _loading;
  bool get offline => _offline;
  int get pendingCount => _pendingCount;
  int get pcBalance => _user?.pcBalance ?? 0;

  final LocalDbService _db = LocalDbService.instance;
  final SyncService _sync = SyncService.instance;

  /// Load from local DB instantly, then sync from API in background.
  Future<void> loadAll() async {
    _loading = true;
    notifyListeners();

    await _sync.initialize();
    _offline = !_sync.isOnline;
    _sync.addListener(_onOnlineChanged);
    _sync.addSyncListener(_onSyncCompleted);

    // Load non-profile data from local (games, rewards, etc.)
    await _loadLocalNonProfile();
    await _refreshPendingCount();

    _loading = false;
    notifyListeners();

    // ALWAYS fetch profile from API when online (never trust stale local)
    if (_sync.isOnline) {
      await Future.wait([
        _fetchProfile(),
        _fetchGames(),
        _fetchTransactions(),
        _fetchRewards(),
        _fetchLeaderboard(),
      ]);
      notifyListeners();
    } else {
      // Offline: load profile from local DB as fallback
      await _loadLocalProfile();
      notifyListeners();
    }

    _startPolling();
  }

  /// Load only games/rewards/leaderboard from local (NOT profile)
  Future<void> _loadLocalNonProfile() async {
    final games = await _db.getGames();
    _brandedGames = games.where((g) => g['game_type'] == 'branded').toList();
    _promoGames = games.where((g) => g['game_type'] != 'branded').toList();
    _transactions = await _db.getTransactions();
    _rewards = await _db.getRewards();
    _leaderboard = await _db.getLeaderboard();
  }

  /// Load profile from local DB (only used when offline)
  Future<void> _loadLocalProfile() async {
    final profile = await _db.getPlayerProfile();
    if (profile != null) {
      _user = User(
        id: profile['id'] as int,
        username: profile['username'] as String? ?? '',
        pcBalance: profile['pc_balance'] as int? ?? 0,
        avatarId: profile['avatar_id'] as String?,
      );
    } else {
      _user ??= User(id: 0, username: MockData.username, pcBalance: MockData.coinBalance, avatarId: 'av-3');
    }
  }

  void _startPolling() {
    _pollTimer?.cancel();
    _pollTimer = Timer.periodic(const Duration(seconds: 60), (_) async {
      if (_sync.isOnline) {
        final oldCount = _brandedGames.length + _promoGames.length;
        await _fetchGames();
        final newCount = _brandedGames.length + _promoGames.length;
        if (newCount > oldCount && newCount > 0) {
          notifyListeners();
        }
      }
    });
  }

  Future<void> _refreshPendingCount() async {
    await _db.refreshPendingCount();
    _pendingCount = _db.pendingCount;
  }

  /// Public method to refresh profile from server (e.g. after session complete)
  Future<void> refreshProfile() async {
    await _fetchProfile();
    notifyListeners();
  }

  void _onOnlineChanged(bool online) {
    _offline = !online;
    notifyListeners();
    if (online) {
      Future.wait([
        _fetchProfile(),
        _fetchGames(),
        _fetchTransactions(),
        _fetchRewards(),
        _fetchLeaderboard(),
      ]).then((_) => notifyListeners());
    }
  }

  void _onSyncCompleted(int syncedCount) {
    if (syncedCount > 0) {
      Future.wait([
        _fetchProfile(),
        _fetchTransactions(),
      ]).then((_) {
        _refreshPendingCount();
        notifyListeners();
      });
    }
  }

  /// Fetch profile from API — ALWAYS overwrites local data.
  Future<void> _fetchProfile() async {
    try {
      final data = await ApiService.get('/pauth/me');
      final playerData = data['player'] as Map<String, dynamic>;
      _user = User.fromJson(playerData);
      // Save correct data to local DB
      await _db.savePlayerProfile(playerData);
    } catch (_) {
      // API failed — keep existing _user if we have one, otherwise fallback
      _user ??= User(id: 0, username: MockData.username, pcBalance: MockData.coinBalance, avatarId: 'av-3');
    }
  }

  Future<void> _fetchGames() async {
    try {
      final data = await ApiService.get('/play/play-page-games');
      final branded = (data['featured'] as List?)?.cast<Map<String, dynamic>>() ?? [];
      final promo = (data['promogames'] as List?)?.cast<Map<String, dynamic>>() ?? [];
      final all = [...branded, ...promo];
      if (all.isNotEmpty) {
        await _db.upsertGames(all);
        _brandedGames = branded;
        _promoGames = promo;
      }
    } catch (_) {}
  }

  Future<void> _fetchTransactions() async {
    try {
      final data = await ApiService.get('/pauth/transactions');
      final txs = (data['transactions'] as List?)?.cast<Map<String, dynamic>>() ?? [];
      if (txs.isNotEmpty) {
        await _db.upsertTransactions(txs);
        _transactions = txs;
      }
    } catch (_) {}
  }

  Future<void> _fetchRewards() async {
    try {
      final data = await ApiService.get('/pauth/rewards');
      final rewards = (data['rewards'] as List?)?.cast<Map<String, dynamic>>() ?? [];
      if (rewards.isNotEmpty) {
        await _db.upsertRewards(rewards);
        _rewards = rewards;
      }
    } catch (_) {}
  }

  Future<void> _fetchLeaderboard() async {
    try {
      final data = await ApiService.get('/pauth/leaderboard');
      final lb = (data['leaderboard'] as List?)?.cast<Map<String, dynamic>>() ?? [];
      if (lb.isNotEmpty) {
        await _db.upsertLeaderboard(lb);
        _leaderboard = lb;
      }
    } catch (_) {}
  }

  Future<void> queueOfflineSession(Map<String, dynamic> session) async {
    await _db.queueSession(session);
    await _refreshPendingCount();
    notifyListeners();
  }

  Future<void> addLocalPcTransaction({
    required int playerId,
    required String type,
    required int points,
    int? gameId,
    required String note,
  }) async {
    await _db.addPcTransaction(
      playerId: playerId,
      type: type,
      points: points,
      gameId: gameId,
      note: note,
    );
    final profile = await _db.getPlayerProfile();
    if (profile != null) {
      _user = User(
        id: profile['id'] as int,
        username: profile['username'] as String? ?? '',
        pcBalance: profile['pc_balance'] as int? ?? 0,
        avatarId: profile['avatar_id'] as String?,
      );
    }
    notifyListeners();
  }

  /// Clear stale local profile data (call on logout)
  Future<void> clearLocalProfile() async {
    _user = null;
    await _db.clearAll();
    notifyListeners();
  }

  @override
  void dispose() {
    _pollTimer?.cancel();
    _sync.removeListener(_onOnlineChanged);
    _sync.removeSyncListener(_onSyncCompleted);
    super.dispose();
  }
}
