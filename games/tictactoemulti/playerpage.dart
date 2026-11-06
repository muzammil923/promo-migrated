import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import 'package:promogames_engine/engine.dart';
import 'logic.dart';

Widget buildTicTacToeMultiPlayer(GameConfig config, GameFinished onFinished) {
  return TicTacToeMultiPlayerPage(config: config, onFinished: onFinished);
}

class TicTacToeMultiPlayerPage extends StatefulWidget {
  final GameConfig config;
  final GameFinished onFinished;
  const TicTacToeMultiPlayerPage(
      {super.key, required this.config, required this.onFinished});

  @override
  State<TicTacToeMultiPlayerPage> createState() =>
      _TicTacToeMultiPlayerPageState();
}

class _TicTacToeMultiPlayerPageState extends State<TicTacToeMultiPlayerPage> {
  late final TicTacToeMultiEngine _engine;
  late Color _bgColor;
  late Color _primaryColor;
  late Color _cellColor;
  String? _bgImageUrl;
  bool _reported = false;

  @override
  void initState() {
    super.initState();
    final s = widget.config.settings;
    _bgColor = _hex(s['bg_color']?.toString()) ?? const Color(0xFF1e293b);
    _primaryColor =
        _hex(s['primary_color']?.toString()) ?? const Color(0xFF6366f1);
    _cellColor =
        _hex(s['board_cell_color']?.toString()) ?? const Color(0xFFffffff);
    _bgImageUrl = s['bg_image_url']?.toString();

    _engine = TicTacToeMultiEngine(settings: s);
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
      case GameFx.correct:
        HapticFeedback.mediumImpact();
      case GameFx.win:
        HapticFeedback.heavyImpact();
      case GameFx.gameOver:
        HapticFeedback.vibrate();
      default:
        break;
    }
  }

  void _exit() {
    _engine.exitEarly();
    widget.onFinished(_engine.score, _engine.maxScore, false);
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
              imageUrl: _bgImageUrl!,
              fit: BoxFit.cover,
              placeholder: (_, __) => ColoredBox(color: _bgColor),
              errorWidget: (_, __, ___) => ColoredBox(color: _bgColor),
            )
          else
            ColoredBox(color: _bgColor),
          Container(color: Colors.black.withValues(alpha: 0.3)),
          SafeArea(
            child: Padding(
              padding: const EdgeInsets.all(24),
              child: AnimatedBuilder(
                animation: _engine,
                builder: (_, __) => Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    if (_engine.completed && _engine.winner == 'X')
                      Text('Player X Wins!',
                          style: TextStyle(
                              color: _primaryColor,
                              fontSize: 28,
                              fontWeight: FontWeight.bold))
                    else if (_engine.completed && _engine.winner == 'O')
                      Text('Player O Wins!',
                          style: const TextStyle(
                              color: Colors.redAccent,
                              fontSize: 28,
                              fontWeight: FontWeight.bold))
                    else if (_engine.completed && _engine.isDraw)
                      const Text('Draw!',
                          style: TextStyle(
                              color: Colors.white70,
                              fontSize: 28,
                              fontWeight: FontWeight.bold))
                    else
                      Text(
                          _engine.isPlayerXTurn
                              ? 'Player X\'s turn'
                              : 'Player O\'s turn',
                          style:
                              TextStyle(color: _primaryColor, fontSize: 18)),
                    const SizedBox(height: 32),
                    AspectRatio(
                      aspectRatio: 1,
                      child: GridView.builder(
                        physics: const NeverScrollableScrollPhysics(),
                        gridDelegate:
                            SliverGridDelegateWithFixedCrossAxisCount(
                          crossAxisCount: _engine.boardSize,
                          crossAxisSpacing: 6,
                          mainAxisSpacing: 6,
                        ),
                        itemCount: _engine.boardSize * _engine.boardSize,
                        itemBuilder: (_, i) {
                          final cell = _engine.board[i];
                          return GestureDetector(
                            onTap: () => _engine.play(i),
                            child: Container(
                              decoration: BoxDecoration(
                                color: _cellColor.withValues(alpha: 0.15),
                                borderRadius: BorderRadius.circular(10),
                              ),
                              child: Center(
                                child: Text(cell,
                                    style: TextStyle(
                                        fontSize: 36,
                                        fontWeight: FontWeight.bold,
                                        color: cell == 'X'
                                            ? _primaryColor
                                            : cell == 'O'
                                                ? Colors.redAccent
                                                : Colors.white70)),
                              ),
                            ),
                          );
                        },
                      ),
                    ),
                    const SizedBox(height: 32),
                    if (_engine.completed)
                      ElevatedButton(
                        style: ElevatedButton.styleFrom(
                          backgroundColor: _primaryColor,
                          padding: const EdgeInsets.symmetric(
                              horizontal: 32, vertical: 14),
                          shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(12)),
                        ),
                        onPressed: () {
                          _reported = false;
                          _engine.newGame();
                        },
                        child: const Text('Play Again',
                            style: TextStyle(
                                color: Colors.white, fontSize: 16)),
                      ),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
