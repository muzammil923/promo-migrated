import 'dart:math';

import 'package:promogames_engine/engine.dart';

class Game2048Engine extends GameEngine {
  late List<List<int>> board;
  int _score = 0;
  bool _over = false;
  final Random _rnd = Random();

  @override
  int get score => _score;
  @override
  int get maxScore => _score;
  @override
  bool get completed => _over;

  bool get isOver => _over;

  Game2048Engine({Map<String, dynamic> settings = const {}}) {
    _newGame();
  }

  void _newGame() {
    board = List.generate(4, (_) => List.filled(4, 0));
    _score = 0;
    _over = false;
    _addRandom();
    _addRandom();
  }

  void _addRandom() {
    final empty = <List<int>>[];
    for (int r = 0; r < 4; r++) {
      for (int c = 0; c < 4; c++) {
        if (board[r][c] == 0) empty.add([r, c]);
      }
    }
    if (empty.isEmpty) return;
    final p = empty[_rnd.nextInt(empty.length)];
    board[p[0]][p[1]] = (_rnd.nextInt(3) == 0) ? 4 : 2;
  }

  bool _canMove() {
    for (int r = 0; r < 4; r++) {
      for (int c = 0; c < 4; c++) {
        if (board[r][c] == 0) return true;
        if (c < 3 && board[r][c] == board[r][c + 1]) return true;
        if (r < 3 && board[r][c] == board[r + 1][c]) return true;
      }
    }
    return false;
  }

  void move(String dir) {
    if (_over) return;
    final before = _snapshot();
    bool moved = false;
    if (dir == 'left' || dir == 'right') {
      for (int r = 0; r < 4; r++) {
        final row = List<int>.generate(4, (c) => board[r][c]);
        final res = _merge(dir == 'left' ? row : row.reversed.toList());
        final merged = dir == 'left' ? res : res.reversed.toList();
        for (int c = 0; c < 4; c++) {
          if (board[r][c] != merged[c]) moved = true;
          board[r][c] = merged[c];
        }
      }
    } else {
      for (int c = 0; c < 4; c++) {
        final col = List<int>.generate(4, (r) => board[r][c]);
        final res = _merge(dir == 'up' ? col : col.reversed.toList());
        final merged = dir == 'up' ? res : res.reversed.toList();
        for (int r = 0; r < 4; r++) {
          if (board[r][c] != merged[r]) moved = true;
          board[r][c] = merged[r];
        }
      }
    }
    if (moved) {
      _addRandom();
      if (!_canMove()) {
        _over = true;
        emit(GameFx.gameOver);
      } else {
        emit(GameFx.tick);
      }
    } else {
      if (!_snapshotEqual(before)) {
        emit(GameFx.tick);
      }
    }
    notifyListeners();
  }

  List<int> _merge(List<int> line) {
    final nonZero = line.where((e) => e != 0).toList();
    final out = <int>[];
    for (int i = 0; i < nonZero.length; i++) {
      if (i + 1 < nonZero.length && nonZero[i] == nonZero[i + 1]) {
        out.add(nonZero[i] * 2);
        _score += nonZero[i] * 2;
        i++;
      } else {
        out.add(nonZero[i]);
      }
    }
    while (out.length < 4) out.add(0);
    return out;
  }

  List<List<int>> _snapshot() => board.map((r) => List<int>.from(r)).toList();
  bool _snapshotEqual(List<List<int>> s) {
    for (int r = 0; r < 4; r++) {
      for (int c = 0; c < 4; c++) {
        if (s[r][c] != board[r][c]) return false;
      }
    }
    return true;
  }

  void newGame() {
    _newGame();
    notifyListeners();
  }

  void exitEarly() {}
}
