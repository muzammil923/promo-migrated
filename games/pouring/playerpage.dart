import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import 'package:promogames_engine/engine.dart';
import 'logic.dart';

Widget buildPouringPlayer(GameConfig config, GameFinished onFinished) {
  return PouringPlayerPage(config: config, onFinished: onFinished);
}

class PouringPlayerPage extends StatefulWidget {
  final GameConfig config;
  final GameFinished onFinished;
  const PouringPlayerPage(
      {super.key, required this.config, required this.onFinished});

  @override
  State<PouringPlayerPage> createState() => _PouringPlayerPageState();
}

class _PouringPlayerPageState extends State<PouringPlayerPage> {
  late final PouringEngine _engine;
  late Color _bgColor;
  late Color _primaryColor;
  String? _bgImageUrl;
  bool _reported = false;

  static const List<Color> _palette = [
    Color(0xFF8b5cf6),
    Color(0xFF22c55e),
    Color(0xFFef4444),
    Color(0xFFf59e0b),
    Color(0xFF3b82f6),
    Color(0xFFec4899),
  ];

  @override
  void initState() {
    super.initState();
    final s = widget.config.settings;
    _bgColor = _hex(s['bg_color']?.toString()) ?? const Color(0xFF0d0a1a);
    _primaryColor =
        _hex(s['primary_color']?.toString()) ?? const Color(0xFF8b5cf6);
    _bgImageUrl = s['bg_image_url']?.toString();

    _engine = PouringEngine(settings: s);
    _engine.fx.listen(_onFx);
    _engine.addListener(_onEngineChanged);
  }

  void _onEngineChanged() {
    if (_engine.completed && !_reported) {
      _reported = true;
      Future.delayed(const Duration(milliseconds: 400), () {
        if (mounted) widget.onFinished(_engine.score, _engine.maxScore, true);
      });
    }
    if (mounted) setState(() {});
  }

  void _onFx(GameFx effect) {
    switch (effect) {
      case GameFx.correct:
        HapticFeedback.mediumImpact();
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
          Container(color: Colors.black.withValues(alpha: 0.3)),
          SafeArea(
            child: Padding(
              padding: const EdgeInsets.all(12),
              child: AnimatedBuilder(
                animation: _engine,
                builder: (_, __) => Column(
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text('Moves: ${_engine.moves}',
                            style: const TextStyle(
                                color: Color(0xFF22c55e), fontSize: 18)),
                        if (_engine.completed)
                          const Text('SOLVED!',
                              style: TextStyle(
                                  color: Color(0xFF8b5cf6), fontSize: 18)),
                      ],
                    ),
                    Expanded(
                      child: Center(
                        child: SingleChildScrollView(
                          scrollDirection: Axis.horizontal,
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              for (int i = 0; i < _engine.tubes.length; i++)
                                _tube(i),
                            ],
                          ),
                        ),
                      ),
                    ),
                    ElevatedButton(
                      onPressed: () {
                        _reported = false;
                        _engine.newGame();
                      },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: _primaryColor,
                      ),
                      child: const Text('Shuffle'),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _tube(int i) {
    final tube = _engine.tubes[i];
    const double w = 46;
    const double seg = 34;
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 6),
      child: GestureDetector(
        onTap: () => _engine.tap(i),
        child: Container(
          width: w,
          height: seg * PouringEngine.capacity + 8,
          decoration: BoxDecoration(
            border: Border.all(
              color: _engine.selected == i
                  ? const Color(0xFF22c55e)
                  : _primaryColor,
              width: _engine.selected == i ? 3 : 2,
            ),
            borderRadius: BorderRadius.circular(10),
            color: const Color(0xFF080612),
          ),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.end,
            children: [
              for (int s = 0; s < tube.length; s++)
                Container(
                  width: w - 8,
                  height: seg - 2,
                  margin:
                      const EdgeInsets.symmetric(horizontal: 2, vertical: 1),
                  decoration: BoxDecoration(
                    color: _palette[tube[s] % _palette.length],
                    borderRadius: BorderRadius.circular(4),
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }
}
