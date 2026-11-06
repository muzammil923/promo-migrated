import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import 'package:promogames_engine/engine.dart';
import 'logic.dart';

/// Native Flappy Bird player screen. Reads builder settings from [GameConfig],
/// drives the headless engine and translates its fx events into haptics.
Widget buildFlappyPlayer(GameConfig config, GameFinished onFinished) {
  return FlappyPlayerPage(config: config, onFinished: onFinished);
}

class FlappyPlayerPage extends StatefulWidget {
  final GameConfig config;
  final GameFinished onFinished;
  const FlappyPlayerPage({super.key, required this.config, required this.onFinished});

  @override
  State<FlappyPlayerPage> createState() => _FlappyPlayerPageState();
}

class _FlappyPlayerPageState extends State<FlappyPlayerPage> {
  late final FlappyEngine _engine;
  late Color _bgColor;
  late Color _primaryColor;
  String? _bgImageUrl;
  bool _reported = false;

  @override
  void initState() {
    super.initState();
    final s = widget.config.settings;
    _bgColor = _hex(s['bg_color']?.toString()) ?? const Color(0xFF87CEEB);
    _primaryColor = _hex(s['primary_color']?.toString()) ?? const Color(0xFFf59e0b);
    _bgImageUrl = s['bg_image_url']?.toString();

    _engine = FlappyEngine(settings: s);
    _engine.fx.listen(_onFx);
    _engine.addListener(_onEngineChanged);
    _engine.start();
  }

  void _onEngineChanged() {
    if (_engine.completed && !_reported) {
      _reported = true;
      Future.delayed(const Duration(milliseconds: 300), () {
        if (mounted) widget.onFinished(_engine.score, _engine.maxScore, true);
      });
    }
    if (mounted) setState(() {});
  }

  void _onFx(GameFx effect) {
    switch (effect) {
      case GameFx.correct:
        HapticFeedback.selectionClick();
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
          SafeArea(
            child: Column(
              children: [
                Padding(
                  padding: const EdgeInsets.all(8),
                  child: AnimatedBuilder(
                    animation: _engine,
                    builder: (_, __) => Text(
                      'Score: ${_engine.score}',
                      style: TextStyle(color: _primaryColor, fontSize: 18, fontWeight: FontWeight.bold),
                    ),
                  ),
                ),
                Expanded(
                  child: GestureDetector(
                    onTap: _engine.flap,
                    child: AnimatedBuilder(
                      animation: _engine,
                      builder: (_, __) => CustomPaint(
                        painter: _FlappyPainter(
                          birdY: _engine.birdY,
                          pipes: _engine.pipes,
                          birdColor: _primaryColor,
                          pipeColor: _primaryColor,
                          pipeWidth: _engine.pipeWidth.toDouble(),
                        ),
                      ),
                    ),
                  ),
                ),
                if (_engine.completed)
                  Padding(
                    padding: const EdgeInsets.all(8),
                    child: Text('GAME OVER', style: TextStyle(color: Colors.red, fontSize: 22, fontWeight: FontWeight.w800)),
                  )
                else if (!_engine.started)
                  const Padding(
                    padding: EdgeInsets.all(8),
                    child: Text('Tap to flap', style: TextStyle(color: Colors.white70)),
                  ),
                const SizedBox(height: 8),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _FlappyPainter extends CustomPainter {
  final double birdY;
  final List<Pipe> pipes;
  final Color birdColor;
  final Color pipeColor;
  final double pipeWidth;

  _FlappyPainter({
    required this.birdY,
    required this.pipes,
    required this.birdColor,
    required this.pipeColor,
    required this.pipeWidth,
  });

  @override
  void paint(Canvas canvas, Size size) {
    final birdPaint = Paint()..color = birdColor;
    canvas.drawCircle(
        Offset(FlappyEngine.birdX, birdY), FlappyEngine.birdRadius, birdPaint);

    final pipePaint = Paint()..color = pipeColor;
    for (final p in pipes) {
      canvas.drawRect(Rect.fromLTWH(p.x, 0, pipeWidth, p.gapTop), pipePaint);
      canvas.drawRect(
          Rect.fromLTWH(p.x, p.gapTop + p.gap, pipeWidth, size.height - p.gapTop - p.gap),
          pipePaint);
    }
  }

  @override
  bool shouldRepaint(covariant _FlappyPainter old) => true;
}
