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

Widget buildReactionGame(GameConfig config, GameFinished onFinished) {
  return _ReactionGame(config: config, onFinished: onFinished);
}

enum _Phase { idle, waiting, ready, tooSoon, result, done }

class _ReactionGame extends StatefulWidget {
  final GameConfig config;
  final GameFinished onFinished;
  const _ReactionGame({required this.config, required this.onFinished});

  @override
  State<_ReactionGame> createState() => _ReactionGameState();
}

class _ReactionGameState extends State<_ReactionGame> {
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

  static const _rounds = 5;
  _Phase _phase = _Phase.idle;
  int _round = 0;
  final List<int> _times = [];
  DateTime? _greenAt;
  int _lastMs = 0;

  int get _bestMs => _times.isEmpty ? 0 : _times.reduce((a, b) => a < b ? a : b);
  int get _score => _bestMs == 0 ? 0 : (_times.reduce((a, b) => a + b) ~/ _times.length);

  void _startRound() {
    setState(() => _phase = _Phase.waiting);
    final delay = 1000 + (DateTime.now().millisecond * 4);
    Future.delayed(Duration(milliseconds: delay.clamp(1000, 4000)), () {
      if (!mounted || _phase != _Phase.waiting) return;
      setState(() {
        _phase = _Phase.ready;
        _greenAt = DateTime.now();
      });
    });
  }

  void _onTap() {
    switch (_phase) {
      case _Phase.idle:
      case _Phase.result:
        _startRound();
        break;
      case _Phase.waiting:
        setState(() => _phase = _Phase.tooSoon);
        break;
      case _Phase.tooSoon:
        setState(() => _phase = _Phase.result);
        break;
      case _Phase.ready:
        _lastMs = DateTime.now().difference(_greenAt!).inMilliseconds;
        _times.add(_lastMs);
        _round++;
        if (_round >= _rounds) {
          setState(() => _phase = _Phase.done);
          widget.onFinished(_bestMs, 0, true);
        } else {
          setState(() => _phase = _Phase.result);
        }
        break;
      case _Phase.done:
        break;
    }
  }

  Color _panelColor() {
    switch (_phase) {
      case _Phase.ready:
        return _green;
      case _Phase.waiting:
        return Colors.red.shade900;
      case _Phase.tooSoon:
        return Colors.orange.shade800;
      default:
        return _purple.withOpacity(0.3);
    }
  }

  String _panelText() {
    switch (_phase) {
      case _Phase.idle:
        return 'Tap to start';
      case _Phase.waiting:
        return 'Wait for green...';
      case _Phase.ready:
        return 'TAP NOW!';
      case _Phase.tooSoon:
        return 'Too soon! Tap to continue';
      case _Phase.result:
        return '$_lastMs ms\nTap for next round';
      case _Phase.done:
        return 'Done!\nBest: $_bestMs ms\nAvg: $_score ms';
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
            widget.onFinished(_bestMs, 0, false);
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

              padding: const EdgeInsets.all(20),

              child:  Column(
          children: [
            Text('Round ${_round.clamp(0, _rounds)}/$_rounds',
                style: const TextStyle(color: _purple, fontSize: 18, fontWeight: FontWeight.bold)),
            const SizedBox(height: 16),
            Expanded(
              child: GestureDetector(
                onTap: _onTap,
                child: Container(
                  width: double.infinity,
                  decoration: BoxDecoration(
                    color: _panelColor(),
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(color: Colors.white24, width: 2),
                  ),
                  child: Center(
                    child: Text(
                      _panelText(),
                      textAlign: TextAlign.center,
                      style: const TextStyle(color: Colors.white, fontSize: 26, fontWeight: FontWeight.bold),
                    ),
                  ),
                ),
              ),
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
