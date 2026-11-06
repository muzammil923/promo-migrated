import 'dart:async';
import 'dart:math';
import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:promogames_engine/engine.dart';
import 'package:promogames_engine/engine.dart';

Widget buildCarLaunchGame(GameConfig config, GameFinished onFinished) {
  return _ClGame(config: config, onFinished: onFinished);
}

class _ClGame extends StatefulWidget {
  final GameConfig config;
  final GameFinished onFinished;
  const _ClGame({required this.config, required this.onFinished});

  @override
  State<_ClGame> createState() => _ClGameState();
}

class _ClGameState extends State<_ClGame> {
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

  static const int tries = 3;
  int angle = 45;
  int power = 70;
  int used = 0;
  int best = 0;
  double carX = 0;
  double carY = 0;
  bool launching = false;
  Timer? timer;
  double groundY = 0;
  double scale = 1;

  @override
  void initState() {
    super.initState();
    _parseSettings();
  }

  void _launch() {
    if (launching || used >= tries) return;
    used++;
    launching = true;
    final rad = angle * 3.141592653589793 / 180;
    double vx = power * 0.2 * cos(rad);
    double vy = -power * 0.2 * sin(rad);
    carX = 0;
    carY = 0;
    double g = 0.35;
    timer?.cancel();
    timer = Timer.periodic(const Duration(milliseconds: 16), (_) {
      carX += vx;
      carY += vy;
      vy += g;
      if (carY >= 0) {
        carY = 0;
        _stop();
        return;
      }
      final dist = (carX / scale).round();
      if (dist > best) best = dist;
      setState(() {});
    });
  }

  void _stop() {
    launching = false;
    timer?.cancel();
    final dist = (carX / scale).round();
    if (dist > best) best = dist;
    setState(() {});
    if (used >= tries) {
      Future.delayed(const Duration(milliseconds: 400), () {
        widget.onFinished(best, 0, true);
      });
    }
  }

  void _finish() {
    if (launching) return;
    widget.onFinished(best, 0, false);
  }

  @override
  void dispose() {
    timer?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final title = widget.config.name ?? 'Car Launch';
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

           LayoutBuilder(
          builder: (ctx, c) {
            groundY = c.maxHeight - 80;
            scale = (c.maxWidth - 60) / 600;
            return Column(
              children: [
                Padding(
                  padding: const EdgeInsets.all(8),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text('Best: $best m',
                          style: const TextStyle(
                              color: Color(0xFF22c55e), fontSize: 18)),
                      Text('Tries left: ${tries - used}',
                          style: const TextStyle(
                              color: Color(0xFF8b5cf6), fontSize: 16)),
                    ],
                  ),
                ),
                SizedBox(
                  height: groundY,
                  child: Stack(
                    children: [
                      CustomPaint(
                        size: Size(c.maxWidth, groundY),
                        painter: _ClPainter(carX * scale + 30, groundY + carY * scale, angle, _primaryColor),
                      ),
                      Positioned(
                        left: 8,
                        bottom: 8,
                        child: Text(
                          'Distance: ${(carX / scale).round()} m',
                          style: const TextStyle(color: Colors.white70),
                        ),
                      ),
                    ],
                  ),
                ),
                Container(height: 4, color: const Color(0xFF22c55e)),
                Padding(
                  padding: const EdgeInsets.all(12),
                  child: Column(
                    children: [
                      _slider('Angle', angle.toDouble(), 10, 85, (v) {
                        if (!launching) {
                          angle = v.round();
                          setState(() {});
                        }
                      }),
                      _slider('Power', power.toDouble(), 20, 100, (v) {
                        if (!launching) {
                          power = v.round();
                          setState(() {});
                        }
                      }),
                      const SizedBox(height: 10),
                      ElevatedButton(
                        style: ElevatedButton.styleFrom(
                          backgroundColor: _primaryColor,
                        ),
                        onPressed: used >= tries ? null : _launch,
                        child: Text(used >= tries ? 'Out of tries' : 'LAUNCH'),
                      ),
                    ],
                  ),
                ),
              ],
            );
          },
        ),
      ],
    ),
  );
  }

  Widget _slider(String label, double value, double min, double max,
      ValueChanged<double> onChanged) {
    return Row(
      children: [
        SizedBox(width: 60, child: Text(label, style: const TextStyle(color: Colors.white70))),
        Expanded(
          child: Slider(
            value: value,
            min: min,
            max: max,
            activeColor: _primaryColor,
            onChanged: onChanged,
          ),
        ),
        SizedBox(width: 40, child: Text(value.round().toString(), style: const TextStyle(color: Colors.white))),
      ],
    );
  }
}

class _ClPainter extends CustomPainter {
  final Color primaryColor;
  final double x;
  final double y;
  final int angle;
  _ClPainter(this.x, this.y, this.angle, this.primaryColor);

  @override
  void paint(Canvas canvas, Size size) {
    final ramp = Paint()..color = primaryColor;
    final a = angle * 3.141592653589793 / 180;
    canvas.save();
    canvas.translate(30, y);
    canvas.rotate(-a);
    canvas.drawRect(Rect.fromLTWH(0, -4, 30, 8), ramp);
    canvas.restore();

    final body = Paint()..color = const Color(0xFF22c55e);
    canvas.drawRRect(
      RRect.fromRectAndRadius(
        Rect.fromLTWH(x, y - 14, 36, 14),
        const Radius.circular(4),
      ),
      body,
    );
    final wheel = Paint()..color = Colors.white;
    canvas.drawCircle(Offset(x + 9, y), 6, wheel);
    canvas.drawCircle(Offset(x + 27, y), 6, wheel);

    final trace = Paint()
      ..color = primaryColor.withOpacity(0.4)
      ..style = PaintingStyle.stroke;
    canvas.drawLine(Offset(30, y), Offset(x + 18, y), trace);
  }

  @override
  bool shouldRepaint(covariant CustomPainter old) => true;
}
