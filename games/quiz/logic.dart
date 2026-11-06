import 'dart:async';
import 'dart:math';

import 'package:promogames_engine/engine.dart';

class QuizQuestion {
  final String text;
  final List<String> options;
  final int? correctIndex;
  final bool scored;
  const QuizQuestion({
    required this.text,
    required this.options,
    this.correctIndex,
    required this.scored,
  });
}

/// Headless quiz engine driven by builder settings and real admin-authored
/// questions (`config.questions`): `question_text`, `question_type`
/// (`right_wrong` scores / `opinion` does not) and `options[].is_correct`.
class QuizEngine extends GameEngine {
  final bool allowBack;
  final int timePerQuestion;

  late final List<QuizQuestion> _questions;
  int _index = 0;
  int _score = 0;
  int? _selected;
  bool _answered = false;
  int? _timeLeft;
  Timer? _timer;

  @override
  bool completed = false;

  @override
  int get score => _score;

  @override
  int get maxScore =>
      _questions.where((q) => q.scored).length.clamp(0, _questions.length);

  int get total => _questions.length;
  int get index => _index;
  bool get answered => _answered;
  int? get selected => _selected;
  int? get timeLeft => _timeLeft;
  bool get isLast => _index >= total - 1;

  QuizQuestion get current => _questions[_index];

  QuizEngine({
    Map<String, dynamic> settings = const {},
    List<dynamic> questions = const [],
  })  : allowBack = settings['allow_back']?.toString() == '1',
        timePerQuestion = _int(settings['time_per_question'], 0, 0, 600) {
    _questions = _normalize(settings, questions);
    _maybeStartTimer();
  }

  static int _int(dynamic v, int fallback, int min, int max) {
    final n = v is num ? v.toInt() : int.tryParse(v?.toString() ?? '');
    if (n == null) return fallback;
    return n.clamp(min, max);
  }

  List<QuizQuestion> _normalize(Map<String, dynamic> settings, List<dynamic> raw) {
    var parsed = <QuizQuestion>[];
    for (final q in raw) {
      if (q is! Map) continue;
      final opts = (q['options'] as List?) ?? const [];
      final texts = <String>[];
      int? correct;
      for (var i = 0; i < opts.length; i++) {
        final o = opts[i];
        if (o is! Map) continue;
        final t = (o['option_text'] ?? '').toString().trim();
        if (t.isEmpty) continue;
        texts.add(t);
        if (o['is_correct']?.toString() == '1' && correct == null) {
          correct = texts.length - 1;
        }
      }
      final type = q['question_type']?.toString();
      final scored = type != 'opinion' && correct != null;
      final text = (q['question_text'] ?? '').toString().trim();
      if (text.isEmpty || texts.isEmpty) continue;
      parsed.add(QuizQuestion(
        text: text,
        options: texts,
        correctIndex: scored ? correct : null,
        scored: scored,
      ));
    }

    final rnd = Random();
    if (settings['randomize_questions']?.toString() == '1') {
      parsed.shuffle(rnd);
    }
    final perSession = _int(settings['questions_per_session'], 0, 0, 500);
    if (perSession > 0 && perSession < parsed.length) {
      parsed = parsed.sublist(0, perSession);
    }
    if (parsed.isEmpty) return _fallback;
    return parsed;
  }

  static const _fallback = <QuizQuestion>[
    QuizQuestion(text: 'What is the capital of France?',
        options: ['London', 'Paris', 'Berlin', 'Madrid'], correctIndex: 1, scored: true),
    QuizQuestion(text: 'How many continents are there?',
        options: ['5', '6', '7', '8'], correctIndex: 2, scored: true),
    QuizQuestion(text: 'Which planet is the Red Planet?',
        options: ['Venus', 'Jupiter', 'Mars', 'Saturn'], correctIndex: 2, scored: true),
  ];

  void answer(int i) {
    if (_answered || completed) return;
    final q = current;
    _selected = i;
    _answered = true;
    _stopTimer();
    if (!q.scored) {
      notifyListeners();
      return;
    }
    if (i == q.correctIndex) {
      _score++;
      emit(GameFx.correct);
    } else {
      emit(GameFx.wrong);
    }
    notifyListeners();
  }

  void timeout() {
    if (_answered || !current.scored) return;
    _answered = true;
    _stopTimer();
    emit(GameFx.wrong);
    notifyListeners();
  }

  void next() {
    if (!_answered || completed) return;
    if (!isLast) {
      _index++;
      _selected = null;
      _answered = false;
      _maybeStartTimer();
      notifyListeners();
    } else {
      completed = true;
      emit(GameFx.win);
      notifyListeners();
    }
  }

  void back() {
    if (!allowBack || _index == 0 || completed) return;
    if (current.scored && _answered && _selected == current.correctIndex) {
      _score--;
    }
    _index--;
    _selected = null;
    _answered = false;
    _maybeStartTimer();
    notifyListeners();
  }

  void _maybeStartTimer() {
    _stopTimer();
    if (timePerQuestion <= 0) return;
    _timeLeft = timePerQuestion;
    _timer = Timer.periodic(const Duration(seconds: 1), (_) {
      if (_answered || completed) return _stopTimer();
      _timeLeft = _timeLeft! - 1;
      emit(GameFx.tick);
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
