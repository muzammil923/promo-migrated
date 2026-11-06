import 'dart:math';
import 'package:flutter/material.dart';
import 'package:promogames_engine/engine.dart';
import 'package:promogames_engine/engine.dart';

/// Builds the chess game widget.
Widget buildChessGame(GameConfig config, GameFinished onFinished) {
  return ChessGame(config: config, onFinished: onFinished);
}

// ══════════════════════════════════════════════════════════════
// Chess Engine (Dart port)
// ══════════════════════════════════════════════════════════════

class _Piece {
  final String type; // 'K','Q','R','B','N','P'
  final bool isWhite;
  _Piece(this.type, this.isWhite);

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

class _Move {
  final int fromR, fromC, toR, toC;
  final String? promotion;
  final bool isCastle;
  final String castleSide; // 'k' or 'q'
  final bool isEnPassant;
  final bool isDoublePush;
  _Move(this.fromR, this.fromC, this.toR, this.toC, {
    this.promotion, this.isCastle = false, this.castleSide = '',
    this.isEnPassant = false, this.isDoublePush = false,
  });

  String toAlgebraic(ChessEngine engine) {
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

class _Castling {
  bool k, q, K, Q;
  _Castling({this.k = true, this.q = true, this.K = true, this.Q = true});

  @override
  String toString() {
    String s = '';
    if (K) s += 'K'; if (Q) s += 'Q'; if (k) s += 'k'; if (q) s += 'q';
    return s.isEmpty ? '-' : s;
  }
}

class ChessEngine {
  List<List<_Piece?>> board = List.generate(8, (_) => List.filled(8, null));
  bool whiteTurn = true;
  _Castling castling = _Castling();
  String enPassant = '-';
  int halfmove = 0;
  int fullmove = 1;
  List<_Move> moveHistory = [];

  ChessEngine() { loadFen('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'); }

  void loadFen(String fen) {
    final parts = fen.split(' ');
    final rows = parts[0].split('/');
    for (int r = 0; r < 8; r++) {
      int c = 0;
      for (final ch in rows[r].split('')) {
        final code = ch.codeUnitAt(0);
        if (code >= 49 && code <= 56) {
          for (int i = 0; i < int.parse(ch); i++) {
            board[r][c++] = null;
          }
        } else {
          final isUpper = code >= 65 && code <= 90;
          board[r][c++] = _Piece(ch.toUpperCase(), isUpper);
        }
      }
    }
    whiteTurn = parts.length > 1 ? parts[1] == 'w' : true;
    final cs = parts.length > 2 ? parts[2] : '-';
    castling = _Castling(
      K: cs.contains('K'), Q: cs.contains('Q'),
      k: cs.contains('k'), q: cs.contains('q'),
    );
    enPassant = parts.length > 3 ? parts[3] : '-';
    halfmove = parts.length > 4 ? int.tryParse(parts[4]) ?? 0 : 0;
    fullmove = parts.length > 5 ? int.tryParse(parts[5]) ?? 1 : 1;
  }

  String toFen() {
    String fen = '';
    for (int r = 0; r < 8; r++) {
      int empty = 0;
      for (int c = 0; c < 8; c++) {
        if (board[r][c] != null) {
          if (empty > 0) { fen += empty.toString(); empty = 0; }
          fen += board[r][c]!.symbol;
        } else {
          empty++;
        }
      }
      if (empty > 0) fen += empty.toString();
      if (r < 7) fen += '/';
    }
    return '$fen ${whiteTurn ? "w" : "b"} ${castling.toString()} $enPassant $halfmove $fullmove';
  }

  _Piece? pieceAt(int r, int c) => (r >= 0 && r < 8 && c >= 0 && c < 8) ? board[r][c] : null;

  bool isAttackedBy(int r, int c, bool byWhite) {
    // Pawn attacks
    final pawnDir = byWhite ? 1 : -1;
    final pawn = _Piece('P', byWhite);
    for (final dc in [-1, 1]) {
      final pr = r + pawnDir, pc = c + dc;
      final p = pieceAt(pr, pc);
      if (p != null && p.type == 'P' && p.isWhite == byWhite) return true;
    }
    // Knight
    for (final [dr, dc] in [
      [-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]
    ]) {
      final p = pieceAt(r+dr, c+dc);
      if (p != null && p.type == 'N' && p.isWhite == byWhite) return true;
    }
    // King
    for (int dr = -1; dr <= 1; dr++) {
      for (int dc = -1; dc <= 1; dc++) {
        if (dr == 0 && dc == 0) continue;
        final p = pieceAt(r+dr, c+dc);
        if (p != null && p.type == 'K' && p.isWhite == byWhite) return true;
      }
    }
    // Sliding: Bishop, Rook, Queen
    final bishopDirs = [[-1,-1],[-1,1],[1,-1],[1,1]];
    final rookDirs = [[-1,0],[1,0],[0,-1],[0,1]];
    for (final [dr, dc] in bishopDirs) {
      for (int i = 1; i < 8; i++) {
        final p = pieceAt(r+dr*i, c+dc*i);
        if (p == null) continue;
        if (p.isWhite == byWhite && (p.type == 'B' || p.type == 'Q')) return true;
        break;
      }
    }
    for (final [dr, dc] in rookDirs) {
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
    final k = white ? 'K' : 'k';
    for (int r = 0; r < 8; r++)
      for (int c = 0; c < 8; c++) {
        if (board[r][c]?.type == 'K' && board[r][c]!.isWhite == white) return [r, c];
      }
    return null;
  }

  bool isInCheck(bool white) {
    final kp = findKing(white);
    if (kp == null) return false;
    return isAttackedBy(kp[0], kp[1], !white);
  }

  List<_Move> generatePseudoLegalMoves() {
    final moves = <_Move>[];
    for (int r = 0; r < 8; r++) {
      for (int c = 0; c < 8; c++) {
        final p = board[r][c];
        if (p == null || p.isWhite != whiteTurn) continue;
        _generateMovesForPiece(r, c, p, moves);
      }
    }
    return moves;
  }

  void _generateMovesForPiece(int r, int c, _Piece p, List<_Move> moves) {
    final isW = p.isWhite;
    switch (p.type) {
      case 'P':
        final dir = isW ? -1 : 1;
        final startRow = isW ? 6 : 1;
        final promoRow = isW ? 0 : 7;
        // Forward
        if (pieceAt(r+dir, c) == null) {
          if (r+dir == promoRow) {
            for (final promo in ['Q','R','B','N']) {
              moves.add(_Move(r, c, r+dir, c, promotion: promo));
            }
          } else {
            moves.add(_Move(r, c, r+dir, c));
            if (r == startRow && pieceAt(r+2*dir, c) == null) {
              moves.add(_Move(r, c, r+2*dir, c, isDoublePush: true));
            }
          }
        }
        // Captures
        for (final dc in [-1, 1]) {
          final tr = r+dir, tc = c+dc;
          if (tc < 0 || tc > 7) continue;
          final target = pieceAt(tr, tc);
          if (target != null && target.isWhite != isW) {
            if (tr == promoRow) {
              for (final promo in ['Q','R','B','N']) {
                moves.add(_Move(r, c, tr, tc, promotion: promo));
              }
            } else {
              moves.add(_Move(r, c, tr, tc));
            }
          }
          // En passant
          if (enPassant != '-') {
            final epC = 'abcdefgh'.indexOf(enPassant[0]);
            final epR = 8 - int.parse(enPassant[1]);
            if (tr == epR && tc == epC) {
              moves.add(_Move(r, c, tr, tc, isEnPassant: true));
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
          if (target == null || target.isWhite != isW) moves.add(_Move(r, c, tr, tc));
        }
      case 'K':
        for (int dr = -1; dr <= 1; dr++) {
          for (int dc = -1; dc <= 1; dc++) {
            if (dr == 0 && dc == 0) continue;
            final tr = r+dr, tc = c+dc;
            if (tr < 0 || tr > 7 || tc < 0 || tc > 7) continue;
            final target = pieceAt(tr, tc);
            if (target == null || target.isWhite != isW) moves.add(_Move(r, c, tr, tc));
          }
        }
        // Castling
        final row = isW ? 7 : 0;
        if (r == row && c == 4) {
          final ks = isW ? castling.K : castling.k;
          final qs = isW ? castling.Q : castling.q;
          final opp = !isW;
          if (ks && pieceAt(row, 5) == null && pieceAt(row, 6) == null &&
              !isAttackedBy(row, 4, opp) && !isAttackedBy(row, 5, opp) && !isAttackedBy(row, 6, opp)) {
            moves.add(_Move(r, c, row, 6, isCastle: true, castleSide: 'k'));
          }
          if (qs && pieceAt(row, 3) == null && pieceAt(row, 2) == null && pieceAt(row, 1) == null &&
              !isAttackedBy(row, 4, opp) && !isAttackedBy(row, 3, opp) && !isAttackedBy(row, 2, opp)) {
            moves.add(_Move(r, c, row, 2, isCastle: true, castleSide: 'q'));
          }
        }
      default:
        // Sliding: B, R, Q
        List<List<int>> dirs = [];
        if (p.type == 'B' || p.type == 'Q') dirs.addAll([[-1,-1],[-1,1],[1,-1],[1,1]]);
        if (p.type == 'R' || p.type == 'Q') dirs.addAll([[-1,0],[1,0],[0,-1],[0,1]]);
        for (final [dr, dc] in dirs) {
          for (int i = 1; i < 8; i++) {
            final tr = r+dr*i, tc = c+dc*i;
            if (tr < 0 || tr > 7 || tc < 0 || tc > 7) break;
            final target = pieceAt(tr, tc);
            if (target == null) {
              moves.add(_Move(r, c, tr, tc));
            } else {
              if (target.isWhite != isW) moves.add(_Move(r, c, tr, tc));
              break;
            }
          }
        }
    }
  }

  List<_Move> generateLegalMoves() {
    return generatePseudoLegalMoves().where((m) {
      final saved = makeMove(m);
      final inCheck = isInCheck(!whiteTurn);
      undoMove(saved);
      return !inCheck;
    }).toList();
  }

  List<_Move> getLegalMovesFrom(int r, int c) {
    return generateLegalMoves().where((m) => m.fromR == r && m.fromC == c).toList();
  }

  /// Returns saved state for undo
  Map<String, dynamic> makeMove(_Move m) {
    final saved = {
      'board': board.map((r) => r.toList()).toList(),
      'whiteTurn': whiteTurn,
      'castling': _Castling(k: castling.k, q: castling.q, K: castling.K, Q: castling.Q),
      'enPassant': enPassant,
      'halfmove': halfmove,
      'fullmove': fullmove,
    };
    final piece = board[m.fromR][m.fromC];
    if (piece == null) return saved;
    final captured = board[m.toR][m.toC];

    if (m.isEnPassant) {
      final epRow = whiteTurn ? m.toR + 1 : m.toR - 1;
      board[epRow][m.toC] = null;
    }

    board[m.toR][m.toC] = m.promotion != null
        ? _Piece(m.promotion!, whiteTurn)
        : piece;
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

    halfmove = (piece.type == 'P' || captured != null) ? 0 : halfmove + 1;
    if (!whiteTurn) fullmove++;
    whiteTurn = !whiteTurn;
    moveHistory.add(m);
    return saved;
  }

  void undoMove(Map<String, dynamic> saved) {
    board = (saved['board'] as List<List<_Piece?>>).map((r) => r.toList()).toList();
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
  bool get isGameOver => isCheckmate || isDraw;
}

// ══════════════════════════════════════════════════════════════
// AI Engine (Minimax with Alpha-Beta Pruning)
// ══════════════════════════════════════════════════════════════

const Map<String, int> _pieceValues = {
  'P': 100, 'N': 320, 'B': 330, 'R': 500, 'Q': 900, 'K': 20000,
};

const List<int> _pstPawn = [
  0,0,0,0,0,0,0,0,
  50,50,50,50,50,50,50,50,
  10,10,20,30,30,20,10,10,
  5,5,10,25,25,10,5,5,
  0,0,0,20,20,0,0,0,
  5,-5,-10,0,0,-10,-5,5,
  5,10,10,-20,-20,10,10,5,
  0,0,0,0,0,0,0,0
];

const List<int> _pstKnight = [
  -50,-40,-30,-30,-30,-30,-40,-50,
  -40,-20,0,0,0,0,-20,-40,
  -30,0,10,15,15,10,0,-30,
  -30,5,15,20,20,15,5,-30,
  -30,0,15,20,20,15,0,-30,
  -30,5,10,15,15,10,5,-30,
  -40,-20,0,5,5,0,-20,-40,
  -50,-40,-30,-30,-30,-30,-40,-50
];

const List<int> _pstBishop = [
  -20,-10,-10,-10,-10,-10,-10,-20,
  -10,0,0,0,0,0,0,-10,
  -10,0,10,10,10,10,0,-10,
  -10,5,5,10,10,5,5,-10,
  -10,0,10,10,10,10,0,-10,
  -10,10,10,10,10,10,10,-10,
  -10,5,0,0,0,0,5,-10,
  -20,-10,-10,-10,-10,-10,-10,-20
];

const List<int> _pstRook = [
  0,0,0,0,0,0,0,0,
  5,10,10,10,10,10,10,5,
  -5,0,0,0,0,0,0,-5,
  -5,0,0,0,0,0,0,-5,
  -5,0,0,0,0,0,0,-5,
  -5,0,0,0,0,0,0,-5,
  -5,0,0,0,0,0,0,-5,
  0,0,0,5,5,0,0,0
];

const List<int> _pstQueen = [
  -20,-10,-10,-5,-5,-10,-10,-20,
  -10,0,0,0,0,0,0,-10,
  -10,0,5,5,5,5,0,-10,
  -5,0,5,5,5,5,0,-5,
  0,0,5,5,5,5,0,-5,
  -10,5,5,5,5,5,0,-10,
  -10,0,5,0,0,0,0,-10,
  -20,-10,-10,-5,-5,-10,-10,-20
];

const List<int> _pstKing = [
  -30,-40,-40,-50,-50,-40,-40,-30,
  -30,-40,-40,-50,-50,-40,-40,-30,
  -30,-40,-40,-50,-50,-40,-40,-30,
  -30,-40,-40,-50,-50,-40,-40,-30,
  -20,-30,-30,-40,-40,-30,-30,-20,
  -10,-20,-20,-20,-20,-20,-20,-10,
  20,20,0,0,0,0,20,20,
  20,30,10,0,0,10,30,20
];

List<int> _pstFor(String type) {
  switch (type) {
    case 'P': return _pstPawn;
    case 'N': return _pstKnight;
    case 'B': return _pstBishop;
    case 'R': return _pstRook;
    case 'Q': return _pstQueen;
    case 'K': return _pstKing;
    default: return List.filled(64, 0);
  }
}

int _evaluate(ChessEngine engine) {
  int score = 0;
  for (int r = 0; r < 8; r++) {
    for (int c = 0; c < 8; c++) {
      final p = engine.board[r][c];
      if (p == null) continue;
      final pst = _pstFor(p.type);
      final idx = p.isWhite ? r * 8 + c : (7 - r) * 8 + c;
      final val = (_pieceValues[p.type] ?? 0) + pst[idx];
      score += p.isWhite ? val : -val;
    }
  }
  return score;
}

int _minimax(ChessEngine engine, int depth, int alpha, int beta, bool maximizing) {
  if (depth == 0) return _evaluate(engine);
  final moves = engine.generateLegalMoves();
  if (moves.isEmpty) {
    if (engine.isInCheck(engine.whiteTurn)) return maximizing ? -99999 + depth : 99999 - depth;
    return 0;
  }
  if (maximizing) {
    int best = -999999;
    for (final m in moves) {
      final saved = engine.makeMove(m);
      final score = _minimax(engine, depth - 1, alpha, beta, false);
      engine.undoMove(saved);
      best = max(best, score);
      alpha = max(alpha, score);
      if (beta <= alpha) break;
    }
    return best;
  } else {
    int best = 999999;
    for (final m in moves) {
      final saved = engine.makeMove(m);
      final score = _minimax(engine, depth - 1, alpha, beta, true);
      engine.undoMove(saved);
      best = min(best, score);
      beta = min(beta, score);
      if (beta <= alpha) break;
    }
    return best;
  }
}

_Move? _getBestMove(ChessEngine engine, int depth) {
  final moves = engine.generateLegalMoves();
  if (moves.isEmpty) return null;
  final isMax = engine.whiteTurn;
  int bestScore = isMax ? -999999 : 999999;
  _Move? bestMove;
  final rng = Random();
  for (final m in moves) {
    final saved = engine.makeMove(m);
    final score = _minimax(engine, depth - 1, -999999, 999999, !isMax);
    engine.undoMove(saved);
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

// ══════════════════════════════════════════════════════════════
// Unicode Piece Map
// ══════════════════════════════════════════════════════════════

const Map<String, String> _pieceUnicode = {
  'K': '♔', 'Q': '♕', 'R': '♖', 'B': '♗', 'N': '♘', 'P': '♙',
  'k': '♚', 'q': '♛', 'r': '♜', 'b': '♝', 'n': '♞', 'p': '♟',
};

// ══════════════════════════════════════════════════════════════
// Chess Game Widget
// ══════════════════════════════════════════════════════════════

class ChessGame extends StatefulWidget {
  final GameConfig config;
  final GameFinished onFinished;
  const ChessGame({super.key, required this.config, required this.onFinished});

  @override
  State<ChessGame> createState() => _ChessGameState();
}

class _ChessGameState extends State<ChessGame> {
  Color _bgColor = const Color(0xFF0d0a1a);
  Color _primaryColor = const Color(0xFF8b5cf6);
  String? _bgImageUrl;
  String? _logoUrl;

  void _parseSettings() {
    final s = widget.config.settings;
    _bgColor = _hexToColor(s['bg_color']?.toString()) ?? const Color(0xFF0d0a1a);
    _primaryColor = _hexToColor(s['primary_color']?.toString()) ?? const Color(0xFF8b5cf6);
    _bgImageUrl = s['bg_image_url']?.toString();
    _logoUrl = s['game_logo_url']?.toString();
  }

  Color? _hexToColor(String? hex) {
    if (hex == null || hex.isEmpty) return null;
    hex = hex.replaceFirst('#', '');
    if (hex.length == 6) hex = 'FF$hex';
    try { return Color(int.parse(hex, radix: 16)); } catch (_) { return null; }
  }

  final ChessEngine _engine = ChessEngine();
  String _difficulty = 'medium';
  bool _aiThinking = false;
  bool _gameOver = false;
  String _gameResult = '';
  List<int>? _selectedSquare;
  List<_Move> _legalMoves = [];
  _Move? _lastMove;
  bool _flipped = false;
  final List<String> _capturedWhite = [];
  final List<String> _capturedBlack = [];
  final List<String> _moveNotations = [];

  int get _aiDepth {
    switch (_difficulty) {
      case 'easy': return 1;
      case 'hard': return 4;
      case 'master': return 5;
      default: return 3;
    }
  }

  @override
  void initState() {
    super.initState();
    _parseSettings();
    final d = widget.config.settings['difficulty'] as String? ?? 'medium';
    _difficulty = d;
  }

  void _handleSquareTap(int r, int c) {
    if (_gameOver || _aiThinking || !_engine.whiteTurn) return;

    final piece = _engine.board[r][c];

    if (_selectedSquare != null) {
      final move = _legalMoves.where((m) => m.toR == r && m.toC == c).firstOrNull;
      if (move != null) {
        _executeMove(move);
        return;
      }
      if (_selectedSquare![0] == r && _selectedSquare![1] == c) {
        setState(() { _selectedSquare = null; _legalMoves = []; });
        return;
      }
    }

    if (piece != null && piece.isWhite) {
      setState(() {
        _selectedSquare = [r, c];
        _legalMoves = _engine.getLegalMovesFrom(r, c);
      });
    } else {
      setState(() { _selectedSquare = null; _legalMoves = []; });
    }
  }

  void _executeMove(_Move move) {
    final saved = _engine.makeMove(move);
    final san = move.toAlgebraic(_engine);
    _moveNotations.add(san);

    if (move.isEnPassant || _engine.board[move.toR][move.toC] != null) {
      // Track capture
      final captured = _engine.board[move.toR][move.toC];
      if (captured != null) {
        final key = '${captured.isWhite ? "w" : "b"}${captured.type}';
        if (captured.isWhite) {
          _capturedWhite.add(key);
        } else {
          _capturedBlack.add(key);
        }
      }
    }

    setState(() {
      _lastMove = move;
      _selectedSquare = null;
      _legalMoves = [];
    });

    _checkGameEnd();

    if (!_gameOver) {
      _triggerAI();
    }
  }

  void _triggerAI() {
    setState(() { _aiThinking = true; });
    Future.delayed(const Duration(milliseconds: 400), () {
      if (!mounted || _gameOver) return;
      final aiMove = _getBestMove(_engine, _aiDepth);
      if (aiMove != null) {
        final san = aiMove.toAlgebraic(_engine);
        _engine.makeMove(aiMove);
        _moveNotations.add(san);

        if (aiMove.isEnPassant || _engine.board[aiMove.toR][aiMove.toC] != null) {
          final captured = _engine.board[aiMove.toR][aiMove.toC];
          if (captured != null) {
            final key = '${captured.isWhite ? "w" : "b"}${captured.type}';
            if (captured.isWhite) {
              _capturedWhite.add(key);
            } else {
              _capturedBlack.add(key);
            }
          }
        }

        setState(() {
          _lastMove = aiMove;
          _aiThinking = false;
        });
        _checkGameEnd();
      } else {
        setState(() { _aiThinking = false; });
      }
    });
  }

  void _checkGameEnd() {
    if (_engine.isCheckmate) {
      setState(() {
        _gameOver = true;
        _gameResult = _engine.whiteTurn ? 'Black wins by checkmate!' : 'White wins by checkmate!';
      });
      widget.onFinished(0, 0, true);
    } else if (_engine.isDraw) {
      setState(() {
        _gameOver = true;
        _gameResult = 'Draw!';
      });
      widget.onFinished(0, 0, false);
    }
  }

  void _newGame() {
    setState(() {
      _engine.loadFen('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
      _selectedSquare = null;
      _legalMoves = [];
      _lastMove = null;
      _gameOver = false;
      _gameResult = '';
      _capturedWhite.clear();
      _capturedBlack.clear();
      _moveNotations.clear();
      _aiThinking = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    final board = _flipped
        ? List.generate(8, (ri) => List.generate(8, (ci) => _engine.board[7-ri][7-ci]))
        : List.generate(8, (ri) => List.generate(8, (ci) => _engine.board[ri][ci]));

    return Scaffold(
      backgroundColor: const Color(0xFF0f0f23),
      body: SafeArea(
        child: Column(
          children: [
            // Top bar
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              child: Row(
                children: [
                  IconButton(
                    icon: const Icon(Icons.arrow_back, color: Colors.white70),
                    onPressed: () => Navigator.pop(context),
                  ),
                  const Expanded(
                    child: Text('♚ Chess', style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.w700)),
                  ),
                  IconButton(
                    icon: Icon(_flipped ? Icons.flip_to_back : Icons.flip_to_front, color: Colors.white70),
                    onPressed: () => setState(() => _flipped = !_flipped),
                  ),
                  IconButton(
                    icon: const Icon(Icons.refresh, color: Colors.white70),
                    onPressed: _newGame,
                  ),
                ],
              ),
            ),
            // Turn indicator
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Row(
                children: [
                  Container(
                    width: 12, height: 12,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      color: _engine.whiteTurn ? Colors.white : Colors.grey[800],
                      border: Border.all(color: Colors.white30),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Text(
                    _aiThinking ? 'AI thinking...' : _gameOver ? _gameResult : '${_engine.whiteTurn ? "White" : "Black"} to move',
                    style: TextStyle(
                      color: _engine.isInCheck(_engine.whiteTurn) && !_gameOver ? Colors.red : Colors.white70,
                      fontSize: 14, fontWeight: FontWeight.w600,
                    ),
                  ),
                  if (_engine.isInCheck(_engine.whiteTurn) && !_gameOver)
                    const Padding(
                      padding: EdgeInsets.only(left: 8),
                      child: Text('CHECK!', style: TextStyle(color: Colors.red, fontSize: 12, fontWeight: FontWeight.w700)),
                    ),
                ],
              ),
            ),
            const SizedBox(height: 8),
            // Board
            Expanded(
              child: Center(
                child: AspectRatio(
                  aspectRatio: 1,
                  child: Container(
                    margin: const EdgeInsets.symmetric(horizontal: 16),
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(8),
                      boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.5), blurRadius: 20)],
                    ),
                    child: GridView.builder(
                      physics: const NeverScrollableScrollPhysics(),
                      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(crossAxisCount: 8),
                      itemCount: 64,
                      itemBuilder: (context, index) {
                        final r = index ~/ 8;
                        final c = index % 8;
                        final piece = board[r][c];
                        final isLight = (r + c) % 2 == 0;
                        final actualR = _flipped ? 7 - r : r;
                        final actualC = _flipped ? 7 - c : c;
                        final isSelected = _selectedSquare != null &&
                            _selectedSquare![0] == actualR && _selectedSquare![1] == actualC;
                        final isLastMove = _lastMove != null &&
                            ((_lastMove!.fromR == actualR && _lastMove!.fromC == actualC) ||
                             (_lastMove!.toR == actualR && _lastMove!.toC == actualC));
                        final isLegalTarget = _legalMoves.any((m) => m.toR == actualR && m.toC == actualC);
                        final isKingInCheck = _engine.isInCheck(_engine.whiteTurn) &&
                            piece?.type == 'K' && piece?.isWhite == _engine.whiteTurn;

                        Color bg;
                        if (isKingInCheck) {
                          bg = Colors.red.withValues(alpha: 0.5);
                        } else if (isSelected) {
                          bg = isLight ? const Color(0xFFF7F769) : const Color(0xFFBBC245);
                        } else if (isLastMove) {
                          bg = isLight ? const Color(0xFFF7F769) : const Color(0xFFBBC245);
                        } else {
                          bg = isLight ? const Color(0xFFEBECD0) : const Color(0xFF779556);
                        }

                        return GestureDetector(
                          onTap: () => _handleSquareTap(actualR, actualC),
                          child: Container(
                            decoration: BoxDecoration(color: bg),
                            child: Stack(
                              children: [
                                // Coordinate labels
                                if (c == 0)
                                  Positioned(
                                    top: 2, left: 3,
                                    child: Text(
                                      '${_flipped ? r + 1 : 8 - r}',
                                      style: TextStyle(
                                        fontSize: 9, fontWeight: FontWeight.w700,
                                        color: (isLight ? const Color(0xFF779556) : const Color(0xFFEBECD0)).withValues(alpha: 0.6),
                                      ),
                                    ),
                                  ),
                                if (r == 7)
                                  Positioned(
                                    bottom: 2, right: 3,
                                    child: Text(
                                      'abcdefgh'[ _flipped ? 7 - c : c],
                                      style: TextStyle(
                                        fontSize: 9, fontWeight: FontWeight.w700,
                                        color: (isLight ? const Color(0xFF779556) : const Color(0xFFEBECD0)).withValues(alpha: 0.6),
                                      ),
                                    ),
                                  ),
                                // Legal move indicator
                                if (isLegalTarget && piece == null)
                                  Center(
                                    child: Container(
                                      width: 28, height: 28,
                                      decoration: BoxDecoration(
                                        shape: BoxShape.circle,
                                        color: Colors.black.withValues(alpha: 0.15),
                                      ),
                                    ),
                                  ),
                                if (isLegalTarget && piece != null)
                                  Center(
                                    child: Container(
                                      width: 60, height: 60,
                                      decoration: BoxDecoration(
                                        shape: BoxShape.circle,
                                        border: Border.all(color: Colors.black.withValues(alpha: 0.2), width: 4),
                                      ),
                                    ),
                                  ),
                                // Piece
                                if (piece != null)
                                  Center(
                                    child: Text(
                                      _pieceUnicode[piece.symbol] ?? '',
                                      style: TextStyle(
                                        fontSize: MediaQuery.of(context).size.width / 11,
                                        shadows: [
                                          Shadow(
                                            color: Colors.black.withValues(alpha: piece.isWhite ? 0.3 : 0.5),
                                            blurRadius: 2,
                                            offset: const Offset(0, 1),
                                          ),
                                        ],
                                      ),
                                    ),
                                  ),
                              ],
                            ),
                          ),
                        );
                      },
                    ),
                  ),
                ),
              ),
            ),
            // Captured pieces
            if (_capturedBlack.isNotEmpty || _capturedWhite.isNotEmpty)
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
                child: Row(
                  children: [
                    if (_capturedBlack.isNotEmpty)
                      ...(_capturedBlack.map((k) => Text(_pieceUnicode[k] ?? '', style: const TextStyle(fontSize: 16)))),
                    const Spacer(),
                    if (_capturedWhite.isNotEmpty)
                      ...(_capturedWhite.map((k) => Text(_pieceUnicode[k] ?? '', style: const TextStyle(fontSize: 16)))),
                  ],
                ),
              ),
            // Move history
            Container(
              height: 80,
              margin: const EdgeInsets.symmetric(horizontal: 16),
              decoration: BoxDecoration(
                color: Colors.white.withValues(alpha: 0.03),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: Colors.white.withValues(alpha: 0.06)),
              ),
              child: ListView.builder(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                itemCount: (_moveNotations.length / 2).ceil(),
                itemBuilder: (context, i) {
                  final wi = i * 2;
                  final bi = wi + 1;
                  return Row(
                    children: [
                      SizedBox(
                        width: 28,
                        child: Text('${i + 1}.', style: const TextStyle(color: Colors.white38, fontSize: 12)),
                      ),
                      SizedBox(
                        width: 56,
                        child: Text(
                          wi < _moveNotations.length ? _moveNotations[wi] : '',
                          style: const TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.w600),
                        ),
                      ),
                      Text(
                        bi < _moveNotations.length ? _moveNotations[bi] : '',
                        style: const TextStyle(color: Colors.white70, fontSize: 13),
                      ),
                    ],
                  );
                },
              ),
            ),
            // Game over overlay
            if (_gameOver)
              Container(
                margin: const EdgeInsets.all(16),
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  color: Colors.white.withValues(alpha: 0.05),
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: Colors.white.withValues(alpha: 0.1)),
                ),
                child: Column(
                  children: [
                    const Text('🏆', style: TextStyle(fontSize: 40)),
                    const SizedBox(height: 8),
                    Text(_gameResult, style: const TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.w700)),
                    const SizedBox(height: 12),
                    Row(
                      children: [
                        Expanded(
                          child: ElevatedButton(
                            onPressed: _newGame,
                            style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF7B3EFF)),
                            child: const Text('Play Again', style: TextStyle(color: Colors.white)),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            const SizedBox(height: 8),
          ],
        ),
      ),
    );
  }
}
