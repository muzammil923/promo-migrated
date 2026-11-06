import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:promogames_engine/engine.dart';

Widget buildTetrisGame(GameConfig config, GameFinished onFinished) {
  return _TetrisGame(config: config, onFinished: onFinished);
}

class _TetrisGame extends StatefulWidget {
  final GameConfig config;
  final GameFinished onFinished;
  const _TetrisGame({required this.config, required this.onFinished});

  @override
  State<_TetrisGame> createState() => _TetrisGameState();
}

class _TetrisGameState extends State<_TetrisGame> {
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

  final String title = 'Tetris';
  static const int cols = 10;
  static const int rows = 20;

  static const List<List<List<int>>> shapes = [
    [[0, 1], [1, 1], [2, 1], [3, 1]], // I
    [[1, 0], [1, 1], [2, 1], [2, 2]], // S
    [[1, 1], [2, 1], [1, 2], [2, 2]], // O
    [[1, 0], [1, 1], [1, 2], [2, 1]], // T
    [[0, 1], [1, 1], [2, 1], [2, 2]], // L
  ];

  late List<List<int>> board;
  late List<List<int>> piece;
  late int color;
  int px = 3;
  int py = 0;
  int score = 0;
  bool dead = false;

  @override
  void initState() {
    super.initState();
    _parseSettings();
    _reset();
  }

  void _reset() {
    board = List.generate(rows, (_) => List.filled(cols, 0));
    score = 0;
    dead = false;
    _spawn();
    _schedule();
  }

  void _schedule() {
    Future.delayed(const Duration(milliseconds: 500), _tick);
  }

  void _spawn() {
    final idx = DateTime.now().microsecondsSinceEpoch % shapes.length;
    piece = shapes[idx].map((c) => List<int>.from(c)).toList();
    color = idx + 1;
    px = 3;
    py = 0;
    if (_collides(px, py, piece)) {
      dead = true;
    }
  }

  bool _collides(int ox, int oy, List<List<int>> p) {
    for (final c in p) {
      final x = ox + c[0];
      final y = oy + c[1];
      if (x < 0 || x >= cols || y >= rows) return true;
      if (y >= 0 && board[y][x] != 0) return true;
    }
    return false;
  }

  void _lock() {
    for (final c in piece) {
      final x = px + c[0];
      final y = py + c[1];
      if (y >= 0) board[y][x] = color;
    }
    _clearLines();
    _spawn();
  }

  void _clearLines() {
    int cleared = 0;
    for (int r = rows - 1; r >= 0; r--) {
      if (board[r].every((v) => v != 0)) {
        board.removeAt(r);
        board.insert(0, List.filled(cols, 0));
        cleared++;
        r++;
      }
    }
    if (cleared > 0) setState(() => score += cleared * 10);
  }

  void _tick() {
    if (dead) return;
    setState(() {
      if (!_collides(px, py + 1, piece)) {
        py++;
      } else {
        _lock();
      }
    });
    if (dead) {
      Future.delayed(const Duration(milliseconds: 300), () {
        widget.onFinished(score, score, false);
      });
    } else {
      _schedule();
    }
  }

  void _move(int dx, int dy) {
    if (dead) return;
    setState(() {
      if (!_collides(px + dx, py + dy, piece)) {
        px += dx;
        py += dy;
      } else if (dy > 0) {
        _lock();
      }
    });
  }

  void _rotate() {
    if (dead) return;
    final rotated = piece.map((c) => [c[1], 2 - c[0]]).toList();
    setState(() {
      if (!_collides(px, py, rotated)) {
        piece = rotated;
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(widget.config.name ?? title),
        backgroundColor: _bgColor,
        actions: [
          IconButton(
            icon: const Icon(Icons.close),
            onPressed: () => widget.onFinished(score, score, false),
          )
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
          children: [
            Padding(
              padding: const EdgeInsets.all(10),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text('Lines score: $score',
                      style: const TextStyle(color: Color(0xFF22c55e), fontSize: 18)),
                  if (dead)
                    const Text('GAME OVER', style: TextStyle(color: Colors.red, fontSize: 18)),
                ],
              ),
            ),
            Expanded(
              child: LayoutBuilder(builder: (ctx, c) {
                final cell = (c.maxWidth < c.maxHeight ? c.maxWidth / cols : c.maxHeight / rows);
                return Center(
                  child: SizedBox(
                    width: cell * cols,
                    height: cell * rows,
                    child: CustomPaint(
                      painter: _TetrisPainter(board, piece, px, py, color, cols, rows, cell),
                    ),
                  ),
                );
              }),
            ),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceEvenly,
              children: [
                _btn(Icons.arrow_left, () => _move(-1, 0)),
                _btn(Icons.rotate_right, _rotate),
                _btn(Icons.arrow_downward, () => _move(0, 1)),
                _btn(Icons.arrow_right, () => _move(1, 0)),
              ],
            ),
            const SizedBox(height: 12),
            if (dead)
              ElevatedButton(
                style: ElevatedButton.styleFrom(backgroundColor: _primaryColor),
                onPressed: () => setState(_reset),
                child: const Text('RESTART', style: TextStyle(color: Colors.white)),
              ),
            const SizedBox(height: 12),
          ],
        ),
        ],
      ),
    );
  }

  Widget _btn(IconData i, VoidCallback f) => IconButton(
        icon: Icon(i, color: _primaryColor),
        onPressed: f,
      );
}

class _TetrisPainter extends CustomPainter {
  final List<List<int>> board;
  final List<List<int>> piece;
  final int px, py, color, cols, rows;
  final double cell;
  _TetrisPainter(this.board, this.piece, this.px, this.py, this.color, this.cols, this.rows, this.cell);

  static const palette = [
    Colors.transparent,
    Color(0xFF8b5cf6),
    Color(0xFF22c55e),
    Color(0xFFef4444),
    Color(0xFFf59e0b),
    Color(0xFF06b6d4),
  ];

  @override
  void paint(Canvas canvas, Size size) {
    canvas.drawRect(Rect.fromLTWH(0, 0, size.width, size.height),
        Paint()..color = const Color(0xFF080612));
    for (int r = 0; r < rows; r++) {
      for (int c = 0; c < cols; c++) {
        if (board[r][c] != 0) _draw(canvas, c, r, palette[board[r][c]]);
      }
    }
    for (final p in piece) {
      final x = px + p[0];
      final y = py + p[1];
      if (y >= 0) _draw(canvas, x, y, palette[color]);
    }
  }

  void _draw(Canvas canvas, int c, int r, Color col) {
    final paint = Paint()..color = col;
    canvas.drawRRect(
      RRect.fromRectAndRadius(
        Rect.fromLTWH(c * cell, r * cell, cell - 1, cell - 1),
        const Radius.circular(2),
      ),
      paint,
    );
  }

  @override
  bool shouldRepaint(covariant CustomPainter old) => true;
}
