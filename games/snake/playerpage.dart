import 'dart:math';

import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import 'package:promogames_engine/engine.dart';
import 'logic.dart';

/// Native Snake player screen. Reads builder settings from [GameConfig],
/// drives the headless engine and translates its fx events into haptics.
Widget buildSnakePlayer(GameConfig config, GameFinished onFinished) {
  return SnakePlayerPage(config: config, onFinished: onFinished);
}

class SnakePlayerPage extends StatefulWidget {
  final GameConfig config;
  final GameFinished onFinished;
  const SnakePlayerPage({super.key, required this.config, required this.onFinished});

  @override
  State<SnakePlayerPage> createState() => _SnakePlayerPageState();
}

class _SnakePlayerPageState extends State<SnakePlayerPage> {
  late final SnakeEngine _engine;
  late Color _bgColor;
  late Color _primaryColor;
  late Color _snakeColor;
  late Color _foodColor;
  String? _bgImageUrl;

  bool _reported = false;

  @override
  void initState() {
    super.initState();
    final s = widget.config.settings;
    _bgColor = _hex(s['bg_color']?.toString()) ?? const Color(0xFF0d0a1a);
    _primaryColor = _hex(s['primary_color']?.toString()) ?? const Color(0xFF8b5cf6);
    _snakeColor = _hex(s['snake_color']?.toString()) ?? const Color(0xFF22c55e);
    _foodColor = _hex(s['food_color']?.toString()) ?? const Color(0xFFef4444);
    _bgImageUrl = s['bg_image_url']?.toString();

    _engine = SnakeEngine(settings: s);
    _engine.fx.listen(_onFx);
    _engine.addListener(_onEngineChanged);
    _engine.start();
  }

  void _onEngineChanged() {
    if (_engine.completed && !_reported) {
      _reported = true;
      Future.delayed(const Duration(milliseconds: 400), () {
        if (mounted) widget.onFinished(_engine.score, _engine.maxScore, true);
      });
    }
  }

  void _onFx(GameFx effect) {
    switch (effect) {
      case GameFx.correct:
        HapticFeedback.mediumImpact();
      case GameFx.gameOver:
        HapticFeedback.heavyImpact();
      default:
        break;
    }
  }

  void _exit() {
    _engine.exitEarly();
    widget.onFinished(_engine.score, _engine.maxScore, false);
  }

  void _setDir(int dx, int dy) {
    HapticFeedback.lightImpact();
    _engine.setDir(dx, dy);
  }

  Color? _hex(String? hex) {
    if (hex == null || hex.isEmpty) return null;
    var h = hex.replaceFirst('#', '');
    if (h.length == 6) h = 'FF$h';
    try {
      return Color(int.parse(h, radix: 16));
    } catch (_) {
      return null;
    }
  }

  @override
  void dispose() {
    _engine.removeListener(_onEngineChanged);
    _engine.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: _bgColor,
      appBar: AppBar(
        backgroundColor: _bgColor,
        title: Text(widget.config.name),
        leading: IconButton(icon: const Icon(Icons.close), onPressed: _exit),
      ),
      body: Stack(
        fit: StackFit.expand,
        children: [
          if (_bgImageUrl != null)
            CachedNetworkImage(
              imageUrl: _bgImageUrl!,
              fit: BoxFit.cover,
              placeholder: (_, __) => ColoredBox(color: _bgColor),
              errorWidget: (_, __, ___) => ColoredBox(color: _bgColor),
            )
          else
            ColoredBox(color: _bgColor),
          Container(color: Colors.black.withOpacity(0.3)),
          SafeArea(
            child: Column(
              children: [
                Padding(
                  padding: const EdgeInsets.all(8),
                  child: AnimatedBuilder(
                    animation: _engine,
                    builder: (_, __) => Text(
                      'Score: ${_engine.score}',
                      style: TextStyle(color: _snakeColor, fontSize: 18, fontWeight: FontWeight.bold),
                    ),
                  ),
                ),
                Expanded(
                  child: LayoutBuilder(
                    builder: (ctx, c) {
                      final cell = min(c.maxWidth / _engine.cols, c.maxHeight / _engine.rows);
                      return Center(
                        child: SizedBox(
                          width: cell * _engine.cols,
                          height: cell * _engine.rows,
                          child: GestureDetector(
                            onVerticalDragEnd: (d) {
                              final v = d.primaryVelocity ?? 0;
                              if (v < 0) _setDir(0, -1);
                              if (v > 0) _setDir(0, 1);
                            },
                            onHorizontalDragEnd: (d) {
                              final v = d.primaryVelocity ?? 0;
                              if (v < 0) _setDir(-1, 0);
                              if (v > 0) _setDir(1, 0);
                            },
                            child: AnimatedBuilder(
                              animation: _engine,
                              builder: (_, __) => CustomPaint(
                                painter: _SnakePainter(
                                  snake: _engine.snake,
                                  food: _engine.food,
                                  cols: _engine.cols,
                                  rows: _engine.rows,
                                  cell: cell,
                                  snakeColor: _snakeColor,
                                  foodColor: _foodColor,
                                ),
                              ),
                            ),
                          ),
                        ),
                      );
                    },
                  ),
                ),
                AnimatedBuilder(
                  animation: _engine,
                  builder: (_, __) => _engine.completed
                      ? Padding(
                          padding: const EdgeInsets.all(8),
                          child: Text('GAME OVER',
                              style: TextStyle(color: _foodColor, fontSize: 22, fontWeight: FontWeight.w800)),
                        )
                      : const SizedBox.shrink(),
                ),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                  children: [
                    _dirBtn(Icons.arrow_upward, () => _setDir(0, -1)),
                    Column(
                      children: [
                        _dirBtn(Icons.arrow_back, () => _setDir(-1, 0)),
                        _dirBtn(Icons.arrow_forward, () => _setDir(1, 0)),
                      ],
                    ),
                    _dirBtn(Icons.arrow_downward, () => _setDir(0, 1)),
                  ],
                ),
                const SizedBox(height: 8),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _dirBtn(IconData icon, VoidCallback onTap) => IconButton(
        icon: Icon(icon, color: _primaryColor, size: 32),
        onPressed: onTap,
      );
}

class _SnakePainter extends CustomPainter {
  final List<(int, int)> snake;
  final (int, int) food;
  final int cols;
  final int rows;
  final double cell;
  final Color snakeColor;
  final Color foodColor;

  _SnakePainter({
    required this.snake,
    required this.food,
    required this.cols,
    required this.rows,
    required this.cell,
    required this.snakeColor,
    required this.foodColor,
  });

  @override
  void paint(Canvas canvas, Size size) {
    canvas.drawRect(
        Rect.fromLTWH(0, 0, size.width, size.height), Paint()..color = const Color(0x141a0e2e));
    for (var i = 0; i < snake.length; i++) {
      final s = snake[i];
      final paint = Paint()..color = i == 0 ? snakeColor : snakeColor.withOpacity(i == 0 ? 1 : 0.85);
      canvas.drawRRect(
        RRect.fromRectAndRadius(
          Rect.fromLTWH(s.$1 * cell + 0.5, s.$2 * cell + 0.5, cell - 1, cell - 1),
          const Radius.circular(3),
        ),
        paint,
      );
    }
    canvas.drawCircle(
      Offset(food.$1 * cell + cell / 2, food.$2 * cell + cell / 2),
      cell / 2 - 2,
      Paint()..color = foodColor,
    );
  }

  @override
  bool shouldRepaint(covariant _SnakePainter old) =>
      old.snake.length != snake.length || old.food != food || old.cell != cell;
}
