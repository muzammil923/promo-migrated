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

Widget buildSudokuGame(GameConfig config, GameFinished onFinished) {
  return _SudokuGame(config: config, onFinished: onFinished);
}

class _SudokuGame extends StatefulWidget {
  final GameConfig config;
  final GameFinished onFinished;
  const _SudokuGame({required this.config, required this.onFinished});

  @override
  State<_SudokuGame> createState() => _SudokuGameState();
}

class _SudokuGameState extends State<_SudokuGame> {
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

  static const int _n = 4;
  late List<List<int>> _solution;
  late List<List<int>> _puzzle;
  late List<List<TextEditingController>> _controllers;
  int _score = 0;

  @override
  void initState() {
    super.initState();
    _parseSettings();
    _buildSolution();
    _controllers = List.generate(_n, (_) => List.generate(_n, (_) => TextEditingController()));
    _loadPuzzle();
  }

  @override
  void dispose() {
    for (final row in _controllers) {
      for (final c in row) {
        c.dispose();
      }
    }
    super.dispose();
  }

  void _buildSolution() {
    _solution = [
      [1, 2, 3, 4],
      [3, 4, 1, 2],
      [2, 1, 4, 3],
      [4, 3, 2, 1],
    ];
  }

  void _loadPuzzle() {
    _puzzle = _solution.map((r) => [...r]).toList();
    final blanks = {
      [0, 1], [0, 3], [1, 0], [1, 2], [2, 1], [2, 3], [3, 0], [3, 2]
    };
    for (final p in blanks) {
      _puzzle[p[0]][p[1]] = 0;
    }
    for (var r = 0; r < _n; r++) {
      for (var c = 0; c < _n; c++) {
        if (_puzzle[r][c] != 0) {
          _controllers[r][c].text = _puzzle[r][c].toString();
        }
      }
    }
  }

  void _check() {
    int correct = 0;
    bool allFilled = true;
    for (var r = 0; r < _n; r++) {
      for (var c = 0; c < _n; c++) {
        final v = int.tryParse(_controllers[r][c].text.trim()) ?? 0;
        if (v == 0) allFilled = false;
        if (v == _solution[r][c]) correct++;
      }
    }
    _score = correct;
    if (allFilled && correct == _n * _n) {
      widget.onFinished(_n * _n, _n * _n, true);
    } else {
      setState(() {});
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        backgroundColor: _bgColor,
        title: Text(widget.config.name ?? 'Game'),
        leading: IconButton(
          icon: const Icon(Icons.close),
          onPressed: () {
            widget.onFinished(_score, _n * _n, false);
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

              padding: const EdgeInsets.all(16),

              child:  Column(
          children: [
            Text('Correct: $_score / ${_n * _n}',
                style: const TextStyle(color: _green, fontSize: 18, fontWeight: FontWeight.bold)),
            const SizedBox(height: 16),
            Center(
              child: Container(
                padding: const EdgeInsets.all(4),
                decoration: BoxDecoration(
                  border: Border.all(color: _purple, width: 3),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Column(
                  children: List.generate(_n, (r) {
                    return Row(
                      mainAxisSize: MainAxisSize.min,
                      children: List.generate(_n, (c) {
                        final given = _puzzle[r][c] != 0;
                        return Container(
                          width: 56,
                          height: 56,
                          decoration: BoxDecoration(
                            border: Border.all(color: Colors.white24),
                            color: given ? _purple.withOpacity(0.25) : Colors.white10,
                          ),
                          child: given
                              ? Center(
                                  child: Text(_puzzle[r][c].toString(),
                                      style: const TextStyle(fontSize: 26, color: Colors.white)))
                              : TextField(
                                  controller: _controllers[r][c],
                                  textAlign: TextAlign.center,
                                  keyboardType: TextInputType.number,
                                  maxLength: 1,
                                  style: const TextStyle(fontSize: 26, color: _green),
                                  decoration: const InputDecoration(
                                    counterText: '', border: InputBorder.none),
                                ),
                        );
                      }),
                    );
                  }),
                ),
              ),
            ),
            const SizedBox(height: 20),
            ElevatedButton(
              style: ElevatedButton.styleFrom(backgroundColor: _purple),
              onPressed: _check,
              child: const Text('Check'),
            ),
          ],
        ),
      ),
    ),
  ],
  ),
);
  }
}
