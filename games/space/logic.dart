import 'dart:async';
import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:promogames_engine/engine.dart';

Widget buildSpaceGame(GameConfig config, GameFinished onFinished) {
  return _SpaceGame(config: config, onFinished: onFinished);
}

class _SpaceGame extends StatefulWidget {
  final GameConfig config;
  final GameFinished onFinished;
  const _SpaceGame({required this.config, required this.onFinished});

  @override
  State<_SpaceGame> createState() => _SpaceGameState();
}

class _SpaceGameState extends State<_SpaceGame> {
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
  static const double h = 560;
  late double shipX;
  late List<Offset> bullets;
  late List<Enemy> enemies;
  late List<double> enemyY;
  int score = 0;
  bool over = false;
  late Timer timer;

  @override
  void initState() {
    super.initState();
    _parseSettings();
    _reset();
    timer = Timer.periodic(const Duration(milliseconds: 30), (_) => _tick());
  }

  void _reset() {
    shipX = w / 2;
    bullets = [];
    enemies = [];
    enemyY = [];
    for (int r = 0; r < 3; r++) {
      for (int c = 0; c < 6; c++) {
        enemies.add(Enemy(Rect.fromLTWH(30 + c * 52.0, 40 + r * 40.0, 34, 26)));
        enemyY.add(40 + r * 40.0);
      }
    }
    over = false;
  }

  void _tick() {
    if (over) return;
    setState(() {
      for (int i = 0; i < enemies.length; i++) {
        enemyY[i] += 0.25;
        enemies[i] =
            Enemy(Rect.fromLTWH(enemies[i].rect.left, enemyY[i], 34, 26));
        if (enemies[i].rect.bottom >= h - 40) {
          _gameOver();
          return;
        }
      }
      for (int i = bullets.length - 1; i >= 0; i--) {
        bullets[i] = Offset(bullets[i].dx, bullets[i].dy - 7);
        if (bullets[i].dy < -10) {
          bullets.removeAt(i);
          continue;
        }
        for (int j = enemies.length - 1; j >= 0; j--) {
          if (enemies[j].rect.contains(bullets[i])) {
            enemies.removeAt(j);
            bullets.removeAt(i);
            score++;
            break;
          }
        }
      }
    });
  }

  void _gameOver() {
    over = true;
    Future.delayed(const Duration(milliseconds: 200),
        () => widget.onFinished(score, score, true));
  }

  void _shoot() {
    if (over) return;
    setState(() => bullets.add(Offset(shipX, h - 50)));
  }

  void _move(double dx) {
    setState(() => shipX = (dx).clamp(15, w - 15));
  }

  @override
  void dispose() {
    timer.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final title = widget.config.name ?? 'Space Invaders';
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
                  style: const TextStyle(
                      color: Color(0xFF22c55e), fontSize: 18)),
            ),
            Center(
              child: GestureDetector(
                onHorizontalDragUpdate: (d) => _move(d.localPosition.dx),
                onTap: _shoot,
                child: SizedBox(
                  width: w,
                  height: h,
                  child: CustomPaint(
                    painter: _SpacePainter(shipX, bullets, enemies, h, _primaryColor),
                  ),
                ),
              ),
            ),
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
                  onPressed: () => _move(shipX - 20),
                ),
                IconButton(
                  icon: const Icon(Icons.arrow_upward, color: Color(0xFF22c55e)),
                  onPressed: _shoot,
                ),
                IconButton(
                  icon: const Icon(Icons.arrow_forward, color: Color(0xFF8b5cf6)),
                  onPressed: () => _move(shipX + 20),
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

class Enemy {
  final Rect rect;
  Enemy(this.rect);
}

class _SpacePainter extends CustomPainter {
  final Color primaryColor;
  final double shipX;
  final List<Offset> bullets;
  final List<Enemy> enemies;
  final double h;
  _SpacePainter(this.shipX, this.bullets, this.enemies, this.h, this.primaryColor);

  @override
  void paint(Canvas canvas, Size size) {
    final sp = Paint()..color = const Color(0xFF22c55e);
    canvas.drawRect(Rect.fromLTWH(shipX - 12, h - 50, 24, 18), sp);
    final bp = Paint()..color = Colors.yellow;
    for (final b in bullets) {
      canvas.drawRect(Rect.fromLTWH(b.dx - 2, b.dy, 4, 10), bp);
    }
    final ep = Paint()..color = primaryColor;
    for (final e in enemies) {
      canvas.drawRect(e.rect, ep);
    }
  }

  @override
  bool shouldRepaint(covariant CustomPainter old) => true;
}
