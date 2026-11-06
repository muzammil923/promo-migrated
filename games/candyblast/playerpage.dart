import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import 'package:promogames_engine/engine.dart';
import 'logic.dart';

Widget buildCandyBlastPlayer(GameConfig config, GameFinished onFinished) {
  return CandyBlastPlayerPage(config: config, onFinished: onFinished);
}

class CandyBlastPlayerPage extends StatefulWidget {
  final GameConfig config;
  final GameFinished onFinished;
  const CandyBlastPlayerPage({super.key, required this.config, required this.onFinished});

  @override
  State<CandyBlastPlayerPage> createState() => _CandyBlastPlayerPageState();
}

class _CandyBlastPlayerPageState extends State<CandyBlastPlayerPage> {
  late final CandyBlastEngine _engine;
  late Color _bgColor;
  late Color _primaryColor;
  String? _bgImageUrl;
  bool _reported = false;

  static const List<Color> palette = [
    Color(0xFF8b5cf6),
    Color(0xFF22c55e),
    Color(0xFFef4444),
    Color(0xFFf59e0b),
    Color(0xFF06b6d4),
    Color(0xFFec4899),
  ];

  @override
  void initState() {
    super.initState();
    final s = widget.config.settings;
    _bgColor = _hex(s['bg_color']?.toString()) ?? const Color(0xFF0d0a1a);
    _primaryColor = _hex(s['primary_color']?.toString()) ?? const Color(0xFF8b5cf6);
    _bgImageUrl = s['bg_image_url']?.toString();

    _engine = CandyBlastEngine(settings: s);
    _engine.fx.listen(_onFx);
    _engine.addListener(_onEngineChanged);
  }

  void _onEngineChanged() {
    if (mounted) setState(() {});
  }

  void _onFx(GameFx effect) {
    switch (effect) {
      case GameFx.correct:
        HapticFeedback.mediumImpact();
      default:
        break;
    }
  }

  void _exit() {
    widget.onFinished(_engine.score, 0, false);
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
                  padding: const EdgeInsets.all(10),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text('Score: ${_engine.score}',
                          style: const TextStyle(color: Color(0xFF22c55e), fontSize: 18)),
                      const Text('Tap two adjacent candies',
                          style: TextStyle(color: Colors.white70, fontSize: 12)),
                    ],
                  ),
                ),
                Expanded(
                  child: Padding(
                    padding: const EdgeInsets.all(8),
                    child: GridView.builder(
                      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                        crossAxisCount: CandyBlastEngine.n,
                        crossAxisSpacing: 2,
                        mainAxisSpacing: 2,
                      ),
                      itemCount: CandyBlastEngine.n * CandyBlastEngine.n,
                      itemBuilder: (ctx, idx) {
                        final r = idx ~/ CandyBlastEngine.n;
                        final c = idx % CandyBlastEngine.n;
                        final v = _engine.board[r][c];
                        final isSel = _engine.selected != null &&
                            _engine.selected![0] == r && _engine.selected![1] == c;
                        return GestureDetector(
                          onTap: () => _engine.tap(r, c),
                          child: Container(
                            decoration: BoxDecoration(
                              color: v < 0 ? Colors.black : palette[v],
                              borderRadius: BorderRadius.circular(6),
                              border: Border.all(
                                color: isSel ? const Color(0xFF22c55e) : Colors.transparent,
                                width: isSel ? 3 : 0,
                              ),
                            ),
                          ),
                        );
                      },
                    ),
                  ),
                ),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                  children: [
                    ElevatedButton(
                      style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF1a0e2e)),
                      onPressed: _exit,
                      child: const Text('FINISH', style: TextStyle(color: Color(0xFF8b5cf6))),
                    ),
                    ElevatedButton(
                      style: ElevatedButton.styleFrom(backgroundColor: _primaryColor),
                      onPressed: () { _reported = false; _engine.newGame(); },
                      child: const Text('RESTART', style: TextStyle(color: Colors.white)),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
