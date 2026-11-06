import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import 'package:promogames_engine/engine.dart';
import 'logic.dart';

Widget buildBouncePlayer(GameConfig config, GameFinished onFinished) {
  return BouncePlayerPage(config: config, onFinished: onFinished);
}

class BouncePlayerPage extends StatefulWidget {
  final GameConfig config;
  final GameFinished onFinished;
  const BouncePlayerPage({super.key, required this.config, required this.onFinished});

  @override
  State<BouncePlayerPage> createState() => _BouncePlayerPageState();
}

class _BouncePlayerPageState extends State<BouncePlayerPage> {
  late final BounceEngine _engine;
  late Color _bgColor;
  late Color _primaryColor;
  String? _bgImageUrl;
  bool _reported = false;

  @override
  void initState() {
    super.initState();
    final s = widget.config.settings;
    _bgColor = _hex(s['bg_color']?.toString()) ?? const Color(0xFF0d0a1a);
    _primaryColor = _hex(s['primary_color']?.toString()) ?? const Color(0xFF8b5cf6);
    _bgImageUrl = s['bg_image_url']?.toString();

    _engine = BounceEngine(settings: s);
    _engine.fx.listen(_onFx);
    _engine.addListener(_onEngineChanged);
  }

  void _onEngineChanged() {
    if (_engine.completed && !_reported) {
      _reported = true;
      Future.delayed(const Duration(milliseconds: 600), () {
        if (mounted) widget.onFinished(_engine.score, _engine.maxScore, true);
      });
    }
    if (mounted) setState(() {});
  }

  void _onFx(GameFx effect) {
    switch (effect) {
      case GameFx.correct:
        HapticFeedback.lightImpact();
      case GameFx.gameOver:
        HapticFeedback.vibrate();
      default:
        break;
    }
  }

  void _exit() {
    _engine.exitEarly();
    widget.onFinished(_engine.score, _engine.maxScore, false);
  }

  Color? _hex(String? hex) {
    if (hex == null || hex.isEmpty) return null;
    var h = hex.replaceFirst('#', '');
    if (h.length == 6) h = 'FF$h';
    try { return Color(int.parse(h, radix: 16)); } catch (_) { return null; }
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
              imageUrl: _bgImageUrl!, fit: BoxFit.cover,
              placeholder: (_, __) => ColoredBox(color: _bgColor),
              errorWidget: (_, __, ___) => ColoredBox(color: _bgColor),
            )
          else
            ColoredBox(color: _bgColor),
          Container(color: Colors.black.withValues(alpha: 0.3)),
          AnimatedBuilder(
            animation: _engine,
            builder: (_, __) => Column(
              children: [
                Padding(
                  padding: const EdgeInsets.all(12),
                  child: Text('Bounces: ${_engine.score}',
                      style: const TextStyle(color: Color(0xFF22c55e), fontSize: 18)),
                ),
                Expanded(
                  child: GestureDetector(
                    onTap: _engine.tap,
                    child: LayoutBuilder(
                      builder: (ctx, c) {
                        final w = c.maxWidth;
                        final h = c.maxHeight;
                        final r = w * 0.04;
                        return Stack(
                          children: [
                            Positioned(
                              left: _engine.ballX * w - r,
                              top: _engine.ballY * h - r,
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
                              top: BounceEngine.floor * h,
                              child: Container(
                                width: w,
                                height: 4,
                                color: const Color(0xFF22c55e),
                              ),
                            ),
                            Center(
                              child: Text(
                                _engine.isOver ? 'GAME OVER' : 'Tap to keep it up!',
                                style: TextStyle(
                                  color: _engine.isOver ? Colors.red : Colors.white38,
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
          ),
        ],
      ),
    );
  }
}
