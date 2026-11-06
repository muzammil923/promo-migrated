import 'dart:async';
import 'dart:math';

import 'package:promogames_engine/engine.dart';

/// Headless memory-match engine. Pairs come from real admin tiles
/// (`config.tiles`: `pair_id` / `tile_label` / `image_url`); builder settings
/// control grid size and the optional countdown (`time_limit_seconds`).
class MemoryEngine extends GameEngine {
  late final List<MemoryCard> cards;
  final int cols;

  final Set<int> _revealed = {};
  final Set<int> _matched = {};
  int _firstPick = -1;
  bool _busy = false;
  int _moves = 0;
  int _matches = 0;
  Timer? _lockTimer;
  Timer? _countdown;

  @override
  int get score => _matches;

  @override
  int get maxScore => cards.length ~/ 2;

  @override
  bool completed = false;

  int get moves => _moves;
  bool get busy => _busy;
  int get pairsTotal => maxScore;
  bool isRevealed(int i) => _revealed.contains(i) || _matched.contains(i);
  bool isMatched(int i) => _matched.contains(i);
  int? get timeLeft => _timeLeft;
  int? _timeLeft;

  MemoryEngine({Map<String, dynamic> settings = const {}, List<dynamic> tiles = const []})
      : cols = _int(settings['grid_cols'], 4, 2, 8) {
    cards = _buildCards(tiles);
    _shuffle();
    final limit = _int(settings['time_limit_seconds'], 0, 0, 3600);
    if (limit > 0) {
      _timeLeft = limit;
      _countdown = Timer.periodic(const Duration(seconds: 1), (_) {
        if (completed) return _countdown?.cancel();
        _timeLeft = _timeLeft! - 1;
        emit(GameFx.tick);
        if (_timeLeft! <= 0) _finishTimedOut();
        notifyListeners();
      });
    }
  }

  static int _int(dynamic v, int fallback, int min, int max) {
    final n = v is num ? v.toInt() : int.tryParse(v?.toString() ?? '');
    if (n == null) return fallback;
    return n.clamp(min, max);
  }

  List<MemoryCard> _buildCards(List<dynamic> raw) {
    // Group tiles into pairs by pair_id, falling back to consecutive order.
    final byPair = <int, List<Map<String, dynamic>>>{};
    var fallbackIdx = 0;
    for (final t in raw) {
      if (t is! Map || t['image_url'] == null && t['tile_label'] == null) continue;
      final pairId = t['pair_id'] is num ? (t['pair_id'] as num).toInt() : null;
      final key = pairId ?? 100000 + (fallbackIdx++ ~/ 2);
      byPair.putIfAbsent(key, () => []).add(Map<String, dynamic>.from(t));
    }

    final faces = <MemoryCard>[];
    const emojis = ['🍎', '🚀', '⭐', '🎈', '🐱', '🌈', '🍕', '⚽', '🎧', '🍩', '🐝', '🌊'];
    if (byPair.isEmpty) {
      for (var p = 0; p < emojis.length; p++) {
        faces.add(MemoryCard(label: emojis[p]));
        faces.add(MemoryCard(label: emojis[p]));
      }
      return faces;
    }
    byPair.forEach((_, pairTiles) {
      final t = pairTiles.first;
      faces.add(MemoryCard(
        label: t['tile_label']?.toString(),
        imageUrl: t['image_url']?.toString(),
      ));
      if (pairTiles.length > 1) {
        final t2 = pairTiles.elementAt(1);
        faces.add(MemoryCard(
          label: t2['tile_label']?.toString(),
          imageUrl: t2['image_url']?.toString(),
        ));
      } else {
        faces.add(MemoryCard(
          label: t['tile_label']?.toString(),
          imageUrl: t['image_url']?.toString(),
        ));
      }
    });
    return faces.length >= 4 ? faces : (faces..addAll(List.generate(4 - faces.length, (_) => MemoryCard(label: '★'))));
  }

  void _shuffle() {
    final rnd = Random();
    for (var i = cards.length - 1; i > 0; i--) {
      final j = rnd.nextInt(i + 1);
      final tmp = cards[i];
      cards[i] = cards[j];
      cards[j] = tmp;
    }
  }

  void flip(int i) {
    if (_busy || completed || _matched.contains(i) || _revealed.contains(i)) return;
    _revealed.add(i);
    emit(GameFx.tick);
    notifyListeners();

    if (_firstPick == -1) {
      _firstPick = i;
      return;
    }
    final a = _firstPick;
    _firstPick = -1;
    _moves++;
    if (cards[a].sameFaceAs(cards[i])) {
      _matched.add(a);
      _matched.add(i);
      _matches++;
      emit(GameFx.match);
      if (_matches == maxScore) _finishWin();
      notifyListeners();
    } else {
      _busy = true;
      emit(GameFx.mismatch);
      _lockTimer = Timer(const Duration(milliseconds: 750), () {
        _revealed.remove(a);
        _revealed.remove(i);
        _busy = false;
        notifyListeners();
      });
    }
  }

  void _finishWin() {
    completed = true;
    emit(GameFx.win);
    _countdown?.cancel();
  }

  void _finishTimedOut() {
    if (completed) return;
    completed = true;
    emit(GameFx.gameOver);
    _countdown?.cancel();
  }

  void exitEarly() {
    _lockTimer?.cancel();
    _countdown?.cancel();
  }

  @override
  void dispose() {
    exitEarly();
    super.dispose();
  }
}

class MemoryCard {
  final String? label;
  final String? imageUrl;
  const MemoryCard({this.label, this.imageUrl});

  bool sameFaceAs(MemoryCard other) =>
      imageUrl != null && other.imageUrl != null
          ? imageUrl == other.imageUrl
          : label != null && label == other.label;
}
