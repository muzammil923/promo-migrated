import 'dart:math';

import 'package:promogames_engine/engine.dart';

/// Headless word-search engine. Places real admin words (`config.words`:
/// `word_text`) in 4 directions with an RNG, fills remaining cells randomly,
/// validates tap-selections and hands out first-letter hints when
/// `allow_hints` is on.
class WordSearchEngine extends GameEngine {
  late final int size;
  late final List<List<String>> board;
  final List<String> words = [];
  final Set<String> found = {};
  final bool allowHints;

  int? _hintR;
  int? _hintC;
  final Random _rnd;

  @override
  int get score => found.length;

  @override
  int get maxScore => words.length;

  @override
  bool get completed => words.isNotEmpty && found.length == words.length;

  int? get hintRow => _hintR;
  int? get hintCol => _hintC;

  static const _directions = [(0, 1), (1, 0), (1, 1), (1, -1)];
  static const _alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

  WordSearchEngine({
    Map<String, dynamic> settings = const {},
    List<dynamic> wordRows = const [],
    int? seed,
  })  : allowHints = settings['allow_hints']?.toString() != '0',
        _rnd = seed == null ? Random() : Random(seed) {
    for (final w in wordRows) {
      if (w is! Map) continue;
      final text = (w['word_text'] ?? '').toString().trim().toUpperCase();
      if (text.length >= 3 && RegExp(r'^[A-Z]+$').hasMatch(text)) words.add(text);
    }
    if (words.isEmpty) words.addAll(['GAME', 'CODE', 'PLAY', 'DART', 'FLUT']);

    var grid = _int(settings['grid_rows'], 12);
    final longest = words.map((w) => w.length).reduce(max);
    if (grid < longest + 1) grid = longest + 1;
    size = grid.clamp(8, 16);

    board = List.generate(size, (_) => List.filled(size, ''));
    for (final w in words) {
      _placeWord(w);
    }
    for (var r = 0; r < size; r++) {
      for (var c = 0; c < size; c++) {
        if (board[r][c].isEmpty) board[r][c] = _alphabet[_rnd.nextInt(26)];
      }
    }
  }

  static int _int(dynamic v, int fallback) {
    final n = v is num ? v.toInt() : int.tryParse(v?.toString() ?? '');
    return n ?? fallback;
  }

  void _placeWord(String w) {
    for (var attempt = 0; attempt < 200; attempt++) {
      final d = _directions[_rnd.nextInt(_directions.length)];
      final r0 = _startCoord(w.length, d.$1, size);
      final c0 = _startCoord(w.length, d.$2, size);
      if (!_fits(w, r0, c0, d.$1, d.$2)) continue;
      for (var i = 0; i < w.length; i++) {
        board[r0 + d.$1 * i][c0 + d.$2 * i] = w[i];
      }
      return;
    }
  }

  /// Valid start index for a word of [len] stepping [step] within [bound].
  int _startCoord(int len, int step, int bound) {
    final room = bound - len + 1;
    if (step > 0) return _rnd.nextInt(room);
    if (step < 0) return (len - 1) + _rnd.nextInt(room);
    return _rnd.nextInt(bound);
  }

  bool _fits(String w, int r0, int c0, int dr, int dc) {
    for (var i = 0; i < w.length; i++) {
      final r = r0 + dr * i;
      final c = c0 + dc * i;
      final cell = board[r][c];
      if (cell.isNotEmpty && cell != w[i]) return false;
    }
    return true;
  }

  /// Validates a selection between two cells. Returns the matched word or
  /// null. Accepts reversed picks and marks completion automatically.
  String? select(int sr, int sc, int er, int ec) {
    final dr = er - sr;
    final dc = ec - sc;
    if (dr == 0 && dc == 0) return null;
    if (dr != 0 && dc != 0 && dr.abs() != dc.abs()) return null;
    final steps = max(dr.abs(), dc.abs());
    final sdr = dr ~/ steps;
    final sdc = dc ~/ steps;
    final buf = StringBuffer();
    for (var k = 0; k <= steps; k++) {
      buf.write(board[sr + sdr * k][sc + sdc * k]);
    }
    final picked = buf.toString();
    final rev = picked.split('').reversed.join();
    for (final w in words) {
      if ((picked == w || rev == w) && !found.contains(w)) {
        found.add(w);
        emit(GameFx.match);
        if (completed) emit(GameFx.win);
        notifyListeners();
        return w;
      }
    }
    emit(GameFx.mismatch);
    notifyListeners();
    return null;
  }

  /// Reveals the first-letter cell of an unfound word. Returns true when a
  /// hint was available.
  bool revealHint() {
    if (!allowHints) return false;
    for (final w in words) {
      if (found.contains(w)) continue;
      for (var r = 0; r < size; r++) {
        for (var c = 0; c < size; c++) {
          if (board[r][c] == w[0]) {
            _hintR = r;
            _hintC = c;
            emit(GameFx.tick);
            notifyListeners();
            return true;
          }
        }
      }
    }
    return false;
  }

  void exitEarly() {}

  @override
  void dispose() {
    exitEarly();
    super.dispose();
  }
}
