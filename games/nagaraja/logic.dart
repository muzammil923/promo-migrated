import 'dart:async';
import 'dart:convert';
import 'dart:math';

import 'package:flutter/painting.dart';

import 'package:promogames_engine/engine.dart';

/// A configurable edible "gift" the Nagaraja snake collects.
class NagarajaGift {
  final String name;
  final String emoji;
  final String color;
  final int points;
  final double size;
  final int spawnWeight;
  const NagarajaGift({
    this.name = 'Gold',
    this.emoji = '🟡',
    this.color = '#f59e0b',
    this.points = 1,
    this.size = 1,
    this.spawnWeight = 10,
  });

  factory NagarajaGift.fromMap(Map<String, dynamic> m) {
    return NagarajaGift(
      name: (m['name'] ?? 'Gold').toString(),
      emoji: (m['emoji'] ?? '🟡').toString(),
      color: (m['color'] ?? '#f59e0b').toString(),
      points: (m['points'] is num ? (m['points'] as num).toInt() : int.tryParse(m['points']?.toString() ?? '') ?? 1),
      size: (m['size'] is num ? (m['size'] as num).toDouble() : double.tryParse(m['size']?.toString() ?? '') ?? 1),
      spawnWeight: (m['spawnWeight'] is num ? (m['spawnWeight'] as num).toInt() : int.tryParse(m['spawnWeight']?.toString() ?? '') ?? 10),
    );
  }
}

class NagarajaGiftItem {
  final NagarajaGift def;
  Offset pos;
  bool shed;
  bool loot;
  NagarajaGiftItem(this.def, this.pos, {this.shed = false, this.loot = false});
}

class NagarajaAISnake {
  final List<Offset> segs = [];
  final Color color;
  double angle;
  double target;
  int retarget;
  final double speed;
  bool alive = true;
  final double headR;
  final int len;
  NagarajaAISnake(this.color, this.angle, this.target, this.retarget, this.speed,
      {this.headR = 7, this.len = 20});
}

class NagarajaKillBurst {
  final Offset pos;
  final int t;
  NagarajaKillBurst(this.pos) : t = DateTime.now().millisecondsSinceEpoch;
}

class NagarajaKillPopup {
  final Offset pos;
  final String text;
  final bool big;
  final int t;
  NagarajaKillPopup(this.pos, this.text, {this.big = false})
      : t = DateTime.now().millisecondsSinceEpoch;
}

/// Slither-style headless Nagaraja engine.
///
/// Owns rules only: continuous movement, gift placement/collection, growth,
/// steer-angle smoothing, boost shedding, AI bot movement and death on AI
/// body collision. No widgets, no colors/network — but colors are needed for
/// rendering, so AI colors are resolved as [Color] here (pure, no UI).
class NagarajaEngine extends GameEngine {
  final double worldW;
  final double worldH;
  final double speed;
  final int aiCount;
  final double aiSpeed;
  final bool boostEnabled;
  final int giftCount;

  /// Parsed gifts from builder settings (`gifts_json`).
  final List<NagarajaGift> giftDefs;

  final List<Offset> segs = [];
  double dirAngle = 0;
  int targetLen = 12;
  final List<NagarajaGiftItem> gifts = [];
  final List<NagarajaAISnake> ai = [];
  int kills = 0;
  final List<NagarajaKillBurst> bursts = [];
  final List<NagarajaKillPopup> popups = [];
  int _combo = 0;
  int _lastKillMs = 0;
  double shakeMag = 0;
  int shakeStartMs = 0;
  final Random _rnd = Random();

  @override
  int score = 0;

  @override
  int get maxScore => score;

  bool _dead = false;

  @override
  bool get completed => _dead;

  Timer? _timer;
  bool _boosting = false;

  NagarajaEngine({Map<String, dynamic> settings = const {}})
      : worldW = _double(settings['world_width'], 1600, 800, 5000),
        worldH = _double(settings['world_height'], 1200, 600, 4000),
        speed = _double(settings['speed'], 5, 1, 10),
        aiCount = _int(settings['ai_snake_count'], 6, 0, 30),
        aiSpeed = _double(settings['ai_speed'], 3, 1, 8),
        boostEnabled = (settings['boost_enabled']?.toString() == '1' || settings['boost_enabled'] == true || settings['boost_enabled'] == null),
        giftCount = _int(settings['gift_count'], 40, 5, 200),
        giftDefs = _parseGifts(settings['gifts_json']) {
    _spawnInitial();
  }

  static double _double(dynamic v, double fallback, double min, double max) {
    final n = v is num ? v.toDouble() : double.tryParse(v?.toString() ?? '');
    if (n == null) return fallback;
    return n.clamp(min, max);
  }

  static int _int(dynamic v, int fallback, int min, int max) {
    final n = v is num ? v.toInt() : int.tryParse(v?.toString() ?? '');
    if (n == null) return fallback;
    return n.clamp(min, max);
  }

  static List<NagarajaGift> _parseGifts(dynamic raw) {
    if (raw == null) return const [NagarajaGift()];
    dynamic list = raw;
    if (raw is String) {
      try { list = _jsonDecode(raw); } catch (_) { list = null; }
    }
    if (list is! List) return const [NagarajaGift()];
    final out = <NagarajaGift>[];
    for (final e in list) {
      if (e is Map) out.add(NagarajaGift.fromMap(Map<String, dynamic>.from(e)));
    }
    if (out.isEmpty) out.add(const NagarajaGift());
    return out;
  }

  void _spawnInitial() {
    final sx = worldW / 2, sy = worldH / 2;
    segs.clear();
    for (int i = 0; i < 12; i++) {
      segs.add(Offset(sx - i * 8, sy));
    }
    targetLen = 12;
    final start = Offset(sx, sy);
    // gifts — dense disc around the start so food is always on screen
    for (int i = 0; i < giftCount; i++) {
      final def = _weightedGift();
      gifts.add(NagarajaGiftItem(def, _nearPoint(start)));
    }
    // AI snakes
    ai.clear();
    const colors = [
      Color(0xFFef4444), Color(0xFF3b82f6), Color(0xFFf59e0b),
      Color(0xFFec4899), Color(0xFF14b8a6), Color(0xFF8b5cf6),
      Color(0xFF84cc16), Color(0xFFf97316),
    ];
    for (int i = 0; i < aiCount; i++) {
      final segLen = 20 + _rnd.nextInt(30);
      final base = _nearPoint(start, 200, 1200);
      final s = NagarajaAISnake(
        colors[i % colors.length],
        _rnd.nextDouble() * pi * 2,
        _rnd.nextDouble() * pi * 2,
        60 + _rnd.nextInt(120),
        2 + _rnd.nextDouble() * (aiSpeed - 1),
        len: segLen,
      );
      for (int k = 0; k < segLen; k++) s.segs.add(Offset(base.dx - k * 7, base.dy));
      ai.add(s);
    }
  }

  NagarajaGift _weightedGift() {
    final totalW = giftDefs.fold<int>(0, (a, g) => a + (g.spawnWeight > 0 ? g.spawnWeight : 1));
    var r = _rnd.nextInt(totalW);
    for (final g in giftDefs) { r -= (g.spawnWeight > 0 ? g.spawnWeight : 1); if (r <= 0) return g; }
    return giftDefs.last;
  }

  Offset _nearPoint(Offset center, [double minR = 120, double maxR = 1300]) {
    final a = _rnd.nextDouble() * pi * 2;
    final r = minR + _rnd.nextDouble() * (maxR - minR);
    return Offset(center.dx + cos(a) * r, center.dy + sin(a) * r);
  }

  void start() {
    _combo = 0;
    _lastKillMs = 0;
    shakeMag = 0;
    bursts.clear();
    popups.clear();
    _timer ??= Timer.periodic(const Duration(milliseconds: 16), (_) => _step());
  }

  /// Steer toward a world-space target point.
  void steerTo(double wx, double wy) {
    if (_dead) return;
    final dx = wx - segs.first.dx, dy = wy - segs.first.dy;
    if (dx.abs() < 3 && dy.abs() < 3) return;
    final target = atan2(dy, dx);
    var diff = target - dirAngle;
    while (diff > pi) diff -= pi * 2;
    while (diff < -pi) diff += pi * 2;
    final turn = diff.sign * diff.abs().clamp(0.0, 0.16);
    dirAngle += turn;
  }

  void setBoost(bool b) { _boosting = b && boostEnabled; }

  void _step() {
    if (_dead) return;
    final boost = _boosting ? 1.8 : 1.0;
    final growth = (targetLen / 140.0).clamp(0.0, 1.0);
    final spd = speed * (1 + growth * 1.3) * boost;
    final head = segs.first;

    // prune expired death bursts / popups
    final _n = DateTime.now().millisecondsSinceEpoch;
    bursts.removeWhere((b) => _n - b.t > 900);
    popups.removeWhere((p) => _n - p.t > 1300);

    if (_boosting && segs.length > 6 && _rnd.nextDouble() < 0.6) {
      gifts.add(NagarajaGiftItem(NagarajaGift(color: '#22c55e'), head, shed: true));
    }

    final hx = head.dx + cos(dirAngle) * spd;
    final hy = head.dy + sin(dirAngle) * spd;
    segs.insert(0, Offset(hx, hy));

    // trim to target length (node spacing ~4px)
    var segLen = 0.0;
    for (int i = 1; i < segs.length; i++) {
      segLen += (segs[i] - segs[i - 1]).distance;
    }
    final target = targetLen * 4.0;
    if (segLen > target) {
      var over = 0.0; int cut = segs.length;
      for (int i = segs.length - 1; i >= 1; i--) {
        final d = (segs[i] - segs[i - 1]).distance;
        over += d;
        if (over > (segLen - target)) { cut = i; break; }
      }
      if (cut > 1 && cut < segs.length) segs.removeRange(cut, segs.length);
    }

    // eat gifts
    final headPos = segs.first;
    for (int gi = gifts.length - 1; gi >= 0; gi--) {
      final g = gifts[gi];
      final radius = g.def.points >= 5 ? 9.0 : (g.def.points >= 3 ? 7.0 : 5.5);
      if ((g.pos - headPos).distance < 7 + radius) {
        score += (g.def.points < 1 ? 1 : g.def.points);
        targetLen += (g.def.points < 1 ? 4 : g.def.points * 4);
        gifts.removeAt(gi);
        gifts.add(NagarajaGiftItem(_weightedGift(), _nearPoint(headPos)));
        emit(GameFx.correct);
      }
    }

    // AI
    final surviving = <NagarajaAISnake>[];
    for (final a in ai) {
      if (!a.alive) continue;
      bool dead = false;
      a.retarget -= 1;
      if (a.retarget <= 0) { a.target = _rnd.nextDouble() * pi * 2; a.retarget = 60 + _rnd.nextInt(120); }
      final aHead = a.segs.first;
      if ((headPos - aHead).distance > 1600) {
        a.target = (headPos - aHead).direction;
        a.retarget = 40;
      }
      var diff = a.target - a.angle;
      while (diff > pi) diff -= pi * 2;
      while (diff < -pi) diff += pi * 2;
      a.angle += diff * 0.05;
      final ah = a.segs.first;
      a.segs.insert(0, Offset(ah.dx + cos(a.angle) * a.speed, ah.dy + sin(a.angle) * a.speed));
      if (a.segs.length > 1) a.segs.removeLast();

      bool playerCrashed = false;
      // 1) player head hits AI body -> player dies
      for (int k = 1; k < a.segs.length; k++) {
        if ((a.segs[k] - headPos).distance < 7 + 6) { playerCrashed = true; break; }
      }
      if (playerCrashed) { _die(); return; }

      // 2) AI head hits player body (not the head) -> AI dies, sheds its food
      final ahead2 = a.segs.first;
      for (int k = 1; k < segs.length && !dead; k++) {
        if ((segs[k] - ahead2).distance < a.headR + 6) { dead = true; }
      }
      if (dead) {
        _killAI(a);
        emit(GameFx.correct);
      } else {
        surviving.add(a);
      }
    }
    ai
      ..clear()
      ..addAll(surviving);
    notifyListeners();
  }

  void _killAI(NagarajaAISnake a) {
    kills++;
    final headPos2 = a.segs.isNotEmpty ? a.segs.first : Offset.zero;
    final now = DateTime.now().millisecondsSinceEpoch;
    // combo / multikill bonus within 4s
    _combo = (now - _lastKillMs < 4000) ? _combo + 1 : 1;
    _lastKillMs = now;
    if (_combo > 1) {
      final bonus = _combo * 10;
      score += bonus;
      targetLen += bonus * 2;
      popups.add(NagarajaKillPopup(headPos2, 'COMBO x$_combo +$bonus', big: true));
    }
    popups.add(NagarajaKillPopup(headPos2, _combo > 1 ? 'KILLED! x$_combo' : 'KILLED!'));
    bursts.add(NagarajaKillBurst(headPos2));
    shakeMag = _combo > 1 ? 10 : 6;
    shakeStartMs = now;
    final lootPts = (a.len / 3.0).round().clamp(4, 40);
    final step = (a.segs.length / 18).floor().clamp(2, a.segs.length);
    for (int k = 0; k < a.segs.length; k += step) {
      final s = a.segs[k];
      final src = _weightedGift();
      gifts.add(NagarajaGiftItem(
        NagarajaGift(color: '#fbbf24', name: 'Snake loot', points: lootPts, size: 1, emoji: src.emoji),
        Offset(s.dx + (_rnd.nextDouble() - 0.5) * 14, s.dy + (_rnd.nextDouble() - 0.5) * 14),
        shed: true, loot: true,
      ));
    }
    a.alive = false;
  }

  void _die() {
    _dead = true;
    _timer?.cancel();
    _timer = null;
    emit(GameFx.gameOver);
    notifyListeners();
  }

  void exitEarly() {
    _timer?.cancel();
    _timer = null;
  }

  @override
  void dispose() {
    exitEarly();
    super.dispose();
  }
}

dynamic _jsonDecode(String s) => jsonDecode(s);
