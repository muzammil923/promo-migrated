import 'dart:async';
import 'dart:math';
import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:promogames_engine/engine.dart';
import 'package:promogames_engine/engine.dart';

Widget buildBubbleShooterGame(GameConfig config, GameFinished onFinished) {
  return _BsGame(config: config, onFinished: onFinished);
}

class _BsGame extends StatefulWidget {
  final GameConfig config;
  final GameFinished onFinished;
  const _BsGame({required this.config, required this.onFinished});

  @override
  State<_BsGame> createState() => _BsGameState();
}

class _BsGameState extends State<_BsGame> {
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
  late int currentColor;
  late int nextColor;
  late int score;
  late int maxScore;
  int? projColor;
  double projX = 0;
  double projY = 0;
  double dirX = 0;
  double dirY = -1;
  bool firing = false;
  bool finished = false;
  double cell = 30;
  Timer? timer;
  final double speed = 7.0;

  @override
  void initState() {
    super.initState();
    _parseSettings();
    _reset();
  }

  void _reset() {
    grid = List.generate(rows, (_) => List.filled(cols, null));
    int seed = DateTime.now().millisecondsSinceEpoch;
    for (int r = 0; r < 5; r++) {
      for (int c = 0; c < cols; c++) {
        grid[r][c] = (seed + r * 31 + c * 17) % paletteSize;
      }
    }
    int count = 0;
    for (int r = 0; r < rows; r++) {
      for (int c = 0; c < cols; c++) {
        if (grid[r][c] != null) count++;
      }
    }
    maxScore = count;
    score = 0;
    finished = false;
    firing = false;
    projColor = null;
    currentColor = _rand();
    nextColor = _rand();
  }

  int _rand() => DateTime.now().millisecondsSinceEpoch % paletteSize;

  Color _colorFor(int c) {
    const colors = [
      Color(0xFF8b5cf6),
      Color(0xFF22c55e),
      Color(0xFFef4444),
      Color(0xFFf59e0b),
    ];
    return colors[c % paletteSize];
  }

  void _fire(double tapX, double tapY) {
    if (firing || finished || projColor != null) return;
    final startX = cell * cols / 2;
    final startY = cell * rows + cell;
    final dx = tapX - startX;
    final dy = tapY - startY;
    final len = sqrt(dx * dx + dy * dy);
    if (len < 1) return;
    dirX = dx / len;
    dirY = dy / len;
    projX = startX;
    projY = startY;
    projColor = currentColor;
    firing = true;
    timer?.cancel();
    timer = Timer.periodic(const Duration(milliseconds: 16), (_) => _step());
  }

  void _step() {
    if (!firing) return;
    projX += dirX * speed;
    projY += dirY * speed;
    if (projX < cell / 2) {
      projX = cell / 2;
      dirX = -dirX;
    }
    if (projX > cell * cols - cell / 2) {
      projX = cell * cols - cell / 2;
      dirX = -dirX;
    }
    bool hit = false;
    if (projY <= cell / 2) hit = true;
    if (!hit) {
      for (int r = 0; r < rows && !hit; r++) {
        for (int c = 0; c < cols; c++) {
          if (grid[r][c] != null) {
            final cx = c * cell + cell / 2;
            final cy = r * cell + cell / 2;
            final d2 = (cx - projX) * (cx - projX) + (cy - projY) * (cy - projY);
            if (d2 < (cell * 0.8) * (cell * 0.8)) {
              hit = true;
              break;
            }
          }
        }
      }
    }
    if (hit) {
      _place();
    } else {
      setState(() {});
    }
  }

  void _place() {
    firing = false;
    timer?.cancel();
    int? bestR;
    int? bestC;
    double bestD = double.infinity;
    for (int r = 0; r < rows; r++) {
      for (int c = 0; c < cols; c++) {
        if (grid[r][c] != null) continue;
        final cx = c * cell + cell / 2;
        final cy = r * cell + cell / 2;
        final d = (cx - projX) * (cx - projX) + (cy - projY) * (cy - projY);
        if (d < bestD) {
          bestD = d;
          bestR = r;
          bestC = c;
        }
      }
    }
    final col = projColor!;
    projColor = null;
    if (bestR != null && bestC != null) {
      grid[bestR][bestC] = col;
      _resolve(bestR, bestC, col);
    }
    currentColor = nextColor;
    nextColor = _rand();
    _checkDone();
    setState(() {});
  }

  void _resolve(int r, int c, int color) {
    final group = <List<int>>[];
    _flood(r, c, color, group);
    if (group.length >= 3) {
      for (final p in group) {
        grid[p[0]][p[1]] = null;
        score++;
      }
      _dropFloating();
    }
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

  void _dropFloating() {
    final connected = List.generate(rows, (_) => List.filled(cols, false));
    for (int c = 0; c < cols; c++) {
      if (grid[0][c] != null) _mark(0, c, connected);
    }
    for (int r = 0; r < rows; r++) {
      for (int c = 0; c < cols; c++) {
        if (grid[r][c] != null && !connected[r][c]) {
          grid[r][c] = null;
          score++;
        }
      }
    }
  }

  void _mark(int r, int c, List<List<bool>> connected) {
    if (r < 0 || r >= rows || c < 0 || c >= cols) return;
    if (grid[r][c] == null || connected[r][c]) return;
    connected[r][c] = true;
    _mark(r + 1, c, connected);
    _mark(r - 1, c, connected);
    _mark(r, c + 1, connected);
    _mark(r, c - 1, connected);
  }

  void _checkDone() {
    int remaining = 0;
    for (int r = 0; r < rows; r++) {
      for (int c = 0; c < cols; c++) {
        if (grid[r][c] != null) remaining++;
      }
    }
    if (remaining == 0 && !finished) {
      finished = true;
      Future.delayed(const Duration(milliseconds: 200), () {
        widget.onFinished(score, maxScore, true);
      });
    }
  }

  void _finish() {
    if (finished) return;
    finished = true;
    widget.onFinished(score, maxScore, false);
  }

  @override
  void dispose() {
    timer?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final title = widget.config.name ?? 'Bubble Shooter';
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
                  Text('Best: $maxScore',
                      style: const TextStyle(
                          color: Color(0xFF8b5cf6), fontSize: 16)),
                ],
              ),
            ),
            Expanded(
              child: LayoutBuilder(
                builder: (ctx, c) {
                  cell = (c.maxWidth / cols < c.maxHeight / (rows + 2))
                      ? c.maxWidth / cols
                      : c.maxHeight / (rows + 2);
                  return Center(
                    child: SizedBox(
                      width: cell * cols,
                      height: cell * (rows + 2),
                      child: GestureDetector(
                        onTapDown: (d) {
                          final box = ctx.findRenderObject() as RenderBox;
                          final local =
                              box.globalToLocal(d.globalPosition);
                          _fire(local.dx, local.dy);
                        },
                        child: CustomPaint(
                          painter: _BsPainter(grid, rows, cols, cell, projX, projY, projColor, _primaryColor),
                        ),
                      ),
                    ),
                  );
                },
              ),
            ),
            Padding(
              padding: const EdgeInsets.all(8),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  _swatch(currentColor),
                  const SizedBox(width: 12),
                  const Text('Next:',
                      style: TextStyle(color: Colors.white70)),
                  const SizedBox(width: 6),
                  _swatch(nextColor, small: true),
                ],
              ),
            ),
            const SizedBox(height: 8),
          ],
        ),
        ],
      ),
    );
  }

  Widget _swatch(int color, {bool small = false}) {
    return Container(
      width: small ? 18 : 26,
      height: small ? 18 : 26,
      decoration: BoxDecoration(
        color: _colorFor(color),
        shape: BoxShape.circle,
        border: Border.all(color: Colors.white24),
      ),
    );
  }
}

class _BsPainter extends CustomPainter {
  final Color primaryColor;
  final List<List<int?>> grid;
  final int rows;
  final int cols;
  final double cell;
  final double projX;
  final double projY;
  final int? projColor;
  final List<Color> colors = const [
    Color(0xFF8b5cf6),
    Color(0xFF22c55e),
    Color(0xFFef4444),
    Color(0xFFf59e0b),
  ];

  _BsPainter(this.grid, this.rows, this.cols, this.cell, this.projX,
      this.projY, this.projColor, this.primaryColor);

  @override
  void paint(Canvas canvas, Size size) {
    for (int r = 0; r < rows; r++) {
      for (int c = 0; c < cols; c++) {
        final v = grid[r][c];
        if (v != null) {
          canvas.drawCircle(
            Offset(c * cell + cell / 2, r * cell + cell / 2),
            cell / 2 - 1,
            Paint()..color = colors[v],
          );
        }
      }
    }
    if (projColor != null) {
      canvas.drawCircle(
        Offset(projX, projY),
        cell / 2 - 1,
        Paint()..color = colors[projColor!],
      );
    }
    canvas.drawCircle(
      Offset(cols * cell / 2, rows * cell + cell),
      cell / 2,
      Paint()..color = primaryColor,
    );
  }

  @override
  bool shouldRepaint(covariant CustomPainter old) => true;
}
