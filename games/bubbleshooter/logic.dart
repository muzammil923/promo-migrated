import 'dart:math';

import 'package:promogames_engine/engine.dart';

/// Headless Bubble Shooter engine. Owns the rules: grid management, projectile
/// physics, matching logic, scoring. No widgets, no colors, no network.
class BubbleShooterEngine extends GameEngine {
  final int rows;
  final int cols;
  final int numColors;

  late List<List<int>> grid;
  int _score = 0;
  bool _dead = false;
  int _projectileColor = 0;
  final Random _rnd = Random();

  @override
  int get score => _score;
  @override
  int get maxScore => _score;
  @override
  bool get completed => _dead;

  int get projectileColor => _projectileColor;
  int get cellSize => 36;

  BubbleShooterEngine({Map<String, dynamic> settings = const {}})
      : rows = _int(settings['grid_rows'], 8, 4, 15),
        cols = _int(settings['grid_cols'], 8, 4, 15),
        numColors = _int(settings['num_colors'], 5, 2, 8) {
    _initGrid();
    _pickProjectile();
  }

  static int _int(dynamic v, int fallback, int min, int max) {
    final n = v is num ? v.toInt() : int.tryParse(v?.toString() ?? '');
    if (n == null) return fallback;
    return n.clamp(min, max);
  }

  void _initGrid() {
    grid = List.generate(rows, (r) => List.generate(cols, (c) {
      if (r < rows ~/ 2) return _rnd.nextInt(numColors) + 1;
      return 0;
    }));
  }

  void _pickProjectile() {
    final colors = <int>{};
    for (final row in grid) {
      for (final c in row) {
        if (c > 0) colors.add(c);
      }
    }
    if (colors.isEmpty) {
      _projectileColor = _rnd.nextInt(numColors) + 1;
    } else {
      _projectileColor = colors.elementAt(_rnd.nextInt(colors.length));
    }
  }

  void shoot(int col) {
    if (_dead || col < 0 || col >= cols) return;

    int row = rows - 1;
    while (row >= 0 && grid[row][col] != 0) row--;
    if (row < 0) { _die(); return; }

    grid[row][col] = _projectileColor;
    final matches = _findConnected(row, col, _projectileColor);

    if (matches.length >= 3) {
      for (final pos in matches) {
        grid[pos[0]][pos[1]] = 0;
      }
      _score += matches.length;
      emit(GameFx.correct);
      _dropFloating();
    } else {
      emit(GameFx.tick);
    }

    _pickProjectile();
    if (grid[0].any((c) => c != 0)) {
      _die();
      return;
    }
    notifyListeners();
  }

  List<List<int>> _findConnected(int r, int c, int color) {
    final visited = <String>{};
    final result = <List<int>>[];
    final queue = [[r, c]];
    visited.add('$r:$c');

    while (queue.isNotEmpty) {
      final pos = queue.removeLast();
      result.add(pos);
      for (final dir in [
        [-1, 0], [1, 0], [0, -1], [0, 1],
      ]) {
        final nr = pos[0] + dir[0], nc = pos[1] + dir[1];
        final key = '$nr:$nc';
        if (nr >= 0 && nr < rows && nc >= 0 && nc < cols &&
            !visited.contains(key) && grid[nr][nc] == color) {
          visited.add(key);
          queue.add([nr, nc]);
        }
      }
    }
    return result;
  }

  void _dropFloating() {
    final connected = <String>{};
    for (var c = 0; c < cols; c++) {
      if (grid[0][c] != 0) {
        for (final pos in _findConnected(0, c, grid[0][c])) {
          connected.add('${pos[0]}:${pos[1]}');
        }
      }
    }
    for (var r = 0; r < rows; r++) {
      for (var c = 0; c < cols; c++) {
        if (grid[r][c] != 0 && !connected.contains('$r:$c')) {
          _score++;
          grid[r][c] = 0;
        }
      }
    }
  }

  void _die() {
    _dead = true;
    emit(GameFx.gameOver);
    notifyListeners();
  }

  void exitEarly() {}

  @override
  void dispose() {
    super.dispose();
  }
}
