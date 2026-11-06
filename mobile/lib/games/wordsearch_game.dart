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

Widget buildWordSearchGame(GameConfig config, GameFinished onFinished) {
  return _WordSearchGame(config: config, onFinished: onFinished);
}

class _WordSearchGame extends StatefulWidget {
  final GameConfig config;
  final GameFinished onFinished;
  const _WordSearchGame({required this.config, required this.onFinished});

  @override
  State<_WordSearchGame> createState() => _WordSearchGameState();
}

class _WordSearchGameState extends State<_WordSearchGame> {
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

  static const int _grid = 8;
  final List<String> _words = ['GAME', 'CODE', 'PLAY', 'DART', 'FLUT'];
  late List<List<String>> _board;
  final Set<String> _found = {};
  int? _start;

  @override
  void initState() {
    super.initState();
    _parseSettings();
    _buildBoard();
  }

  void _buildBoard() {
    const fill = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    _board = List.generate(_grid, (_) => List.generate(_grid, (_) => fill[(0)]));
    // deterministic pseudo-random fill
    int s = 7;
    int rnd() {
      s = (s * 1103515245 + 12345) & 0x7fffffff;
      return (s >> 8) % 26;
    }

    void place(String w, int r, int c, int dr, int dc) {
      for (var i = 0; i < w.length; i++) {
        _board[r + dr * i][c + dc * i] = w[i];
      }
    }

    place('GAME', 0, 0, 0, 1);
    place('CODE', 2, 0, 0, 1);
    place('PLAY', 4, 0, 0, 1);
    place('DART', 0, 2, 1, 0);
    place('FLUT', 0, 5, 1, 0);

    for (var r = 0; r < _grid; r++) {
      for (var c = 0; c < _grid; c++) {
        if (_board[r][c] == fill[0]) {
          _board[r][c] = fill[rnd()];
        }
      }
    }
  }

  int _idx(int r, int c) => r * _grid + c;

  void _tap(int r, int c) {
    final i = _idx(r, c);
    if (_start == null) {
      setState(() => _start = i);
      return;
    }
    if (_start == i) {
      setState(() => _start = null);
      return;
    }
    final sr = _start! ~/ _grid;
    final sc = _start! % _grid;
    final dr = r - sr;
    final dc = c - sc;
    final len = _words.length;
    if (dr != 0 && dc != 0 && dr.abs() != dc.abs()) {
      setState(() => _start = i);
      return;
    }
    final steps = dr == 0 && dc == 0 ? 0 : (dr.abs() > dc.abs() ? dr.abs() : dc.abs());
    final sdr = steps == 0 ? 0 : dr ~/ steps;
    final sdc = steps == 0 ? 0 : dc ~/ steps;
    String picked = '';
    for (var k = 0; k <= steps; k++) {
      picked += _board[sr + sdr * k][sc + sdc * k];
    }
    final rev = picked.split('').reversed.join();
    for (final w in _words) {
      if ((picked == w || rev == w) && !_found.contains(w)) {
        _found.add(w);
        break;
      }
    }
    setState(() => _start = null);
    if (_found.length == len) {
      widget.onFinished(len, len, true);
    }
  }

  @override
  Widget build(BuildContext context) {
    final cell = MediaQuery.of(context).size.width / (_grid + 2);
    return Scaffold(
      appBar: AppBar(
        backgroundColor: _bgColor,
        title: Text(widget.config.name ?? 'Game'),
        leading: IconButton(
          icon: const Icon(Icons.close),
          onPressed: () {
            widget.onFinished(_found.length, _words.length, false);
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
            Text('Found: ${_found.length} / ${_words.length}',
                style: const TextStyle(color: _green, fontSize: 18, fontWeight: FontWeight.bold)),
            const SizedBox(height: 8),
            Wrap(
              spacing: 8,
              children: _words
                  .map((w) => Text(w,
                      style: TextStyle(
                          color: _found.contains(w) ? _green : Colors.white54, fontSize: 14)))
                  .toList(),
            ),
            const SizedBox(height: 12),
            Expanded(
              child: Center(
                child: SizedBox(
                  width: cell * _grid,
                  height: cell * _grid,
                  child: GridView.builder(
                    gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
                      crossAxisCount: _grid,
                      crossAxisSpacing: 1,
                      mainAxisSpacing: 1,
                    ),
                    itemCount: _grid * _grid,
                    physics: const NeverScrollableScrollPhysics(),
                    itemBuilder: (context, i) {
                      final r = i ~/ _grid;
                      final c = i % _grid;
                      final sel = _start == i;
                      return GestureDetector(
                        onTap: () => _tap(r, c),
                        child: Container(
                          decoration: BoxDecoration(
                            color: sel ? _purple : Colors.white10,
                            border: Border.all(color: Colors.white24),
                          ),
                          child: Center(
                            child: Text(_board[r][c],
                                style: const TextStyle(fontSize: 18, color: Colors.white)),
                          ),
                        ),
                      );
                    },
                  ),
                ),
              ),
            ),
            const Text('Tap a start cell then an end cell on a straight line.',
                style: TextStyle(color: Colors.white54, fontSize: 12)),
          ],
        ),
      ),
    ),
  ],
  ),
);
  }
}
