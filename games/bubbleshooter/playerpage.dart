import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import 'package:promogames_engine/engine.dart';
import 'logic.dart';

/// Native Bubble Shooter player screen. Reads builder settings from [GameConfig],
/// drives the headless engine and translates its fx events into haptics.
Widget buildBubbleShooterPlayer(GameConfig config, GameFinished onFinished) {
  return BubbleShooterPlayerPage(config: config, onFinished: onFinished);
}

class BubbleShooterPlayerPage extends StatefulWidget {
  final GameConfig config;
  final GameFinished onFinished;
  const BubbleShooterPlayerPage({super.key, required this.config, required this.onFinished});

  @override
  State<BubbleShooterPlayerPage> createState() => _BubbleShooterPlayerPageState();
}

class _BubbleShooterPlayerPageState extends State<BubbleShooterPlayerPage> {
  late final BubbleShooterEngine _engine;
  late Color _bgColor;
  late Color _primaryColor;
  String? _bgImageUrl;
  bool _reported = false;

  static const _colors = [
    Color(0xFFef4444), Color(0xFF22c55e), Color(0xFF3b82f6),
    Color(0xFFf59e0b), Color(0xFF8b5cf6), Color(0xFFec4899),
    Color(0xFF14b8a6), Color(0xFFf97316),
  ];

  @override
  void initState() {
    super.initState();
    final s = widget.config.settings;
    _bgColor = _hex(s['bg_color']?.toString()) ?? const Color(0xFF0f172a);
    _primaryColor = _hex(s['primary_color']?.toString()) ?? const Color(0xFF06b6d4);
    _bgImageUrl = s['bg_image_url']?.toString();

    _engine = BubbleShooterEngine(settings: s);
    _engine.fx.listen(_onFx);
    _engine.addListener(_onEngineChanged);
  }

  void _onEngineChanged() {
    if (_engine.completed && !_reported) {
      _reported = true;
      Future.delayed(const Duration(milliseconds: 400), () {
        if (mounted) widget.onFinished(_engine.score, _engine.maxScore, true);
      });
    }
    if (mounted) setState(() {});
  }

  void _onFx(GameFx effect) {
    switch (effect) {
      case GameFx.correct:
        HapticFeedback.mediumImpact();
      case GameFx.gameOver:
        HapticFeedback.heavyImpact();
      default:
        HapticFeedback.selectionClick();
    }
  }

  void _exit() {
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
    final cellSize = _engine.cellSize;
    final boardWidth = _engine.cols * cellSize;
    final boardHeight = _engine.rows * cellSize;

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
          SafeArea(
            child: AnimatedBuilder(
              animation: _engine,
              builder: (_, __) => Column(
                children: [
                  Padding(
                    padding: const EdgeInsets.all(8),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Text('Score: ${_engine.score}',
                            style: TextStyle(color: _primaryColor, fontSize: 18, fontWeight: FontWeight.bold)),
                      ],
                    ),
                  ),
                  if (_engine.completed)
                    const Expanded(
                      child: Center(
                        child: Text('GAME OVER', style: TextStyle(color: Colors.redAccent, fontSize: 28, fontWeight: FontWeight.w800)),
                      ),
                    )
                  else
                    Expanded(
                      child: Center(
                        child: GestureDetector(
                          onTapDown: (details) {
                            if (_engine.completed) return;
                            final dx = details.localPosition.dx;
                            final col = (dx / cellSize).floor().clamp(0, _engine.cols - 1);
                            _engine.shoot(col);
                          },
                          child: SizedBox(
                            width: boardWidth.toDouble(),
                            height: boardHeight.toDouble(),
                            child: CustomPaint(
                              painter: _BubblePainter(
                                grid: _engine.grid,
                                cols: _engine.cols,
                                rows: _engine.rows,
                                cellSize: cellSize.toDouble(),
                                colors: _colors,
                              ),
                            ),
                          ),
                        ),
                      ),
                    ),
                  if (!_engine.completed)
                    Padding(
                      padding: const EdgeInsets.all(12),
                      child: Container(
                        width: cellSize.toDouble(),
                        height: cellSize.toDouble(),
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          color: _colors[(_engine.projectileColor - 1) % _colors.length],
                        ),
                      ),
                    ),
                  const SizedBox(height: 8),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _BubblePainter extends CustomPainter {
  final List<List<int>> grid;
  final int cols, rows;
  final double cellSize;
  final List<Color> colors;

  _BubblePainter({
    required this.grid,
    required this.cols,
    required this.rows,
    required this.cellSize,
    required this.colors,
  });

  @override
  void paint(Canvas canvas, Size size) {
    final r = cellSize / 2 - 2;
    for (var row = 0; row < rows; row++) {
      for (var col = 0; col < cols; col++) {
        final c = grid[row][col];
        if (c <= 0) continue;
        final paint = Paint()..color = colors[(c - 1) % colors.length];
        final cx = col * cellSize + cellSize / 2;
        final cy = row * cellSize + cellSize / 2;
        canvas.drawCircle(Offset(cx, cy), r, paint);
      }
    }
  }

  @override
  bool shouldRepaint(covariant _BubblePainter old) => true;
}
