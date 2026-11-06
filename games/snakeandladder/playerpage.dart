import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import 'package:promogames_engine/engine.dart';
import 'logic.dart';

Widget buildSnakeAndLadderPlayer(GameConfig config, GameFinished onFinished) {
  return SnakeAndLadderPlayerPage(config: config, onFinished: onFinished);
}

class SnakeAndLadderPlayerPage extends StatefulWidget {
  final GameConfig config;
  final GameFinished onFinished;
  const SnakeAndLadderPlayerPage({super.key, required this.config, required this.onFinished});

  @override
  State<SnakeAndLadderPlayerPage> createState() => _SnakeAndLadderPlayerPageState();
}

class _SnakeAndLadderPlayerPageState extends State<SnakeAndLadderPlayerPage> {
  late final SnakeAndLadderEngine _engine;
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

    _engine = SnakeAndLadderEngine(settings: s);
    _engine.fx.listen(_onFx);
    _engine.addListener(_onEngineChanged);
  }

  void _onEngineChanged() {
    if (_engine.completed && !_reported) {
      _reported = true;
      Future.delayed(const Duration(milliseconds: 500), () {
        if (mounted) widget.onFinished(_engine.score, _engine.maxScore, true);
      });
    }
    if (mounted) setState(() {});
  }

  void _onFx(GameFx effect) {
    switch (effect) {
      case GameFx.win:
        HapticFeedback.heavyImpact();
      case GameFx.gameOver:
        HapticFeedback.vibrate();
      case GameFx.tick:
        HapticFeedback.lightImpact();
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
            builder: (_, __) => Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text(_engine.message,
                      style: const TextStyle(color: Colors.white, fontSize: 18)),
                  const SizedBox(height: 16),
                  Text('You: ${_engine.playerPosition}  |  AI: ${_engine.aiPosition}',
                      style: TextStyle(color: _primaryColor, fontSize: 16)),
                  const SizedBox(height: 24),
                  if (_engine.completed)
                    ElevatedButton(
                      style: ElevatedButton.styleFrom(backgroundColor: _primaryColor),
                      onPressed: () { _reported = false; _engine.newGame(); },
                      child: const Text('Play Again', style: TextStyle(color: Colors.white)),
                    )
                  else
                    ElevatedButton(
                      style: ElevatedButton.styleFrom(backgroundColor: _primaryColor),
                      onPressed: _engine.playerTurn
                          ? () { _engine.movePlayer(); if (!_engine.completed) _engine.moveAi(); }
                          : null,
                      child: const Text('Roll Dice', style: TextStyle(color: Colors.white)),
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
