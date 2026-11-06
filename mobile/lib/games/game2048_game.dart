import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:promogames_engine/engine.dart';
import 'package:promogames_engine/engine.dart';

Widget build2048Game(GameConfig config, GameFinished onFinished) {
  return _Game2048(config: config, onFinished: onFinished);
}

class _Game2048 extends StatefulWidget {
  final GameConfig config;
  final GameFinished onFinished;
  const _Game2048({required this.config, required this.onFinished});

  @override
  State<_Game2048> createState() => _Game2048State();
}

class _Game2048State extends State<_Game2048> {
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

  late List<List<int>> board;
  int score = 0;
  bool over = false;

  @override
  void initState() {
    super.initState();
    _parseSettings();
    _newGame();
  }

  void _newGame() {
    board = List.generate(4, (_) => List.filled(4, 0));
    score = 0;
    over = false;
    _addRandom();
    _addRandom();
  }

  void _addRandom() {
    final empty = <Point>[];
    for (int r = 0; r < 4; r++) {
      for (int c = 0; c < 4; c++) {
        if (board[r][c] == 0) empty.add(Point(r, c));
      }
    }
    if (empty.isEmpty) return;
    final p = empty[DateTime.now().microsecond % empty.length];
    board[p.x][p.y] = (DateTime.now().millisecond % 3 == 0) ? 4 : 2;
  }

  bool _canMove() {
    for (int r = 0; r < 4; r++) {
      for (int c = 0; c < 4; c++) {
        if (board[r][c] == 0) return true;
        if (c < 3 && board[r][c] == board[r][c + 1]) return true;
        if (r < 3 && board[r][c] == board[r + 1][c]) return true;
      }
    }
    return false;
  }

  void _move(String dir) {
    if (over) return;
    final before = _snapshot();
    bool moved = false;
    if (dir == 'left' || dir == 'right') {
      for (int r = 0; r < 4; r++) {
        final row = List<int>.generate(4, (c) => board[r][c]);
        final res = _merge(dir == 'left' ? row : row.reversed.toList());
        final merged = dir == 'left' ? res : res.reversed.toList();
        for (int c = 0; c < 4; c++) {
          if (board[r][c] != merged[c]) moved = true;
          board[r][c] = merged[c];
        }
      }
    } else {
      for (int c = 0; c < 4; c++) {
        final col = List<int>.generate(4, (r) => board[r][c]);
        final res = _merge(dir == 'up' ? col : col.reversed.toList());
        final merged = dir == 'up' ? res : res.reversed.toList();
        for (int r = 0; r < 4; r++) {
          if (board[r][c] != merged[r]) moved = true;
          board[r][c] = merged[r];
        }
      }
    }
    if (moved) {
      _addRandom();
      setState(() {});
      if (!_canMove()) {
        over = true;
        Future.delayed(const Duration(milliseconds: 200),
            () => widget.onFinished(score, score, true));
      }
    } else {
      if (!_snapshotEqual(before)) setState(() {});
    }
  }

  List<int> _merge(List<int> line) {
    final nonZero = line.where((e) => e != 0).toList();
    final out = <int>[];
    for (int i = 0; i < nonZero.length; i++) {
      if (i + 1 < nonZero.length && nonZero[i] == nonZero[i + 1]) {
        out.add(nonZero[i] * 2);
        score += nonZero[i] * 2;
        i++;
      } else {
        out.add(nonZero[i]);
      }
    }
    while (out.length < 4) {
      out.add(0);
    }
    return out;
  }

  List<List<int>> _snapshot() =>
      board.map((r) => List<int>.from(r)).toList();
  bool _snapshotEqual(List<List<int>> s) {
    for (int r = 0; r < 4; r++) {
      for (int c = 0; c < 4; c++) {
        if (s[r][c] != board[r][c]) return false;
      }
    }
    return true;
  }

  Color _color(int v) {
    switch (v) {
      case 2: return _primaryColor;
      case 4: return const Color(0xFF22c55e);
      case 8: return const Color(0xFFf59e0b);
      case 16: return const Color(0xFFef4444);
      case 32: return const Color(0xFF06b6d4);
      case 64: return const Color(0xFFec4899);
      default: return v == 0 ? const Color(0xFF1a0e2e) : const Color(0xFFa855f7);
    }
  }

  @override
  Widget build(BuildContext context) {
    final title = widget.config.name ?? '2048';
    return Scaffold(
      appBar: AppBar(
        title: Text(title),
        backgroundColor: _bgColor,
        actions: [
          IconButton(
            icon: const Icon(Icons.close),
            onPressed: () => widget.onFinished(score, score, false),
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
              padding: const EdgeInsets.all(8),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text('Score: $score',
                      style: const TextStyle(
                          color: Color(0xFF22c55e), fontSize: 18)),
                  ElevatedButton(
                    onPressed: () => setState(_newGame),
                    style: ElevatedButton.styleFrom(
                        backgroundColor: _primaryColor),
                    child: const Text('Restart'),
                  ),
                ],
              ),
            ),
            Expanded(
              child: GestureDetector(
                onVerticalDragEnd: (d) {
                  if (d.primaryVelocity! < 0) {
                    _move('up');
                  } else if (d.primaryVelocity! > 0) _move('down');
                },
                onHorizontalDragEnd: (d) {
                  if (d.primaryVelocity! < 0) {
                    _move('left');
                  } else if (d.primaryVelocity! > 0) _move('right');
                },
                child: Padding(
                  padding: const EdgeInsets.all(12),
                  child: GridView.count(
                    crossAxisCount: 4,
                    crossAxisSpacing: 6,
                    mainAxisSpacing: 6,
                    children: [
                      for (int r = 0; r < 4; r++)
                        for (int c = 0; c < 4; c++)
                          Container(
                            decoration: BoxDecoration(
                              color: _color(board[r][c]),
                              borderRadius: BorderRadius.circular(8),
                            ),
                            alignment: Alignment.center,
                            child: Text(
                              board[r][c] == 0 ? '' : '${board[r][c]}',
                              style: const TextStyle(
                                  fontSize: 22,
                                  fontWeight: FontWeight.bold,
                                  color: Colors.white),
                            ),
                          ),
                    ],
                  ),
                ),
              ),
            ),
            if (over)
              const Padding(
                padding: EdgeInsets.all(8),
                child: Text('NO MOVES LEFT',
                    style: TextStyle(color: Colors.red, fontSize: 22)),
              ),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceEvenly,
              children: [
                _btn(Icons.arrow_upward, () => _move('up')),
                Row(children: [
                  _btn(Icons.arrow_back, () => _move('left')),
                  _btn(Icons.arrow_forward, () => _move('right')),
                ]),
                _btn(Icons.arrow_downward, () => _move('down')),
              ],
            ),
            const SizedBox(height: 8),
          ],
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

class Point {
  final int x, y;
  Point(this.x, this.y);
}
