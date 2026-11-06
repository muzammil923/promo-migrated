import 'dart:async';
import 'dart:math';

import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import 'package:promogames_engine/engine.dart';
import 'logic.dart';

Widget buildTyperPlayer(GameConfig config, GameFinished onFinished) {
  return TyperPlayerPage(config: config, onFinished: onFinished);
}

class TyperPlayerPage extends StatefulWidget {
  final GameConfig config;
  final GameFinished onFinished;
  const TyperPlayerPage({super.key, required this.config, required this.onFinished});

  @override
  State<TyperPlayerPage> createState() => _TyperPlayerPageState();
}

class _TyperPlayerPageState extends State<TyperPlayerPage> with TickerProviderStateMixin {
  late final TyperEngine _engine;
  late Color _bgColor;
  String? _bgImageUrl;
  bool _reported = false;
  Timer? _roundTimer;
  Timer? _ringTimer;
  final TextEditingController _inputCtrl = TextEditingController();
  final FocusNode _inputFocus = FocusNode();

  late AnimationController _flashCtrl;
  late AnimationController _shakeCtrl;

  @override
  void initState() {
    super.initState();
    final s = widget.config.settings;
    _bgColor = _hex(s['bg_color']?.toString()) ?? const Color(0xFF1c122f);
    _bgImageUrl = s['bg_image_url']?.toString();

    _engine = TyperEngine(settings: s);
    _engine.fx.listen(_onFx);
    _engine.addListener(_onEngineChanged);

    _flashCtrl = AnimationController(vsync: this, duration: const Duration(milliseconds: 300));
    _shakeCtrl = AnimationController(vsync: this, duration: const Duration(milliseconds: 300));
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
        _flashCtrl.forward(from: 0);
      case GameFx.wrong:
        HapticFeedback.heavyImpact();
        _shakeCtrl.forward(from: 0);
      case GameFx.gameOver:
        HapticFeedback.vibrate();
      default:
        break;
    }
  }

  void _startRound() {
    _engine.startRound();
    _roundTimer?.cancel();
    _roundTimer = Timer.periodic(const Duration(seconds: 1), (t) {
      if (!mounted || _engine.completed) { t.cancel(); return; }
      _engine.tickSecond();
    });
    _startRingTimer();
    WidgetsBinding.instance.addPostFrameCallback((_) => _inputFocus.requestFocus());
  }

  void _startRingTimer() {
    _ringTimer?.cancel();
    _ringTimer = Timer.periodic(const Duration(milliseconds: 16), (t) {
      if (!mounted || _engine.completed) { t.cancel(); return; }
      final elapsed = DateTime.now().difference(_engine.wordStart!).inMilliseconds;
      final budget = 2500.0 + _engine.currentWord.length * 190;
      final remaining = budget - elapsed;
      if (remaining <= 0) {
        t.cancel();
        _engine.submitWord(true, _engine.currentWord.length);
        return;
      }
      _engine.updateRingProgress((remaining / budget).clamp(0.0, 1.0));
    });
  }

  void _exit() {
    _roundTimer?.cancel();
    _ringTimer?.cancel();
    _engine.exitEarly();
    widget.onFinished(_engine.score, _engine.maxScore, false);
  }

  Color? _hex(String? hex) {
    if (hex == null || hex.isEmpty) return null;
    var h = hex.replaceFirst('#', '');
    if (h.length == 6) h = 'FF$h';
    try { return Color(int.parse(h, radix: 16)); } catch (_) { return null; }
  }

  @override
  void dispose() {
    _roundTimer?.cancel();
    _ringTimer?.cancel();
    _flashCtrl.dispose();
    _shakeCtrl.dispose();
    _inputCtrl.dispose();
    _inputFocus.dispose();
    _engine.removeListener(_onEngineChanged);
    _engine.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: _bgColor,
      body: Stack(
        fit: StackFit.expand,
        children: [
          if (_bgImageUrl != null)
            CachedNetworkImage(
              imageUrl: _bgImageUrl!, fit: BoxFit.cover,
              placeholder: (_, __) => Container(color: _bgColor),
              errorWidget: (_, __, ___) => Container(color: _bgColor),
            ),
          if (_bgImageUrl != null)
            Container(color: Colors.black.withValues(alpha: 0.4)),
          SafeArea(
            child: _engine.completed ? _buildEndScreen() : _buildGameScreen(),
          ),
        ],
      ),
    );
  }

  Widget _buildGameScreen() {
    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text('WPM: ${_engine.wpm}  ACC: ${_engine.accuracy}%  STREAK: ${_engine.streak}',
                  style: const TextStyle(color: Colors.white70, fontSize: 12)),
              Text('${_engine.remainingSeconds}s',
                  style: TextStyle(
                    color: _engine.remainingSeconds <= 10 ? Colors.red : Colors.white70,
                    fontSize: 14, fontWeight: FontWeight.bold,
                  )),
            ],
          ),
        ),
        Expanded(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: Column(
              children: [
                if (_engine.history.length > 2)
                  ...(_engine.history.sublist(_engine.history.length - 2).map((e) => Text(
                    '${e.word} ${e.ok ? "\u2713" : "\u2717"}',
                    style: TextStyle(
                      fontSize: 14,
                      color: e.ok ? const Color(0xFF22c55e) : Colors.red,
                    ),
                  ))),
                const SizedBox(height: 12),
                if (_engine.currentWord.isNotEmpty)
                  AnimatedBuilder(
                    animation: _shakeCtrl,
                    builder: (_, __) {
                      final shake = _shakeCtrl.value < 1.0
                          ? sin(_shakeCtrl.value * pi * 6) * 4 * (1 - _shakeCtrl.value)
                          : 0.0;
                      return Transform.translate(
                        offset: Offset(shake, 0),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            for (int i = 0; i < _engine.currentWord.length; i++)
                              Text(
                                _engine.currentWord[i],
                                style: TextStyle(
                                  fontSize: 36,
                                  fontWeight: FontWeight.bold,
                                  color: i < _engine.typed.length
                                      ? (_engine.typed[i].toUpperCase() == _engine.currentWord[i]
                                          ? const Color(0xFF22c55e)
                                          : Colors.red)
                                      : Colors.white38,
                                ),
                              ),
                          ],
                        ),
                      );
                    },
                  ),
                const SizedBox(height: 12),
                SizedBox(
                  width: 200,
                  height: 200,
                  child: CustomPaint(
                    painter: _RingPainter(progress: _engine.ringProgress),
                  ),
                ),
              ],
            ),
          ),
        ),
        TextField(
          controller: _inputCtrl,
          focusNode: _inputFocus,
          autofocus: true,
          autocorrect: false,
          enableSuggestions: false,
          style: const TextStyle(color: Colors.transparent, fontSize: 1),
          decoration: const InputDecoration.collapsed(hintText: ''),
          onChanged: (v) {
            _engine.onInputChanged(v);
            if (_engine.currentWord.isNotEmpty && v.toUpperCase() == _engine.currentWord) {
              _inputCtrl.clear();
            }
          },
        ),
        Padding(
          padding: const EdgeInsets.all(16),
          child: ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: Colors.red.withValues(alpha: 0.8)),
            onPressed: () { _roundTimer?.cancel(); _ringTimer?.cancel(); _engine.endRound(); },
            child: const Text('End Round', style: TextStyle(color: Colors.white)),
          ),
        ),
      ],
    );
  }

  Widget _buildEndScreen() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(24),
      child: Column(
        children: [
          const SizedBox(height: 40),
          Text("TIME'S UP", style: TextStyle(fontSize: 32, color: Colors.red.shade300, fontWeight: FontWeight.bold)),
          const SizedBox(height: 24),
          _statRow('WPM', '${_engine.wpm}'),
          _statRow('Accuracy', '${_engine.accuracy}%'),
          _statRow('Best Streak', '${_engine.bestStreak}'),
          _statRow('Words Typed', '${_engine.correctWords}'),
          _statRow('Mistakes', '${_engine.mistakes}'),
          _statRow('Score', '${_engine.score}'),
          const SizedBox(height: 24),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF8b5cf6)),
            onPressed: () { _reported = false; _startRound(); },
            child: const Text('Play Again', style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
    );
  }

  Widget _statRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: const TextStyle(color: Colors.white70, fontSize: 16)),
          Text(value, style: const TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold)),
        ],
      ),
    );
  }
}

class _RingPainter extends CustomPainter {
  final double progress;
  _RingPainter({required this.progress});

  @override
  void paint(Canvas canvas, Size size) {
    final center = Offset(size.width / 2, size.height / 2);
    final radius = size.width / 2 - 8;
    canvas.drawCircle(center, radius, Paint()
      ..color = Colors.white12
      ..style = PaintingStyle.stroke
      ..strokeWidth = 3);
    canvas.drawArc(
      Rect.fromCircle(center: center, radius: radius),
      -pi / 2,
      2 * pi * progress,
      false,
      Paint()
        ..color = progress < 0.25 ? Colors.red : const Color(0xFF8b5cf6)
        ..style = PaintingStyle.stroke
        ..strokeWidth = 3
        ..strokeCap = StrokeCap.round,
    );
  }

  @override
  bool shouldRepaint(covariant _RingPainter old) => old.progress != progress;
}
