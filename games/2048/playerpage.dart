import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import 'package:promogames_engine/engine.dart';
import 'logic.dart';

Widget build2048Player(GameConfig config, GameFinished onFinished) {
  return Game2048PlayerPage(config: config, onFinished: onFinished);
}

class Game2048PlayerPage extends StatefulWidget {
  final GameConfig config;
  final GameFinished onFinished;
  const Game2048PlayerPage({super.key, required this.config, required this.onFinished});

  @override
  State<Game2048PlayerPage> createState() => _Game2048PlayerPageState();
}

class _Game2048PlayerPageState extends State<Game2048PlayerPage> {
  late final Game2048Engine _engine;
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

    _engine = Game2048Engine(settings: s);
    _engine.fx.listen(_onFx);
    _engine.addListener(_onEngineChanged);
  }

  void _onEngineChanged() {
    if (_engine.completed && !_reported) {
      _reported = true;
      Future.delayed(const Duration(milliseconds: 200), () {
        if (mounted) widget.onFinished(_engine.score, _engine.maxScore, true);
      });
    }
    if (mounted) setState(() {});
  }

  void _onFx(GameFx effect) {
    switch (effect) {
      case GameFx.tick:
        HapticFeedback.selectionClick();
      case GameFx.gameOver:
        HapticFeedback.vibrate();
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

  Color _tileColor(int v) {
    switch (v) {
      case 2: return _primaryColor;
      case 4: return const Color(0xFF22c55e);
      case 8: return const Color(0xFFf59e0b);
      case 16: return const Color(0xFFef4444);
      case 32: return const Color(0xFF06b6d4);
      case 64: return const Color(0xFFec4899);
      default: return v == 0 ? const Color(0xFF1a0e2e) : const Color(0xFFa855f7);
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
          AnimatedBuilder(
            animation: _engine,
            builder: (_, __) => Column(
              children: [
                Padding(
                  padding: const EdgeInsets.all(8),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text('Score: ${_engine.score}',
                          style: const TextStyle(color: Color(0xFF22c55e), fontSize: 18)),
                      ElevatedButton(
                        onPressed: () { _reported = false; _engine.newGame(); },
                        style: ElevatedButton.styleFrom(backgroundColor: _primaryColor),
                        child: const Text('Restart'),
                      ),
                    ],
                  ),
                ),
                Expanded(
                  child: GestureDetector(
                    onVerticalDragEnd: (d) {
                      if (d.primaryVelocity! < 0) _engine.move('up');
                      else if (d.primaryVelocity! > 0) _engine.move('down');
                    },
                    onHorizontalDragEnd: (d) {
                      if (d.primaryVelocity! < 0) _engine.move('left');
                      else if (d.primaryVelocity! > 0) _engine.move('right');
                    },
                    child: Padding(
                      padding: const EdgeInsets.all(12),
                      child: GridView.count(
                        crossAxisCount: 4,
                        crossAxisSpacing: 6,
                        mainAxisSpacing: 6,
                        children: [
                          for (int r = 0; r < 4; r++)
                            for (int c = 0; c < 4; c++)
                              Container(
                                decoration: BoxDecoration(
                                  color: _tileColor(_engine.board[r][c]),
                                  borderRadius: BorderRadius.circular(8),
                                ),
                                alignment: Alignment.center,
                                child: Text(
                                  _engine.board[r][c] == 0 ? '' : '${_engine.board[r][c]}',
                                  style: const TextStyle(
                                      fontSize: 22,
                                      fontWeight: FontWeight.bold,
                                      color: Colors.white),
                                ),
                              ),
                        ],
                      ),
                    ),
                  ),
                ),
                if (_engine.isOver)
                  const Padding(
                    padding: EdgeInsets.all(8),
                    child: Text('NO MOVES LEFT',
                        style: TextStyle(color: Colors.red, fontSize: 22)),
                  ),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                  children: [
                    _btn(Icons.arrow_upward, () => _engine.move('up')),
                    Row(children: [
                      _btn(Icons.arrow_back, () => _engine.move('left')),
                      _btn(Icons.arrow_forward, () => _engine.move('right')),
                    ]),
                    _btn(Icons.arrow_downward, () => _engine.move('down')),
                  ],
                ),
                const SizedBox(height: 8),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _btn(IconData i, VoidCallback f) => IconButton(
        icon: Icon(i, color: _primaryColor),
        onPressed: f,
      );
}
