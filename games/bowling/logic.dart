import 'dart:async';

import 'package:promogames_engine/engine.dart';

class BowlingEngine extends GameEngine {
  static const int totalFrames = 5;
  static const int pinCount = 10;

  late List<bool> pins;
  int frame = 0;
  int rollsInFrame = 0;
  int _score = 0;
  bool rolling = false;
  double ballY = 0;
  String message = 'Tap ROLL to bowl!';

  @override
  int get score => _score;
  @override
  int get maxScore => totalFrames * pinCount;
  @override
  bool get completed => frame >= totalFrames;

  BowlingEngine({Map<String, dynamic> settings = const {}}) {
    pins = List.filled(pinCount, true);
  }

  int standingCount() => pins.where((p) => p).length;

  void roll() {
    if (rolling || frame >= totalFrames) return;
    rolling = true;
    ballY = 0;
    message = 'Rolling...';
    notifyListeners();

    Future.delayed(const Duration(milliseconds: 600), () {
      final standing = standingCount();
      if (standing == 0) {
        pins = List.filled(pinCount, true);
      }
      final maxKnock = standingCount();
      final knock = maxKnock == 0
          ? 0
          : (DateTime.now().microsecondsSinceEpoch % (maxKnock + 1));
      int knocked = 0;
      for (int i = 0; i < pins.length && knocked < knock; i++) {
        if (pins[i]) {
          pins[i] = false;
          knocked++;
        }
      }
      _score += knocked;
      rollsInFrame++;
      rolling = false;
      ballY = 1;
      if (rollsInFrame >= 2 || standingCount() == 0) {
        rollsInFrame = 0;
        frame++;
        if (frame < totalFrames) {
          pins = List.filled(pinCount, true);
          message = 'Frame ${frame + 1}: tap ROLL';
        } else {
          message = 'Game over! Score: $_score';
        }
      } else {
        message = 'Knocked $knocked! Tap ROLL again';
      }
      if (frame >= totalFrames) {
        emit(GameFx.win);
      } else {
        emit(GameFx.tick);
      }
      notifyListeners();
    });
  }

  void newGame() {
    pins = List.filled(pinCount, true);
    frame = 0;
    rollsInFrame = 0;
    _score = 0;
    rolling = false;
    ballY = 0;
    message = 'Tap ROLL to bowl!';
    notifyListeners();
  }

  void exitEarly() {}
}
