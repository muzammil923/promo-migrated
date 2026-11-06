import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:promogames_engine/engine.dart';
import 'package:promogames_engine/engine.dart';

Widget buildRpsGame(GameConfig config, GameFinished onFinished) {
  return _RpsGame(config: config, onFinished: onFinished);
}

class _RpsGame extends StatefulWidget {
  final GameConfig config;
  final GameFinished onFinished;
  const _RpsGame({required this.config, required this.onFinished});

  @override
  State<_RpsGame> createState() => _RpsGameState();
}

class _RpsGameState extends State<_RpsGame> {
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

  final String title = 'Rock Paper Scissors';
  static const int roundsTotal = 7;

  final List<String> choices = ['rock', 'paper', 'scissors'];
  final Map<String, IconData> icons = {
    'rock': Icons.square_rounded,
    'paper': Icons.description,
    'scissors': Icons.content_cut,
  };

  int wins = 0;
  int losses = 0;
  int round = 0;
  String? playerChoice;
  String? cpuChoice;
  String result = 'Best of $roundsTotal — pick your move!';

  int _beats(String a, String b) {
    if (a == b) return 0;
    if ((a == 'rock' && b == 'scissors') ||
        (a == 'paper' && b == 'rock') ||
        (a == 'scissors' && b == 'paper')) {
      return 1;
    }
    return -1;
  }

  void _play(String choice) {
    if (round >= roundsTotal) {
      return;
    }
    final cpu = choices[DateTime.now().microsecondsSinceEpoch % 3];
    final outcome = _beats(choice, cpu);
    setState(() {
      playerChoice = choice;
      cpuChoice = cpu;
      round++;
      if (outcome == 1) {
        wins++;
        result = 'You win this round!';
      } else if (outcome == -1) {
        losses++;
        result = 'CPU wins this round.';
      } else {
        result = 'Draw!';
      }

      if (round >= roundsTotal) {
        result = 'Done! Wins: $wins  Losses: $losses';
      }
    });
    if (round >= roundsTotal) {
      Future.delayed(const Duration(milliseconds: 800), () {
        widget.onFinished(wins, roundsTotal, true);
      });
    }
  }

  Widget _choiceBtn(String c) => ElevatedButton(
        style: ElevatedButton.styleFrom(
          backgroundColor: _bgColor,
          foregroundColor: _primaryColor,
          side: const BorderSide(color: Color(0xFF8b5cf6)),
          padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 14),
        ),
        onPressed: round >= roundsTotal ? null : () => _play(c),
        child: Column(
          children: [
            Icon(icons[c], size: 30),
            Text(c, style: const TextStyle(fontSize: 12)),
          ],
        ),
      );

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(widget.config.name ?? title),
        backgroundColor: _bgColor,
        actions: [
          IconButton(
            icon: const Icon(Icons.close),
            onPressed: () => widget.onFinished(wins, roundsTotal, false),
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
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text('Round $round/$roundsTotal',
                style: const TextStyle(color: Color(0xFF8b5cf6), fontSize: 18)),
            const SizedBox(height: 8),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceEvenly,
              children: [
                Column(children: [
                  const Text('You', style: TextStyle(color: Colors.white70)),
                  Icon(icons[playerChoice ?? 'rock'], size: 40, color: const Color(0xFF22c55e)),
                ]),
                Column(children: [
                  const Text('CPU', style: TextStyle(color: Colors.white70)),
                  Icon(icons[cpuChoice ?? 'rock'], size: 40, color: Colors.red),
                ]),
              ],
            ),
            const SizedBox(height: 16),
            Text(result, style: const TextStyle(color: Colors.white, fontSize: 16), textAlign: TextAlign.center),
            const SizedBox(height: 24),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceEvenly,
              children: choices.map(_choiceBtn).toList(),
            ),
            const SizedBox(height: 24),
            Text('Wins: $wins   Losses: $losses',
                style: const TextStyle(color: Color(0xFF22c55e), fontSize: 16)),
          ],
        ),
        ],
      ),
    );
  }
}
