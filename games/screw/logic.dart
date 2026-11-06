import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:promogames_engine/engine.dart';

Widget buildScrewGame(GameConfig config, GameFinished onFinished) {
  return _ScrewGame(config: config, onFinished: onFinished);
}

class _ScrewGame extends StatefulWidget {
  final GameConfig config;
  final GameFinished onFinished;
  const _ScrewGame({required this.config, required this.onFinished});

  @override
  State<_ScrewGame> createState() => _ScrewGameState();
}

class _ScrewGameState extends State<_ScrewGame> {
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

  // Each screw needs a number of turns to be fully removed.
  late List<Screw> screws;
  int removed = 0;

  @override
  void initState() {
    super.initState();
    _parseSettings();
    _newGame();
  }

  void _newGame() {
    final n = (widget.config.settings['count'] as int?) ?? 9;
    final cols = 3;
    screws = List.generate(n, (i) {
      final layer = i ~/ cols; // top layers must be removed first
      return Screw(
        id: i,
        turns: 2 + (i % 3),
        layer: layer,
      );
    });
    removed = 0;
  }

  bool _canUnscrew(int i) {
    final s = screws[i];
    if (s.turns == 0) return false;
    // A screw is blocked if any screw on a higher layer above its column exists.
    final col = i % 3;
    for (int j = 0; j < screws.length; j++) {
      if (j == i) continue;
      final other = screws[j];
      if (other.layer < s.layer) continue;
      if (other.turns == 0) continue;
      if (other.id % 3 == col && other.layer < s.layer) return false;
    }
    return true;
  }

  void _tap(int i) {
    if (screws[i].turns == 0) return;
    if (!_canUnscrew(i)) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Unscrew the screws on top first'),
          duration: Duration(milliseconds: 600),
        ),
      );
      return;
    }
    setState(() {
      screws[i].turns--;
      screws[i].angle += 0.5;
      if (screws[i].turns == 0) {
        removed++;
        if (removed == screws.length) {
          Future.delayed(const Duration(milliseconds: 300), () {
            widget.onFinished(removed, screws.length, true);
          });
        }
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final title = widget.config.name ?? 'Screw';
    final cols = 3;
    return Scaffold(
      appBar: AppBar(
        title: Text(title),
        backgroundColor: _bgColor,
        actions: [
          IconButton(
            icon: const Icon(Icons.close),
            onPressed: () => widget.onFinished(removed, screws.length, false),
          )
        ],
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

           Column(
          children: [
            Padding(
              padding: const EdgeInsets.all(12),
              child: Text('Unscrewed: $removed / ${screws.length}',
                  style: const TextStyle(color: Color(0xFF22c55e), fontSize: 18)),
            ),
            Expanded(
              child: GridView.builder(
                padding: const EdgeInsets.all(16),
                gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
                  crossAxisCount: cols,
                  mainAxisSpacing: 16,
                  crossAxisSpacing: 16,
                  childAspectRatio: 1,
                ),
                itemCount: screws.length,
                itemBuilder: (ctx, i) => _screw(i),
              ),
            ),
          ],
        ),
      ],
    ),
  );
  }

  Widget _screw(int i) {
    final s = screws[i];
    final done = s.turns == 0;
    final blocked = !done && !_canUnscrew(i);
    return GestureDetector(
      onTap: () => _tap(i),
      child: Container(
        decoration: BoxDecoration(
          color: const Color(0xFF1a0e2e),
          borderRadius: BorderRadius.circular(14),
          border: Border.all(
            color: blocked
                ? Colors.white24
                : (done ? Colors.transparent : _primaryColor),
            width: 2,
          ),
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Transform.rotate(
              angle: s.angle,
              child: Icon(
                Icons.build_circle,
                size: 46,
                color: done
                    ? const Color(0xFF22c55e)
                    : (blocked ? Colors.white24 : _primaryColor),
              ),
            ),
            const SizedBox(height: 6),
            Text(
              done ? 'done' : '${s.turns} turns',
              style: TextStyle(
                color: done ? const Color(0xFF22c55e) : Colors.white70,
                fontSize: 12,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class Screw {
  final int id;
  final int layer;
  int turns;
  double angle;
  Screw({required this.id, required this.turns, required this.layer, this.angle = 0});
}
