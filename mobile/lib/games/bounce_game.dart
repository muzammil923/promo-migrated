import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:promogames_engine/engine.dart';
import 'package:promogames_engine/engine.dart';

Widget buildBounceGame(GameConfig config, GameFinished onFinished) {
  return _BounceGame(config: config, onFinished: onFinished);
}

class _BounceGame extends StatefulWidget {
  final GameConfig config;
  final GameFinished onFinished;
  const _BounceGame({required this.config, required this.onFinished});

  @override
  State<_BounceGame> createState() => _BounceGameState();
}

class _BounceGameState extends State<_BounceGame>
    with SingleTickerProviderStateMixin {
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

  late double ballY; // 0 top .. 1 bottom
  late double ballX;
  late double vy;
  late double vx;
  late AnimationController _controller;
  int bounces = 0;
  bool over = false;
  static const double gravity = 0.0016;
  static const double impulse = -0.026;
  static const double floor = 0.92;

  @override
  void initState() {
    super.initState();
    _parseSettings();
    _reset();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(days: 1),
    )
      ..addListener(_tick)
      ..repeat();
  }

  void _reset() {
    ballY = 0.2;
    ballX = 0.5;
    vy = 0;
    vx = 0.004;
    over = false;
  }

  void _tick() {
    if (over) return;
    setState(() {
      vy += gravity;
      ballY += vy;
      ballX += vx;
      if (ballX < 0.05 || ballX > 0.95) vx = -vx;
      if (ballY < 0.05) {
        ballY = 0.05;
        vy = -vy;
        bounces++;
      }
      if (ballY > floor) {
        over = true;
        _controller.stop();
        Future.delayed(const Duration(milliseconds: 600), () {
          widget.onFinished(bounces, bounces, true);
        });
      }
    });
  }

  void _tap() {
    if (over) return;
    setState(() {
      vy = impulse;
      bounces++;
    });
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final title = widget.config.name ?? 'Bounce';
    return Scaffold(
      appBar: AppBar(
        title: Text(title),
        backgroundColor: _bgColor,
        actions: [
          IconButton(
            icon: const Icon(Icons.close),
            onPressed: () => widget.onFinished(bounces, bounces, false),
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
              padding: const EdgeInsets.all(12),
              child: Text('Bounces: $bounces',
                  style: const TextStyle(color: Color(0xFF22c55e), fontSize: 18)),
            ),
            Expanded(
              child: GestureDetector(
                onTap: _tap,
                child: LayoutBuilder(
                  builder: (ctx, c) {
                    final w = c.maxWidth;
                    final h = c.maxHeight;
                    final r = w * 0.04;
                    return Stack(
                      children: [
                        Positioned(
                          left: ballX * w - r,
                          top: ballY * h - r,
                          child: Container(
                            width: r * 2,
                            height: r * 2,
                            decoration: const BoxDecoration(
                              color: Color(0xFF8b5cf6),
                              shape: BoxShape.circle,
                            ),
                          ),
                        ),
                        Positioned(
                          left: 0,
                          top: floor * h,
                          child: Container(
                            width: w,
                            height: 4,
                            color: const Color(0xFF22c55e),
                          ),
                        ),
                        Center(
                          child: Text(
                            over ? 'GAME OVER' : 'Tap to keep it up!',
                            style: TextStyle(
                              color: over ? Colors.red : Colors.white38,
                              fontSize: 20,
                            ),
                          ),
                        ),
                      ],
                    );
                  },
                ),
              ),
            ),
          ],
        ),
        ],
      ),
    );
  }
}
