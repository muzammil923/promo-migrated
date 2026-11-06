import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import 'package:promogames_engine/engine.dart';
import 'logic.dart';

/// Native math player screen — big question display, custom numeric keypad,
/// level chip and optional per-question timer, themed from builder settings.
Widget buildMathPlayer(GameConfig config, GameFinished onFinished) {
  return MathPlayerPage(config: config, onFinished: onFinished);
}

class MathPlayerPage extends StatefulWidget {
  final GameConfig config;
  final GameFinished onFinished;
  const MathPlayerPage({super.key, required this.config, required this.onFinished});

  @override
  State<MathPlayerPage> createState() => _MathPlayerPageState();
}

class _MathPlayerPageState extends State<MathPlayerPage> {
  late final MathEngine _engine;
  late Color _bgColor;
  late Color _primaryColor;
  String _input = '';
  bool _reported = false;

  @override
  void initState() {
    super.initState();
    final s = widget.config.settings;
    _bgColor = _hex(s['bg_color']?.toString()) ?? const Color(0xFF0d0a1a);
    _primaryColor = _hex(s['primary_color']?.toString()) ?? const Color(0xFF22c55e);
    _engine = MathEngine(settings: s);
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
      case GameFx.correct:
        HapticFeedback.lightImpact();
      case GameFx.wrong:
        HapticFeedback.vibrate();
      case GameFx.levelUp || GameFx.win:
        HapticFeedback.heavyImpact();
      default:
        break;
    }
  }

  void _key(String k) {
    if (_engine.answered) return;
    setState(() {
      switch (k) {
        case '<':
          if (_input.isNotEmpty) _input = _input.substring(0, _input.length - 1);
        case '-':
          _input = _input.startsWith('-') ? _input.substring(1) : '-$_input';
        default:
          if (_input.replaceAll('-', '').length < 6) _input += k;
      }
    });
  }

  void _submit() {
    final v = int.tryParse(_input);
    if (v == null || _engine.answered) return;
    _engine.submit(v);
    Future.delayed(const Duration(milliseconds: 550), () {
      if (!mounted) return;
      setState(() => _input = '');
      _engine.next();
    });
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
        leading: IconButton(
          icon: const Icon(Icons.close),
          onPressed: () {
            _engine.exitEarly();
            widget.onFinished(_engine.score, _engine.maxScore, false);
          },
        ),
      ),
      body: SafeArea(
        child: AnimatedBuilder(
          animation: _engine,
          builder: (_, __) => Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Chip(
                      label: Text('Level ${_engine.level}',
                          style: TextStyle(color: Colors.white, fontSize: 13)),
                      backgroundColor: _primaryColor.withOpacity(0.25),
                    ),
                    Text('Score ${_engine.score}/${_engine.maxScore}',
                        style: const TextStyle(
                            color: Colors.white70, fontSize: 14, fontWeight: FontWeight.w600)),
                  ],
                ),
                const SizedBox(height: 8),
                ClipRRect(
                  borderRadius: BorderRadius.circular(8),
                  child: LinearProgressIndicator(
                    value: (_engine.qIndex + 1) / _engine.maxScore,
                    color: _primaryColor,
                    backgroundColor: Colors.white12,
                  ),
                ),
                if (_engine.timeLeft != null) ...[
                  const SizedBox(height: 8),
                  Text('${_engine.timeLeft}s left',
                      textAlign: TextAlign.center,
                      style: TextStyle(color: _primaryColor, fontSize: 13)),
                ],
                Expanded(
                  child: Center(
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text(
                          '${_engine.current.a} ${_engine.current.op} ${_engine.current.b} = ?',
                          style: const TextStyle(
                              color: Colors.white, fontSize: 40, fontWeight: FontWeight.w800),
                        ),
                        const SizedBox(height: 24),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 28, vertical: 12),
                          decoration: BoxDecoration(
                            color: Colors.white10,
                            borderRadius: BorderRadius.circular(14),
                            border: Border.all(color: _primaryColor.withOpacity(0.5)),
                          ),
                          child: Text(
                            _input.isEmpty ? '—' : _input,
                            style: TextStyle(
                                color: _engine.answered
                                    ? (_input == _engine.current.answer.toString()
                                        ? const Color(0xFF22c55e)
                                        : const Color(0xFFef4444))
                                    : Colors.white,
                                fontSize: 34,
                                fontWeight: FontWeight.w700),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
                _keypad(),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _keypad() {
    const rows = [
      ['7', '8', '9'],
      ['4', '5', '6'],
      ['1', '2', '3'],
    ];
    return Column(
      children: [
        ...rows.map((r) => Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: r.map((k) => _keyBtn(k)).toList(),
            )),
        Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            if (_engine.allowNegative) _keyBtn('-'),
            _keyBtn('0'),
            _keyBtn('<', icon: Icons.backspace_outlined),
          ],
        ),
        const SizedBox(height: 10),
        SizedBox(
          width: double.infinity,
          child: ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: _primaryColor,
              padding: const EdgeInsets.symmetric(vertical: 16),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
              disabledBackgroundColor: _primaryColor.withOpacity(0.4),
            ),
            onPressed: _engine.answered ? null : _submit,
            child: Text(_engine.answered ? '…' : 'Submit',
                style: const TextStyle(color: Colors.white, fontSize: 17, fontWeight: FontWeight.w700)),
          ),
        ),
      ],
    );
  }

  Widget _keyBtn(String k, {IconData? icon}) => Padding(
        padding: const EdgeInsets.all(4),
        child: SizedBox(
          width: 72,
          height: 58,
          child: ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.white10,
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              elevation: 0,
            ),
            onPressed: _engine.answered ? null : () => _key(k),
            child: icon != null ? Icon(icon) : Text(k, style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w600)),
          ),
        ),
      );
}
