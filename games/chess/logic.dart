import 'dart:math';

import 'package:promogames_engine/engine.dart';

class Piece {
  final String type;
  final bool isWhite;
  Piece(this.type, this.isWhite);
  String get symbol => isWhite ? type : type.toLowerCase();
  String get name {
    switch (type) {
      case 'K': return 'King';
      case 'Q': return 'Queen';
      case 'R': return 'Rook';
      case 'B': return 'Bishop';
      case 'N': return 'Knight';
      case 'P': return 'Pawn';
      default: return '';
    }
  }
}

class ChessMove {
  final int fromR, fromC, toR, toC;
  final String? promotion;
  final bool isCastle;
  final String castleSide;
  final bool isEnPassant;
  final bool isDoublePush;
  ChessMove(this.fromR, this.fromC, this.toR, this.toC, {
    this.promotion, this.isCastle = false, this.castleSide = '',
    this.isEnPassant = false, this.isDoublePush = false,
  });

  String toAlgebraic(ChessBoardState engine) {
    final files = 'abcdefgh';
    final toAlg = '${files[toC]}${8 - toR}';
    if (isCastle) return castleSide == 'k' ? 'O-O' : 'O-O-O';
    final piece = engine.board[fromR][fromC];
    if (piece == null) return toAlg;
    String san = '';
    if (piece.type != 'P') {
      san += piece.type;
    } else if (engine.board[toR][toC] != null || isEnPassant) {
      san += files[fromC];
    }
    if (engine.board[toR][toC] != null || isEnPassant) san += 'x';
    san += toAlg;
    if (promotion != null) san += '=${promotion!.toUpperCase()}';
    return san;
  }
}

class CastlingRights {
  bool k, q, K, Q;
  CastlingRights({this.k = true, this.q = true, this.K = true, this.Q = true});
  CastlingRights copy() => CastlingRights(k: k, q: q, K: K, Q: Q);
}

abstract class ChessBoardState {
  List<List<Piece?>> get board;
}

class ChessEngine extends GameEngine implements ChessBoardState {
  List<List<Piece?>> board = List.generate(8, (_) => List.filled(8, null));
  bool whiteTurn = true;
  CastlingRights castling = CastlingRights();
  String enPassant = '-';
  int halfmove = 0;
  int fullmove = 1;
  List<ChessMove> moveHistory = [];

  int _score = 0;
  bool _gameOver = false;
  String _gameResult = '';
  String _difficulty;

  @override
  int get score => _score;
  @override
  int get maxScore => 1;
  @override
  bool get completed => _gameOver;

  bool get isGameOver => _gameOver;
  String get gameResult => _gameResult;

  ChessEngine({Map<String, dynamic> settings = const {}})
      : _difficulty = settings['difficulty']?.toString() ?? 'medium' {
    loadFen('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
  }

  void loadFen(String fen) {
    final parts = fen.split(' ');
    final rows = parts[0].split('/');
    for (int r = 0; r < 8; r++) {
      int c = 0;
      for (final ch in rows[r].split('')) {
        final code = ch.codeUnitAt(0);
        if (code >= 49 && code <= 56) {
          for (int i = 0; i < int.parse(ch); i++) board[r][c++] = null;
        } else {
          final isUpper = code >= 65 && code <= 90;
          board[r][c++] = Piece(ch.toUpperCase(), isUpper);
        }
      }
    }
    whiteTurn = parts.length > 1 ? parts[1] == 'w' : true;
    final cs = parts.length > 2 ? parts[2] : '-';
    castling = CastlingRights(
      K: cs.contains('K'), Q: cs.contains('Q'),
      k: cs.contains('k'), q: cs.contains('q'),
    );
    enPassant = parts.length > 3 ? parts[3] : '-';
    halfmove = parts.length > 4 ? int.tryParse(parts[4]) ?? 0 : 0;
    fullmove = parts.length > 5 ? int.tryParse(parts[5]) ?? 1 : 1;
  }

  Piece? pieceAt(int r, int c) => (r >= 0 && r < 8 && c >= 0 && c < 8) ? board[r][c] : null;

  bool isAttackedBy(int r, int c, bool byWhite) {
    for (final dc in [-1, 1]) {
      final pr = r + (byWhite ? 1 : -1);
      final p = pieceAt(pr, c + dc);
      if (p != null && p.type == 'P' && p.isWhite == byWhite) return true;
    }
    for (final [dr, dc] in [
      [-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]
    ]) {
      final p = pieceAt(r+dr, c+dc);
      if (p != null && p.type == 'N' && p.isWhite == byWhite) return true;
    }
    for (int dr = -1; dr <= 1; dr++) {
      for (int dc = -1; dc <= 1; dc++) {
        if (dr == 0 && dc == 0) continue;
        final p = pieceAt(r+dr, c+dc);
        if (p != null && p.type == 'K' && p.isWhite == byWhite) return true;
      }
    }
    for (final [dr, dc] in [[-1,-1],[-1,1],[1,-1],[1,1]]) {
      for (int i = 1; i < 8; i++) {
        final p = pieceAt(r+dr*i, c+dc*i);
        if (p == null) continue;
        if (p.isWhite == byWhite && (p.type == 'B' || p.type == 'Q')) return true;
        break;
      }
    }
    for (final [dr, dc] in [[-1,0],[1,0],[0,-1],[0,1]]) {
      for (int i = 1; i < 8; i++) {
        final p = pieceAt(r+dr*i, c+dc*i);
        if (p == null) continue;
        if (p.isWhite == byWhite && (p.type == 'R' || p.type == 'Q')) return true;
        break;
      }
    }
    return false;
  }

  List<int>? findKing(bool white) {
    for (int r = 0; r < 8; r++)
      for (int c = 0; c < 8; c++)
        if (board[r][c]?.type == 'K' && board[r][c]!.isWhite == white) return [r, c];
    return null;
  }

  bool isInCheck(bool white) {
    final kp = findKing(white);
    if (kp == null) return false;
    return isAttackedBy(kp[0], kp[1], !white);
  }

  List<ChessMove> generatePseudoLegalMoves() {
    final moves = <ChessMove>[];
    for (int r = 0; r < 8; r++) {
      for (int c = 0; c < 8; c++) {
        final p = board[r][c];
        if (p == null || p.isWhite != whiteTurn) continue;
        _generateMovesForPiece(r, c, p, moves);
      }
    }
    return moves;
  }

  void _generateMovesForPiece(int r, int c, Piece p, List<ChessMove> moves) {
    final isW = p.isWhite;
    switch (p.type) {
      case 'P':
        final dir = isW ? -1 : 1;
        final startRow = isW ? 6 : 1;
        final promoRow = isW ? 0 : 7;
        if (pieceAt(r+dir, c) == null) {
          if (r+dir == promoRow) {
            for (final promo in ['Q','R','B','N']) {
              moves.add(ChessMove(r, c, r+dir, c, promotion: promo));
            }
          } else {
            moves.add(ChessMove(r, c, r+dir, c));
            if (r == startRow && pieceAt(r+2*dir, c) == null) {
              moves.add(ChessMove(r, c, r+2*dir, c, isDoublePush: true));
            }
          }
        }
        for (final dc in [-1, 1]) {
          final tr = r+dir, tc = c+dc;
          if (tc < 0 || tc > 7) continue;
          final target = pieceAt(tr, tc);
          if (target != null && target.isWhite != isW) {
            if (tr == promoRow) {
              for (final promo in ['Q','R','B','N']) {
                moves.add(ChessMove(r, c, tr, tc, promotion: promo));
              }
            } else {
              moves.add(ChessMove(r, c, tr, tc));
            }
          }
          if (enPassant != '-') {
            final epC = 'abcdefgh'.indexOf(enPassant[0]);
            final epR = 8 - int.parse(enPassant[1]);
            if (tr == epR && tc == epC) {
              moves.add(ChessMove(r, c, tr, tc, isEnPassant: true));
            }
          }
        }
      case 'N':
        for (final [dr, dc] in [
          [-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]
        ]) {
          final tr = r+dr, tc = c+dc;
          if (tr < 0 || tr > 7 || tc < 0 || tc > 7) continue;
          final target = pieceAt(tr, tc);
          if (target == null || target.isWhite != isW) moves.add(ChessMove(r, c, tr, tc));
        }
      case 'K':
        for (int dr = -1; dr <= 1; dr++) {
          for (int dc = -1; dc <= 1; dc++) {
            if (dr == 0 && dc == 0) continue;
            final tr = r+dr, tc = c+dc;
            if (tr < 0 || tr > 7 || tc < 0 || tc > 7) continue;
            final target = pieceAt(tr, tc);
            if (target == null || target.isWhite != isW) moves.add(ChessMove(r, c, tr, tc));
          }
        }
        final row = isW ? 7 : 0;
        if (r == row && c == 4) {
          final ks = isW ? castling.K : castling.k;
          final qs = isW ? castling.Q : castling.q;
          final opp = !isW;
          if (ks && pieceAt(row, 5) == null && pieceAt(row, 6) == null &&
              !isAttackedBy(row, 4, opp) && !isAttackedBy(row, 5, opp) && !isAttackedBy(row, 6, opp)) {
            moves.add(ChessMove(r, c, row, 6, isCastle: true, castleSide: 'k'));
          }
          if (qs && pieceAt(row, 3) == null && pieceAt(row, 2) == null && pieceAt(row, 1) == null &&
              !isAttackedBy(row, 4, opp) && !isAttackedBy(row, 3, opp) && !isAttackedBy(row, 2, opp)) {
            moves.add(ChessMove(r, c, row, 2, isCastle: true, castleSide: 'q'));
          }
        }
      default:
        List<List<int>> dirs = [];
        if (p.type == 'B' || p.type == 'Q') dirs.addAll([[-1,-1],[-1,1],[1,-1],[1,1]]);
        if (p.type == 'R' || p.type == 'Q') dirs.addAll([[-1,0],[1,0],[0,-1],[0,1]]);
        for (final [dr, dc] in dirs) {
          for (int i = 1; i < 8; i++) {
            final tr = r+dr*i, tc = c+dc*i;
            if (tr < 0 || tr > 7 || tc < 0 || tc > 7) break;
            final target = pieceAt(tr, tc);
            if (target == null) {
              moves.add(ChessMove(r, c, tr, tc));
            } else {
              if (target.isWhite != isW) moves.add(ChessMove(r, c, tr, tc));
              break;
            }
          }
        }
    }
  }

  List<ChessMove> generateLegalMoves() {
    return generatePseudoLegalMoves().where((m) {
      final saved = makeMove(m);
      final inCheck = isInCheck(!whiteTurn);
      undoMove(saved);
      return !inCheck;
    }).toList();
  }

  List<ChessMove> getLegalMovesFrom(int r, int c) {
    return generateLegalMoves().where((m) => m.fromR == r && m.fromC == c).toList();
  }

  Map<String, dynamic> makeMove(ChessMove m) {
    final saved = {
      'board': board.map((r) => r.toList()).toList(),
      'whiteTurn': whiteTurn,
      'castling': castling.copy(),
      'enPassant': enPassant,
      'halfmove': halfmove,
      'fullmove': fullmove,
    };
    final piece = board[m.fromR][m.fromC];
    if (piece == null) return saved;
    if (m.isEnPassant) {
      final epRow = whiteTurn ? m.toR + 1 : m.toR - 1;
      board[epRow][m.toC] = null;
    }
    board[m.toR][m.toC] = m.promotion != null ? Piece(m.promotion!, whiteTurn) : piece;
    board[m.fromR][m.fromC] = null;
    if (m.isCastle) {
      final row = whiteTurn ? 7 : 0;
      if (m.castleSide == 'k') {
        board[row][5] = board[row][7];
        board[row][7] = null;
      } else {
        board[row][3] = board[row][0];
        board[row][0] = null;
      }
    }
    if (m.isDoublePush) {
      final epRow = (m.fromR + m.toR) ~/ 2;
      enPassant = '${"abcdefgh"[m.toC]}${8 - epRow}';
    } else {
      enPassant = '-';
    }
    if (piece.type == 'K') {
      if (whiteTurn) { castling.K = false; castling.Q = false; }
      else { castling.k = false; castling.q = false; }
    }
    if (piece.type == 'R') {
      if (m.fromR == 7 && m.fromC == 0) castling.Q = false;
      if (m.fromR == 7 && m.fromC == 7) castling.K = false;
      if (m.fromR == 0 && m.fromC == 0) castling.q = false;
      if (m.fromR == 0 && m.fromC == 7) castling.k = false;
    }
    if (m.toR == 0 && m.toC == 0) castling.q = false;
    if (m.toR == 0 && m.toC == 7) castling.k = false;
    if (m.toR == 7 && m.toC == 0) castling.Q = false;
    if (m.toR == 7 && m.toC == 7) castling.K = false;
    halfmove = (piece.type == 'P' || board[m.toR][m.toC] != null) ? 0 : halfmove + 1;
    if (!whiteTurn) fullmove++;
    whiteTurn = !whiteTurn;
    moveHistory.add(m);
    return saved;
  }

  void undoMove(Map<String, dynamic> saved) {
    board = (saved['board'] as List<List<Piece?>>).map((r) => r.toList()).toList();
    whiteTurn = saved['whiteTurn'];
    castling = saved['castling'];
    enPassant = saved['enPassant'];
    halfmove = saved['halfmove'];
    fullmove = saved['fullmove'];
    if (moveHistory.isNotEmpty) moveHistory.removeLast();
  }

  bool get isCheckmate => isInCheck(whiteTurn) && generateLegalMoves().isEmpty;
  bool get isStalemate => !isInCheck(whiteTurn) && generateLegalMoves().isEmpty;
  bool get isDraw => halfmove >= 100 || isStalemate;

  void checkGameEnd() {
    if (isCheckmate) {
      _gameOver = true;
      _gameResult = whiteTurn ? 'Black wins by checkmate!' : 'White wins by checkmate!';
      emit(GameFx.gameOver);
    } else if (isDraw) {
      _gameOver = true;
      _gameResult = 'Draw!';
      emit(GameFx.gameOver);
    }
    notifyListeners();
  }

  int get _aiDepth {
    switch (_difficulty) {
      case 'easy': return 1;
      case 'hard': return 4;
      case 'master': return 5;
      default: return 3;
    }
  }

  ChessMove? getBestAiMove() {
    final moves = generateLegalMoves();
    if (moves.isEmpty) return null;
    final isMax = whiteTurn;
    int bestScore = isMax ? -999999 : 999999;
    ChessMove? bestMove;
    final rng = Random();
    for (final m in moves) {
      final saved = makeMove(m);
      final score = _minimax(_aiDepth - 1, -999999, 999999, !isMax);
      undoMove(saved);
      if (isMax) {
        if (score > bestScore) { bestScore = score; bestMove = m; }
        else if (score == bestScore && rng.nextDouble() < 0.3) bestMove = m;
      } else {
        if (score < bestScore) { bestScore = score; bestMove = m; }
        else if (score == bestScore && rng.nextDouble() < 0.3) bestMove = m;
      }
    }
    return bestMove;
  }

  int _minimax(int depth, int alpha, int beta, bool maximizing) {
    if (depth == 0) return _evaluate();
    final moves = generateLegalMoves();
    if (moves.isEmpty) {
      if (isInCheck(whiteTurn)) return maximizing ? -99999 + depth : 99999 - depth;
      return 0;
    }
    if (maximizing) {
      int best = -999999;
      for (final m in moves) {
        final saved = makeMove(m);
        final score = _minimax(depth - 1, alpha, beta, false);
        undoMove(saved);
        best = max(best, score);
        alpha = max(alpha, score);
        if (beta <= alpha) break;
      }
      return best;
    } else {
      int best = 999999;
      for (final m in moves) {
        final saved = makeMove(m);
        final score = _minimax(depth - 1, alpha, beta, true);
        undoMove(saved);
        best = min(best, score);
        beta = min(beta, score);
        if (beta <= alpha) break;
      }
      return best;
    }
  }

  int _evaluate() {
    int score = 0;
    for (int r = 0; r < 8; r++) {
      for (int c = 0; c < 8; c++) {
        final p = board[r][c];
        if (p == null) continue;
        final val = _pieceValues[p.type] ?? 0;
        score += p.isWhite ? val : -val;
      }
    }
    return score;
  }

  static const Map<String, int> _pieceValues = {
    'P': 100, 'N': 320, 'B': 330, 'R': 500, 'Q': 900, 'K': 20000,
  };

  static const Map<String, String> pieceUnicode = {
    'K': '\u2654', 'Q': '\u2655', 'R': '\u2656', 'B': '\u2657', 'N': '\u2658', 'P': '\u2659',
    'k': '\u265A', 'q': '\u265B', 'r': '\u265C', 'b': '\u265D', 'n': '\u265E', 'p': '\u265F',
  };

  void newGame() {
    loadFen('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
    _gameOver = false;
    _gameResult = '';
    _score = 0;
    moveHistory.clear();
    notifyListeners();
  }

  void exitEarly() {}
}
