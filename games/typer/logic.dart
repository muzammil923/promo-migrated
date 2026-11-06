import 'dart:math';

import 'package:promogames_engine/engine.dart';

const _builtinWords = {
  'easy': [
    'CAT', 'DOG', 'RUN', 'JUMP', 'BLUE', 'TREE', 'FISH', 'BOOK', 'LAMP', 'DOOR',
    'MILK', 'RAIN', 'STAR', 'WIND', 'GOLD', 'LEAF', 'SNOW', 'FIRE', 'MOON', 'SHIP',
  ],
  'medium': [
    'GARDEN', 'PLANET', 'WINDOW', 'BOTTLE', 'CASTLE', 'FOREST', 'HUNTER', 'JACKET',
    'KITCHEN', 'ORANGE', 'PENCIL', 'RABBIT', 'VILLAGE', 'YELLOW', 'BRIDGE', 'CAMERA',
  ],
  'hard': [
    'ADVENTURE', 'ALGORITHM', 'BLUEPRINT', 'CHRONICLE', 'DISCIPLINE', 'FANTASTIC',
    'GRAVITY', 'HORIZON', 'IMAGINARY', 'JOURNALIST', 'KNOWLEDGE', 'LABYRINTH',
  ],
};

class TyperEngine extends GameEngine {
  String selectedDifficulty = 'medium';
  int selectedDuration = 60;
  String currentWord = '';
  String typed = '';
  List<_WordEntry> history = [];
  List<String> queue = [];
  int _wordGen = 0;
  bool wordLocked = false;

  int correctChars = 0;
  int wordsCompleted = 0;
  int correctWords = 0;
  int mistakes = 0;
  int streak = 0;
  int bestStreak = 0;
  double _score = 0;
  int remainingSeconds = 60;
  DateTime? roundStart;
  DateTime? wordStart;
  double ringProgress = 1.0;

  bool _finished = false;
  final Random _rnd = Random();

  @override
  int get score => _score.round();
  @override
  int get maxScore => _score.round();
  @override
  bool get completed => _finished;

  bool get isFinished => _finished;

  TyperEngine({Map<String, dynamic> settings = const {}}) {
    final diffMode = settings['difficulty_mode']?.toString() ?? 'progressive';
    if (['easy', 'medium', 'hard'].contains(diffMode)) {
      selectedDifficulty = diffMode;
    }
    selectedDuration = (settings['time_limit_seconds'] as num?)?.toInt() ?? 60;
    remainingSeconds = selectedDuration;
  }

  List<String> _getWordBank(String diff) {
    return _builtinWords[diff] ?? _builtinWords['medium']!;
  }

  void _fillQueue() {
    final bank = _getWordBank(selectedDifficulty);
    final shuffled = List<String>.from(bank)..shuffle(_rnd);
    queue.addAll(shuffled);
  }

  String _nextWord() {
    if (queue.length < 5) _fillQueue();
    return queue.removeAt(0);
  }

  void startRound() {
    queue = [];
    history = [];
    correctChars = 0;
    wordsCompleted = 0;
    correctWords = 0;
    mistakes = 0;
    streak = 0;
    bestStreak = 0;
    _score = 0;
    _wordGen = 0;
    wordLocked = false;
    typed = '';
    remainingSeconds = selectedDuration;
    roundStart = DateTime.now();
    _finished = false;
    _loadNextWord();
    notifyListeners();
  }

  void _loadNextWord() {
    _wordGen++;
    wordLocked = false;
    typed = '';
    currentWord = _nextWord();
    wordStart = DateTime.now();
    ringProgress = 1.0;
    notifyListeners();
  }

  void submitWord(bool timedOut, int gen) {
    if (gen != _wordGen || wordLocked) return;
    wordLocked = true;
    wordsCompleted++;

    final ok = !timedOut && typed.toUpperCase() == currentWord;
    history.add(_WordEntry(word: currentWord, ok: ok));

    if (ok) {
      correctWords++;
      correctChars += currentWord.length;
      streak++;
      bestStreak = max(bestStreak, streak);
      _score += currentWord.length * 10 * (1 + min(streak, 10) * 0.1);
      emit(GameFx.correct);
    } else {
      mistakes++;
      streak = 0;
      emit(GameFx.wrong);
    }
    notifyListeners();

    Future.delayed(const Duration(milliseconds: 200), () {
      if (!_finished) _loadNextWord();
    });
  }

  void tickSecond() {
    if (_finished || remainingSeconds <= 0) return;
    remainingSeconds--;
    if (remainingSeconds <= 0) {
      _finished = true;
      emit(GameFx.gameOver);
    }
    notifyListeners();
  }

  void updateRingProgress(double value) {
    ringProgress = value;
    notifyListeners();
  }

  void onInputChanged(String value) {
    typed = value;
    if (value.toUpperCase() == currentWord) {
      submitWord(false, _wordGen);
    }
    notifyListeners();
  }

  int get wpm {
    if (roundStart == null) return 0;
    final elapsed = max(DateTime.now().difference(roundStart!).inMilliseconds, 1);
    return ((correctChars / 5) / (elapsed / 60000)).round();
  }

  int get accuracy =>
      wordsCompleted > 0 ? (correctWords / wordsCompleted * 100).round() : 100;

  void endRound() {
    _finished = true;
    emit(GameFx.gameOver);
    notifyListeners();
  }

  void newGame() {
    queue = [];
    history = [];
    _finished = false;
    selectedDifficulty = 'medium';
    selectedDuration = 60;
    remainingSeconds = 60;
    notifyListeners();
  }

  void exitEarly() {
    _finished = true;
  }
}

class _WordEntry {
  final String word;
  final bool ok;
  const _WordEntry({required this.word, required this.ok});
}
