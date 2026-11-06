import 'dart:math';

import 'package:promogames_engine/engine.dart';

class CandyBlastEngine extends GameEngine {
  static const int n = 8;
  static const int gemColors = 6;

  late List<List<int>> board;
  List<int>? selected;
  int _score = 0;
  final Random _rnd = Random();

  @override
  int get score => _score;
  @override
  int get maxScore => _score;
  @override
  bool get completed => false;

  CandyBlastEngine({Map<String, dynamic> settings = const {}}) {
    _newGame();
  }

  void _newGame() {
    board = List.generate(n, (r) => List.generate(n, (c) {
      int v;
      do {
        v = _rnd.nextInt(gemColors);
      } while (_createsMatch(r, c, v));
      return v;
    }));
    selected = null;
    _score = 0;
  }

  bool _createsMatch(int r, int c, int v) {
    if (c >= 2 && board[r][c - 1] == v && board[r][c - 2] == v) return true;
    if (r >= 2 && board[r - 1][c] == v && board[r - 2][c] == v) return true;
    return false;
  }

  bool _adjacent(List<int> a, List<int> b) =>
      (a[0] - b[0]).abs() + (a[1] - b[1]).abs() == 1;

  void tap(int r, int c) {
    if (selected == null) {
      selected = [r, c];
      notifyListeners();
      return;
    }
    if (selected![0] == r && selected![1] == c) {
      selected = null;
      notifyListeners();
      return;
    }
    if (_adjacent(selected!, [r, c])) {
      _swap(selected!, [r, c]);
    } else {
      selected = [r, c];
      notifyListeners();
    }
  }

  void _swap(List<int> a, List<int> b) {
    final tmp = board[a[0]][a[1]];
    board[a[0]][a[1]] = board[b[0]][b[1]];
    board[b[0]][b[1]] = tmp;
    if (_findMatches().isEmpty) {
      final t2 = board[a[0]][a[1]];
      board[a[0]][a[1]] = board[b[0]][b[1]];
      board[b[0]][b[1]] = t2;
      selected = null;
      notifyListeners();
    } else {
      selected = null;
      _resolve();
      emit(GameFx.correct);
    }
  }

  Set<String> _findMatches() {
    final matched = <String>{};
    for (int r = 0; r < n; r++) {
      for (int c = 0; c < n - 2; c++) {
        final v = board[r][c];
        if (v < 0) continue;
        if (board[r][c + 1] == v && board[r][c + 2] == v) {
          int k = c;
          while (k < n && board[r][k] == v) { matched.add('$r,$k'); k++; }
        }
      }
    }
    for (int c = 0; c < n; c++) {
      for (int r = 0; r < n - 2; r++) {
        final v = board[r][c];
        if (v < 0) continue;
        if (board[r + 1][c] == v && board[r + 2][c] == v) {
          int k = r;
          while (k < n && board[k][c] == v) { matched.add('$k,$c'); k++; }
        }
      }
    }
    return matched;
  }

  void _resolve() {
    int gained = 0;
    for (int pass = 0; pass < 20; pass++) {
      final matched = _findMatches();
      if (matched.isEmpty) break;
      gained += matched.length;
      for (final m in matched) {
        final parts = m.split(',');
        board[int.parse(parts[0])][int.parse(parts[1])] = -1;
      }
      for (int c = 0; c < n; c++) {
        final col = <int>[];
        for (int r = n - 1; r >= 0; r--) {
          if (board[r][c] != -1) col.add(board[r][c]);
        }
        for (int r = n - 1; r >= 0; r--) {
          board[r][c] = col.length > (n - 1 - r) ? col[n - 1 - r] : -1;
        }
        for (int r = 0; r < n; r++) {
          if (board[r][c] == -1) board[r][c] = _rnd.nextInt(gemColors);
        }
      }
    }
    _score += gained;
    notifyListeners();
  }

  void newGame() {
    _newGame();
    notifyListeners();
  }

  void exitEarly() {}
}
