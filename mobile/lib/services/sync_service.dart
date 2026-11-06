import 'dart:async';
import 'dart:convert';
import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:http/http.dart' as http;
import 'local_db_service.dart';
import 'api_service.dart';

class SyncService {
  static final SyncService instance = SyncService._();
  SyncService._();

  final Connectivity _connectivity = Connectivity();
  StreamSubscription? _sub;
  bool _syncing = false;
  bool _initialized = false;

  final List<void Function(bool online)> _listeners = [];
  void addListener(void Function(bool online) cb) => _listeners.add(cb);
  void removeListener(void Function(bool online) cb) => _listeners.remove(cb);

  final List<void Function(int count)> _syncListeners = [];
  void addSyncListener(void Function(int count) cb) => _syncListeners.add(cb);
  void removeSyncListener(void Function(int count) cb) => _syncListeners.remove(cb);

  bool _isOnline = true;
  bool get isOnline => _isOnline;

  Future<void> initialize() async {
    if (_initialized) return;
    _initialized = true;
    final result = await _connectivity.checkConnectivity();
    _isOnline = !result.contains(ConnectivityResult.none);
    _sub = _connectivity.onConnectivityChanged.listen(_onConnectivityChange);
    if (_isOnline) await syncPending();
  }

  void _onConnectivityChange(List<ConnectivityResult> results) {
    final online = !results.contains(ConnectivityResult.none);
    if (online == _isOnline) return;
    _isOnline = online;
    for (final cb in _listeners) {
      cb(online);
    }
    if (online) syncPending();
  }

  Future<void> syncPending() async {
    if (_syncing || !_isOnline) return;
    _syncing = true;
    try {
      final pending = await LocalDbService.instance.getPendingSessions();
      if (pending.isEmpty) return;

      int syncedCount = 0;
      for (final s in pending) {
        final attempts = s['sync_attempts'] as int? ?? 0;
        if (attempts >= 5) continue;

        try {
          final utmSource = s['utm_source'] as String?;
          final promoPlayerId = s['promo_player_id'] as int?;

          // Step 1: Start session on backend
          final startBody = jsonEncode({
            'game_id': s['game_id'],
            'source_type': 'link',
            if (promoPlayerId != null) 'promo_player_id': promoPlayerId,
            if (utmSource != null && utmSource.isNotEmpty)
              'utm_source': utmSource,
          });
          final sessionStartRes = await http.post(
            Uri.parse('${ApiService.baseUrl}/play/session/start'),
            headers: {'Content-Type': 'application/json'},
            body: startBody,
          ).timeout(const Duration(seconds: 15));

          if (sessionStartRes.statusCode != 200) {
            await LocalDbService.instance.incrementSyncAttempt(
              s['id'] as int,
              'Session start failed: ${sessionStartRes.statusCode}',
            );
            continue;
          }

          final sessionData = jsonDecode(sessionStartRes.body) as Map<String, dynamic>;
          final sessionToken = sessionData['session_token']?.toString();

          // Step 2: Complete session on backend
          final completeBody = jsonEncode({
            'session_token': sessionToken,
            'score': s['score'],
            'total_scoreable': s['max_score'],
            'player_data': {},
          });
          final completeRes = await http.post(
            Uri.parse('${ApiService.baseUrl}/play/session/complete'),
            headers: {'Content-Type': 'application/json'},
            body: completeBody,
          ).timeout(const Duration(seconds: 15));

          if (completeRes.statusCode != 200) {
            await LocalDbService.instance.incrementSyncAttempt(
              s['id'] as int,
              'Session complete failed: ${completeRes.statusCode}',
            );
            continue;
          }

          await LocalDbService.instance.markSessionSynced(s['id'] as int);
          syncedCount++;
        } catch (e) {
          await LocalDbService.instance.incrementSyncAttempt(
            s['id'] as int,
            e.toString(),
          );
        }
      }

      await LocalDbService.instance.clearSyncedSessions();
      await LocalDbService.instance.refreshPendingCount();

      for (final cb in _syncListeners) {
        cb(syncedCount);
      }
    } finally {
      _syncing = false;
    }
  }

  void dispose() {
    _sub?.cancel();
  }
}
