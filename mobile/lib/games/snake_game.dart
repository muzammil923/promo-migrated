import 'dart:async';
import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:promogames_engine/engine.dart';
import 'package:promogames_engine/engine.dart';

Widget buildSnakeGame(GameConfig config, GameFinished onFinished) {
  return _SnakeGame(config: config, onFinished: onFinished);
}

class _SnakeGame extends StatefulWidget {
  final GameConfig config;
  final GameFinished onFinished;
  const _SnakeGame({required this.config, required this.onFinished});

  @override
  State<_SnakeGame> createState() => _SnakeGameState();
}

class _SnakeGameState extends State<_SnakeGame> {
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

  static const int cols = 18;
  static const int rows = 22;
  late List<Point> snake;
  late Point dir;
  late Point food;
  late Timer timer;
  int score = 0;
  bool dead = false;

  @override
  void initState() {
    super.initState();
    _parseSettings();
    _reset();
    timer = Timer.periodic(const Duration(milliseconds: 110), (_) => _tick());
  }

  void _reset() {
    snake = [Point(5, 10), Point(4, 10), Point(3, 10)];
    dir = Point(1, 0);
    _placeFood();
  }

  void _placeFood() {
    final rnd = (DateTime.now().microsecondsSinceEpoch);
    int x, y;
    do {
      x = (rnd ~/ (snake.length + 1) + score) % cols;
      y = (rnd + score * 7) % rows;
    } while (snake.any((s) => s.x == x && s.y == y));
    food = Point(x, y);
  }

  void _tick() {
    if (dead) return;
    setState(() {
      final head = snake.first;
      final next = Point(head.x + dir.x, head.y + dir.y);
      if (next.x < 0 || next.x >= cols || next.y < 0 || next.y >= rows ||
          snake.any((s) => s.x == next.x && s.y == next.y)) {
        _gameOver();
        return;
      }
      snake.insert(0, next);
      if (next.x == food.x && next.y == food.y) {
        score++;
        _placeFood();
      } else {
        snake.removeLast();
      }
    });
  }

  void _gameOver() {
    dead = true;
    timer.cancel();
    Future.delayed(const Duration(milliseconds: 300), () {
      widget.onFinished(score, score, true);
    });
  }

  void _setDir(Point d) {
    if (dead) return;
    if (d.x != -dir.x || d.y != -dir.y) dir = d;
  }

  @override
  void dispose() {
    timer.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final title = widget.config.name ?? 'Snake';
    return Scaffold(
      appBar: AppBar(
        title: Text(title),
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
              padding: const EdgeInsets.all(8),
              child: Text('Score: $score',
                  style: const TextStyle(color: Color(0xFF22c55e), fontSize: 18)),
            ),
            Expanded(
              child: LayoutBuilder(
                builder: (ctx, c) {
                  final w = c.maxWidth;
                  final h = c.maxHeight;
                  final cell = (w < h ? w / cols : h / rows);
                  return Center(
                    child: SizedBox(
                      width: cell * cols,
                      height: cell * rows,
                      child: GestureDetector(
                        onVerticalDragEnd: (d) {
                          if (d.primaryVelocity! < 0) {
                            _setDir(Point(0, -1));
                          } else if (d.primaryVelocity! > 0) _setDir(Point(0, 1));
                        },
                        onHorizontalDragEnd: (d) {
                          if (d.primaryVelocity! < 0) {
                            _setDir(Point(-1, 0));
                          } else if (d.primaryVelocity! > 0) _setDir(Point(1, 0));
                        },
                        child: CustomPaint(
                          painter: _SnakePainter(snake, food, cell, _primaryColor),
                        ),
                      ),
                    ),
                  );
                },
              ),
            ),
            if (dead)
              const Padding(
                padding: EdgeInsets.all(8),
                child: Text('GAME OVER',
                    style: TextStyle(color: Colors.red, fontSize: 22)),
              ),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceEvenly,
              children: [
                _dirBtn(Icons.arrow_upward, () => _setDir(Point(0, -1))),
                Column(
                  children: [
                    _dirBtn(Icons.arrow_back, () => _setDir(Point(-1, 0))),
                    _dirBtn(Icons.arrow_forward, () => _setDir(Point(1, 0))),
                  ],
                ),
                _dirBtn(Icons.arrow_downward, () => _setDir(Point(0, 1))),
              ],
            ),
            const SizedBox(height: 8),
          ],
        ),
        ],
      ),
    );
  }

  Widget _dirBtn(IconData i, VoidCallback f) => IconButton(
        icon: Icon(i, color: _primaryColor),
        onPressed: f,
      );
}

class Point {
  final int x, y;
  Point(this.x, this.y);
}

class _SnakePainter extends CustomPainter {
  final Color primaryColor;
  final List<Point> snake;
  final Point food;
  final double cell;
  _SnakePainter(this.snake, this.food, this.cell, this.primaryColor);

  @override
  void paint(Canvas canvas, Size size) {
    final grid = Paint()..color = const Color(0xFF1a0e2e);
    canvas.drawRect(
        Rect.fromLTWH(0, 0, size.width, size.height),
        Paint()..color = const Color(0xFF080612));
    for (int i = 0; i < snake.length; i++) {
      final s = snake[i];
      grid.color = i == 0 ? const Color(0xFF22c55e) : primaryColor;
      canvas.drawRRect(
        RRect.fromRectAndRadius(
          Rect.fromLTWH(s.x * cell, s.y * cell, cell - 1, cell - 1),
          const Radius.circular(3),
        ),
        grid,
      );
    }
    final f = Paint()..color = Colors.red;
    canvas.drawCircle(
        Offset(food.x * cell + cell / 2, food.y * cell + cell / 2),
        cell / 2 - 2,
        f);
  }

  @override
  bool shouldRepaint(covariant CustomPainter old) => true;
}
