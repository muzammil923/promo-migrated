import 'package:promogames_engine/engine.dart';

class StressBusterEngine extends GameEngine {
  int _relief = 0;
  int _breaths = 0;
  double _breathValue = 0;
  bool _finished = false;

  @override
  int get score => _relief;
  @override
  int get maxScore => 0;
  @override
  bool get completed => _finished;

  int get relief => _relief;
  int get breaths => _breaths;
  double get breathValue => _breathValue;

  StressBusterEngine({Map<String, dynamic> settings = const {}});

  String get phase {
    if (_breathValue < 0.45) return 'Breathe in...';
    if (_breathValue < 0.55) return 'Hold';
    return 'Breathe out...';
  }

  void updateBreath(double value) {
    _breathValue = value;
    notifyListeners();
  }

  void tapBreath() {
    if (_finished) return;
    _relief++;
    if (_relief % 4 == 0) _breaths++;
    emit(GameFx.tick);
    notifyListeners();
  }

  void newGame() {
    _relief = 0;
    _breaths = 0;
    _breathValue = 0;
    _finished = false;
    notifyListeners();
  }

  void finishSession() {
    if (_finished) return;
    _finished = true;
    emit(GameFx.gameOver);
    notifyListeners();
  }

  void exitEarly() {}
}
