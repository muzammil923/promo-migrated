import 'dart:async';

import 'package:promogames_engine/engine.dart';

class ArrowEscapeEngine extends GameEngine {
  static const int cols = 7;
  static const int rows = 12;

  late List<List<int>> grid;
  late int px, py;
  late List<List<int>> obstacles;
  int _score = 0;
  bool _dead = false;
  late int tickMs;
  int level = 0;
  Timer? _timer;

  @override
  int get score => _score;
  @override
  int get maxScore => _score;
  @override
  bool get completed => _dead;

  bool get dead => _dead;

  ArrowEscapeEngine({Map<String, dynamic> settings = const {}}) {
    tickMs = (settings['tick_ms'] as num?)?.toInt() ?? 450;
    _reset();
  }

  void _reset() {
    grid = List.generate(rows, (_) => List.filled(cols, 0));
    px = cols ~/ 2;
    py = rows - 1;
    obstacles = [];
    _score = 0;
    _dead = false;
    level = 0;
    tickMs = 450;
    grid[py][px] = 1;
    _schedule();
  }

  void newGame() {
    _timer?.cancel();
    _reset();
    notifyListeners();
  }

  void _schedule() {
    _timer?.cancel();
    _timer = Timer(Duration(milliseconds: tickMs), _tick);
  }

  void _spawn() {
    final n = 1 + (level ~/ 5);
    for (int i = 0; i < n; i++) {
      final c = DateTime.now().microsecondsSinceEpoch + i * 13 + _score;
      obstacles.add([c % cols, 0]);
    }
  }

  void _tick() {
    if (_dead) return;
    for (final o in obstacles) {
      o[1]++;
    }
    obstacles.removeWhere((o) => o[1] >= rows);
    for (final o in obstacles) {
      if (o[0] == px && o[1] == py) {
        _dead = true;
        emit(GameFx.gameOver);
        notifyListeners();
        return;
      }
    }
    _score++;
    level++;
    if (level % 10 == 0 && tickMs > 150) tickMs -= 30;
    _spawn();
    emit(GameFx.tick);
    notifyListeners();
    _schedule();
  }

  void move(int dx, int dy) {
    if (_dead) return;
    final nx = px + dx;
    final ny = py + dy;
    if (nx < 0 || nx >= cols || ny < 0 || ny >= rows) return;
    if (obstacles.any((o) => o[0] == nx && o[1] == ny)) {
      _dead = true;
      emit(GameFx.gameOver);
      notifyListeners();
      return;
    }
    px = nx;
    py = ny;
    notifyListeners();
  }

  void exitEarly() {
    _timer?.cancel();
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }
}
