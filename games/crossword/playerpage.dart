import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import 'package:promogames_engine/engine.dart';
import 'logic.dart';

/// Native crossword player screen — letter-cell grid sized by the builder's
/// `cell_size`, numbered clues, check + hint actions themed from settings.
Widget buildCrosswordPlayer(GameConfig config, GameFinished onFinished) {
  return CrosswordPlayerPage(config: config, onFinished: onFinished);
}

class CrosswordPlayerPage extends StatefulWidget {
  final GameConfig config;
  final GameFinished onFinished;
  const CrosswordPlayerPage({super.key, required this.config, required this.onFinished});

  @override
  State<CrosswordPlayerPage> createState() => _CrosswordPlayerPageState();
}

class _CrosswordPlayerPageState extends State<CrosswordPlayerPage> {
  late final CrosswordEngine _engine;
  late Color _bgColor;
  late Color _primaryColor;
  late double _cellSize;
  String? _bgImageUrl;
  List<List<TextEditingController?>> _controllers = [];

  @override
  void initState() {
    super.initState();
    final s = widget.config.settings;
    _bgColor = _hex(s['bg_color']?.toString()) ?? const Color(0xFF0d0a1a);
    _primaryColor = _hex(s['primary_color']?.toString()) ?? const Color(0xFF7c6ff7);
    var cell = 40.0;
    final parsed = num.tryParse(s['cell_size']?.toString() ?? '');
    if (parsed != null && parsed >= 24 && parsed <= 72) cell = parsed.toDouble();
    _cellSize = cell;
    _bgImageUrl = s['bg_image_url']?.toString();

    _engine = CrosswordEngine(settings: s, words: widget.config.words);
    _engine.fx.listen(_onFx);
    _engine.addListener(_onEngineChanged);
    _resetEntries();
  }

  void _resetEntries() {
    _controllers = List.generate(
      _engine.rows,
      (_) => List.filled(_engine.cols, null, growable: false),
      growable: false,
    );
    for (var r = 0; r < _engine.rows; r++) {
      for (var c = 0; c < _engine.cols; c++) {
        if (_engine.solution[r][c] == null) continue;
        _controllers[r][c] = TextEditingController();
      }
    }
  }

  List<List<String>> _readEntries() => List.generate(
        _engine.rows,
        (r) => List.generate(
            _engine.cols, (c) => _controllers[r][c]?.text ?? ''),
        growable: false,
      );

  void _onEngineChanged() {
    if (_engine.completed) {
      Future.delayed(const Duration(milliseconds: 500), () {
        if (mounted) widget.onFinished(_engine.score, _engine.maxScore, true);
      });
    }
    if (mounted) setState(() {});
  }

  void _onFx(GameFx effect) {
    switch (effect) {
      case GameFx.win:
        HapticFeedback.heavyImpact();
      case GameFx.wrong:
        HapticFeedback.vibrate();
      case GameFx.tick:
        HapticFeedback.selectionClick();
      default:
        break;
    }
  }

  void _check() => _engine.check(_readEntries());

  void _hint() {
    if (widget.config.settings['allow_hints']?.toString() == '0') return;
    final idx = _engine.revealLetter(_readEntries());
    if (idx != null) {
      final r = idx ~/ _engine.cols;
      final c = idx % _engine.cols;
      _controllers[r][c]?.text = _engine.solution[r][c] ?? '';
      setState(() {});
    }
  }

  void _exit() {
    _engine.exitEarly();
    _engine.check(_readEntries());
    widget.onFinished(_engine.score, _engine.maxScore, false);
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
  void dispose() {
    for (final row in _controllers) {
      for (final c in row) {
        c?.dispose();
      }
    }
    _engine.removeListener(_onEngineChanged);
    _engine.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: _bgColor,
      appBar: AppBar(
        backgroundColor: _bgColor,
        title: Text(widget.config.name),
        leading: IconButton(icon: const Icon(Icons.close), onPressed: _exit),
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
                    padding: const EdgeInsets.all(8),
                    child: Text('Correct: ${_engine.score} / ${_engine.maxScore}',
                        style: TextStyle(
                            color: _primaryColor, fontSize: 17, fontWeight: FontWeight.bold)),
                  ),
                  Expanded(
                    child: SingleChildScrollView(
                      child: Column(
                        children: [
                          _grid(),
                          const SizedBox(height: 12),
                          ..._engine.clues.map((cl) => Padding(
                                padding:
                                    const EdgeInsets.symmetric(vertical: 3, horizontal: 16),
                                child: Text('${cl.number}. ${cl.clue} (${cl.word.length})',
                                    style: const TextStyle(color: Colors.white70, fontSize: 15)),
                              )),
                        ],
                      ),
                    ),
                  ),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                    children: [
                      ElevatedButton.icon(
                        style: ElevatedButton.styleFrom(backgroundColor: _primaryColor),
                        onPressed: _check,
                        icon: const Icon(Icons.check, color: Colors.white),
                        label: const Text('Check', style: TextStyle(color: Colors.white)),
                      ),
                      if (widget.config.settings['allow_hints']?.toString() != '0')
                        OutlinedButton.icon(
                          onPressed: _hint,
                          icon: Icon(Icons.lightbulb_outline, color: _primaryColor),
                          label: Text('Hint', style: TextStyle(color: _primaryColor)),
                        ),
                    ],
                  ),
                  const SizedBox(height: 12),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _grid() {
    return Center(
      child: Container(
        padding: const EdgeInsets.all(4),
        decoration: BoxDecoration(
          border: Border.all(color: _primaryColor, width: 2),
          borderRadius: BorderRadius.circular(10),
          color: Colors.black26,
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: List.generate(_engine.rows, (r) {
            return Row(
              mainAxisSize: MainAxisSize.min,
              children: List.generate(_engine.cols, (c) => _cell(r, c)),
            );
          }),
        ),
      ),
    );
  }

  Widget _cell(int r, int c) {
    final sol = _engine.solution[r][c];
    if (sol == null) {
      return Container(width: _cellSize, height: _cellSize, color: Colors.white);
    }
    final wrong = _engine.isWrongCell(r, c);
    final controller = _controllers[r][c];
    return Container(
      width: _cellSize,
      height: _cellSize,
      margin: const EdgeInsets.all(1),
      decoration: BoxDecoration(
        color: wrong ? const Color(0xFFef4444).withOpacity(0.35) : Colors.white10,
        border: Border.all(color: wrong ? const Color(0xFFef4444) : Colors.white24),
      ),
      child: Center(
        child: controller == null
            ? const SizedBox.shrink()
            : TextField(
                controller: controller,
                textAlign: TextAlign.center,
                textCapitalization: TextCapitalization.characters,
                maxLength: 1,
                style: TextStyle(fontSize: _cellSize * 0.5, color: Colors.white),
                decoration: const InputDecoration(counterText: '', border: InputBorder.none),
              ),
      ),
    );
  }
}
