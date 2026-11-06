import 'dart:async';
import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:promogames_engine/engine.dart';

Widget buildSoundifyGame(GameConfig config, GameFinished onFinished) {
  return _SfGame(config: config, onFinished: onFinished);
}

class _SfGame extends StatefulWidget {
  final GameConfig config;
  final GameFinished onFinished;
  const _SfGame({required this.config, required this.onFinished});

  @override
  State<_SfGame> createState() => _SfGameState();
}

class _SfGameState extends State<_SfGame> {
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

  static const int padCount = 4;
  List<int> sequence = [];
  int playerIndex = 0;
  int combo = 0;
  int maxCombo = 0;
  bool showing = false;
  int? litPad;
  bool finished = false;
  Timer? timer;

  final colors = const [
    Color(0xFF8b5cf6),
    Color(0xFF22c55e),
    Color(0xFFef4444),
    Color(0xFFf59e0b),
  ];

  @override
  void initState() {
    super.initState();
    _parseSettings();
    _nextRound();
  }

  void _nextRound() {
    if (finished) return;
    sequence.add(DateTime.now().millisecondsSinceEpoch % padCount);
    playerIndex = 0;
    _playSequence();
  }

  void _playSequence() {
    showing = true;
    setState(() {});
    int i = 0;
    timer?.cancel();
    timer = Timer.periodic(const Duration(milliseconds: 500), (t) {
      if (i >= sequence.length) {
        t.cancel();
        showing = false;
        setState(() {});
        return;
      }
      setState(() => litPad = sequence[i]);
      Future.delayed(const Duration(milliseconds: 300), () {
        if (mounted) setState(() => litPad = null);
      });
      i++;
    });
  }

  void _tapPad(int pad) {
    if (showing || finished) return;
    setState(() => litPad = pad);
    Future.delayed(const Duration(milliseconds: 150), () {
      if (mounted) setState(() => litPad = null);
    });
    if (pad == sequence[playerIndex]) {
      playerIndex++;
      combo++;
      if (combo > maxCombo) maxCombo = combo;
      if (playerIndex >= sequence.length) {
        Future.delayed(const Duration(milliseconds: 300), _nextRound);
      }
    } else {
      combo = 0;
      _gameOver();
    }
    setState(() {});
  }

  void _gameOver() {
    finished = true;
    Future.delayed(const Duration(milliseconds: 400), () {
      widget.onFinished(maxCombo, 0, true);
    });
  }

  void _finish() {
    if (finished) return;
    finished = true;
    widget.onFinished(maxCombo, 0, false);
  }

  @override
  void dispose() {
    timer?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final title = widget.config.name ?? 'Soundify';
    return Scaffold(
      appBar: AppBar(
        title: Text(title),
        backgroundColor: _bgColor,
        actions: [
          IconButton(icon: const Icon(Icons.close), onPressed: _finish),
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
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text(showing ? 'Watch the sequence...' : 'Repeat the sequence!',
                style: const TextStyle(color: Colors.white70, fontSize: 16)),
            const SizedBox(height: 8),
            Text('Max combo: $maxCombo',
                style: const TextStyle(
                    color: Color(0xFF22c55e), fontSize: 22)),
            const SizedBox(height: 20),
            SizedBox(
              width: 260,
              height: 260,
              child: GridView.count(
                crossAxisCount: 2,
                mainAxisSpacing: 12,
                crossAxisSpacing: 12,
                padding: const EdgeInsets.all(12),
                children: List.generate(padCount, (i) {
                  final lit = litPad == i;
                  return GestureDetector(
                    onTap: () => _tapPad(i),
                    child: AnimatedContainer(
                      duration: const Duration(milliseconds: 120),
                      decoration: BoxDecoration(
                        color: lit
                            ? colors[i]
                            : colors[i].withOpacity(0.35),
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(
                          color: lit
                              ? Colors.white
                              : colors[i],
                          width: lit ? 3 : 1,
                        ),
                        boxShadow: lit
                            ? [
                                BoxShadow(
                                  color: colors[i],
                                  blurRadius: 24,
                                  spreadRadius: 4,
                                )
                              ]
                            : [],
                      ),
                    ),
                  );
                }),
              ),
            ),
            const SizedBox(height: 16),
            ElevatedButton(
              style: ElevatedButton.styleFrom(
                backgroundColor: _primaryColor,
              ),
              onPressed: _finish,
              child: const Text('Finish'),
            ),
          ],
        ),
        ],
      ),
    );
  }
}
