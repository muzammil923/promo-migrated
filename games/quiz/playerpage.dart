import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import 'package:promogames_engine/engine.dart';
import 'logic.dart';

/// Native quiz player screen. Reflects builder settings (colors, texts,
/// progress, timer) and drives the headless quiz engine.
Widget buildQuizPlayer(GameConfig config, GameFinished onFinished) {
  return QuizPlayerPage(config: config, onFinished: onFinished);
}

class QuizPlayerPage extends StatefulWidget {
  final GameConfig config;
  final GameFinished onFinished;
  const QuizPlayerPage({super.key, required this.config, required this.onFinished});

  @override
  State<QuizPlayerPage> createState() => _QuizPlayerPageState();
}

class _QuizPlayerPageState extends State<QuizPlayerPage> {
  late final QuizEngine _engine;
  late Color _bgColor;
  late Color _primaryColor;
  late String _introText;
  late String _outroText;
  late bool _showProgress;
  String? _bgImageUrl;
  String? _logoUrl;
  bool _started = false;
  bool _reported = false;

  @override
  void initState() {
    super.initState();
    final s = widget.config.settings;
    _bgColor = _hex(s['bg_color']?.toString()) ?? const Color(0xFF0d0a1a);
    _primaryColor = _hex(s['primary_color']?.toString()) ?? const Color(0xFF8b5cf6);
    _introText = s['intro_text']?.toString() ?? '';
    _outroText = s['outro_text']?.toString() ?? '';
    _showProgress = s['show_progress']?.toString() != '0';
    _bgImageUrl = s['bg_image_url']?.toString();
    _logoUrl = s['game_logo_url']?.toString();

    _engine = QuizEngine(settings: s, questions: widget.config.questions);
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
          Container(color: Colors.black.withOpacity(0.3)),
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
              _introText.isEmpty ? 'Ready to play?' : _introText,
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
              child: Text(s('start_button_text', 'Start'),
                  style: const TextStyle(color: Colors.white, fontSize: 17, fontWeight: FontWeight.w700)),
            ),
          ],
        ),
      );

  Widget _body() {
    final q = _engine.current;
    return Padding(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            children: [
              if (_showProgress)
                Expanded(
                  child: ClipRRect(
                    borderRadius: BorderRadius.circular(6),
                    child: LinearProgressIndicator(
                      value: (_engine.index + 1) / _engine.total,
                      color: _primaryColor,
                      backgroundColor: Colors.white12,
                    ),
                  ),
                )
              else
                const Spacer(),
              if (_engine.timeLeft != null)
                Padding(
                  padding: const EdgeInsets.only(left: 12),
                  child: Chip(
                    avatar: Icon(Icons.timer_outlined, size: 16, color: _primaryColor),
                    label: Text('${_engine.timeLeft}s',
                        style: TextStyle(color: Colors.white, fontSize: 13)),
                    backgroundColor: Colors.white10,
                  ),
                ),
            ],
          ),
          const SizedBox(height: 8),
          Text('${_engine.index + 1}/${_engine.total}',
              style: TextStyle(color: _primaryColor, fontSize: 15, fontWeight: FontWeight.bold)),
          Text('Score: ${_engine.score}',
              style: const TextStyle(color: Color(0xFF22c55e), fontSize: 13)),
          const SizedBox(height: 20),
          Expanded(
            child: SingleChildScrollView(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Text(q.text,
                      style: const TextStyle(
                          color: Colors.white, fontSize: 21, fontWeight: FontWeight.w600)),
                  const SizedBox(height: 22),
                  ...List.generate(q.options.length, _optionTile),
                ],
              ),
            ),
          ),
          if (_engine.answered)
            ElevatedButton(
              style: ElevatedButton.styleFrom(
                backgroundColor: _primaryColor,
                padding: const EdgeInsets.symmetric(vertical: 16),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
              ),
              onPressed: () {
                if (_engine.completed) return;
                _engine.next();
                if (_engine.completed && _outroText.isNotEmpty && mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(content: Text(_outroText), backgroundColor: _primaryColor));
                }
              },
              child: Text(_engine.isLast ? 'Finish' : s('next_button_text', 'Next'),
                  style: const TextStyle(color: Colors.white, fontSize: 16)),
            ),
          if (_engine.allowBack && _engine.index > 0 && !_engine.completed)
            TextButton(
              onPressed: _engine.back,
              child: const Text('Back', style: TextStyle(color: Colors.white54)),
            ),
        ],
      ),
    );
  }

  Widget _optionTile(int i) {
    final q = _engine.current;
    Color fill = Colors.white10;
    if (_engine.answered) {
      if (q.scored && i == q.correctIndex) {
        fill = const Color(0xFF22c55e).withOpacity(0.75);
      } else if (i == _engine.selected) {
        fill = const Color(0xFFef4444).withOpacity(0.65);
      }
    }
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: ElevatedButton(
        style: ElevatedButton.styleFrom(
          backgroundColor: fill,
          foregroundColor: Colors.white,
          padding: const EdgeInsets.symmetric(vertical: 16),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        ),
        onPressed: _engine.answered ? null : () => _engine.answer(i),
        child: Text(q.options[i],
            textAlign: TextAlign.center,
            style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w500)),
      ),
    );
  }

  String s(String key, String fallback) {
    final v = widget.config.settings[key]?.toString();
    return (v == null || v.isEmpty) ? fallback : v;
  }
}
