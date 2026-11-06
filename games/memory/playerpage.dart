import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import 'package:promogames_engine/engine.dart';
import 'logic.dart';

/// Native memory player screen — flip cards fed by real admin tiles, themed
/// from builder settings, haptics on match/mismatch/win.
Widget buildMemoryPlayer(GameConfig config, GameFinished onFinished) {
  return MemoryPlayerPage(config: config, onFinished: onFinished);
}

class MemoryPlayerPage extends StatefulWidget {
  final GameConfig config;
  final GameFinished onFinished;
  const MemoryPlayerPage({super.key, required this.config, required this.onFinished});

  @override
  State<MemoryPlayerPage> createState() => _MemoryPlayerPageState();
}

class _MemoryPlayerPageState extends State<MemoryPlayerPage> {
  late final MemoryEngine _engine;
  late Color _bgColor;
  late Color _primaryColor;
  String? _bgImageUrl;
  bool _reported = false;

  @override
  void initState() {
    super.initState();
    final s = widget.config.settings;
    _bgColor = _hex(s['bg_color']?.toString()) ?? const Color(0xFF0d0a1a);
    _primaryColor = _hex(s['primary_color']?.toString()) ?? const Color(0xFF6366f1);
    _bgImageUrl = s['bg_image_url']?.toString();
    _engine = MemoryEngine(settings: s, tiles: widget.config.tiles);
    _engine.fx.listen(_onFx);
    _engine.addListener(_onEngineChanged);
  }

  void _onEngineChanged() {
    if (_engine.completed && !_reported) {
      _reported = true;
      Future.delayed(const Duration(milliseconds: 600), () {
        if (mounted) {
          widget.onFinished(_engine.score, _engine.maxScore,
              _engine.score > 0 || _engine.timeLeft != null && _engine.timeLeft! > 0);
        }
      });
    }
    if (mounted) setState(() {});
  }

  void _onFx(GameFx effect) {
    switch (effect) {
      case GameFx.match:
        HapticFeedback.mediumImpact();
      case GameFx.mismatch:
        HapticFeedback.selectionClick();
      case GameFx.win || GameFx.gameOver:
        HapticFeedback.heavyImpact();
      default:
        break;
    }
  }

  @override
  void dispose() {
    _engine.removeListener(_onEngineChanged);
    _engine.dispose();
    super.dispose();
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
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: _bgColor,
      appBar: AppBar(
        backgroundColor: _bgColor,
        title: Text(widget.config.name),
        leading: IconButton(
          icon: const Icon(Icons.close),
          onPressed: () {
            _engine.exitEarly();
            widget.onFinished(_engine.score, _engine.maxScore, false);
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
              placeholder: (_, __) => ColoredBox(color: _bgColor),
              errorWidget: (_, __, ___) => ColoredBox(color: _bgColor),
            )
          else
            ColoredBox(color: _bgColor),
          Container(color: Colors.black.withOpacity(0.3)),
          SafeArea(
            child: AnimatedBuilder(
              animation: _engine,
              builder: (_, __) => Column(
                children: [
                  Padding(
                    padding: const EdgeInsets.all(12),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text('Matches: ${_engine.score} / ${_engine.pairsTotal}',
                            style: TextStyle(
                                color: _primaryColor, fontSize: 16, fontWeight: FontWeight.bold)),
                        if (_engine.timeLeft != null)
                          Chip(
                            avatar: Icon(Icons.timer_outlined,
                                size: 15, color: _primaryColor),
                            label: Text('${_engine.timeLeft}s',
                                style: const TextStyle(color: Colors.white, fontSize: 13)),
                            backgroundColor: Colors.white10,
                          ),
                      ],
                    ),
                  ),
                  Expanded(
                    child: GridView.builder(
                      padding: const EdgeInsets.all(14),
                      gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
                        crossAxisCount: _engine.cols,
                        crossAxisSpacing: 8,
                        mainAxisSpacing: 8,
                      ),
                      itemCount: _engine.cards.length,
                      itemBuilder: (context, i) => _card(i),
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

  Widget _card(int i) {
    final revealed = _engine.isRevealed(i);
    final matched = _engine.isMatched(i);
    final card = _engine.cards[i];
    return GestureDetector(
      onTap: () => _engine.flip(i),
      child: AnimatedOpacity(
        duration: const Duration(milliseconds: 250),
        opacity: matched ? 0.55 : 1,
        child: Container(
          decoration: BoxDecoration(
            color: revealed ? _primaryColor.withOpacity(0.30) : Colors.white10,
            border: Border.all(color: matched ? const Color(0xFF22c55e) : _primaryColor, width: 2),
            borderRadius: BorderRadius.circular(10),
          ),
          child: revealed
              ? _face(card)
              : Center(
                  child: Text('?',
                      style: TextStyle(fontSize: 30, color: _primaryColor))),
        ),
      ),
    );
  }

  Widget _face(MemoryCard card) {
    if (card.imageUrl != null && card.imageUrl!.isNotEmpty) {
      return ClipRRect(
        borderRadius: BorderRadius.circular(8),
        child: CachedNetworkImage(
          imageUrl: card.imageUrl!,
          fit: BoxFit.cover,
          placeholder: (_, __) => const SizedBox.shrink(),
          errorWidget: (_, __, ___) =>
              Center(child: Text(card.label ?? '★', style: const TextStyle(fontSize: 28))),
        ),
      );
    }
    return Center(
      child: Text(card.label ?? '★', style: const TextStyle(fontSize: 30)),
    );
  }
}
