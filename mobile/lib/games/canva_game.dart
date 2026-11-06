import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:promogames_engine/engine.dart';
import 'package:promogames_engine/engine.dart';

Widget buildCanvaGame(GameConfig config, GameFinished onFinished) {
  return _CvGame(config: config, onFinished: onFinished);
}

class _CvGame extends StatefulWidget {
  final GameConfig config;
  final GameFinished onFinished;
  const _CvGame({required this.config, required this.onFinished});

  @override
  State<_CvGame> createState() => _CvGameState();
}

class _CvGameState extends State<_CvGame> {
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

  List<_CvStroke> strokes = [];
  _CvStroke? current;
  late Color currentColor;
  int strokeCount = 0;

  @override
  void initState() {
    super.initState();
    _parseSettings();
    currentColor = _primaryColor;
  }
  bool finished = false;

  final palette = const [
    Color(0xFF8b5cf6),
    Color(0xFF22c55e),
    Color(0xFFef4444),
    Color(0xFFf59e0b),
    Color(0xFFffffff),
  ];

  void _onDown(Offset p) {
    current = _CvStroke(color: currentColor, points: [p]);
    strokes.add(current!);
    setState(() {});
  }

  void _onMove(Offset p) {
    if (current == null) return;
    current!.points.add(p);
    setState(() {});
  }

  void _onUp() {
    if (current != null) {
      if (current!.points.length > 1) strokeCount++;
      current = null;
      setState(() {});
    }
  }

  void _clear() {
    strokes.clear();
    strokeCount = 0;
    setState(() {});
  }

  void _finish() {
    if (finished) return;
    finished = true;
    widget.onFinished(strokeCount, 0, true);
  }

  @override
  Widget build(BuildContext context) {
    final title = widget.config.name ?? 'Canva';
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
          children: [
            Padding(
              padding: const EdgeInsets.symmetric(vertical: 8),
              child: Text('Strokes: $strokeCount',
                  style: const TextStyle(
                      color: Color(0xFF22c55e), fontSize: 18)),
            ),
            Expanded(
              child: LayoutBuilder(
                builder: (ctx, c) {
                  return GestureDetector(
                    onPanStart: (d) {
                      final box = ctx.findRenderObject() as RenderBox;
                      _onDown(box.globalToLocal(d.globalPosition));
                    },
                    onPanUpdate: (d) {
                      final box = ctx.findRenderObject() as RenderBox;
                      _onMove(box.globalToLocal(d.globalPosition));
                    },
                    onPanEnd: (_) => _onUp(),
                    child: Container(
                      width: c.maxWidth,
                      height: c.maxHeight,
                      margin: const EdgeInsets.all(8),
                      decoration: BoxDecoration(
                        color: const Color(0xFF0f0b1e),
                        border: Border.all(color: _primaryColor),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: CustomPaint(painter: _CvPainter(strokes)),
                    ),
                  );
                },
              ),
            ),
            Padding(
              padding: const EdgeInsets.all(8),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                children: [
                  ...palette.map((col) => GestureDetector(
                        onTap: () => setState(() => currentColor = col),
                        child: Container(
                          width: 28,
                          height: 28,
                          decoration: BoxDecoration(
                            color: col,
                            shape: BoxShape.circle,
                            border: Border.all(
                              color: currentColor == col
                                  ? Colors.white
                                  : Colors.transparent,
                              width: 3,
                            ),
                          ),
                        ),
                      )),
                  IconButton(
                    icon: const Icon(Icons.delete, color: Color(0xFFef4444)),
                    onPressed: _clear,
                  ),
                  ElevatedButton(
                    style: ElevatedButton.styleFrom(
                      backgroundColor: _primaryColor,
                    ),
                    onPressed: _finish,
                    child: const Text('Done'),
                  ),
                ],
              ),
            ),
          ],
        ),
        ],
      ),
    );
  }
}

class _CvStroke {
  final Color color;
  final List<Offset> points;
  _CvStroke({required this.color, required this.points});
}

class _CvPainter extends CustomPainter {
  final List<_CvStroke> strokes;
  _CvPainter(this.strokes);

  @override
  void paint(Canvas canvas, Size size) {
    for (final s in strokes) {
      if (s.points.length < 2) {
        if (s.points.isNotEmpty) {
          canvas.drawCircle(s.points.first, 2, Paint()..color = s.color);
        }
        continue;
      }
      final paint = Paint()
        ..color = s.color
        ..strokeWidth = 4
        ..strokeCap = StrokeCap.round
        ..strokeJoin = StrokeJoin.round;
      final path = Path()..moveTo(s.points.first.dx, s.points.first.dy);
      for (int i = 1; i < s.points.length; i++) {
        path.lineTo(s.points[i].dx, s.points[i].dy);
      }
      canvas.drawPath(path, paint);
    }
  }

  @override
  bool shouldRepaint(covariant CustomPainter old) => true;
}
