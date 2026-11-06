import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import 'package:promogames_engine/engine.dart';
import 'logic.dart';

Widget buildConnect4Player(GameConfig config, GameFinished onFinished) {
  return Connect4PlayerPage(config: config, onFinished: onFinished);
}

class Connect4PlayerPage extends StatefulWidget {
  final GameConfig config;
  final GameFinished onFinished;
  const Connect4PlayerPage({super.key, required this.config, required this.onFinished});

  @override
  State<Connect4PlayerPage> createState() => _Connect4PlayerPageState();
}

class _Connect4PlayerPageState extends State<Connect4PlayerPage> {
  late final Connect4Engine _engine;
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

    _engine = Connect4Engine(settings: s);
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
        HapticFeedback.selectionClick();
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
    try { return Color(int.parse(h, radix: 16)); } catch (_) { return null; }
  }

  @override
  void dispose() {
    _engine.removeListener(_onEngineChanged);
    _engine.dispose();
    super.dispose();
  }

  String _statusText() {
    if (_engine.completed) {
      return _engine.result == 1 ? 'You win!' : _engine.result == 2 ? 'CPU wins' : 'Draw';
    }
    return _engine.isPlayerTurn ? 'Your turn (purple)' : 'CPU thinking...';
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
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Text(_statusText(),
                    style: const TextStyle(color: Color(0xFF22c55e), fontSize: 20)),
                const SizedBox(height: 12),
                LayoutBuilder(
                  builder: (ctx, c) {
                    final size = c.maxWidth < 420 ? c.maxWidth : 420.0;
                    final cell = size / Connect4Engine.cols;
                    return GestureDetector(
                      onTapDown: (d) {
                        final box = ctx.findRenderObject() as RenderBox;
                        final local = box.globalToLocal(d.globalPosition);
                        final col = (local.dx / cell).floor();
                        if (col >= 0 && col < Connect4Engine.cols) _engine.tapColumn(col);
                      },
                      child: Container(
                        width: size,
                        height: cell * Connect4Engine.rows,
                        padding: const EdgeInsets.all(6),
                        decoration: BoxDecoration(
                          color: const Color(0xFF0d0a1a),
                          borderRadius: BorderRadius.circular(10),
                          border: Border.all(color: _primaryColor),
                        ),
                        child: CustomPaint(
                          painter: _C4Painter(
                            _engine.board, Connect4Engine.rows, Connect4Engine.cols,
                            cell, _primaryColor,
                          ),
                        ),
                      ),
                    );
                  },
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _C4Painter extends CustomPainter {
  final Color primaryColor;
  final List<List<int?>> board;
  final int rows;
  final int cols;
  final double cell;
  _C4Painter(this.board, this.rows, this.cols, this.cell, this.primaryColor);

  @override
  void paint(Canvas canvas, Size size) {
    final bg = Paint()..color = const Color(0xFF1a0e2e);
    canvas.drawRect(Rect.fromLTWH(0, 0, size.width, size.height), bg);
    for (int r = 0; r < rows; r++) {
      for (int c = 0; c < cols; c++) {
        final v = board[r][c];
        canvas.drawCircle(
          Offset(c * cell + cell / 2, r * cell + cell / 2),
          cell / 2 - 3,
          Paint()
            ..color = v == 1
                ? primaryColor
                : v == 2
                    ? const Color(0xFF22c55e)
                    : Colors.black54,
        );
      }
    }
  }

  @override
  bool shouldRepaint(covariant CustomPainter old) => true;
}
