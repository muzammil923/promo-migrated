import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:promogames_engine/engine.dart';
import 'package:promogames_engine/engine.dart';

Widget buildStressBusterGame(GameConfig config, GameFinished onFinished) {
  return _SbGame(config: config, onFinished: onFinished);
}

class _SbGame extends StatefulWidget {
  final GameConfig config;
  final GameFinished onFinished;
  const _SbGame({required this.config, required this.onFinished});

  @override
  State<_SbGame> createState() => _SbGameState();
}

class _SbGameState extends State<_SbGame> with TickerProviderStateMixin {
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

  late AnimationController _breath;
  int relief = 0;
  int breaths = 0;
  bool finished = false;

  @override
  void initState() {
    super.initState();
    _parseSettings();
    _breath = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 8),
    )..repeat(reverse: true);
  }

  String _phase() {
    final v = _breath.value;
    if (v < 0.45) return 'Breathe in...';
    if (v < 0.55) return 'Hold';
    return 'Breathe out...';
  }

  void _tapBreath() {
    if (finished) return;
    relief++;
    if (relief % 4 == 0) breaths++;
    setState(() {});
  }

  void _finish() {
    if (finished) return;
    finished = true;
    widget.onFinished(relief, 0, false);
  }

  @override
  void dispose() {
    _breath.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final title = widget.config.name ?? 'Stress Buster';
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
          mainAxisAlignment: MainAxisAlignment.spaceAround,
          children: [
            const Text('Follow the circle. Tap as you breathe.',
                style: TextStyle(color: Colors.white70, fontSize: 16)),
            AnimatedBuilder(
              animation: _breath,
              builder: (ctx, _) {
                final size = 80 + _breath.value * 180;
                return GestureDetector(
                  onTap: _tapBreath,
                  child: Container(
                    width: size,
                    height: size,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      gradient: RadialGradient(
                        colors: [
                          const Color(0xFF22c55e).withOpacity(0.8),
                          _primaryColor.withOpacity(0.3),
                        ],
                      ),
                      border: Border.all(
                        color: _primaryColor, width: 3),
                    ),
                    child: Center(
                      child: Text(
                        _phase(),
                        style: const TextStyle(
                            color: Colors.white, fontSize: 18),
                      ),
                    ),
                  ),
                );
              },
            ),
            Column(
              children: [
                Text('Relief taps: $relief',
                    style: const TextStyle(
                        color: Color(0xFF22c55e), fontSize: 20)),
                Text('Breaths: $breaths',
                    style: const TextStyle(
                        color: Color(0xFF8b5cf6), fontSize: 16)),
                const SizedBox(height: 12),
                ElevatedButton(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: _primaryColor,
                  ),
                  onPressed: _finish,
                  child: const Text('Finish session'),
                ),
              ],
            ),
          ],
        ),
        ],
      ),
    );
  }
}
