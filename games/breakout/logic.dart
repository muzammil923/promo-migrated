import 'dart:async';
import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:promogames_engine/engine.dart';

Widget buildBreakoutGame(GameConfig config, GameFinished onFinished) {
  return _BreakoutGame(config: config, onFinished: onFinished);
}

class _BreakoutGame extends StatefulWidget {
  final GameConfig config;
  final GameFinished onFinished;
  const _BreakoutGame({required this.config, required this.onFinished});

  @override
  State<_BreakoutGame> createState() => _BreakoutGameState();
}

class _BreakoutGameState extends State<_BreakoutGame> {
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

  static const double w = 360;
  static const double h = 520;
  static const double padW = 70;
  static const double padH = 12;
  late double padX;
  late Offset ball;
  late Offset ballV;
  late List<Brick> bricks;
  int score = 0;
  bool over = false;
  bool started = false;
  late Timer timer;

  @override
  void initState() {
    super.initState();
    _parseSettings();
    _reset();
    timer = Timer.periodic(const Duration(milliseconds: 16), (_) => _tick());
  }

  void _reset() {
    padX = w / 2 - padW / 2;
    ball = Offset(w / 2, h - 60);
    ballV = const Offset(3.2, -3.6);
    started = false;
    over = false;
    bricks = [];
    for (int r = 0; r < 5; r++) {
      for (int c = 0; c < 9; c++) {
        bricks.add(Brick(
          Rect.fromLTWH(6 + c * 39.0, 40 + r * 26.0, 34, 20),
          true,
        ));
      }
    }
  }

  void _tick() {
    if (over || !started) return;
    setState(() {
      ball = Offset(ball.dx + ballV.dx, ball.dy + ballV.dy);
      if (ball.dx <= 0 || ball.dx >= w) ballV = Offset(-ballV.dx, ballV.dy);
      if (ball.dy <= 0) ballV = Offset(ballV.dx, -ballV.dy);
      if (ball.dy >= h) {
        _gameOver();
        return;
      }
      if (ball.dy >= h - 40 - 6 && ball.dx >= padX && ball.dx <= padX + padW) {
        ballV = Offset(ballV.dx, -ballV.dy.abs());
      }
      for (final b in bricks) {
        if (b.alive && b.rect.contains(Offset(ball.dx, ball.dy))) {
          b.alive = false;
          score++;
          ballV = Offset(ballV.dx, -ballV.dy);
          break;
        }
      }
      bricks.removeWhere((b) => !b.alive);
    });
  }

  void _gameOver() {
    over = true;
    Future.delayed(const Duration(milliseconds: 200),
        () => widget.onFinished(score, score, true));
  }

  void _movePad(double dx) {
    setState(() {
      padX = (dx - padW / 2).clamp(0, w - padW);
    });
  }

  @override
  void dispose() {
    timer.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final title = widget.config.name ?? 'Breakout';
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
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text('Score: $score',
                      style: const TextStyle(
                          color: Color(0xFF22c55e), fontSize: 18)),
                  Text('Bricks: ${bricks.length}',
                      style: const TextStyle(color: Colors.white70)),
                ],
              ),
            ),
            Center(
              child: GestureDetector(
                onHorizontalDragUpdate: (d) => _movePad(d.localPosition.dx),
                onTap: () => setState(() => started = true),
                child: SizedBox(
                  width: w,
                  height: h,
                  child: CustomPaint(
                    painter: _BreakoutPainter(ball, bricks, padX, padW, padH, h, _primaryColor),
                  ),
                ),
              ),
            ),
            if (!started)
              const Text('Tap to start',
                  style: TextStyle(color: Color(0xFF8b5cf6))),
            if (over)
              const Padding(
                padding: EdgeInsets.all(4),
                child: Text('GAME OVER',
                    style: TextStyle(color: Colors.red, fontSize: 22)),
              ),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceEvenly,
              children: [
                IconButton(
                  icon: const Icon(Icons.arrow_back, color: Color(0xFF8b5cf6)),
                  onPressed: () => _movePad(padX - 25),
                ),
                IconButton(
                  icon: const Icon(Icons.arrow_forward, color: Color(0xFF8b5cf6)),
                  onPressed: () => _movePad(padX + 25),
                ),
                IconButton(
                  icon: const Icon(Icons.replay, color: Color(0xFF8b5cf6)),
                  onPressed: () => setState(_reset),
                ),
              ],
            ),
            const SizedBox(height: 8),
          ],
        ),
        ],
      ),
    );
  }
}

class Brick {
  Rect rect;
  bool alive;
  Brick(this.rect, this.alive);
}

class _BreakoutPainter extends CustomPainter {
  final Color primaryColor;
  final Offset ball;
  final List<Brick> bricks;
  final double padX, padW, padH, h;
  _BreakoutPainter(this.ball, this.bricks, this.padX, this.padW, this.padH, this.h, this.primaryColor);

  @override
  void paint(Canvas canvas, Size size) {
    final bp = Paint()..color = Colors.white;
    canvas.drawCircle(ball, 7, bp);
    final brp = Paint()..color = primaryColor;
    for (final b in bricks) {
      canvas.drawRect(b.rect, brp);
    }
    final pp = Paint()..color = const Color(0xFF22c55e);
    canvas.drawRect(Rect.fromLTWH(padX, h - 40, padW, padH), pp);
  }

  @override
  bool shouldRepaint(covariant CustomPainter old) => true;
}
