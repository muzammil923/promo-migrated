import 'dart:async';

import 'package:promogames_engine/engine.dart';

class Connect4Engine extends GameEngine {
  static const int cols = 7;
  static const int rows = 6;

  late List<List<int?>> board;
  bool playerTurn = true;
  bool _finished = false;
  int result = -1;
  Timer? _timer;

  @override
  int get score => result == 1 ? 1 : 0;
  @override
  int get maxScore => 1;
  @override
  bool get completed => _finished;

  bool get isFinished => _finished;
  bool get isPlayerTurn => playerTurn;

  Connect4Engine({Map<String, dynamic> settings = const {}}) {
    board = List.generate(rows, (_) => List.filled(cols, null));
  }

  int? _dropCol(int c) {
    for (int r = rows - 1; r >= 0; r--) {
      if (board[r][c] == null) return r;
    }
    return null;
  }

  bool _full() {
    for (int c = 0; c < cols; c++) {
      if (board[0][c] == null) return false;
    }
    return true;
  }

  int _checkWin(int player) {
    for (int r = 0; r < rows; r++) {
      for (int c = 0; c < cols; c++) {
        if (board[r][c] != player) continue;
        if (c + 3 < cols &&
            board[r][c + 1] == player &&
            board[r][c + 2] == player &&
            board[r][c + 3] == player) return player;
        if (r + 3 < rows &&
            board[r + 1][c] == player &&
            board[r + 2][c] == player &&
            board[r + 3][c] == player) return player;
        if (r + 3 < rows && c + 3 < cols &&
            board[r + 1][c + 1] == player &&
            board[r + 2][c + 2] == player &&
            board[r + 3][c + 3] == player) return player;
        if (r - 3 >= 0 && c + 3 < cols &&
            board[r - 1][c + 1] == player &&
            board[r - 2][c + 2] == player &&
            board[r - 3][c + 3] == player) return player;
      }
    }
    return 0;
  }

  void tapColumn(int c) {
    if (!playerTurn || _finished) return;
    final r = _dropCol(c);
    if (r == null) return;
    board[r][c] = 1;
    if (_checkWin(1) == 1) {
      _end(1);
      return;
    }
    if (_full()) {
      _end(0);
      return;
    }
    playerTurn = false;
    emit(GameFx.tick);
    notifyListeners();
    _timer = Timer(const Duration(milliseconds: 500), _cpuMove);
  }

  void _cpuMove() {
    if (_finished) return;
    int? move;
    for (int c = 0; c < cols; c++) {
      final r = _dropCol(c);
      if (r != null) {
        board[r][c] = 2;
        if (_checkWin(2) == 2) { move = c; board[r][c] = null; break; }
        board[r][c] = null;
      }
    }
    if (move == null) {
      for (int c = 0; c < cols; c++) {
        final r = _dropCol(c);
        if (r != null) {
          board[r][c] = 1;
          if (_checkWin(1) == 1) { move = c; board[r][c] = null; break; }
          board[r][c] = null;
        }
      }
    }
    if (move == null) {
      final options = <int>[];
      for (int c = 0; c < cols; c++) {
        if (_dropCol(c) != null) options.add(c);
      }
      move = options[DateTime.now().millisecondsSinceEpoch % options.length];
    }
    final rr = _dropCol(move);
    if (rr != null) board[rr][move] = 2;
    if (_checkWin(2) == 2) { _end(2); return; }
    if (_full()) { _end(0); return; }
    playerTurn = true;
    emit(GameFx.tick);
    notifyListeners();
  }

  void _end(int res) {
    _finished = true;
    result = res;
    if (res == 1) {
      emit(GameFx.win);
    } else {
      emit(GameFx.gameOver);
    }
    notifyListeners();
  }

  void newGame() {
    _timer?.cancel();
    board = List.generate(rows, (_) => List.filled(cols, null));
    playerTurn = true;
    _finished = false;
    result = -1;
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
