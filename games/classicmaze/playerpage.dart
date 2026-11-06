import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import 'package:promogames_engine/engine.dart';
import 'logic.dart';

Widget buildClassicMazePlayer(GameConfig config, GameFinished onFinished) {
  return ClassicMazePlayerPage(config: config, onFinished: onFinished);
}

class ClassicMazePlayerPage extends StatefulWidget {
  final GameConfig config;
  final GameFinished onFinished;
  const ClassicMazePlayerPage({super.key, required this.config, required this.onFinished});

  @override
  State<ClassicMazePlayerPage> createState() => _ClassicMazePlayerPageState();
}

class _ClassicMazePlayerPageState extends State<ClassicMazePlayerPage> {
  late final ClassicMazeEngine _engine;
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

    _engine = ClassicMazeEngine(settings: s);
    _engine.fx.listen(_onFx);
    _engine.addListener(_onEngineChanged);
  }

  void _onEngineChanged() {
    if (_engine.completed && !_reported) {
      _reported = true;
      Future.delayed(const Duration(milliseconds: 300), () {
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
        HapticFeedback.selectionClick();
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

  @override
  Widget build(BuildContext context) {
    final cell = MediaQuery.of(context).size.width / (ClassicMazeEngine.size + 2);
    return Scaffold(
      backgroundColor: _bgColor,
      appBar: AppBar(
        backgroundColor: _bgColor,
        title: Text(widget.config.name),
        leading: IconButton(
          icon: const Icon(Icons.close),
          onPressed: _exit,
        ),
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
          SafeArea(
            child: Padding(
              padding: const EdgeInsets.all(12),
              child: AnimatedBuilder(
                animation: _engine,
                builder: (_, __) => Column(
                  children: [
                    Text('Steps: ${_engine.score}',
                        style: const TextStyle(color: Color(0xFF22c55e), fontSize: 18, fontWeight: FontWeight.bold)),
                    const SizedBox(height: 8),
                    Expanded(
                      child: Center(
                        child: SizedBox(
                          width: cell * ClassicMazeEngine.size,
                          height: cell * ClassicMazeEngine.size,
                          child: GridView.builder(
                            gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
                              crossAxisCount: ClassicMazeEngine.size,
                              crossAxisSpacing: 1,
                              mainAxisSpacing: 1,
                            ),
                            itemCount: ClassicMazeEngine.size * ClassicMazeEngine.size,
                            physics: const NeverScrollableScrollPhysics(),
                            itemBuilder: (context, i) {
                              final x = i % ClassicMazeEngine.size;
                              final y = i ~/ ClassicMazeEngine.size;
                              Color color;
                              if (x == _engine.px && y == _engine.py) {
                                color = const Color(0xFF22c55e);
                              } else if (x == ClassicMazeEngine.size - 1 && y == ClassicMazeEngine.size - 1) {
                                color = _primaryColor;
                              } else if (_engine.maze[y][x] == 0) {
                                color = Colors.white10;
                              } else {
                                color = const Color(0xFF1a0e2e);
                              }
                              return Container(color: color);
                            },
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(height: 8),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        ElevatedButton(onPressed: () => _engine.move(0, -1), child: const Icon(Icons.arrow_upward)),
                      ],
                    ),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        ElevatedButton(onPressed: () => _engine.move(-1, 0), child: const Icon(Icons.arrow_back)),
                        const SizedBox(width: 8),
                        ElevatedButton(onPressed: () => _engine.move(1, 0), child: const Icon(Icons.arrow_forward)),
                      ],
                    ),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        ElevatedButton(onPressed: () => _engine.move(0, 1), child: const Icon(Icons.arrow_downward)),
                      ],
                    ),
                    const SizedBox(height: 8),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
