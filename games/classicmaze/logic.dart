import 'dart:math';

import 'package:promogames_engine/engine.dart';

class ClassicMazeEngine extends GameEngine {
  static const int size = 10;
  late List<List<int>> maze;
  late int px;
  late int py;
  int _steps = 0;
  bool _won = false;
  final Random _rnd = Random();

  @override
  int get score => _steps;
  @override
  int get maxScore => 1;
  @override
  bool get completed => _won;

  bool get won => _won;

  ClassicMazeEngine({Map<String, dynamic> settings = const {}}) {
    _generate();
  }

  void _generate() {
    maze = List.generate(size, (_) => List.filled(size, 1));
    px = 0;
    py = 0;
    _steps = 0;
    _won = false;
    int x = 0, y = 0;
    maze[0][0] = 0;
    while (!(x == size - 1 && y == size - 1)) {
      if (_rnd.nextBool() && x < size - 1) {
        x++;
      } else if (y < size - 1) {
        y++;
      } else if (x > 0) {
        x--;
      }
      maze[y][x] = 0;
    }
    maze[size - 1][size - 1] = 0;
    maze[0][0] = 0;
  }

  void move(int dx, int dy) {
    if (_won) return;
    final nx = px + dx;
    final ny = py + dy;
    if (nx < 0 || ny < 0 || nx >= size || ny >= size) return;
    if (maze[ny][nx] == 1) return;
    px = nx;
    py = ny;
    _steps++;
    if (px == size - 1 && py == size - 1) {
      _won = true;
      emit(GameFx.win);
    } else {
      emit(GameFx.tick);
    }
    notifyListeners();
  }

  void newGame() {
    _generate();
    notifyListeners();
  }

  void exitEarly() {}
}
