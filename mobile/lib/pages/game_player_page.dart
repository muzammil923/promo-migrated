import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../models/game.dart';
import 'package:promogames_engine/engine.dart';
import '../services/api_service.dart';
import '../services/auth_service.dart';
import '../services/player_provider.dart';
import '../services/sync_service.dart';
import '../services/game_data_service.dart';
import '../widgets/spinning_logo.dart';
import '../games/registry.dart';

class GamePlayerPage extends StatefulWidget {
  final Game game;
  final String? utmSource;
  const GamePlayerPage({super.key, required this.game, this.utmSource});

  @override
  State<GamePlayerPage> createState() => _GamePlayerPageState();
}

class _GamePlayerPageState extends State<GamePlayerPage> {
  bool _loading = true;
  GameConfig? _config;
  String? _error;
  bool _finished = false;
  String? _sessionToken;

  @override
  void initState() {
    super.initState();
    _init();
  }

  Future<void> _init() async {
    // Fetch full game config from backend (with local cache fallback)
    try {
      _config = await GameDataService.instance.fetch(widget.game.id);
    } catch (_) {
      _config = GameConfig(
        id: widget.game.id,
        name: widget.game.name,
        category: widget.game.category,
      );
    }

    // Start session on backend (non-blocking)
    await _startSession();

    if (mounted) {
      setState(() => _loading = false);
    }
  }

  Future<void> _startSession() async {
    final auth = context.read<AuthService>();
    final playerId = auth.user?.id;
    try {
      final data = await ApiService.post('/play/session/start', {
        'game_id': widget.game.id,
        'player_data': {},
        'source_type': 'link',
        'promo_player_id': playerId,
        'utm_source': widget.utmSource ?? '',
      }, auth: playerId != null);
      _sessionToken = data['session_token']?.toString();
      if (data['already_played'] == true && mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('You have already played this game')),
        );
        context.pop();
      }
    } catch (_) {
      // Session start failed — game will still work, just won't sync score
    }
  }

  void _onFinished(int score, int maxScore, bool completed) {
    if (_finished) return;
    _finished = true;

    // Report score (offline-first) — PC is awarded server-side on completion
    _reportScore(score, maxScore);

    if (!mounted) return;
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (_) => AlertDialog(
        backgroundColor: const Color(0xFF1a0e2e),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: const Text('Game Over', style: TextStyle(color: Color(0xFFf0ecff))),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const SpinningLogo(size: 48),
            const SizedBox(height: 16),
            Text('Score: $score${maxScore > 0 ? ' / $maxScore' : ''}',
                style: const TextStyle(color: Color(0xFFa78bfa), fontSize: 20, fontWeight: FontWeight.bold)),
            const SizedBox(height: 8),
            _buildSyncBadge(),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () {
              if (mounted) context.pop();
            },
            child: const Text('Close', style: TextStyle(color: Color(0xFFa78bfa))),
          ),
        ],
      ),
    ).then((_) {
      if (mounted) context.pop();
    });
  }

  Widget _buildSyncBadge() {
    final isOnline = SyncService.instance.isOnline;
    final pending = context.read<PlayerProvider>().pendingCount;
    if (isOnline && pending == 0) {
      return const Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.cloud_done, color: Color(0xFF22c55e), size: 16),
          SizedBox(width: 4),
          Text('Synced', style: TextStyle(color: Color(0xFF22c55e), fontSize: 12)),
        ],
      );
    }
    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        Icon(
          isOnline ? Icons.sync : Icons.cloud_off,
          color: const Color(0xFFf59e0b),
          size: 16,
        ),
        const SizedBox(width: 4),
        Text(
          isOnline ? 'Syncing…' : 'Offline — will sync later',
          style: const TextStyle(color: Color(0xFFf59e0b), fontSize: 12),
        ),
      ],
    );
  }

  Future<void> _reportScore(int score, int maxScore) async {
    if (SyncService.instance.isOnline && _sessionToken != null) {
      try {
        await ApiService.post('/play/session/complete', {
          'session_token': _sessionToken,
          'score': score,
          'total_scoreable': maxScore,
          'player_data': {},
        });
        // Refresh profile to get updated PC balance from server
        if (mounted) {
          await context.read<PlayerProvider>().refreshProfile();
        }
        return;
      } catch (_) {}
    }
    // Offline — queue locally for later sync
    if (mounted) {
      final auth = context.read<AuthService>();
      final playerId = auth.user?.id;
      await context.read<PlayerProvider>().queueOfflineSession({
        'game_id': widget.game.id,
        'score': score,
        'max_score': maxScore,
        'utm_source': widget.utmSource ?? '',
        'player_data': '{}',
        if (playerId != null) 'promo_player_id': playerId,
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) return const FullScreenSpinner(label: 'Loading game…');
    if (_error != null) {
      return Scaffold(
        backgroundColor: const Color(0xFF0d0a1a),
        appBar: AppBar(title: Text(widget.game.name), backgroundColor: const Color(0xFF1a0e2e)),
        body: Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(Icons.error_outline, color: Colors.red, size: 48),
              const SizedBox(height: 16),
              Text(_error!, style: const TextStyle(color: Colors.white70)),
              const SizedBox(height: 16),
              ElevatedButton(
                onPressed: () => context.pop(),
                child: const Text('Go Back'),
              ),
            ],
          ),
        ),
      );
    }

    final config = _config ?? GameConfig(id: widget.game.id, name: widget.game.name, category: widget.game.category);
    final builder = gameBuilder(config.category);
    return builder(config, _onFinished);
  }
}

class FullScreenSpinner extends StatelessWidget {
  final String label;
  const FullScreenSpinner({super.key, required this.label});
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0d0a1a),
      body: Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const SpinningLogo(size: 48),
            const SizedBox(height: 16),
            Text(label, style: const TextStyle(color: Color(0xFFa78bfa), fontSize: 14)),
          ],
        ),
      ),
    );
  }
}
