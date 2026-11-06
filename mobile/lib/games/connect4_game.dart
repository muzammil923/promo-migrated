import 'dart:async';
import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:promogames_engine/engine.dart';
import 'package:promogames_engine/engine.dart';

Widget buildConnect4Game(GameConfig config, GameFinished onFinished) {
  return _C4Game(config: config, onFinished: onFinished);
}

class _C4Game extends StatefulWidget {
  final GameConfig config;
  final GameFinished onFinished;
  const _C4Game({required this.config, required this.onFinished});

  @override
  State<_C4Game> createState() => _C4GameState();
}

class _C4GameState extends State<_C4Game> {
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

  static const int cols = 7;
  static const int rows = 6;
  late List<List<int?>> board;
  bool playerTurn = true;
  bool finished = false;
  int result = -1; // -1 none, 0 draw, 1 player win, 2 cpu win
  Timer? timer;

  @override
  void initState() {
    super.initState();
    _parseSettings();
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
            board[r][c + 3] == player) {
          return player;
        }
        if (r + 3 < rows &&
            board[r + 1][c] == player &&
            board[r + 2][c] == player &&
            board[r + 3][c] == player) {
          return player;
        }
        if (r + 3 < rows &&
            c + 3 < cols &&
            board[r + 1][c + 1] == player &&
            board[r + 2][c + 2] == player &&
            board[r + 3][c + 3] == player) {
          return player;
        }
        if (r - 3 >= 0 &&
            c + 3 < cols &&
            board[r - 1][c + 1] == player &&
            board[r - 2][c + 2] == player &&
            board[r - 3][c + 3] == player) {
          return player;
        }
      }
    }
    return 0;
  }

  void _tapColumn(int c) {
    if (!playerTurn || finished) return;
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
    setState(() {});
    timer = Timer(const Duration(milliseconds: 500), _cpuMove);
  }

  void _cpuMove() {
    if (finished) return;
    int? move;
    for (int c = 0; c < cols; c++) {
      final r = _dropCol(c);
      if (r != null) {
        board[r][c] = 2;
        if (_checkWin(2) == 2) {
          move = c;
          board[r][c] = null;
          break;
        }
        board[r][c] = null;
      }
    }
    if (move == null) {
      for (int c = 0; c < cols; c++) {
        final r = _dropCol(c);
        if (r != null) {
          board[r][c] = 1;
          if (_checkWin(1) == 1) {
            move = c;
            board[r][c] = null;
            break;
          }
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
    if (_checkWin(2) == 2) {
      _end(2);
      return;
    }
    if (_full()) {
      _end(0);
      return;
    }
    playerTurn = true;
    setState(() {});
  }

  void _end(int res) {
    finished = true;
    result = res;
    setState(() {});
    Future.delayed(const Duration(milliseconds: 500), () {
      widget.onFinished(result == 1 ? 1 : 0, 1, true);
    });
  }

  void _finish() {
    if (finished) return;
    widget.onFinished(result == 1 ? 1 : 0, 1, false);
  }

  @override
  void dispose() {
    timer?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final title = widget.config.name ?? 'Connect 4';
    return Scaffold(
      appBar: AppBar(
        title: Text(title),
        backgroundColor: _bgColor,
        actions: [
          IconButton(icon: const Icon(Icons.close), onPressed: _finish),
        ],
      ),
      body: Stack(

        fit: StackFit.expand,

        children: [

          if (_bgImageUrl != null)

            CachedNetworkImage(

              imageUrl: _bgImageUrl!,

              fit: BoxFit.cover,

              placeholder: (_, __) => Container(color: _bgColor),

              errorWidget: (_, __, ___) => Container(color: _bgColor),

            )

          else Container(color: _bgColor),

          Container(color: Colors.black.withOpacity(0.3)),

           Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            _status(),
            const SizedBox(height: 12),
            LayoutBuilder(
              builder: (ctx, c) {
                final size = c.maxWidth < 420 ? c.maxWidth : 420.0;
                final cell = size / cols;
                return GestureDetector(
                  onTapDown: (d) {
                    final box = ctx.findRenderObject() as RenderBox;
                    final local = box.globalToLocal(d.globalPosition);
                    final col = (local.dx / cell).floor();
                    if (col >= 0 && col < cols) _tapColumn(col);
                  },
                  child: Container(
                    width: size,
                    height: cell * rows,
                    padding: const EdgeInsets.all(6),
                    decoration: BoxDecoration(
                      color: const Color(0xFF0d0a1a),
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(color: _primaryColor),
                    ),
                    child: CustomPaint(
                      painter: _C4Painter(board, rows, cols, cell, _primaryColor),
                    ),
                  ),
                );
              },
            ),
          ],
        ),
        ],
      ),
    );
  }

  Widget _status() {
    String t;
    if (finished) {
      t = result == 1 ? 'You win!' : result == 2 ? 'CPU wins' : 'Draw';
    } else {
      t = playerTurn ? 'Your turn (purple)' : 'CPU thinking...';
    }
    return Text(t,
        style: const TextStyle(color: Color(0xFF22c55e), fontSize: 20));
  }
}

class _C4Painter extends CustomPainter {
  final Color primaryColor;
  final List<List<int?>> board;
  final int rows;
  final int cols;
  final double cell;
  _C4Painter(this.board, this.rows, this.cols, this.cell, this.primaryColor);

  @override
  void paint(Canvas canvas, Size size) {
    final bg = Paint()..color = const Color(0xFF1a0e2e);
    canvas.drawRect(Rect.fromLTWH(0, 0, size.width, size.height), bg);
    for (int r = 0; r < rows; r++) {
      for (int c = 0; c < cols; c++) {
        final v = board[r][c];
        canvas.drawCircle(
          Offset(c * cell + cell / 2, r * cell + cell / 2),
          cell / 2 - 3,
          Paint()
            ..color = v == 1
                ? primaryColor
                : v == 2
                    ? const Color(0xFF22c55e)
                    : Colors.black54,
        );
      }
    }
  }

  @override
  bool shouldRepaint(covariant CustomPainter old) => true;
}
