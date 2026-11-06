import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:promogames_engine/engine.dart';
import 'package:promogames_engine/engine.dart';

const _bg = LinearGradient(
  begin: Alignment.topLeft,
  end: Alignment.bottomRight,
  colors: [Color(0xFF0d0a1a), Color(0xFF1a0e2e), Color(0xFF0f0b1e), Color(0xFF080612)],
);
const _purple = Color(0xFF8b5cf6);
const _green = Color(0xFF22c55e);

Widget buildMemoryGame(GameConfig config, GameFinished onFinished) {
  return _MemoryGame(config: config, onFinished: onFinished);
}

class _MemoryGame extends StatefulWidget {
  final GameConfig config;
  final GameFinished onFinished;
  const _MemoryGame({required this.config, required this.onFinished});

  @override
  State<_MemoryGame> createState() => _MemoryGameState();
}

class _MemoryGameState extends State<_MemoryGame> {
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

  static const _emojis = ['🍎', '🚀', '⭐', '🎈', '🐱', '🌈', '🍕', '⚽'];
  late List<String> _cards;
  late List<bool> _revealed;
  late List<bool> _matched;
  int _firstIndex = -1;
  int _matches = 0;
  bool _busy = false;

  int get _totalPairs => _emojis.length;

  @override
  void initState() {
    super.initState();
    _parseSettings();
    _cards = [..._emojis, ..._emojis];
    _cards.shuffle();
    _revealed = List.filled(_cards.length, false);
    _matched = List.filled(_cards.length, false);
  }

  void _tap(int i) {
    if (_busy || _revealed[i] || _matched[i]) return;
    setState(() => _revealed[i] = true);
    if (_firstIndex == -1) {
      _firstIndex = i;
      return;
    }
    final first = _firstIndex;
    _firstIndex = -1;
    if (_cards[first] == _cards[i]) {
      setState(() {
        _matched[first] = true;
        _matched[i] = true;
        _matches++;
      });
      if (_matches == _totalPairs) {
        widget.onFinished(_matches, _totalPairs, true);
      }
    } else {
      _busy = true;
      Future.delayed(const Duration(milliseconds: 700), () {
        if (!mounted) return;
        setState(() {
          _revealed[first] = false;
          _revealed[i] = false;
          _busy = false;
        });
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        backgroundColor: _bgColor,
        title: Text(widget.config.name ?? 'Game'),
        leading: IconButton(
          icon: const Icon(Icons.close),
          onPressed: () {
            widget.onFinished(_matches, _totalPairs, false);
            Navigator.of(context).maybePop();
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

              placeholder: (_, __) => Container(color: _bgColor),

              errorWidget: (_, __, ___) => Container(color: _bgColor),

            )

          else Container(color: _bgColor),

          Container(color: Colors.black.withOpacity(0.3)),

          SafeArea(

            child: Padding(

              padding: const EdgeInsets.all(16),

              child:  Column(
          children: [
            Text('Matches: $_matches / $_totalPairs',
                style: const TextStyle(color: _green, fontSize: 18, fontWeight: FontWeight.bold)),
            const SizedBox(height: 16),
            Expanded(
              child: GridView.builder(
                gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                  crossAxisCount: 4,
                  crossAxisSpacing: 8,
                  mainAxisSpacing: 8,
                ),
                itemCount: _cards.length,
                itemBuilder: (context, i) {
                  final show = _revealed[i] || _matched[i];
                  return GestureDetector(
                    onTap: () => _tap(i),
                    child: Container(
                      decoration: BoxDecoration(
                        color: show ? _purple.withOpacity(0.3) : Colors.white10,
                        border: Border.all(color: _matched[i] ? _green : _purple, width: 2),
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: Center(
                        child: Text(show ? _cards[i] : '?',
                            style: const TextStyle(fontSize: 30, color: Colors.white)),
                      ),
                    ),
                  );
                },
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
}
