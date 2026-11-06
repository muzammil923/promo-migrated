import 'dart:async';
import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:promogames_engine/engine.dart';

Widget buildCatchGame(GameConfig config, GameFinished onFinished) {
  return _CatchGame(config: config, onFinished: onFinished);
}

class _CatchGame extends StatefulWidget {
  final GameConfig config;
  final GameFinished onFinished;
  const _CatchGame({required this.config, required this.onFinished});

  @override
  State<_CatchGame> createState() => _CatchGameState();
}

class _CatchGameState extends State<_CatchGame> {
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
  static const double basketW = 64;
  static const double basketH = 16;
  late double basketX;
  late List<Item> items;
  int score = 0;
  int lives = 3;
  bool over = false;
  late Timer timer;
  double spawnAcc = 0;

  @override
  void initState() {
    super.initState();
    _parseSettings();
    basketX = w / 2 - basketW / 2;
    items = [];
    timer = Timer.periodic(const Duration(milliseconds: 16), (_) => _tick());
  }

  void _tick() {
    if (over) return;
    setState(() {
      spawnAcc += 0.016;
      if (spawnAcc > 0.7) {
        spawnAcc = 0;
        final good = (DateTime.now().microsecond % 3 != 0);
        items.add(Item(
          Offset(20 + DateTime.now().millisecond % (w - 40), -20.0),
          2.5 + (DateTime.now().microsecond % 20) / 10,
          good,
        ));
      }
      final basketRect = Rect.fromLTWH(basketX, h - 50, basketW, basketH);
      for (int i = items.length - 1; i >= 0; i--) {
        items[i].pos = Offset(items[i].pos.dx, items[i].pos.dy + items[i].speed);
        final r = Rect.fromLTWH(items[i].pos.dx - 10, items[i].pos.dy - 10, 20, 20);
        if (r.bottom >= basketRect.top && r.left < basketRect.right &&
            r.right > basketRect.left && items[i].pos.dy < basketRect.bottom) {
          if (items[i].good) {
            score++;
          } else {
            lives--;
          }
          items.removeAt(i);
          _check();
          continue;
        }
        if (items[i].pos.dy > h) {
          if (items[i].good) lives--;
          items.removeAt(i);
          _check();
        }
      }
    });
  }

  void _check() {
    if (lives <= 0) {
      over = true;
      Future.delayed(const Duration(milliseconds: 200),
          () => widget.onFinished(score, score, true));
    }
  }

  void _move(double dx) {
    setState(() => basketX = (dx - basketW / 2).clamp(0, w - basketW));
  }

  @override
  void dispose() {
    timer.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final title = widget.config.name ?? 'Catch';
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
                  Text('Lives: $lives',
                      style: const TextStyle(color: Colors.white70)),
                ],
              ),
            ),
            Center(
              child: GestureDetector(
                onHorizontalDragUpdate: (d) => _move(d.localPosition.dx),
                child: SizedBox(
                  width: w,
                  height: h,
                  child: CustomPaint(
                    painter: _CatchPainter(basketX, basketW, basketH, items, h, _primaryColor),
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
                  onPressed: () => _move(basketX - 25 + basketW / 2),
                ),
                IconButton(
                  icon: const Icon(Icons.arrow_forward, color: Color(0xFF8b5cf6)),
                  onPressed: () => _move(basketX + 25 + basketW / 2),
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

class Item {
  Offset pos;
  final double speed;
  final bool good;
  Item(this.pos, this.speed, this.good);
}

class _CatchPainter extends CustomPainter {
  final Color primaryColor;
  final double basketX, basketW, basketH;
  final List<Item> items;
  final double h;
  _CatchPainter(this.basketX, this.basketW, this.basketH, this.items, this.h, this.primaryColor);

  @override
  void paint(Canvas canvas, Size size) {
    for (final it in items) {
      final p = Paint()..color = it.good ? const Color(0xFF22c55e) : Colors.red;
      canvas.drawCircle(it.pos, 10, p);
    }
    final bp = Paint()..color = primaryColor;
    canvas.drawRect(Rect.fromLTWH(basketX, h - 50, basketW, basketH), bp);
  }

  @override
  bool shouldRepaint(covariant CustomPainter old) => true;
}
