import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import 'package:promogames_engine/engine.dart';
import 'logic.dart';

Widget buildArrowEscapePlayer(GameConfig config, GameFinished onFinished) {
  return ArrowEscapePlayerPage(config: config, onFinished: onFinished);
}

class ArrowEscapePlayerPage extends StatefulWidget {
  final GameConfig config;
  final GameFinished onFinished;
  const ArrowEscapePlayerPage({super.key, required this.config, required this.onFinished});

  @override
  State<ArrowEscapePlayerPage> createState() => _ArrowEscapePlayerPageState();
}

class _ArrowEscapePlayerPageState extends State<ArrowEscapePlayerPage> {
  late final ArrowEscapeEngine _engine;
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

    _engine = ArrowEscapeEngine(settings: s);
    _engine.fx.listen(_onFx);
    _engine.addListener(_onEngineChanged);
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
        HapticFeedback.selectionClick();
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
                  padding: const EdgeInsets.all(10),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text('Score: ${_engine.score}',
                          style: const TextStyle(color: Color(0xFF22c55e), fontSize: 18)),
                      if (_engine.dead)
                        const Text('CAUGHT!', style: TextStyle(color: Colors.red, fontSize: 18)),
                    ],
                  ),
                ),
                Expanded(
                  child: LayoutBuilder(builder: (ctx, c) {
                    final cell = (c.maxWidth < c.maxHeight
                        ? c.maxWidth / ArrowEscapeEngine.cols
                        : c.maxHeight / ArrowEscapeEngine.rows);
                    return Center(
                      child: SizedBox(
                        width: cell * ArrowEscapeEngine.cols,
                        height: cell * ArrowEscapeEngine.rows,
                        child: CustomPaint(
                          painter: _EscapePainter(
                            _engine.px, _engine.py, _engine.obstacles,
                            ArrowEscapeEngine.cols, ArrowEscapeEngine.rows, cell,
                          ),
                        ),
                      ),
                    );
                  }),
                ),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                  children: [
                    _btn(Icons.arrow_left, () => _engine.move(-1, 0)),
                    _btn(Icons.arrow_upward, () => _engine.move(0, -1)),
                    _btn(Icons.arrow_downward, () => _engine.move(0, 1)),
                    _btn(Icons.arrow_right, () => _engine.move(1, 0)),
                  ],
                ),
                const SizedBox(height: 12),
                if (_engine.dead)
                  ElevatedButton(
                    style: ElevatedButton.styleFrom(backgroundColor: _primaryColor),
                    onPressed: () { _reported = false; _engine.newGame(); },
                    child: const Text('RESTART', style: TextStyle(color: Colors.white)),
                  ),
                const SizedBox(height: 12),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _btn(IconData i, VoidCallback f) => IconButton(
        icon: Icon(i, color: _primaryColor),
        onPressed: f,
      );
}

class _EscapePainter extends CustomPainter {
  final int px, py;
  final List<List<int>> obstacles;
  final int cols, rows;
  final double cell;
  _EscapePainter(this.px, this.py, this.obstacles, this.cols, this.rows, this.cell);

  @override
  void paint(Canvas canvas, Size size) {
    canvas.drawRect(Rect.fromLTWH(0, 0, size.width, size.height),
        Paint()..color = const Color(0xFF080612));
    for (final o in obstacles) {
      canvas.drawRRect(
        RRect.fromRectAndRadius(
          Rect.fromLTWH(o[0] * cell, o[1] * cell, cell - 1, cell - 1),
          const Radius.circular(3),
        ),
        Paint()..color = Colors.red.shade700,
      );
    }
    canvas.drawRRect(
      RRect.fromRectAndRadius(
        Rect.fromLTWH(px * cell, py * cell, cell - 1, cell - 1),
        const Radius.circular(3),
      ),
      Paint()..color = const Color(0xFF22c55e),
    );
  }

  @override
  bool shouldRepaint(covariant CustomPainter old) => true;
}
