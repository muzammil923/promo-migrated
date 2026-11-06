import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import 'package:promogames_engine/engine.dart';
import 'logic.dart';

/// Native word-search player screen — tappable grid with straight-line
/// selection, live word bank and optional hint button, themed from settings.
Widget buildWordSearchPlayer(GameConfig config, GameFinished onFinished) {
  return WordSearchPlayerPage(config: config, onFinished: onFinished);
}

class WordSearchPlayerPage extends StatefulWidget {
  final GameConfig config;
  final GameFinished onFinished;
  const WordSearchPlayerPage({super.key, required this.config, required this.onFinished});

  @override
  State<WordSearchPlayerPage> createState() => _WordSearchPlayerPageState();
}

class _WordSearchPlayerPageState extends State<WordSearchPlayerPage> {
  late final WordSearchEngine _engine;
  late Color _bgColor;
  late Color _primaryColor;
  String? _bgImageUrl;
  int? _startCell;
  final Set<String> _foundWords = {};
  bool _reported = false;

  @override
  void initState() {
    super.initState();
    final s = widget.config.settings;
    _bgColor = _hex(s['bg_color']?.toString()) ?? const Color(0xFF0d0a1a);
    _primaryColor = _hex(s['primary_color']?.toString()) ?? const Color(0xFF6366f1);
    _bgImageUrl = s['bg_image_url']?.toString();
    _engine = WordSearchEngine(settings: s, wordRows: widget.config.words);
    _engine.fx.listen(_onFx);
    _engine.addListener(_onEngineChanged);
  }

  void _onEngineChanged() {
    if (_engine.completed && !_reported) {
      _reported = true;
      Future.delayed(const Duration(milliseconds: 600), () {
        if (mounted) widget.onFinished(_engine.score, _engine.maxScore, true);
      });
    }
    if (mounted) setState(() {});
  }

  void _onFx(GameFx effect) {
    switch (effect) {
      case GameFx.match:
        HapticFeedback.mediumImpact();
      case GameFx.mismatch:
        HapticFeedback.vibrate();
      case GameFx.win:
        HapticFeedback.heavyImpact();
      default:
        break;
    }
  }

  void _tap(int r, int c) {
    if (_startCell == null) {
      setState(() => _startCell = r * _engine.size + c);
      return;
    }
    final sr = _startCell! ~/ _engine.size;
    final sc = _startCell! % _engine.size;
    _startCell = null;
    final w = _engine.select(sr, sc, r, c);
    if (w != null) {
      setState(() => _foundWords.add(w));
    } else {
      setState(() {});
    }
  }

  @override
  void dispose() {
    _engine.removeListener(_onEngineChanged);
    _engine.dispose();
    super.dispose();
  }

  Color? _hex(String? hex) {
    if (hex == null || hex.isEmpty) return null;
    var h = hex.replaceFirst('#', '');
    if (h.length == 6) h = 'FF$h';
    try {
      return Color(int.parse(h, radix: 16));
    } catch (_) {
      return null;
    }
  }

  @override
  Widget build(BuildContext context) {
    final cellSize =
        (MediaQuery.of(context).size.width - 32) / _engine.size;
    return Scaffold(
      backgroundColor: _bgColor,
      appBar: AppBar(
        backgroundColor: _bgColor,
        title: Text(widget.config.name),
        leading: IconButton(
          icon: const Icon(Icons.close),
          onPressed: () {
            widget.onFinished(_engine.score, _engine.maxScore, false);
          },
        ),
      ),
      body: Stack(
        fit: StackFit.expand,
        children: [
          if (_bgImageUrl != null)
            Image.network(
              _bgImageUrl!,
              fit: BoxFit.cover,
              errorBuilder: (_, __, ___) => const SizedBox.shrink(),
            ),
          Container(color: Colors.black.withOpacity(0.35)),
          SafeArea(
            child: AnimatedBuilder(
              animation: _engine,
              builder: (_, __) => Column(
                children: [
                  Padding(
                    padding: const EdgeInsets.all(10),
                    child: Text('Found: ${_engine.score} / ${_engine.maxScore}',
                        style: TextStyle(
                            color: _primaryColor, fontSize: 17, fontWeight: FontWeight.bold)),
                  ),
                  Wrap(
                    spacing: 8,
                    runSpacing: 4,
                    alignment: WrapAlignment.center,
                    children: _engine.words
                        .map((w) => Text(
                              w,
                              style: TextStyle(
                                color: _engine.found.contains(w)
                                    ? const Color(0xFF22c55e)
                                    : Colors.white54,
                                fontSize: 14,
                                decoration: _engine.found.contains(w)
                                    ? TextDecoration.lineThrough
                                    : null,
                              ),
                            ))
                        .toList(),
                  ),
                  const SizedBox(height: 10),
                  Expanded(
                    child: Center(
                      child: SizedBox(
                        width: cellSize * _engine.size,
                        height: cellSize * _engine.size,
                        child: GridView.builder(
                          gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
                            crossAxisCount: _engine.size,
                            crossAxisSpacing: 1,
                            mainAxisSpacing: 1,
                          ),
                          itemCount: _engine.size * _engine.size,
                          physics: const NeverScrollableScrollPhysics(),
                          itemBuilder: (context, i) {
                            final r = i ~/ _engine.size;
                            final c = i % _engine.size;
                            final selected = _startCell == i;
                            final hinted = _engine.hintRow == r && _engine.hintCol == c;
                            return GestureDetector(
                              onTap: () => _tap(r, c),
                              child: Container(
                                decoration: BoxDecoration(
                                  color: selected
                                      ? _primaryColor
                                      : Colors.white10,
                                  border: Border.all(
                                      color: hinted ? _primaryColor : Colors.white24),
                                ),
                                child: Center(
                                  child: Text(_engine.board[r][c],
                                      style: const TextStyle(
                                          fontSize: 15, color: Colors.white)),
                                ),
                              ),
                            );
                          },
                        ),
                      ),
                    ),
                  ),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                    children: [
                      const Text('Tap a start cell then an end cell.',
                          style: TextStyle(color: Colors.white54, fontSize: 12)),
                      if (_engine.allowHints)
                        OutlinedButton.icon(
                          onPressed: () => _engine.revealHint(),
                          icon: Icon(Icons.lightbulb_outline, color: _primaryColor, size: 18),
                          label: Text('Hint', style: TextStyle(color: _primaryColor)),
                        ),
                    ],
                  ),
                  const SizedBox(height: 10),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
