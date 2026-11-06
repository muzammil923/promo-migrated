import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import 'package:promogames_engine/engine.dart';
import 'logic.dart';

Widget buildStressBusterPlayer(GameConfig config, GameFinished onFinished) {
  return StressBusterPlayerPage(config: config, onFinished: onFinished);
}

class StressBusterPlayerPage extends StatefulWidget {
  final GameConfig config;
  final GameFinished onFinished;
  const StressBusterPlayerPage({super.key, required this.config, required this.onFinished});

  @override
  State<StressBusterPlayerPage> createState() => _StressBusterPlayerPageState();
}

class _StressBusterPlayerPageState extends State<StressBusterPlayerPage>
    with TickerProviderStateMixin {
  late final StressBusterEngine _engine;
  late Color _bgColor;
  late Color _primaryColor;
  String? _bgImageUrl;
  late AnimationController _breath;
  bool _reported = false;

  @override
  void initState() {
    super.initState();
    final s = widget.config.settings;
    _bgColor = _hex(s['bg_color']?.toString()) ?? const Color(0xFF0d0a1a);
    _primaryColor = _hex(s['primary_color']?.toString()) ?? const Color(0xFF8b5cf6);
    _bgImageUrl = s['bg_image_url']?.toString();

    _engine = StressBusterEngine(settings: s);
    _engine.fx.listen(_onFx);
    _engine.addListener(_onEngineChanged);

    _breath = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 8),
    )..repeat(reverse: true)
      ..addListener(() {
        _engine.updateBreath(_breath.value);
      });
  }

  void _onEngineChanged() {
    if (_engine.completed && !_reported) {
      _reported = true;
      Future.delayed(const Duration(milliseconds: 300), () {
        if (mounted) widget.onFinished(_engine.score, _engine.maxScore, false);
      });
    }
    if (mounted) setState(() {});
  }

  void _onFx(GameFx effect) {
    switch (effect) {
      case GameFx.tick:
        HapticFeedback.lightImpact();
      case GameFx.gameOver:
        HapticFeedback.vibrate();
      default:
        break;
    }
  }

  void _exit() {
    _engine.finishSession();
  }

  Color? _hex(String? hex) {
    if (hex == null || hex.isEmpty) return null;
    var h = hex.replaceFirst('#', '');
    if (h.length == 6) h = 'FF$h';
    try { return Color(int.parse(h, radix: 16)); } catch (_) { return null; }
  }

  @override
  void dispose() {
    _breath.dispose();
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
            animation: Listenable.merge([_engine, _breath]),
            builder: (_, __) => Column(
              mainAxisAlignment: MainAxisAlignment.spaceAround,
              children: [
                const Text('Follow the circle. Tap as you breathe.',
                    style: TextStyle(color: Colors.white70, fontSize: 16)),
                GestureDetector(
                  onTap: _engine.tapBreath,
                  child: Container(
                    width: 80 + _engine.breathValue * 180,
                    height: 80 + _engine.breathValue * 180,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      gradient: RadialGradient(
                        colors: [
                          const Color(0xFF22c55e).withValues(alpha: 0.8),
                          _primaryColor.withValues(alpha: 0.3),
                        ],
                      ),
                      border: Border.all(color: _primaryColor, width: 3),
                    ),
                    child: Center(
                      child: Text(
                        _engine.phase,
                        style: const TextStyle(color: Colors.white, fontSize: 18),
                      ),
                    ),
                  ),
                ),
                Column(
                  children: [
                    Text('Relief taps: ${_engine.relief}',
                        style: const TextStyle(color: Color(0xFF22c55e), fontSize: 20)),
                    Text('Breaths: ${_engine.breaths}',
                        style: TextStyle(color: _primaryColor, fontSize: 16)),
                    const SizedBox(height: 12),
                    ElevatedButton(
                      style: ElevatedButton.styleFrom(backgroundColor: _primaryColor),
                      onPressed: _exit,
                      child: const Text('Finish session'),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
