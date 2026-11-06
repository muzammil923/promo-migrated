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

Widget buildWordScrambleGame(GameConfig config, GameFinished onFinished) {
  return _WordScrambleGame(config: config, onFinished: onFinished);
}

class _WordScrambleGame extends StatefulWidget {
  final GameConfig config;
  final GameFinished onFinished;
  const _WordScrambleGame({required this.config, required this.onFinished});

  @override
  State<_WordScrambleGame> createState() => _WordScrambleGameState();
}

class _WordScrambleGameState extends State<_WordScrambleGame> {
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

  final List<String> _words = ['FLUTTER', 'GAMING', 'PUZZLE', 'REWARD', 'BONUS', 'PLAYER'];
  final List<TextEditingController> _controllers = [];
  int _round = 0;
  int _score = 0;
  late String _scrambled;
  String _feedback = '';

  @override
  void initState() {
    super.initState();
    _parseSettings();
    for (var i = 0; i < _words.length; i++) {
      _controllers.add(TextEditingController());
    }
    _scrambleCurrent();
  }

  @override
  void dispose() {
    for (final c in _controllers) {
      c.dispose();
    }
    super.dispose();
  }

  String _scramble(String w) {
    final chars = w.split('');
    int s = w.length * 31 + 7;
    int rnd() {
      s = (s * 1103515245 + 12345) & 0x7fffffff;
      return (s >> 8) % 1000;
    }
    for (var i = chars.length - 1; i > 0; i--) {
      final j = rnd() % (i + 1);
      final t = chars[i];
      chars[i] = chars[j];
      chars[j] = t;
    }
    final result = chars.join();
    return result == w ? _scramble(w) : result;
  }

  void _scrambleCurrent() {
    _scrambled = _scramble(_words[_round]);
    _controllers[_round].clear();
    _feedback = '';
  }

  void _submit() {
    final ans = _controllers[_round].text.trim().toUpperCase();
    if (ans == _words[_round]) {
      _score++;
      _feedback = 'Correct!';
      if (_round + 1 >= _words.length) {
        widget.onFinished(_score, _words.length, true);
        return;
      }
      setState(() {
        _round++;
        _scrambleCurrent();
      });
    } else {
      setState(() => _feedback = 'Try again');
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
            widget.onFinished(_score, _words.length, false);
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

              padding: const EdgeInsets.all(24),

              child:  Column(
          children: [
            Text('Score: $_score / ${_words.length}   Round ${_round + 1}/${_words.length}',
                style: const TextStyle(color: _green, fontSize: 18, fontWeight: FontWeight.bold)),
            const SizedBox(height: 40),
            const Text('Unscramble the word:', style: TextStyle(color: Colors.white70, fontSize: 16)),
            const SizedBox(height: 16),
            Container(
              padding: const EdgeInsets.symmetric(vertical: 20, horizontal: 16),
              decoration: BoxDecoration(
                color: _purple.withOpacity(0.2),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: _purple, width: 2),
              ),
              child: Text(_scrambled,
                  style: const TextStyle(
                      fontSize: 34, letterSpacing: 6, color: Colors.white, fontWeight: FontWeight.bold)),
            ),
            const SizedBox(height: 24),
            TextField(
              controller: _controllers[_round],
              textAlign: TextAlign.center,
              textCapitalization: TextCapitalization.characters,
              style: const TextStyle(fontSize: 24, color: _green, letterSpacing: 4),
              decoration: InputDecoration(
                hintText: 'Your answer',
                hintStyle: const TextStyle(color: Colors.white38),
                enabledBorder: OutlineInputBorder(
                  borderSide: const BorderSide(color: _purple),
                  borderRadius: BorderRadius.circular(10),
                ),
                focusedBorder: OutlineInputBorder(
                  borderSide: const BorderSide(color: _green),
                  borderRadius: BorderRadius.circular(10),
                ),
              ),
            ),
            const SizedBox(height: 16),
            Text(_feedback, style: TextStyle(color: _feedback == 'Correct!' ? _green : Colors.redAccent)),
            const SizedBox(height: 24),
            ElevatedButton(
              style: ElevatedButton.styleFrom(backgroundColor: _purple, minimumSize: const Size(160, 48)),
              onPressed: _submit,
              child: const Text('Submit'),
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
