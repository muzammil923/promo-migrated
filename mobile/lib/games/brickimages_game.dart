import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:promogames_engine/engine.dart';
import 'package:promogames_engine/engine.dart';

Widget buildBrickImagesGame(GameConfig config, GameFinished onFinished) {
  return _BiGame(config: config, onFinished: onFinished);
}

class _BiGame extends StatefulWidget {
  final GameConfig config;
  final GameFinished onFinished;
  const _BiGame({required this.config, required this.onFinished});

  @override
  State<_BiGame> createState() => _BiGameState();
}

class _BiGameState extends State<_BiGame> {
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

  static const int rows = 10;
  static const int cols = 8;
  static const int paletteSize = 4;
  late List<List<int?>> grid;
  late int score;
  late int maxScore;
  bool finished = false;
  double cell = 30;

  @override
  void initState() {
    super.initState();
    _parseSettings();
    _reset();
  }

  void _reset() {
    grid = List.generate(rows, (r) => List.generate(
        cols, (c) => (r * 31 + c * 17 + DateTime.now().millisecondsSinceEpoch) %
            paletteSize));
    int count = 0;
    for (int r = 0; r < rows; r++) {
      for (int c = 0; c < cols; c++) {
        if (grid[r][c] != null) count++;
      }
    }
    maxScore = count;
    score = 0;
    finished = false;
  }

  void _tap(int r, int c) {
    if (finished) return;
    final color = grid[r][c];
    if (color == null) return;
    final group = <List<int>>[];
    _flood(r, c, color, group);
    if (group.length < 2) return;
    for (final p in group) {
      grid[p[0]][p[1]] = null;
    }
    score += group.length;
    _applyGravity();
    _checkDone();
    setState(() {});
  }

  void _flood(int r, int c, int color, List<List<int>> out) {
    if (r < 0 || r >= rows || c < 0 || c >= cols) return;
    if (grid[r][c] != color) return;
    out.add([r, c]);
    _flood(r + 1, c, color, out);
    _flood(r - 1, c, color, out);
    _flood(r, c + 1, color, out);
    _flood(r, c - 1, color, out);
  }

  void _applyGravity() {
    for (int c = 0; c < cols; c++) {
      final stack = <int?>[];
      for (int r = rows - 1; r >= 0; r--) {
        if (grid[r][c] != null) stack.add(grid[r][c]);
      }
      for (int r = rows - 1; r >= 0; r--) {
        grid[r][c] = stack.isEmpty ? null : stack.removeAt(0);
      }
    }
  }

  bool _hasMoves() {
    for (int r = 0; r < rows; r++) {
      for (int c = 0; c < cols; c++) {
        if (grid[r][c] == null) continue;
        if (c + 1 < cols && grid[r][c + 1] == grid[r][c]) return true;
        if (r + 1 < rows && grid[r + 1][c] == grid[r][c]) return true;
      }
    }
    return false;
  }

  bool _isEmpty() {
    for (int r = 0; r < rows; r++) {
      for (int c = 0; c < cols; c++) {
        if (grid[r][c] != null) return false;
      }
    }
    return true;
  }

  void _checkDone() {
    if (_isEmpty()) {
      finished = true;
      Future.delayed(const Duration(milliseconds: 200), () {
        widget.onFinished(score, maxScore, true);
      });
    } else if (!_hasMoves()) {
      finished = true;
      Future.delayed(const Duration(milliseconds: 200), () {
        widget.onFinished(score, maxScore, true);
      });
    }
  }

  void _finish() {
    if (finished) return;
    widget.onFinished(score, maxScore, false);
  }

  @override
  Widget build(BuildContext context) {
    final title = widget.config.name ?? 'Brick Images';
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
              padding: const EdgeInsets.all(8),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text('Score: $score',
                      style: const TextStyle(
                          color: Color(0xFF22c55e), fontSize: 18)),
                  Text('Cleared: $maxScore',
                      style: const TextStyle(
                          color: Color(0xFF8b5cf6), fontSize: 16)),
                ],
              ),
            ),
            Expanded(
              child: LayoutBuilder(
                builder: (ctx, c) {
                  cell = (c.maxWidth / cols < c.maxHeight / rows)
                      ? c.maxWidth / cols
                      : c.maxHeight / rows;
                  return Center(
                    child: SizedBox(
                      width: cell * cols,
                      height: cell * rows,
                      child: GestureDetector(
                        onTapDown: (d) {
                          final box = ctx.findRenderObject() as RenderBox;
                          final local = box.globalToLocal(d.globalPosition);
                          final r = (local.dy / cell).floor();
                          final col = (local.dx / cell).floor();
                          if (r >= 0 && r < rows && col >= 0 && col < cols) {
                            _tap(r, col);
                          }
                        },
                        child: CustomPaint(
                          painter: _BiPainter(grid, rows, cols, cell),
                        ),
                      ),
                    ),
                  );
                },
              ),
            ),
            const SizedBox(height: 8),
          ],
        ),
        ],
      ),
    );
  }
}

class _BiPainter extends CustomPainter {
  final List<List<int?>> grid;
  final int rows;
  final int cols;
  final double cell;
  final List<Color> colors = const [
    Color(0xFF8b5cf6),
    Color(0xFF22c55e),
    Color(0xFFef4444),
    Color(0xFFf59e0b),
  ];
  _BiPainter(this.grid, this.rows, this.cols, this.cell);

  @override
  void paint(Canvas canvas, Size size) {
    for (int r = 0; r < rows; r++) {
      for (int c = 0; c < cols; c++) {
        final v = grid[r][c];
        if (v != null) {
          final paint = Paint()..color = colors[v];
          canvas.drawRRect(
            RRect.fromRectAndRadius(
              Rect.fromLTWH(c * cell + 1, r * cell + 1, cell - 2, cell - 2),
              const Radius.circular(4),
            ),
            paint,
          );
          canvas.drawRRect(
            RRect.fromRectAndRadius(
              Rect.fromLTWH(c * cell + 1, r * cell + 1, cell - 2, (cell - 2) / 2),
              const Radius.circular(4),
            ),
            Paint()..color = colors[v].withOpacity(0.5),
          );
        }
      }
    }
  }

  @override
  bool shouldRepaint(covariant CustomPainter old) => true;
}
