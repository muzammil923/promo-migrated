import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import 'package:promogames_engine/engine.dart';
import 'logic.dart';

Widget buildBowlingPlayer(GameConfig config, GameFinished onFinished) {
  return BowlingPlayerPage(config: config, onFinished: onFinished);
}

class BowlingPlayerPage extends StatefulWidget {
  final GameConfig config;
  final GameFinished onFinished;
  const BowlingPlayerPage({super.key, required this.config, required this.onFinished});

  @override
  State<BowlingPlayerPage> createState() => _BowlingPlayerPageState();
}

class _BowlingPlayerPageState extends State<BowlingPlayerPage> {
  late final BowlingEngine _engine;
  late Color _bgColor;
  late Color _primaryColor;
  String? _bgImageUrl;
  bool _reported = false;

  @override
  void initState() {
    super.initState();
    final s = widget.config.settings;
    _bgColor = _hex(s['bg_color']?.toString()) ?? const Color(0xFF0d0a1a);
    _primaryColor = _hex(s['primary_color']?.toString()) ?? const Color(0xFF8b5cf6);
    _bgImageUrl = s['bg_image_url']?.toString();

    _engine = BowlingEngine(settings: s);
    _engine.fx.listen(_onFx);
    _engine.addListener(_onEngineChanged);
  }

  void _onEngineChanged() {
    if (_engine.completed && !_reported) {
      _reported = true;
      Future.delayed(const Duration(milliseconds: 700), () {
        if (mounted) widget.onFinished(_engine.score, _engine.maxScore, true);
      });
    }
    if (mounted) setState(() {});
  }

  void _onFx(GameFx effect) {
    switch (effect) {
      case GameFx.win:
        HapticFeedback.heavyImpact();
      case GameFx.tick:
        HapticFeedback.mediumImpact();
      default:
        break;
    }
  }

  void _exit() {
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
    _engine.removeListener(_onEngineChanged);
    _engine.dispose();
    super.dispose();
  }

  Widget _pin(int i) {
    final standing = _engine.pins[i];
    return Container(
      width: 22,
      height: 34,
      decoration: BoxDecoration(
        color: standing ? Colors.white : Colors.grey.shade700,
        borderRadius: BorderRadius.circular(11),
        border: Border.all(color: _primaryColor, width: 1.5),
      ),
      child: standing
          ? null
          : const Center(child: Icon(Icons.close, size: 14, color: Colors.red)),
    );
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
              imageUrl: _bgImageUrl!, fit: BoxFit.cover,
              placeholder: (_, __) => ColoredBox(color: _bgColor),
              errorWidget: (_, __, ___) => ColoredBox(color: _bgColor),
            )
          else
            ColoredBox(color: _bgColor),
          Container(color: Colors.black.withValues(alpha: 0.3)),
          AnimatedBuilder(
            animation: _engine,
            builder: (_, __) => Column(
              children: [
                Padding(
                  padding: const EdgeInsets.all(12),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text('Frame: ${_engine.frame + 1}/${BowlingEngine.totalFrames}',
                          style: TextStyle(color: _primaryColor, fontSize: 16)),
                      Text('Score: ${_engine.score}',
                          style: const TextStyle(color: Color(0xFF22c55e), fontSize: 18)),
                    ],
                  ),
                ),
                Expanded(
                  child: Container(
                    margin: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: const Color(0xFF080612),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: _primaryColor),
                    ),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                      children: [
                        Row(mainAxisAlignment: MainAxisAlignment.center, children: List.generate(4, (i) => _pin(i))),
                        Row(mainAxisAlignment: MainAxisAlignment.center, children: List.generate(3, (i) => _pin(i + 4))),
                        Row(mainAxisAlignment: MainAxisAlignment.center, children: List.generate(2, (i) => _pin(i + 7))),
                        _pin(9),
                        AnimatedAlign(
                          duration: const Duration(milliseconds: 500),
                          alignment: Alignment(0, _engine.ballY == 1 ? 0.9 : -0.9),
                          child: Container(
                            width: 26,
                            height: 26,
                            decoration: const BoxDecoration(
                              color: Color(0xFF22c55e),
                              shape: BoxShape.circle,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
                Text(_engine.message, style: const TextStyle(color: Colors.white70)),
                const SizedBox(height: 8),
                ElevatedButton(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: _primaryColor,
                    foregroundColor: Colors.white,
                  ),
                  onPressed: _engine.rolling || _engine.completed ? null : _engine.roll,
                  child: const Text('ROLL'),
                ),
                const SizedBox(height: 16),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
