import 'dart:math';

import 'package:promogames_engine/engine.dart';

class TicTacToeMultiEngine extends GameEngine {
  final int boardSize;

  late List<String> board;
  bool _gameOver = false;
  String? _winner;
  bool _isDraw = false;
  int _score = 0;
  bool _isPlayerXTurn = true;

  @override
  int get score => _score;
  @override
  int get maxScore => 1;
  @override
  bool get completed => _gameOver;

  bool get isPlayerXTurn => _isPlayerXTurn;
  String? get winner => _winner;
  bool get isDraw => _isDraw;

  final Random _rnd = Random();

  TicTacToeMultiEngine({Map<String, dynamic> settings = const {}})
      : boardSize = _int(settings['board_size'], 3) {
    _initBoard();
  }

  static int _int(dynamic v, int fallback) =>
      v is num ? v.toInt() : (int.tryParse(v?.toString() ?? '') ?? fallback);

  void _initBoard() {
    board = List.filled(boardSize * boardSize, '');
    _gameOver = false;
    _winner = null;
    _isDraw = false;
    _isPlayerXTurn = true;
  }

  void newGame() {
    _initBoard();
    notifyListeners();
  }

  bool play(int index) {
    if (_gameOver || board[index].isNotEmpty) return false;

    board[index] = _isPlayerXTurn ? 'X' : 'O';
    final player = _isPlayerXTurn ? 'X' : 'O';

    if (_checkWin(player)) {
      _score++;
      _winner = player;
      _gameOver = true;
      emit(GameFx.win);
      notifyListeners();
      return true;
    }
    if (board.every((c) => c.isNotEmpty)) {
      _isDraw = true;
      _gameOver = true;
      emit(GameFx.tick);
      notifyListeners();
      return true;
    }

    _isPlayerXTurn = !_isPlayerXTurn;
    emit(GameFx.tick);
    notifyListeners();
    return true;
  }

  bool _checkWin(String p) {
    final n = boardSize;
    for (var r = 0; r < n; r++) {
      bool win = true;
      for (var c = 0; c < n; c++) {
        if (board[r * n + c] != p) {
          win = false;
          break;
        }
      }
      if (win) return true;
    }
    for (var c = 0; c < n; c++) {
      bool win = true;
      for (var r = 0; r < n; r++) {
        if (board[r * n + c] != p) {
          win = false;
          break;
        }
      }
      if (win) return true;
    }
    bool d1 = true, d2 = true;
    for (var i = 0; i < n; i++) {
      if (board[i * n + i] != p) d1 = false;
      if (board[i * n + (n - 1 - i)] != p) d2 = false;
    }
    return d1 || d2;
  }

  void exitEarly() {}
}
