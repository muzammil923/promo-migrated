import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:promogames_engine/engine.dart';
import 'package:promogames_engine/engine.dart';

Widget buildHanoiGame(GameConfig config, GameFinished onFinished) {
  return _HanoiGame(config: config, onFinished: onFinished);
}

class _HanoiGame extends StatefulWidget {
  final GameConfig config;
  final GameFinished onFinished;
  const _HanoiGame({required this.config, required this.onFinished});

  @override
  State<_HanoiGame> createState() => _HanoiGameState();
}

class _HanoiGameState extends State<_HanoiGame> {
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

  late int n;
  late List<List<int>> pegs; // top disk is last
  int? selected;
  int moves = 0;
  bool solved = false;

  @override
  void initState() {
    super.initState();
    _parseSettings();
    _newGame();
  }

  void _newGame() {
    n = (widget.config.settings['disks'] as int?) ?? 3;
    if (n < 1) n = 3;
    if (n > 6) n = 6;
    pegs = [
      List.generate(n, (i) => n - i), // largest at bottom (index 0)
      [],
      [],
    ];
    moves = 0;
    selected = null;
    solved = false;
  }

  bool _isSolved() {
    return pegs.any((p) => p.length == n);
  }

  void _tap(int peg) {
    if (solved) return;
    setState(() {
      if (selected == null) {
        if (pegs[peg].isNotEmpty) selected = peg;
      } else if (selected == peg) {
        selected = null;
      } else {
        final src = pegs[selected!];
        final dst = pegs[peg];
        final disk = src.last;
        if (dst.isEmpty || dst.last > disk) {
          dst.add(src.removeLast());
          moves++;
          if (_isSolved()) {
            solved = true;
            Future.delayed(const Duration(milliseconds: 400), () {
              widget.onFinished(1, 1, true);
            });
          }
        }
        selected = null;
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final title = widget.config.name ?? 'Tower of Hanoi';
    return Scaffold(
      appBar: AppBar(
        title: Text(title),
        backgroundColor: _bgColor,
        actions: [
          IconButton(
            icon: const Icon(Icons.close),
            onPressed: () => widget.onFinished(moves, moves, false),
          )
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
              padding: const EdgeInsets.all(12),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text('Moves: $moves',
                      style: const TextStyle(color: Color(0xFF22c55e), fontSize: 18)),
                  if (solved)
                    const Text('SOLVED!',
                        style: TextStyle(color: Color(0xFF8b5cf6), fontSize: 18)),
                ],
              ),
            ),
            Expanded(
              child: LayoutBuilder(
                builder: (ctx, c) {
                  return CustomPaint(
                    painter: _HanoiPainter(pegs, n, selected, _primaryColor),
                    size: Size(c.maxWidth, c.maxHeight),
                  );
                },
              ),
            ),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceEvenly,
              children: [
                for (int i = 0; i < 3; i++)
                  ElevatedButton(
                    onPressed: () => _tap(i),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: selected == i
                          ? const Color(0xFF22c55e)
                          : _primaryColor,
                    ),
                    child: Text('Peg ${i + 1}'),
                  ),
              ],
            ),
            const SizedBox(height: 12),
          ],
        ),
        ],
      ),
    );
  }
}

class _HanoiPainter extends CustomPainter {
  final Color primaryColor;
  final List<List<int>> pegs;
  final int n;
  final int? selected;
  _HanoiPainter(this.pegs, this.n, this.selected, this.primaryColor);

  @override
  void paint(Canvas canvas, Size size) {
    final pegW = size.width / 3;
    final baseY = size.height - 30;
    final maxDiskH = (baseY - 20) / n;
    final colors = [
      primaryColor,
      const Color(0xFF22c55e),
      const Color(0xFFef4444),
      const Color(0xFFf59e0b),
      const Color(0xFF3b82f6),
      const Color(0xFFec4899),
    ];
    final postPaint = Paint()..color = const Color(0xFF22c55e);
    for (int p = 0; p < 3; p++) {
      final cx = pegW * (p + 0.5);
      canvas.drawRect(
        Rect.fromLTWH(cx - 4, 20, 8, baseY - 20),
        postPaint,
      );
      canvas.drawRect(
        Rect.fromLTWH(pegW * p + 10, baseY, pegW - 20, 12),
        Paint()..color = primaryColor,
      );
      final stack = pegs[p];
      for (int i = 0; i < stack.length; i++) {
        final disk = stack[i];
        final w = (pegW - 30) * (disk / n) + 14;
        final x = cx - w / 2;
        final y = baseY - (i + 1) * maxDiskH;
        canvas.drawRRect(
          RRect.fromRectAndRadius(
            Rect.fromLTWH(x, y, w, maxDiskH - 2),
            const Radius.circular(4),
          ),
          Paint()..color = colors[(disk - 1) % colors.length],
        );
      }
    }
  }

  @override
  bool shouldRepaint(covariant CustomPainter old) => true;
}
