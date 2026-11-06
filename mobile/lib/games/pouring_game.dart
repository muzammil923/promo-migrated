import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:promogames_engine/engine.dart';
import 'package:promogames_engine/engine.dart';

Widget buildPouringGame(GameConfig config, GameFinished onFinished) {
  return _PouringGame(config: config, onFinished: onFinished);
}

class _PouringGame extends StatefulWidget {
  final GameConfig config;
  final GameFinished onFinished;
  const _PouringGame({required this.config, required this.onFinished});

  @override
  State<_PouringGame> createState() => _PouringGameState();
}

class _PouringGameState extends State<_PouringGame> {
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

  static const int capacity = 4;
  static const List<Color> palette = [
    Color(0xFF8b5cf6),
    Color(0xFF22c55e),
    Color(0xFFef4444),
    Color(0xFFf59e0b),
    Color(0xFF3b82f6),
    Color(0xFFec4899),
  ];

  late List<List<int>> tubes;
  int? selected;
  int moves = 0;
  bool solved = false;

  int _seed = DateTime.now().microsecondsSinceEpoch;
  int _next() {
    _seed = (_seed * 1103515245 + 12345) & 0x7fffffff;
    return _seed;
  }

  @override
  void initState() {
    super.initState();
    _parseSettings();
    _newGame();
  }

  void _newGame() {
    final numColors = 4;
    final colors = <int>[];
    for (int c = 0; c < numColors; c++) {
      for (int k = 0; k < capacity; k++) {
        colors.add(c);
      }
    }
    for (int i = colors.length - 1; i > 0; i--) {
      final j = _next() % (i + 1);
      final tmp = colors[i];
      colors[i] = colors[j];
      colors[j] = tmp;
    }
    tubes = [];
    int idx = 0;
    for (int t = 0; t < numColors; t++) {
      tubes.add(colors.sublist(idx, idx + capacity));
      idx += capacity;
    }
    tubes.add([]);
    tubes.add([]);
    moves = 0;
    selected = null;
    solved = false;
  }

  bool _isSolved() {
    for (final tube in tubes) {
      if (tube.isEmpty) continue;
      final first = tube.first;
      if (tube.length != capacity || tube.any((e) => e != first)) return false;
    }
    return true;
  }

  void _tap(int i) {
    if (solved) return;
    setState(() {
      if (selected == null) {
        if (tubes[i].isNotEmpty) selected = i;
      } else if (selected == i) {
        selected = null;
      } else {
        _pour(selected!, i);
        selected = null;
      }
    });
  }

  void _pour(int from, int to) {
    final src = tubes[from];
    final dst = tubes[to];
    if (src.isEmpty || dst.length >= capacity) return;
    final color = src.last;
    int space = capacity - dst.length;
    while (src.isNotEmpty && src.last == color && space > 0) {
      dst.add(src.removeLast());
      space--;
    }
    moves++;
    if (_isSolved()) {
      solved = true;
      Future.delayed(const Duration(milliseconds: 400), () {
        widget.onFinished(1, 1, true);
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final title = widget.config.name ?? 'Pouring';
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
              child: Center(
                child: SingleChildScrollView(
                  scrollDirection: Axis.horizontal,
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      for (int i = 0; i < tubes.length; i++) _tube(i),
                    ],
                  ),
                ),
              ),
            ),
            Padding(
              padding: const EdgeInsets.all(12),
              child: ElevatedButton(
                onPressed: () => setState(_newGame),
                style: ElevatedButton.styleFrom(
                  backgroundColor: _primaryColor,
                ),
                child: const Text('Shuffle'),
              ),
            ),
          ],
        ),
        ],
      ),
    );
  }

  Widget _tube(int i) {
    final tube = tubes[i];
    const double w = 46;
    const double seg = 34;
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 6),
      child: GestureDetector(
        onTap: () => _tap(i),
        child: Container(
          width: w,
          height: seg * capacity + 8,
          decoration: BoxDecoration(
            border: Border.all(
              color: selected == i
                  ? const Color(0xFF22c55e)
                  : _primaryColor,
              width: selected == i ? 3 : 2,
            ),
            borderRadius: BorderRadius.circular(10),
            color: const Color(0xFF080612),
          ),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.end,
            children: [
              for (int s = 0; s < tube.length; s++)
                Container(
                  width: w - 8,
                  height: seg - 2,
                  margin: const EdgeInsets.symmetric(horizontal: 2, vertical: 1),
                  decoration: BoxDecoration(
                    color: palette[tube[s] % palette.length],
                    borderRadius: BorderRadius.circular(4),
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }
}
