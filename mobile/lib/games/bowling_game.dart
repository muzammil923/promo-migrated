import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:promogames_engine/engine.dart';
import 'package:promogames_engine/engine.dart';

Widget buildBowlingGame(GameConfig config, GameFinished onFinished) {
  return _BowlingGame(config: config, onFinished: onFinished);
}

class _BowlingGame extends StatefulWidget {
  final GameConfig config;
  final GameFinished onFinished;
  const _BowlingGame({required this.config, required this.onFinished});

  @override
  State<_BowlingGame> createState() => _BowlingGameState();
}

class _BowlingGameState extends State<_BowlingGame> {
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

  final String title = 'Bowling';
  static const int totalFrames = 5;
  static const int pinCount = 10;

  late List<bool> pins; // true = standing
  int frame = 0;
  int rollsInFrame = 0;
  int score = 0;
  bool rolling = false;
  double ballY = 0;
  String message = 'Tap ROLL to bowl!';

  @override
  void initState() {
    super.initState();
    _parseSettings();
    pins = List.filled(pinCount, true);
  }

  int standingCount() => pins.where((p) => p).length;

  void _roll() {
    if (rolling || frame >= totalFrames) return;
    setState(() {
      rolling = true;
      ballY = 0;
      message = 'Rolling...';
    });
    Future.delayed(const Duration(milliseconds: 600), () {
      final standing = standingCount();
      if (standing == 0) {
        // fresh rack
        pins = List.filled(pinCount, true);
      }
      final maxKnock = standingCount();
      final knock = maxKnock == 0
          ? 0
          : (DateTime.now().microsecondsSinceEpoch % (maxKnock + 1));
      int knocked = 0;
      for (int i = 0; i < pins.length && knocked < knock; i++) {
        if (pins[i]) {
          pins[i] = false;
          knocked++;
        }
      }
      score += knocked;
      rollsInFrame++;
      setState(() {
        rolling = false;
        ballY = 1;
        if (rollsInFrame >= 2 || standingCount() == 0) {
          rollsInFrame = 0;
          frame++;
          if (frame < totalFrames) {
            pins = List.filled(pinCount, true);
            message = 'Frame ${frame + 1}: tap ROLL';
          } else {
            message = 'Game over! Score: $score';
          }
        } else {
          message = 'Knocked $knocked! Tap ROLL again';
        }
      });
      if (frame >= totalFrames) {
        Future.delayed(const Duration(milliseconds: 700), () {
          widget.onFinished(score, totalFrames * pinCount, true);
        });
      }
    });
  }

  Widget _pin(int i) {
    final standing = pins[i];
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
      appBar: AppBar(
        title: Text(widget.config.name ?? title),
        backgroundColor: _bgColor,
        actions: [
          IconButton(
            icon: const Icon(Icons.close),
            onPressed: () => widget.onFinished(score, totalFrames * pinCount, false),
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
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text('Frame: ${frame + 1}/$totalFrames',
                      style: const TextStyle(color: Color(0xFF8b5cf6), fontSize: 16)),
                  Text('Score: $score',
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
                      alignment: Alignment(0, ballY == 1 ? 0.9 : -0.9),
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
            Text(message, style: const TextStyle(color: Colors.white70)),
            const SizedBox(height: 8),
            ElevatedButton(
              style: ElevatedButton.styleFrom(
                backgroundColor: _primaryColor,
                foregroundColor: Colors.white,
              ),
              onPressed: rolling || frame >= totalFrames ? null : _roll,
              child: const Text('ROLL'),
            ),
            const SizedBox(height: 16),
          ],
        ),
        ],
      ),
    );
  }
}
