import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import 'package:promogames_engine/engine.dart';
import 'logic.dart';

Widget buildChessPlayer(GameConfig config, GameFinished onFinished) {
  return ChessPlayerPage(config: config, onFinished: onFinished);
}

class ChessPlayerPage extends StatefulWidget {
  final GameConfig config;
  final GameFinished onFinished;
  const ChessPlayerPage({super.key, required this.config, required this.onFinished});

  @override
  State<ChessPlayerPage> createState() => _ChessPlayerPageState();
}

class _ChessPlayerPageState extends State<ChessPlayerPage> {
  late final ChessEngine _engine;
  late Color _bgColor;
  late Color _primaryColor;
  String? _bgImageUrl;
  bool _aiThinking = false;
  List<int>? _selectedSquare;
  List<ChessMove> _legalMoves = [];
  ChessMove? _lastMove;
  bool _flipped = false;
  bool _reported = false;

  @override
  void initState() {
    super.initState();
    final s = widget.config.settings;
    _bgColor = _hex(s['bg_color']?.toString()) ?? const Color(0xFF0d0a1a);
    _primaryColor = _hex(s['primary_color']?.toString()) ?? const Color(0xFF8b5cf6);
    _bgImageUrl = s['bg_image_url']?.toString();

    _engine = ChessEngine(settings: s);
    _engine.fx.listen(_onFx);
    _engine.addListener(_onEngineChanged);
  }

  void _onEngineChanged() {
    if (_engine.completed && !_reported) {
      _reported = true;
      Future.delayed(const Duration(milliseconds: 500), () {
        if (mounted) widget.onFinished(0, 0, true);
      });
    }
    if (mounted) setState(() {});
  }

  void _onFx(GameFx effect) {
    switch (effect) {
      case GameFx.gameOver:
        HapticFeedback.vibrate();
      default:
        break;
    }
  }

  void _exit() {
    widget.onFinished(0, 0, false);
  }

  Color? _hex(String? hex) {
    if (hex == null || hex.isEmpty) return null;
    var h = hex.replaceFirst('#', '');
    if (h.length == 6) h = 'FF$h';
    try { return Color(int.parse(h, radix: 16)); } catch (_) { return null; }
  }

  void _handleSquareTap(int r, int c) {
    if (_engine.isGameOver || _aiThinking || !_engine.whiteTurn) return;
    final piece = _engine.board[r][c];

    if (_selectedSquare != null) {
      final move = _legalMoves.where((m) => m.toR == r && m.toC == c).firstOrNull;
      if (move != null) { _executeMove(move); return; }
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

  void _executeMove(ChessMove move) {
    _engine.makeMove(move);
    setState(() {
      _lastMove = move;
      _selectedSquare = null;
      _legalMoves = [];
    });
    _engine.checkGameEnd();
    if (!_engine.isGameOver) _triggerAI();
  }

  void _triggerAI() {
    setState(() { _aiThinking = true; });
    Future.delayed(const Duration(milliseconds: 400), () {
      if (!mounted || _engine.isGameOver) return;
      final aiMove = _engine.getBestAiMove();
      if (aiMove != null) {
        _engine.makeMove(aiMove);
        setState(() { _lastMove = aiMove; _aiThinking = false; });
        _engine.checkGameEnd();
      } else {
        setState(() { _aiThinking = false; });
      }
    });
  }

  @override
  void dispose() {
    _engine.removeListener(_onEngineChanged);
    _engine.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final displayBoard = _flipped
        ? List.generate(8, (ri) => List.generate(8, (ci) => _engine.board[7-ri][7-ci]))
        : List.generate(8, (ri) => List.generate(8, (ci) => _engine.board[ri][ci]));

    return Scaffold(
      backgroundColor: const Color(0xFF0f0f23),
      body: SafeArea(
        child: Column(
          children: [
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              child: Row(
                children: [
                  IconButton(
                    icon: const Icon(Icons.arrow_back, color: Colors.white70),
                    onPressed: _exit,
                  ),
                  const Expanded(
                    child: Text('\u265A Chess', style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.w700)),
                  ),
                  IconButton(
                    icon: Icon(_flipped ? Icons.flip_to_back : Icons.flip_to_front, color: Colors.white70),
                    onPressed: () => setState(() => _flipped = !_flipped),
                  ),
                  IconButton(
                    icon: const Icon(Icons.refresh, color: Colors.white70),
                    onPressed: () { _reported = false; _engine.newGame(); _selectedSquare = null; _legalMoves = []; _lastMove = null; _aiThinking = false; },
                  ),
                ],
              ),
            ),
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
                    _aiThinking ? 'AI thinking...' : _engine.isGameOver
                        ? _engine.gameResult
                        : '${_engine.whiteTurn ? "White" : "Black"} to move',
                    style: TextStyle(
                      color: _engine.isInCheck(_engine.whiteTurn) && !_engine.isGameOver
                          ? Colors.red : Colors.white70,
                      fontSize: 14, fontWeight: FontWeight.w600,
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 8),
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
                        final piece = displayBoard[r][c];
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
                        } else if (isSelected || isLastMove) {
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
                                if (piece != null)
                                  Center(
                                    child: Text(
                                      ChessEngine.pieceUnicode[piece.symbol] ?? '',
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
            if (_engine.isGameOver)
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
                    Text(_engine.gameResult, style: const TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.w700)),
                    const SizedBox(height: 12),
                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton(
                        onPressed: () { _reported = false; _engine.newGame(); _selectedSquare = null; _legalMoves = []; _lastMove = null; _aiThinking = false; },
                        style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF7B3EFF)),
                        child: const Text('Play Again', style: TextStyle(color: Colors.white)),
                      ),
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
