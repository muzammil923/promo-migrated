import 'package:promogames_engine/engine.dart';

class SnakeAndLadderEngine extends GameEngine {
  int _score = 0;
  bool _finished = false;
  int playerPosition = 0;
  int aiPosition = 0;
  bool playerTurn = true;
  String message = 'Roll the dice!';

  static const Map<int, int> snakes = {16: 6, 47: 26, 49: 11, 56: 53, 62: 19, 64: 60, 87: 24, 93: 73, 95: 75, 98: 78};
  static const Map<int, int> ladders = {1: 38, 4: 14, 9: 31, 21: 42, 28: 84, 36: 44, 51: 67, 71: 91, 80: 100};

  @override
  int get score => _score;
  @override
  int get maxScore => 1;
  @override
  bool get completed => _finished;

  SnakeAndLadderEngine({Map<String, dynamic> settings = const {}});

  int rollDice() {
    return (DateTime.now().microsecondsSinceEpoch % 6) + 1;
  }

  void movePlayer() {
    if (!playerTurn || _finished) return;
    final dice = rollDice();
    int newPos = playerPosition + dice;
    if (newPos > 100) newPos = playerPosition;
    newPos = snakes[newPos] ?? ladders[newPos] ?? newPos;
    playerPosition = newPos;
    message = 'Rolled $dice. You are at $playerPosition';
    if (playerPosition == 100) {
      _score = 1;
      _finished = true;
      message = 'You win!';
      emit(GameFx.win);
    } else {
      playerTurn = false;
      emit(GameFx.tick);
    }
    notifyListeners();
  }

  void moveAi() {
    if (playerTurn || _finished) return;
    final dice = rollDice();
    int newPos = aiPosition + dice;
    if (newPos > 100) newPos = aiPosition;
    newPos = snakes[newPos] ?? ladders[newPos] ?? newPos;
    aiPosition = newPos;
    message = 'AI rolled. AI is at $aiPosition';
    if (aiPosition == 100) {
      _finished = true;
      message = 'AI wins!';
      emit(GameFx.gameOver);
    } else {
      playerTurn = true;
      emit(GameFx.tick);
    }
    notifyListeners();
  }

  void newGame() {
    playerPosition = 0;
    aiPosition = 0;
    playerTurn = true;
    _finished = false;
    _score = 0;
    message = 'Roll the dice!';
    notifyListeners();
  }

  void exitEarly() {}
}
