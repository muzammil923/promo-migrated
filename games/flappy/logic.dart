import 'dart:async';

import 'package:promogames_engine/engine.dart';

/// Headless Flappy Bird engine. Owns the rules: physics, pipes, collision,
/// scoring. No widgets, no colors, no network.
class FlappyEngine extends GameEngine {
  final double gravity;
  final double flapStrength;
  final int pipeSpeed;
  final int pipeGap;
  final int pipeWidth;

  double birdY = 0;
  double birdV = 0;
  bool started = false;
  final List<Pipe> pipes = [];
  int _score = 0;
  bool _dead = false;

  static const double fieldWidth = 360;
  static const double fieldHeight = 560;
  static const double birdX = 80;
  static const double birdRadius = 11;

  @override
  int get score => _score;
  @override
  int get maxScore => _score;
  @override
  bool get completed => _dead;

  Timer? _timer;

  FlappyEngine({Map<String, dynamic> settings = const {}})
      : gravity = _dbl(settings['gravity'], 0.32),
        flapStrength = _dbl(settings['flap_strength'], -6.0),
        pipeSpeed = _int(settings['pipe_speed'], 2),
        pipeGap = _int(settings['pipe_gap'], 170),
        pipeWidth = _int(settings['pipe_width'], 50) {
    birdY = fieldHeight / 2;
    _spawnInitial();
  }

  static double _dbl(dynamic v, double fallback) =>
      v is num ? v.toDouble() : fallback;
  static int _int(dynamic v, int fallback) =>
      v is num ? v.toInt() : fallback;

  void _spawnInitial() {
    pipes.clear();
    pipes.add(Pipe(fieldWidth + 40, 120.0, pipeGap.toDouble()));
    pipes.add(Pipe(fieldWidth + 260, 90.0, pipeGap.toDouble()));
  }

  void start() {
    _timer ??= Timer.periodic(const Duration(milliseconds: 16), (_) => _tick());
  }

  void flap() {
    if (_dead) return;
    if (!started) started = true;
    birdV = flapStrength;
  }

  void _tick() {
    if (_dead || !started) return;
    birdV += gravity;
    birdY += birdV;

    if (birdY < 0 || birdY > fieldHeight) {
      _die();
      return;
    }

    for (final p in pipes) {
      p.x -= pipeSpeed;
      if (p.x < birdX + birdRadius && p.x + pipeWidth > birdX - birdRadius) {
        if (birdY < p.gapTop || birdY > p.gapTop + p.gap) {
          _die();
          return;
        }
      }
      if (!p.passed && p.x + pipeWidth < birdX) {
        p.passed = true;
        _score++;
        emit(GameFx.correct);
      }
    }

    if (pipes.first.x < -pipeWidth - 10) {
      pipes.removeAt(0);
      final last = pipes.last;
      final gt = 70.0 + (_score * 7 % 180).toDouble();
      pipes.add(Pipe(last.x + 200.0, gt, pipeGap.toDouble()));
    }

    notifyListeners();
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

class Pipe {
  double x;
  double gapTop;
  double gap;
  bool passed;
  Pipe(this.x, this.gapTop, this.gap) : passed = false;
}
