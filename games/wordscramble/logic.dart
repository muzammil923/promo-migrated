import 'dart:math';

import 'package:promogames_engine/engine.dart';

/// Headless Word Scramble engine. Owns the rules: word list, scrambling,
/// scoring and round progression. No widgets, no colors, no network.
class WordScrambleEngine extends GameEngine {
  final int timePerWord;
  final bool allowBack;

  late final List<_WordEntry> _words;
  int _index = 0;
  int _score = 0;
  bool _answered = false;
  String _feedback = '';
  bool _isCorrect = false;

  @override
  int get score => _score;

  @override
  int get maxScore => _words.length;

  @override
  bool get completed => _index >= _words.length;

  int get index => _index;
  int get total => _words.length;
  bool get answered => _answered;
  String get feedback => _feedback;
  bool get isCorrect => _isCorrect;
  bool get isLast => _index >= _words.length - 1;
  _WordEntry get current => _words[_index];
  String get scrambled => _scramble(current.text);

  WordScrambleEngine({
    Map<String, dynamic> settings = const {},
    List<dynamic> words = const [],
  })  : timePerWord = _int(settings['time_per_word'], 30, 0, 600),
        allowBack = settings['allow_back']?.toString() == '1' {
    _words = _normalize(words);
  }

  static int _int(dynamic v, int fallback, int min, int max) {
    final n = v is num ? v.toInt() : int.tryParse(v?.toString() ?? '');
    if (n == null) return fallback;
    return n.clamp(min, max);
  }

  List<_WordEntry> _normalize(List<dynamic> raw) {
    final entries = <_WordEntry>[];
    for (final w in raw) {
      if (w is! Map) continue;
      final text = (w['word_text'] ?? '').toString().trim().toUpperCase();
      if (text.length < 2) continue;
      final hint = (w['clue_text'] ?? w['hint_text'] ?? '').toString().trim();
      entries.add(_WordEntry(text: text, hint: hint.isEmpty ? null : hint));
    }
    if (entries.isEmpty) {
      return const [
        _WordEntry(text: 'FLUTTER'),
        _WordEntry(text: 'GAMING'),
        _WordEntry(text: 'PUZZLE'),
        _WordEntry(text: 'REWARD'),
        _WordEntry(text: 'BONUS'),
        _WordEntry(text: 'PLAYER'),
      ];
    }
    final rnd = Random();
    entries.shuffle(rnd);
    return entries;
  }

  String _scramble(String w) {
    final chars = w.split('');
    final rnd = Random();
    for (var i = chars.length - 1; i > 0; i--) {
      final j = rnd.nextInt(i + 1);
      final t = chars[i];
      chars[i] = chars[j];
      chars[j] = t;
    }
    final result = chars.join();
    return result == w ? _scramble(w) : result;
  }

  void answer(String guess) {
    if (_answered || completed) return;
    _answered = true;
    if (guess.trim().toUpperCase() == current.text) {
      _score++;
      _isCorrect = true;
      _feedback = 'Correct!';
      emit(GameFx.correct);
    } else {
      _isCorrect = false;
      _feedback = 'Try again — the word was ${current.text}';
      emit(GameFx.wrong);
    }
    notifyListeners();
  }

  void next() {
    if (!_answered || completed) return;
    _index++;
    _answered = false;
    _feedback = '';
    if (completed) {
      emit(GameFx.win);
    }
    notifyListeners();
  }

  void back() {
    if (!allowBack || _index == 0 || completed) return;
    _index--;
    _answered = false;
    _feedback = '';
    notifyListeners();
  }

  void exitEarly() {}

  @override
  void dispose() {
    super.dispose();
  }
}

class _WordEntry {
  final String text;
  final String? hint;
  const _WordEntry({required this.text, this.hint});
}
