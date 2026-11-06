import 'dart:math';

import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import 'package:promogames_engine/engine.dart';
import 'logic.dart';

/// Native Nagaraja player screen (Slither-style). Reads builder settings from
/// [GameConfig], drives the headless engine and translates its fx into haptics.
Widget buildNagarajaPlayer(GameConfig config, GameFinished onFinished) {
  return NagarajaPlayerPage(config: config, onFinished: onFinished);
}

class NagarajaPlayerPage extends StatefulWidget {
  final GameConfig config;
  final GameFinished onFinished;
  const NagarajaPlayerPage({super.key, required this.config, required this.onFinished});

  @override
  State<NagarajaPlayerPage> createState() => _NagarajaPlayerPageState();
}

class _NagarajaPlayerPageState extends State<NagarajaPlayerPage> {
  late final NagarajaEngine _engine;
  late Color _bgColor;
  late Color _snakeColor;
  String? _bgImageUrl;
  bool _reported = false;
  bool _started = false;

  @override
  void initState() {
    super.initState();
    final s = widget.config.settings;
    _bgColor = _hex(s['bg_color']?.toString()) ?? const Color(0xFF0d0a1a);
    _snakeColor = _hex(s['snake_color']?.toString()) ?? const Color(0xFF22c55e);
    _bgImageUrl = s['bg_image_url']?.toString();

    _engine = NagarajaEngine(settings: s);
    _engine.fx.listen(_onFx);
    _engine.addListener(_onEngineChanged);
  }

  void _onEngineChanged() {
    if (_engine.completed && !_reported) {
      _reported = true;
      Future.delayed(const Duration(milliseconds: 400), () {
        if (mounted) widget.onFinished(_engine.score, _engine.maxScore, true);
      });
    }
  }

  void _onFx(GameFx effect) {
    switch (effect) {
      case GameFx.correct:
        HapticFeedback.selectionClick();
      case GameFx.gameOver:
        HapticFeedback.heavyImpact();
      default:
        break;
    }
  }

  void _start() {
    setState(() => _started = true);
    _engine.start();
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
            CachedNetworkImage(imageUrl: _bgImageUrl!, fit: BoxFit.cover,
              placeholder: (_, __) => ColoredBox(color: _bgColor),
              errorWidget: (_, __, ___) => ColoredBox(color: _bgColor))
          else
            ColoredBox(color: _bgColor),
          Container(color: Colors.black.withOpacity(0.3)),
          if (!_started)
            _buildIntro()
          else
            _buildGame(),
        ],
      ),
    );
  }

  Widget _buildIntro() {
    final s = widget.config.settings;
    final gifts = _engine.giftDefs;
    return SafeArea(
      child: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Text('🐍', style: TextStyle(fontSize: 56)),
            const SizedBox(height: 12),
            Text(s['heading_1']?.toString() ?? 'NAGARAJA',
              textAlign: TextAlign.center,
              style: const TextStyle(fontSize: 28, fontWeight: FontWeight.w900,
                color: Colors.white)),
            const SizedBox(height: 8),
            Text(s['heading_2']?.toString() ?? 'Slither, eat gifts, survive the snakes!',
              textAlign: TextAlign.center,
              style: const TextStyle(color: Colors.white70)),
            const SizedBox(height: 16),
            if (s['intro_text']?.toString().isNotEmpty == true)
              Padding(padding: const EdgeInsets.only(bottom: 16),
                child: Text(s['intro_text'].toString(),
                  textAlign: TextAlign.center, style: const TextStyle(color: Colors.white54))),
            Wrap(
              spacing: 8, runSpacing: 8, alignment: WrapAlignment.center,
              children: gifts.map((g) => Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                decoration: BoxDecoration(color: Colors.white10, borderRadius: BorderRadius.circular(8)),
                child: Text('${g.emoji} ${g.name}  +${g.points}',
                  style: const TextStyle(color: Colors.white, fontSize: 13)),
              )).toList(),
            ),
            const SizedBox(height: 20),
            Text('Steer toward gifts to collect them and grow.\n'
                'Avoid AI snakes — touch one and it\'s game over!',
              textAlign: TextAlign.center, style: const TextStyle(color: Colors.white60)),
            const SizedBox(height: 24),
            SizedBox(
              width: 240,
              child: ElevatedButton(
                onPressed: _start,
                style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF22c55e),
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(40))),
                child: Text(s['start_button_text']?.toString() ?? 'START SLITHERING',
                  style: const TextStyle(fontWeight: FontWeight.bold, letterSpacing: 2)),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildGame() {
    return Stack(
      fit: StackFit.expand,
      children: [
        LayoutBuilder(builder: (ctx, c) {
          return Listener(
            onPointerMove: (d) {
              final l = ctx.findRenderObject() as RenderBox?;
              if (l == null) return;
              final local = l.globalToLocal(d.position);
              final dx = (local.dx - c.maxWidth / 2) / (c.maxWidth / 2);
              final dy = (local.dy - c.maxHeight / 2) / (c.maxHeight / 2);
              _engine.steerTo(_engine.segs.first.dx + dx * 400, _engine.segs.first.dy + dy * 400);
            },
                child: AnimatedBuilder(
              animation: _engine,
              builder: (_, __) => CustomPaint(
                painter: _NagarajaPainter(
                  segs: _engine.segs,
                  gifts: _engine.gifts,
                  ai: _engine.ai,
                  bursts: _engine.bursts,
                  popups: _engine.popups,
                  kills: _engine.kills,
                  shakeMag: _engine.shakeMag,
                  shakeStartMs: _engine.shakeStartMs,
                  dirAngle: _engine.dirAngle,
                  camW: c.maxWidth, camH: c.maxHeight,
                  snakeColor: _snakeColor,
                ),
              ),
            ),
          );
        }),
        SafeArea(
          child: Padding(
            padding: const EdgeInsets.all(12),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                  decoration: BoxDecoration(color: Colors.black45, borderRadius: BorderRadius.circular(12)),
                  child: AnimatedBuilder(animation: _engine, builder: (_, __) => Text(
                    'Score: ${_engine.score}   Kills: ${_engine.kills}',
                    style: const TextStyle(color: Color(0xFFfbbf24), fontWeight: FontWeight.w800, fontSize: 16),
                  )),
                ),
                if (_engine.completed)
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                    decoration: BoxDecoration(color: Colors.redAccent, borderRadius: BorderRadius.circular(12)),
                    child: const Text('GAME OVER', style: TextStyle(fontWeight: FontWeight.w800)),
                  ),
              ],
            ),
          ),
        ),
        if (_engine.completed)
          Center(child: Container(
            margin: const EdgeInsets.all(24),
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(color: Colors.black.withOpacity(0.85), borderRadius: BorderRadius.circular(20)),
            child: Column(mainAxisSize: MainAxisSize.min, children: [
              const Text('💀', style: TextStyle(fontSize: 48)),
              const SizedBox(height: 8),
              const Text('GAME OVER', style: TextStyle(fontSize: 24, fontWeight: FontWeight.w900, color: Colors.redAccent)),
              const SizedBox(height: 8),
              Text('Score: ${_engine.score}', style: const TextStyle(fontSize: 18, color: Color(0xFFa78bfa))),
              const SizedBox(height: 16),
              ElevatedButton(onPressed: _exit,
                child: Text(widget.config.settings['continue_button_text']?.toString() ?? 'CONTINUE')),
            ]),
          )),
      ],
    );
  }
}

class _NagarajaPainter extends CustomPainter {
  final List<Offset> segs;
  final List<NagarajaGiftItem> gifts;
  final List<NagarajaAISnake> ai;
  final double dirAngle;
  final double camW, camH;
  final Color snakeColor;
  final List<NagarajaKillBurst> bursts;
  final List<NagarajaKillPopup> popups;
  final int kills;
  final double shakeMag;
  final int shakeStartMs;

  _NagarajaPainter({required this.segs, required this.gifts, required this.ai,
    required this.bursts, required this.popups, required this.kills,
    required this.shakeMag, required this.shakeStartMs,
    required this.dirAngle, required this.camW, required this.camH,
    required this.snakeColor});

  Offset _toView(Offset p) => Offset(p.dx - _camX() + camW / 2, p.dy - _camY() + camH / 2);

  double _shakeX() {
    final age = DateTime.now().millisecondsSinceEpoch - shakeStartMs;
    if (age > 250) return 0;
    final m = shakeMag * (1 - age / 250);
    return (Random().nextDouble() - 0.5) * 2 * m;
  }
  double _shakeY() {
    final age = DateTime.now().millisecondsSinceEpoch - shakeStartMs;
    if (age > 250) return 0;
    final m = shakeMag * (1 - age / 250);
    return (Random().nextDouble() - 0.5) * 2 * m;
  }
  double _camX() => segs.isEmpty ? 0 : segs.first.dx + _shakeX();
  double _camY() => segs.isEmpty ? 0 : segs.first.dy + _shakeY();

  @override
  void paint(Canvas canvas, Size size) {
    // grid
    final grid = 60.0;
    final gx = _camX().floorToDouble(), gy = _camY().floorToDouble();
    final gridPaint = Paint()..color = const Color(0x148b5cf6)..strokeWidth = 1;
    for (double x = ((gx - camW) ~/ grid) * grid; x < gx + camW; x += grid) {
      canvas.drawLine(Offset(x - _camX() + camW / 2, 0), Offset(x - _camX() + camW / 2, camH), gridPaint);
    }
    for (double y = ((gy - camH) ~/ grid) * grid; y < gy + camH; y += grid) {
      canvas.drawLine(Offset(0, y - _camY() + camH / 2), Offset(camW, y - _camY() + camH / 2), gridPaint);
    }

    // gifts
    for (final g in gifts) {
      final pos = g.pos;
      final def = g.def;
      final v = _toView(pos);
      if (v.dx < -20 || v.dx > camW + 20 || v.dy < -20 || v.dy > camH + 20) continue;
      final radius = def.points >= 5 ? 9.0 : (def.points >= 3 ? 7.0 : 5.5);
      final c = _hex(def.color) ?? const Color(0xFFf59e0b);
      if (g.shed) {
        if (g.loot) {
          canvas.drawCircle(v, radius * 2.4, Paint()..color = c.withOpacity(0.4));
          canvas.drawCircle(v, radius * 1.2, Paint()..color = c);
          canvas.drawCircle(v - const Offset(3, 3), 2, Paint()..color = Colors.white);
          _drawEmoji(canvas, def.emoji, v, radius * 1.8);
        } else {
          canvas.drawCircle(v, 3, Paint()..color = c);
        }
        continue;
      }
      canvas.drawCircle(v, radius * 2, Paint()..color = c.withOpacity(0.15));
      canvas.drawCircle(v, radius, Paint()..color = c);
      _drawEmoji(canvas, def.emoji, v, radius * 2);
    }

    // AI snakes
    for (final a in ai) {
      final segs2 = a.segs;
      for (int i = 1; i < segs2.length; i++) {
        final p1 = _toView(segs2[i - 1]), p2 = _toView(segs2[i]);
        if ((p1.dx < -60 && p2.dx < -60) || (p1.dx > camW + 60 && p2.dx > camW + 60) ||
            (p1.dy < -60 && p2.dy < -60) || (p1.dy > camH + 60 && p2.dy > camH + 60)) continue;
        final w = 6 - (i / segs2.length) * 3;
        canvas.drawLine(p1, p2, Paint()..color = a.color..strokeWidth = w..strokeCap = StrokeCap.round);
      }
      if (segs2.isNotEmpty) {
        final h = _toView(segs2.first);
        canvas.drawCircle(h, 7, Paint()..color = a.color);
        canvas.drawCircle(h - const Offset(2, 2), 2.2, Paint()..color = Colors.white);
      }
    }

    // player snake — white outline + labelled head so it stands out vs AI snakes
    final pAng = atan2(sin(dirAngle), cos(dirAngle));
    final px = cos(pAng), py = sin(pAng);
    for (int i = segs.length - 1; i >= 0; i--) {
      final v = _toView(segs[i]);
      if (v.dx < -40 || v.dx > camW + 40 || v.dy < -40 || v.dy > camH + 40) continue;
      final w = i == 0 ? 10.0 : max(3.5, 9.0 * (1 - i / (segs.length + 10.0)));
      canvas.drawCircle(v, w / 2 + 1.4, Paint()..color = const Color(0xF2FFFFFF));
      canvas.drawCircle(v, w / 2, Paint()..color = i == 0 ? snakeColor : snakeColor.withOpacity(0.75));
      if (i == 0) {
        final perpX = -py, perpY = px;
        final eyePaint = Paint()..color = Colors.white;
        final pupilPaint = Paint()..color = const Color(0xFF111111);
        for (final sgn in [-1, 1]) {
          canvas.drawCircle(Offset(v.dx + px * 4 + perpX * sgn * 3, v.dy + py * 4 + perpY * sgn * 3), 2.6, eyePaint);
          canvas.drawCircle(Offset(v.dx + px * 6 + perpX * sgn * 3, v.dy + py * 6 + perpY * sgn * 3), 1.3, pupilPaint);
        }
        final tp = TextPainter(
          text: TextSpan(text: 'YOU', style: TextStyle(
            fontSize: 12, fontWeight: FontWeight.w800, color: Colors.white,
            shadows: [Shadow(blurRadius: 3, color: Colors.black),
          ])),
          textDirection: TextDirection.ltr,
        )..layout();
        tp.paint(canvas, Offset(v.dx - tp.width / 2, v.dy - 24));
      }
    }

    // death bursts from killed snakes
    final now = DateTime.now().millisecondsSinceEpoch;
    for (final b in bursts) {
      final age = now - b.t;
      if (age > 900) continue;
      final prog = age / 900;
      final v = _toView(b.pos);
      final er = 10.0 + prog * 90;
      canvas.drawCircle(v, er,
        Paint()..style = PaintingStyle.stroke
          ..color = const Color(0xFFfbbf24).withOpacity((1 - prog) * 0.8)
          ..strokeWidth = 6 * (1 - prog) + 1);
      canvas.drawCircle(v, er * 0.6,
        Paint()..style = PaintingStyle.stroke
          ..color = Colors.white.withOpacity((1 - prog) * 0.8)
          ..strokeWidth = 2);
      for (int p = 0; p < 8; p++) {
        final pa = (p / 8) * pi * 2 + prog * 0.8;
        final pr = er * 0.4 + prog * 60;
        canvas.drawCircle(
          Offset(v.dx + cos(pa) * pr, v.dy + sin(pa) * pr),
          2 + (1 - prog) * 2,
          Paint()..color = (p % 2 == 0 ? const Color(0xFFfbbf24) : Colors.white));
      }
    }

    // floating "KILLED!" / combo popups
    for (final p in popups) {
      final page = now - p.t;
      if (page > 1300) continue;
      final pprog = page / 1300;
      final pv = _toView(p.pos);
      final py = pv.dy - 30 - pprog * 50;
      final fsize = p.big ? (26 - pprog * 8).clamp(14.0, 26.0) : (20 - pprog * 8).clamp(11.0, 20.0);
      final tp = TextPainter(
        text: TextSpan(
          text: p.text,
          style: TextStyle(
            fontSize: fsize, fontWeight: FontWeight.w900,
            color: (p.big ? const Color(0xFFfbbf24) : const Color(0xFFf87171)).withOpacity((1 - pprog).clamp(0.0, 1.0)),
            fontFamily: 'Orbitron',
            shadows: const [Shadow(blurRadius: 4, color: Color(0xCC000000))],
          ),
        ),
        textDirection: TextDirection.ltr,
      )..layout();
      tp.paint(canvas, Offset(pv.dx - tp.width / 2, py));
    }
  }

  void _drawEmoji(Canvas canvas, String emoji, Offset at, double size) {
    final tp = TextPainter(
      text: TextSpan(text: emoji, style: TextStyle(fontSize: size)),
      textDirection: TextDirection.ltr,
    )..layout();
    tp.paint(canvas, at - Offset(tp.width / 2, tp.height / 2));
  }

  Color? _hex(String? hex) {
    if (hex == null || hex.isEmpty) return null;
    var h = hex.replaceFirst('#', '');
    if (h.length == 6) h = 'FF$h';
    try { return Color(int.parse(h, radix: 16)); } catch (_) { return null; }
  }

  @override
  bool shouldRepaint(covariant _NagarajaPainter old) => true;
}
