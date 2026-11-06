import 'dart:async';
import 'dart:collection';
import 'dart:math';

import 'package:promogames_engine/engine.dart';

/// Headless Snake engine.
///
/// Owns the rules only: grid state, movement ticks, collision, scoring and
/// feedback events. No widgets, no colors, no network. The companion
/// `playerpage.dart` renders this state and translates [fx] into haptics.
class SnakeEngine extends GameEngine {
  final int cols;
  final int rows;
  final bool wrap;

  /// Milliseconds per movement tick, derived from builder `speed` (1–10).
  late final int tickMs;

  final List<(int, int)> snake;
  (int, int) dir = (1, 0);
  (int, int) food = (0, 0);

  @override
  int score = 0;

  @override
  int get maxScore => score;

  bool _dead = false;

  @override
  bool get completed => _dead;

  Timer? _timer;
  final Queue<(int, int)> _pendingDirs = Queue();
  final Random _rnd = Random();

  SnakeEngine({Map<String, dynamic> settings = const {}})
      : cols = _int(settings['board_width'], 20, 8, 40),
        rows = _int(settings['board_height'], 20, 8, 40),
        wrap = settings['wall_mode']?.toString() == 'wrap',
        snake = [(5, 10), (4, 10), (3, 10)] {
    final speed = _int(settings['speed'], 5, 1, 10);
    tickMs = (12 - speed) * 22;
    _placeFood();
  }

  static int _int(dynamic v, int fallback, int min, int max) {
    final n = v is num ? v.toInt() : int.tryParse(v?.toString() ?? '');
    if (n == null) return fallback;
    return n.clamp(min, max);
  }

  void start() {
    _timer ??= Timer.periodic(Duration(milliseconds: tickMs), (_) => _tick());
  }

  void setDir(int dx, int dy) {
    if (_dead) return;
    final last = _pendingDirs.isEmpty ? dir : _pendingDirs.last;
    if ((dx == -last.$1 && dy == -last.$2) || (dx == last.$1 && dy == last.$2)) {
      return;
    }
    if (_pendingDirs.length < 2) _pendingDirs.add((dx, dy));
  }

  void _tick() {
    if (_dead) return;
    if (_pendingDirs.isNotEmpty) dir = _pendingDirs.removeFirst();
    final head = snake.first;
    var nx = head.$1 + dir.$1;
    var ny = head.$2 + dir.$2;
    if (wrap) {
      nx = (nx + cols) % cols;
      ny = (ny + rows) % rows;
    } else if (nx < 0 || nx >= cols || ny < 0 || ny >= rows) {
      _die();
      return;
    }
    for (var i = 0; i < snake.length - 1; i++) {
      if (snake[i] == (nx, ny)) {
        _die();
        return;
      }
    }
    snake.insert(0, (nx, ny));
    if ((nx, ny) == food) {
      score++;
      emit(GameFx.correct);
      _placeFood();
    } else {
      snake.removeLast();
    }
    notifyListeners();
  }

  void _placeFood() {
    do {
      food = (_rnd.nextInt(cols), _rnd.nextInt(rows));
    } while (snake.contains(food));
  }

  void _die() {
    _dead = true;
    _timer?.cancel();
    _timer = null;
    emit(GameFx.gameOver);
    notifyListeners();
  }

  void exitEarly() {
    _timer?.cancel();
    _timer = null;
  }

  @override
  void dispose() {
    exitEarly();
    super.dispose();
  }
}
