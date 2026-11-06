import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:promogames_engine/engine.dart';
import 'package:promogames_engine/engine.dart';

const _bg = LinearGradient(
  begin: Alignment.topLeft,
  end: Alignment.bottomRight,
  colors: [Color(0xFF0d0a1a), Color(0xFF1a0e2e), Color(0xFF0f0b1e), Color(0xFF080612)],
);
const _purple = Color(0xFF8b5cf6);
const _green = Color(0xFF22c55e);

Widget buildMazeGame(GameConfig config, GameFinished onFinished) {
  return _MazeGame(config: config, onFinished: onFinished);
}

class _MazeGame extends StatefulWidget {
  final GameConfig config;
  final GameFinished onFinished;
  const _MazeGame({required this.config, required this.onFinished});

  @override
  State<_MazeGame> createState() => _MazeGameState();
}

class _MazeGameState extends State<_MazeGame> {
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

  static const int _size = 10;
  late List<List<int>> _maze;
  late int _px;
  late int _py;
  int _steps = 0;

  @override
  void initState() {
    super.initState();
    _parseSettings();
    _generate();
  }

  void _generate() {
    final rng = Random();
    _maze = List.generate(_size, (_) => List.filled(_size, 1));
    _px = 0;
    _py = 0;
    _steps = 0;
    int x = 0, y = 0;
    _maze[0][0] = 0;
    while (!(x == _size - 1 && y == _size - 1)) {
      if (rng.nextBool() && x < _size - 1) {
        x++;
      } else if (y < _size - 1) {
        y++;
      } else if (x > 0) {
        x--;
      }
      _maze[y][x] = 0;
    }
    _maze[_size - 1][_size - 1] = 0;
    _maze[0][0] = 0;
  }

  void _move(int dx, int dy) {
    final nx = _px + dx;
    final ny = _py + dy;
    if (nx < 0 || ny < 0 || nx >= _size || ny >= _size) return;
    if (_maze[ny][nx] == 1) return;
    setState(() {
      _px = nx;
      _py = ny;
      _steps++;
    });
    if (_px == _size - 1 && _py == _size - 1) {
      widget.onFinished(1, 1, true);
    }
  }

  @override
  Widget build(BuildContext context) {
    final cell = MediaQuery.of(context).size.width / (_size + 2);
    return Scaffold(
      appBar: AppBar(
        backgroundColor: _bgColor,
        title: Text(widget.config.name ?? 'Game'),
        leading: IconButton(
          icon: const Icon(Icons.close),
          onPressed: () {
            widget.onFinished(0, 1, false);
            Navigator.of(context).maybePop();
          },
        ),
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

          SafeArea(

            child: Padding(

              padding: const EdgeInsets.all(12),

              child:  Column(
          children: [
            Text('Steps: $_steps',
                style: const TextStyle(color: _green, fontSize: 18, fontWeight: FontWeight.bold)),
            const SizedBox(height: 8),
            Expanded(
              child: Center(
                child: SizedBox(
                  width: cell * _size,
                  height: cell * _size,
                  child: GridView.builder(
                    gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
                      crossAxisCount: _size,
                      crossAxisSpacing: 1,
                      mainAxisSpacing: 1,
                    ),
                    itemCount: _size * _size,
                    physics: const NeverScrollableScrollPhysics(),
                    itemBuilder: (context, i) {
                      final x = i % _size;
                      final y = i ~/ _size;
                      Color color;
                      if (x == _px && y == _py) {
                        color = _green;
                      } else if (x == _size - 1 && y == _size - 1) {
                        color = _purple;
                      } else if (_maze[y][x] == 0) {
                        color = Colors.white10;
                      } else {
                        color = const Color(0xFF1a0e2e);
                      }
                      return Container(color: color);
                    },
                  ),
                ),
              ),
            ),
            const SizedBox(height: 8),
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                ElevatedButton(onPressed: () => _move(0, -1), child: const Icon(Icons.arrow_upward)),
              ],
            ),
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                ElevatedButton(onPressed: () => _move(-1, 0), child: const Icon(Icons.arrow_back)),
                const SizedBox(width: 8),
                ElevatedButton(onPressed: () => _move(1, 0), child: const Icon(Icons.arrow_forward)),
              ],
            ),
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                ElevatedButton(onPressed: () => _move(0, 1), child: const Icon(Icons.arrow_downward)),
              ],
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

class Random {
  Random([int seed = 12345]) : _s = seed;
  int _s;
  int nextInt(int n) {
    _s = (_s * 1103515245 + 12345) & 0x7fffffff;
    return (_s >> 8) % n;
  }

  bool nextBool() => nextInt(2) == 0;
  void shuffle<T>(List<T> list) {
    for (var i = list.length - 1; i > 0; i--) {
      final j = nextInt(i + 1);
      final t = list[i];
      list[i] = list[j];
      list[j] = t;
    }
  }
}
