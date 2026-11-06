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

Widget buildCrosswordGame(GameConfig config, GameFinished onFinished) {
  return _CrosswordGame(config: config, onFinished: onFinished);
}

class _CrosswordGame extends StatefulWidget {
  final GameConfig config;
  final GameFinished onFinished;
  const _CrosswordGame({required this.config, required this.onFinished});

  @override
  State<_CrosswordGame> createState() => _CrosswordGameState();
}

class _CrosswordGameState extends State<_CrosswordGame> {
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

  static const int _grid = 5;
  // null = black block, otherwise the correct letter (uppercase).
  static const List<List<String?>> _solution = [
    ['C', 'A', 'T', null, null],
    ['O', null, null, null, null],
    ['W', 'E', 'B', null, null],
    [null, null, null, null, null],
    [null, null, null, null, null],
  ];
  final List<TextEditingController> _controllers = [];
  int _score = 0;

  final List<Map<String, String>> _clues = const [
    {'n': '1 Across', 'c': 'A small pet that meows (3)'},
    {'n': '2 Down', 'c': 'Animal that gives milk (3)'},
    {'n': '3 Across', 'c': 'Part of the internet (3)'},
  ];

  @override
  void initState() {
    super.initState();
    _parseSettings();
    for (var r = 0; r < _grid; r++) {
      for (var c = 0; c < _grid; c++) {
        _controllers.add(TextEditingController());
      }
    }
  }

  @override
  void dispose() {
    for (final c in _controllers) {
      c.dispose();
    }
    super.dispose();
  }

  void _check() {
    int correct = 0;
    int total = 0;
    for (var r = 0; r < _grid; r++) {
      for (var c = 0; c < _grid; c++) {
        final sol = _solution[r][c];
        if (sol == null) continue;
        total++;
        final v = _controllers[r * _grid + c].text.trim().toUpperCase();
        if (v == sol) correct++;
      }
    }
    _score = correct;
    if (correct == total) {
      widget.onFinished(total, total, true);
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
            widget.onFinished(_score, 7, false);
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
            Text('Correct: $_score / 7',
                style: const TextStyle(color: _green, fontSize: 18, fontWeight: FontWeight.bold)),
            const SizedBox(height: 12),
            Center(
              child: Container(
                padding: const EdgeInsets.all(4),
                decoration: BoxDecoration(
                  border: Border.all(color: _purple, width: 3),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Column(
                  children: List.generate(_grid, (r) {
                    return Row(
                      mainAxisSize: MainAxisSize.min,
                      children: List.generate(_grid, (c) {
                        final sol = _solution[r][c];
                        if (sol == null) {
                          return Container(
                            width: 40,
                            height: 40,
                            color: Colors.white,
                            margin: const EdgeInsets.all(1),
                          );
                        }
                        return Container(
                          width: 40,
                          height: 40,
                          margin: const EdgeInsets.all(1),
                          decoration: BoxDecoration(
                            border: Border.all(color: Colors.white24),
                            color: Colors.white10,
                          ),
                          child: TextField(
                            controller: _controllers[r * _grid + c],
                            textAlign: TextAlign.center,
                            textCapitalization: TextCapitalization.characters,
                            maxLength: 1,
                            style: const TextStyle(fontSize: 22, color: _green),
                            decoration: const InputDecoration(counterText: '', border: InputBorder.none),
                          ),
                        );
                      }),
                    );
                  }),
                ),
              ),
            ),
            const SizedBox(height: 16),
            Expanded(
              child: ListView(
                children: _clues
                    .map((cl) => Padding(
                          padding: const EdgeInsets.symmetric(vertical: 4),
                          child: Text('${cl['n']}: ${cl['c']}',
                              style: const TextStyle(color: Colors.white, fontSize: 16)),
                        ))
                    .toList(),
              ),
            ),
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
