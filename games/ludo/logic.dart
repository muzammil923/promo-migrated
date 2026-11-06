import 'package:promogames_engine/engine.dart';

class LudoEngine extends GameEngine {
  int _score = 0;
  bool _finished = false;
  int playerTokens = 0;
  int aiTokens = 0;
  bool playerTurn = true;
  String message = 'Roll the dice!';

  @override
  int get score => _score;
  @override
  int get maxScore => 4;
  @override
  bool get completed => _finished;

  LudoEngine({Map<String, dynamic> settings = const {}});

  int rollDice() {
    return (DateTime.now().microsecondsSinceEpoch % 6) + 1;
  }

  void movePlayer() {
    if (!playerTurn || _finished) return;
    final dice = rollDice();
    if (dice == 6 && playerTokens < 4) {
      playerTokens++;
      message = 'Rolled 6! Token entered.';
    } else if (playerTokens > 0) {
      final move = dice.clamp(0, 4 - playerTokens);
      playerTokens += move;
      message = 'Rolled $dice. Moved $move.';
    } else {
      message = 'Rolled $dice. Need a 6 to enter.';
    }
    if (playerTokens >= 4) {
      _score = 4;
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
    if (dice == 6 && aiTokens < 4) {
      aiTokens++;
    } else if (aiTokens > 0) {
      final move = dice.clamp(0, 4 - aiTokens);
      aiTokens += move;
    }
    if (aiTokens >= 4) {
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
    playerTokens = 0;
    aiTokens = 0;
    playerTurn = true;
    _finished = false;
    _score = 0;
    message = 'Roll the dice!';
    notifyListeners();
  }

  void exitEarly() {}
}
