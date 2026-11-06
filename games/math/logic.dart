import 'dart:async';
import 'dart:math';

import 'package:promogames_engine/engine.dart';

class MathQuestion {
  final int a;
  final int b;
  final String op;
  late final int answer = switch (op) {
    '+' => a + b,
    '-' => a - b,
    '×' => a * b,
    _ => 0,
  };
  MathQuestion({required this.a, required this.b, required this.op});
}

/// Headless arithmetic engine generated from builder settings:
/// `operations`, `number_range_start/end`, `allow_negative`,
/// `questions_per_level`, `pass_threshold`, `time_per_question`.
/// A session is one level: clear it by hitting `pass_threshold` to win.
class MathEngine extends GameEngine {
  final int questionsPerLevel;
  final int passThreshold;
  final int timePerQuestion;
  final List<String> operations;
  final bool allowNegative;
  final int rangeStart;
  final int rangeEnd;
  final Random _rnd;

  int _level = 1;
  int _qIndex = 0;
  int _correctInLevel = 0;
  int _score = 0;
  bool _answered = false;
  int? _timeLeft;
  Timer? _timer;
  MathQuestion _current = MathQuestion(a: 0, b: 0, op: '+');

  @override
  bool completed = false;

  @override
  int get score => _score;
  @override
  int get maxScore => questionsPerLevel;
  int get level => _level;
  int get qIndex => _qIndex;
  bool get answered => _answered;
  int? get timeLeft => _timeLeft;
  MathQuestion get current => _current;

  MathEngine({Map<String, dynamic> settings = const {}, int? seed})
      : questionsPerLevel =
            _int(settings['questions_per_level'], 5, 1, 50),
        passThreshold = _int(settings['pass_threshold'], 5, 1, 50),
        timePerQuestion = _int(settings['time_per_question'], 0, 0, 300),
        operations = _parseOps(settings['operations']?.toString()),
        allowNegative = settings['allow_negative']?.toString() == '1',
        rangeStart = _int(settings['number_range_start'], 1, -9999, 9999),
        rangeEnd = _int(settings['number_range_end'], 100, -9999, 99999),
        _rnd = seed == null ? Random() : Random(seed) {
    if (operations.isEmpty) operations.addAll(['+', '-', '×']);
    _nextQuestion();
    _maybeStartTimer();
  }

  static int _int(dynamic v, int fallback, int min, int max) {
    final n = v is num ? v.toInt() : int.tryParse(v?.toString() ?? '');
    if (n == null) return fallback;
    return n.clamp(min, max);
  }

  static List<String> _parseOps(String? raw) {
    if (raw == null || raw.trim().isEmpty) return [];
    return raw
        .split(',')
        .map((e) => e.trim())
        .where((e) => ['+', '-', '×', '*', 'x', 'X'].contains(e))
        .map((e) => e == '*' || e == 'x' || e == 'X' ? '×' : e)
        .toList();
  }

  void _nextQuestion() {
    final span = (rangeEnd - rangeStart).abs();
    final grow = min(_level - 1, 10) / 10.0;
    final hi = rangeStart + (span * (0.4 + 0.6 * grow)).round();
    final lo = rangeStart;
    int pick(int from, int to) =>
        to <= from ? from : from + _rnd.nextInt(to - from + 1);
    var a = pick(lo, hi);
    var b = pick(lo, hi);
    final op = operations[_rnd.nextInt(operations.length)];
    if (op == '-' && !allowNegative && b > a) {
      final t = a;
      a = b;
      b = t;
    }
    if (op == '-' && !allowNegative && b > a) b = a;
    if (op == '×') {
      a = a.clamp(0, 12 + _level);
      b = b.clamp(0, 12);
    }
    _current = MathQuestion(a: a, b: b, op: op);
    _answered = false;
  }

  /// Returns true when the submitted value was correct.
  bool submit(int value) {
    if (_answered || completed) return false;
    _answered = true;
    _stopTimer();
    final ok = value == _current.answer;
    if (ok) {
      _score++;
      _correctInLevel++;
      emit(GameFx.correct);
    } else {
      emit(GameFx.wrong);
    }
    notifyListeners();
    return ok;
  }

  void timeout() {
    if (_answered || completed) return;
    _answered = true;
    _stopTimer();
    emit(GameFx.wrong);
    notifyListeners();
  }

  void next() {
    if (!_answered || completed) return;
    if (_qIndex < questionsPerLevel - 1) {
      _qIndex++;
      _maybeStartTimer();
      _nextQuestion();
      notifyListeners();
      return;
    }
    // End of level.
    if (_correctInLevel >= min(passThreshold, questionsPerLevel)) {
      emit(GameFx.levelUp);
      emit(GameFx.win);
    } else {
      emit(GameFx.gameOver);
    }
    completed = true;
    notifyListeners();
  }

  void _maybeStartTimer() {
    _stopTimer();
    if (timePerQuestion <= 0) return;
    _timeLeft = timePerQuestion;
    _timer = Timer.periodic(const Duration(seconds: 1), (_) {
      if (_answered || completed) return _stopTimer();
      _timeLeft = _timeLeft! - 1;
      if (_timeLeft! <= 0) timeout();
      notifyListeners();
    });
  }

  void _stopTimer() {
    _timer?.cancel();
    _timer = null;
  }

  void exitEarly() => _stopTimer();

  @override
  void dispose() {
    _stopTimer();
    super.dispose();
  }
}
