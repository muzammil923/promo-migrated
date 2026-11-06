import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:promogames_engine/engine.dart';
import 'package:promogames_engine/engine.dart';

Widget buildArrowEscapeGame(GameConfig config, GameFinished onFinished) {
  return _ArrowEscapeGame(config: config, onFinished: onFinished);
}

class _ArrowEscapeGame extends StatefulWidget {
  final GameConfig config;
  final GameFinished onFinished;
  const _ArrowEscapeGame({required this.config, required this.onFinished});

  @override
  State<_ArrowEscapeGame> createState() => _ArrowEscapeGameState();
}

class _ArrowEscapeGameState extends State<_ArrowEscapeGame> {
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

  final String title = 'Arrow Escape';
  static const int cols = 7;
  static const int rows = 12;

  late List<List<int>> grid; // 0 empty, 1 player, 2 obstacle
  late int px, py;
  late List<List<int>> obstacles;
  int score = 0;
  bool dead = false;
  late int tickMs;
  int level = 0;

  @override
  void initState() {
    super.initState();
    _parseSettings();
    _reset();
  }

  void _reset() {
    grid = List.generate(rows, (_) => List.filled(cols, 0));
    px = cols ~/ 2;
    py = rows - 1;
    obstacles = [];
    score = 0;
    dead = false;
    level = 0;
    tickMs = 450;
    grid[py][px] = 1;
    _schedule();
  }

  void _schedule() {
    Future.delayed(Duration(milliseconds: tickMs), _tick);
  }

  void _spawn() {
    final n = 1 + (level ~/ 5);
    for (int i = 0; i < n; i++) {
      final c = DateTime.now().microsecondsSinceEpoch + i * 13 + score;
      obstacles.add([c % cols, 0]);
    }
  }

  void _tick() {
    if (dead) return;
    setState(() {
      for (final o in obstacles) {
        o[1]++;
      }
      // remove offscreen
      obstacles.removeWhere((o) => o[1] >= rows);
      // collision
      for (final o in obstacles) {
        if (o[0] == px && o[1] == py) {
          dead = true;
        }
      }
      if (!dead) {
        score++;
        level++;
        if (level % 10 == 0 && tickMs > 150) tickMs -= 30;
      }
      _spawn();
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
    final nx = px + dx;
    final ny = py + dy;
    if (nx < 0 || nx >= cols || ny < 0 || ny >= rows) return;
    if (obstacles.any((o) => o[0] == nx && o[1] == ny)) {
      setState(() => dead = true);
      Future.delayed(const Duration(milliseconds: 200), () {
        widget.onFinished(score, score, false);
      });
      return;
    }
    setState(() {
      px = nx;
      py = ny;
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
                  Text('Score: $score',
                      style: const TextStyle(color: Color(0xFF22c55e), fontSize: 18)),
                  if (dead)
                    const Text('CAUGHT!', style: TextStyle(color: Colors.red, fontSize: 18)),
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
                      painter: _EscapePainter(px, py, obstacles, cols, rows, cell),
                    ),
                  ),
                );
              }),
            ),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceEvenly,
              children: [
                _btn(Icons.arrow_left, () => _move(-1, 0)),
                _btn(Icons.arrow_upward, () => _move(0, -1)),
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

class _EscapePainter extends CustomPainter {
  final int px, py;
  final List<List<int>> obstacles;
  final int cols, rows;
  final double cell;
  _EscapePainter(this.px, this.py, this.obstacles, this.cols, this.rows, this.cell);

  @override
  void paint(Canvas canvas, Size size) {
    canvas.drawRect(Rect.fromLTWH(0, 0, size.width, size.height),
        Paint()..color = const Color(0xFF080612));
    for (final o in obstacles) {
      canvas.drawRRect(
        RRect.fromRectAndRadius(
          Rect.fromLTWH(o[0] * cell, o[1] * cell, cell - 1, cell - 1),
          const Radius.circular(3),
        ),
        Paint()..color = Colors.red.shade700,
      );
    }
    canvas.drawRRect(
      RRect.fromRectAndRadius(
        Rect.fromLTWH(px * cell, py * cell, cell - 1, cell - 1),
        const Radius.circular(3),
      ),
      Paint()..color = const Color(0xFF22c55e),
    );
  }

  @override
  bool shouldRepaint(covariant CustomPainter old) => true;
}
