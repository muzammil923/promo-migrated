import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import 'package:promogames_engine/engine.dart';
import 'logic.dart';

/// Native Word Scramble player screen. Reads builder settings from [GameConfig],
/// drives the headless engine and translates its fx events into haptics.
Widget buildWordScramblePlayer(GameConfig config, GameFinished onFinished) {
  return WordScramblePlayerPage(config: config, onFinished: onFinished);
}

class WordScramblePlayerPage extends StatefulWidget {
  final GameConfig config;
  final GameFinished onFinished;
  const WordScramblePlayerPage({super.key, required this.config, required this.onFinished});

  @override
  State<WordScramblePlayerPage> createState() => _WordScramblePlayerPageState();
}

class _WordScramblePlayerPageState extends State<WordScramblePlayerPage> {
  late final WordScrambleEngine _engine;
  late Color _bgColor;
  late Color _primaryColor;
  String? _bgImageUrl;
  String? _logoUrl;
  bool _started = false;
  bool _reported = false;
  final _controller = TextEditingController();

  @override
  void initState() {
    super.initState();
    final s = widget.config.settings;
    _bgColor = _hex(s['bg_color']?.toString()) ?? const Color(0xFF0d0a1a);
    _primaryColor = _hex(s['primary_color']?.toString()) ?? const Color(0xFF8b5cf6);
    _bgImageUrl = s['bg_image_url']?.toString();
    _logoUrl = s['game_logo_url']?.toString();

    _engine = WordScrambleEngine(settings: s, words: widget.config.words);
    _engine.fx.listen(_onFx);
    _engine.addListener(_onEngineChanged);
  }

  void _onEngineChanged() {
    if (_engine.completed && !_reported) {
      _reported = true;
      Future.delayed(const Duration(milliseconds: 500), () {
        if (mounted) widget.onFinished(_engine.score, _engine.maxScore, true);
      });
    }
    if (mounted) setState(() {});
  }

  void _onFx(GameFx effect) {
    switch (effect) {
      case GameFx.correct:
        HapticFeedback.mediumImpact();
      case GameFx.wrong:
        HapticFeedback.vibrate();
      case GameFx.win:
        HapticFeedback.heavyImpact();
      default:
        break;
    }
  }

  void _exit() {
    _engine.exitEarly();
    widget.onFinished(_engine.score, _engine.maxScore, false);
  }

  void _submit() {
    _engine.answer(_controller.text);
    if (_engine.isCorrect) {
      Future.delayed(const Duration(milliseconds: 600), () {
        if (mounted) {
          _controller.clear();
          _engine.next();
        }
      });
    }
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
    _controller.dispose();
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
            CachedNetworkImage(
              imageUrl: _bgImageUrl!,
              fit: BoxFit.cover,
              placeholder: (_, __) => ColoredBox(color: _bgColor),
              errorWidget: (_, __, ___) => ColoredBox(color: _bgColor),
            )
          else
            ColoredBox(color: _bgColor),
          Container(color: Colors.black.withValues(alpha: 0.3)),
          SafeArea(child: !_started ? _intro : AnimatedBuilder(animation: _engine, builder: (_, __) => _body())),
        ],
      ),
    );
  }

  Widget get _intro => Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            if (_logoUrl != null)
              Center(
                child: CachedNetworkImage(
                  imageUrl: _logoUrl!,
                  height: 90,
                  placeholder: (_, __) => const SizedBox.shrink(),
                  errorWidget: (_, __, ___) => const SizedBox.shrink(),
                ),
              ),
            const SizedBox(height: 24),
            Text(
              _s('intro_text', 'Unscramble the letters to form the correct word!'),
              textAlign: TextAlign.center,
              style: const TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.w600),
            ),
            const SizedBox(height: 32),
            ElevatedButton(
              style: ElevatedButton.styleFrom(
                backgroundColor: _primaryColor,
                padding: const EdgeInsets.symmetric(vertical: 16),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
              ),
              onPressed: () => setState(() => _started = true),
              child: Text(_s('start_button_text', 'Start'),
                  style: const TextStyle(color: Colors.white, fontSize: 17, fontWeight: FontWeight.w700)),
            ),
          ],
        ),
      );

  Widget _body() {
    if (_engine.completed) return _complete;
    final entry = _engine.current;
    return Padding(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            children: [
              Text('${_engine.index + 1}/${_engine.total}',
                  style: TextStyle(color: _primaryColor, fontSize: 15, fontWeight: FontWeight.bold)),
              const Spacer(),
              Text('Score: ${_engine.score}',
                  style: const TextStyle(color: Color(0xFF22c55e), fontSize: 13)),
            ],
          ),
          const SizedBox(height: 8),
          const LinearProgressIndicator(value: 0, backgroundColor: Colors.white12),
          const SizedBox(height: 32),
          if (entry.hint != null)
            Padding(
              padding: const EdgeInsets.only(bottom: 16),
              child: Text('Hint: ${entry.hint}',
                  style: const TextStyle(color: Colors.white60, fontSize: 14)),
            ),
          const Text('Unscramble the word:',
              style: TextStyle(color: Colors.white70, fontSize: 16)),
          const SizedBox(height: 16),
          Container(
            padding: const EdgeInsets.symmetric(vertical: 20, horizontal: 16),
            decoration: BoxDecoration(
              color: _primaryColor.withValues(alpha: 0.2),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: _primaryColor, width: 2),
            ),
            child: Text(_engine.scrambled,
                textAlign: TextAlign.center,
                style: const TextStyle(
                    fontSize: 34, letterSpacing: 6, color: Colors.white, fontWeight: FontWeight.bold)),
          ),
          const SizedBox(height: 24),
          TextField(
            controller: _controller,
            textAlign: TextAlign.center,
            textCapitalization: TextCapitalization.characters,
            style: const TextStyle(fontSize: 24, color: Colors.white, letterSpacing: 4),
            onSubmitted: (_) => _submit(),
            decoration: InputDecoration(
              hintText: 'Your answer',
              hintStyle: const TextStyle(color: Colors.white38),
              enabledBorder: OutlineInputBorder(
                borderSide: const BorderSide(color: Colors.white24),
                borderRadius: BorderRadius.circular(10),
              ),
              focusedBorder: OutlineInputBorder(
                borderSide: BorderSide(color: _primaryColor),
                borderRadius: BorderRadius.circular(10),
              ),
            ),
          ),
          const SizedBox(height: 16),
          if (_engine.feedback.isNotEmpty)
            Text(_engine.feedback,
                style: TextStyle(
                    color: _engine.isCorrect ? const Color(0xFF22c55e) : Colors.redAccent,
                    fontSize: 16,
                    fontWeight: FontWeight.w600)),
          const Spacer(),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: _primaryColor,
              padding: const EdgeInsets.symmetric(vertical: 16),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
            ),
            onPressed: _submit,
            child: const Text('Submit', style: TextStyle(color: Colors.white, fontSize: 16)),
          ),
          if (_engine.answered && !_engine.isCorrect)
            Padding(
              padding: const EdgeInsets.only(top: 12),
              child: ElevatedButton(
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.white12,
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                ),
                onPressed: () {
                  _controller.clear();
                  _engine.next();
                },
                child: Text(_engine.isLast ? 'Finish' : 'Next',
                    style: const TextStyle(color: Colors.white, fontSize: 16)),
              ),
            ),
          const SizedBox(height: 8),
        ],
      ),
    );
  }

  Widget get _complete => Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Text('You scored ${_engine.score}/${_engine.maxScore}!',
                  style: TextStyle(color: _primaryColor, fontSize: 28, fontWeight: FontWeight.bold)),
              const SizedBox(height: 16),
              const Text('Game Complete!',
                  style: TextStyle(color: Colors.white70, fontSize: 16)),
            ],
          ),
        ),
      );

  String _s(String key, String fallback) {
    final v = widget.config.settings[key]?.toString();
    return (v == null || v.isEmpty) ? fallback : v;
  }
}
