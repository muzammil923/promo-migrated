import 'dart:async';

import 'package:promogames_engine/engine.dart';

class BounceEngine extends GameEngine {
  double ballY = 0.2;
  double ballX = 0.5;
  double vy = 0;
  double vx = 0.004;
  int _bounces = 0;
  bool _over = false;
  Timer? _timer;

  static const double gravity = 0.0016;
  static const double impulse = -0.026;
  static const double floor = 0.92;

  @override
  int get score => _bounces;
  @override
  int get maxScore => _bounces;
  @override
  bool get completed => _over;

  bool get isOver => _over;

  BounceEngine({Map<String, dynamic> settings = const {}}) {
    _reset();
  }

  void _reset() {
    ballY = 0.2;
    ballX = 0.5;
    vy = 0;
    vx = 0.004;
    _bounces = 0;
    _over = false;
    _startLoop();
  }

  void _startLoop() {
    _timer?.cancel();
    _timer = Timer.periodic(const Duration(milliseconds: 16), (_) => _tick());
  }

  void _tick() {
    if (_over) return;
    vy += gravity;
    ballY += vy;
    ballX += vx;
    if (ballX < 0.05 || ballX > 0.95) vx = -vx;
    if (ballY < 0.05) {
      ballY = 0.05;
      vy = -vy;
      _bounces++;
      emit(GameFx.correct);
    }
    if (ballY > floor) {
      _over = true;
      _timer?.cancel();
      emit(GameFx.gameOver);
    }
    notifyListeners();
  }

  void tap() {
    if (_over) return;
    vy = impulse;
    _bounces++;
    emit(GameFx.tick);
    notifyListeners();
  }

  void newGame() {
    _reset();
    notifyListeners();
  }

  void exitEarly() {
    _timer?.cancel();
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }
}
