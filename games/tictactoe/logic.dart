import 'dart:math';

import 'package:promogames_engine/engine.dart';

/// Headless Tic Tac Toe engine. Owns the rules: board state, AI moves,
/// win detection, scoring. No widgets, no colors, no network.
class TicTacToeEngine extends GameEngine {
  final int boardSize;
  final String difficulty;

  late List<String> board;
  bool _gameOver = false;
  String? _winner;
  bool _isDraw = false;
  int _score = 0;
  bool _isPlayerTurn = true;

  @override
  int get score => _score;
  @override
  int get maxScore => 1;
  @override
  bool get completed => _gameOver;

  bool get isPlayerTurn => _isPlayerTurn;
  String? get winner => _winner;
  bool get isDraw => _isDraw;

  final Random _rnd = Random();

  TicTacToeEngine({Map<String, dynamic> settings = const {}})
      : boardSize = _int(settings['board_size'], 3),
        difficulty = settings['difficulty']?.toString() ?? 'easy' {
    _initBoard();
  }

  static int _int(dynamic v, int fallback) =>
      v is num ? v.toInt() : (int.tryParse(v?.toString() ?? '') ?? fallback);

  void _initBoard() {
    board = List.filled(boardSize * boardSize, '');
    _gameOver = false;
    _winner = null;
    _isDraw = false;
    _isPlayerTurn = true;
  }

  void newGame() {
    _initBoard();
    notifyListeners();
  }

  bool play(int index) {
    if (_gameOver || board[index].isNotEmpty || !_isPlayerTurn) return false;

    board[index] = 'X';
    if (_checkWin('X')) {
      _score++;
      _winner = 'X';
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

    _isPlayerTurn = false;
    notifyListeners();

    Future.delayed(const Duration(milliseconds: 400), () {
      if (_gameOver) return;
      _aiMove();
      notifyListeners();
    });
    return true;
  }

  void _aiMove() {
    List<int> empty = [];
    for (var i = 0; i < board.length; i++) {
      if (board[i].isEmpty) empty.add(i);
    }
    if (empty.isEmpty) return;

    int move;
    if (difficulty == 'hard') {
      move = _bestMove(empty);
    } else if (difficulty == 'medium') {
      move = _rnd.nextDouble() < 0.5 ? _bestMove(empty) : empty[_rnd.nextInt(empty.length)];
    } else {
      move = empty[_rnd.nextInt(empty.length)];
    }

    board[move] = 'O';
    if (_checkWin('O')) {
      _winner = 'O';
      _gameOver = true;
      emit(GameFx.gameOver);
      notifyListeners();
      return;
    }
    if (board.every((c) => c.isNotEmpty)) {
      _isDraw = true;
      _gameOver = true;
      emit(GameFx.tick);
      notifyListeners();
      return;
    }
    _isPlayerTurn = true;
    emit(GameFx.tick);
  }

  int _bestMove(List<int> empty) {
    for (final i in empty) {
      board[i] = 'O';
      if (_checkWin('O')) { board[i] = ''; return i; }
      board[i] = '';
    }
    for (final i in empty) {
      board[i] = 'X';
      if (_checkWin('X')) { board[i] = ''; return i; }
      board[i] = '';
    }
    final center = boardSize * boardSize ~/ 2;
    if (board[center].isEmpty) return center;
    return empty[_rnd.nextInt(empty.length)];
  }

  bool _checkWin(String p) {
    final n = boardSize;
    for (var r = 0; r < n; r++) {
      bool win = true;
      for (var c = 0; c < n; c++) {
        if (board[r * n + c] != p) { win = false; break; }
      }
      if (win) return true;
    }
    for (var c = 0; c < n; c++) {
      bool win = true;
      for (var r = 0; r < n; r++) {
        if (board[r * n + c] != p) { win = false; break; }
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
