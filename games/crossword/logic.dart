import 'dart:math';

import 'package:promogames_engine/engine.dart';

class CrosswordClue {
  final int number;
  final String clue;
  final String word;
  final bool across;
  const CrosswordClue({
    required this.number,
    required this.clue,
    required this.word,
    required this.across,
  });
}

/// Headless crossword engine. Builds the solution grid from real admin
/// entries (`config.words`: `word_text`, `start_row`, `start_col`,
/// `direction`), grades cell entries and hands out hints when the builder
/// allows them (`allow_hints`).
class CrosswordEngine extends GameEngine {
  late final int rows;
  late final int cols;
  late final List<List<String?>> solution;
  final List<CrosswordClue> clues = [];
  final Set<int> _revealed = {};
  Set<int> _wrongCells = {};
  bool _checkedComplete = false;

  @override
  int score = 0;

  @override
  int get maxScore {
    var n = 0;
    for (final row in solution) {
      for (final c in row) {
        if (c != null) n++;
      }
    }
    return n;
  }

  @override
  bool get completed => _checkedComplete;

  bool get hasWrongMarks => _wrongCells.isNotEmpty;

  CrosswordEngine({
    Map<String, dynamic> settings = const {},
    List<dynamic> words = const [],
  }) {
    _build(settings, words);
  }

  void _build(Map<String, dynamic> settings, List<dynamic> raw) {
    final entries = <_Entry>[];
    for (final w in raw) {
      if (w is! Map) continue;
      final text = (w['word_text'] ?? '').toString().trim().toUpperCase();
      if (text.length < 2) continue;
      entries.add(_Entry(
        word: text,
        clue: (w['clue_text'] ?? '').toString(),
        row: _int(w['start_row'], 0),
        col: _int(w['start_col'], 0),
        across: w['direction']?.toString() != 'down',
      ));
    }
    if (entries.isEmpty) return _fallbackGrid();

    final autoSize = settings['auto_size']?.toString() == '1';
    var rCount = _int(settings['grid_rows'], 10).clamp(3, 30);
    var cCount = _int(settings['grid_cols'], 10).clamp(3, 30);
    if (autoSize) {
      for (final e in entries) {
        rCount = max(rCount, e.across ? e.row + 1 : e.row + e.word.length);
        cCount = max(cCount, e.across ? e.col + e.word.length : e.col + 1);
      }
    } else {
      // Keep words inside the fixed grid; drop any that overflow.
      entries.removeWhere((e) {
        final endRow = e.across ? e.row : e.row + e.word.length;
        final endCol = e.across ? e.col + e.word.length : e.col;
        return endRow > rCount || endCol > cCount;
      });
      if (entries.isEmpty) return _fallbackGrid();
    }

    rows = rCount;
    cols = cCount;
    solution = List.generate(rows, (_) => List.filled(cols, null));
    for (final e in entries) {
      for (var i = 0; i < e.word.length; i++) {
        final r = e.across ? e.row : e.row + i;
        final c = e.across ? e.col + i : e.col;
        solution[r][c] = e.word[i];
      }
    }
    _numberClues(entries);
  }

  static int _int(dynamic v, int fallback) {
    final n = v is num ? v.toInt() : int.tryParse(v?.toString() ?? '');
    return n ?? fallback;
  }

  void _numberClues(List<_Entry> entries) {
    final starts = <String, int>{};
    var next = 1;
    for (var r = 0; r < rows; r++) {
      for (var c = 0; c < cols; c++) {
        if (solution[r][c] == null) continue;
        final startsAcross =
            (c == 0 || solution[r][c - 1] == null) && _filled(r, c + 1);
        final startsDown =
            (r == 0 || solution[r - 1][c] == null) && _filled(r + 1, c);
        if (!startsAcross && !startsDown) continue;
        starts['$r:$c'] = next++;
      }
    }
    for (final e in entries..sort((a, b) => a.word.compareTo(b.word))) {
      final n = starts['${e.row}:${e.col}'];
      if (n == null) continue;
      clues.add(CrosswordClue(
          number: n, clue: e.clue, word: e.word, across: e.across));
    }
  }

  bool _filled(int r, int c) =>
      r >= 0 && r < rows && c >= 0 && c < cols && solution[r][c] != null;

  void _fallbackGrid() {
    rows = 5;
    cols = 5;
    solution = [
      ['C', 'A', 'T', null, null],
      ['O', null, null, null, null],
      ['W', 'E', 'B', null, null],
      [null, null, null, null, null],
      [null, null, null, null, null],
    ];
    clues
      ..add(const CrosswordClue(number: 1, clue: 'A small pet that meows', word: 'CAT', across: true))
      ..add(const CrosswordClue(number: 2, clue: 'Animal that gives milk', word: 'COW', across: true))
      ..add(const CrosswordClue(number: 3, clue: 'Part of the internet', word: 'WEB', across: true));
  }

  /// Grades a full grid of uppercase letters. Returns correct letter count.
  int check(List<List<String>> entries) {
    score = 0;
    _wrongCells = {};
    for (var r = 0; r < rows; r++) {
      for (var c = 0; c < cols; c++) {
        final sol = solution[r][c];
        if (sol == null) continue;
        final given = (entries[r][c]).trim().toUpperCase();
        if (given.isEmpty) continue;
        if (given == sol || _revealed.contains(r * cols + c)) {
          score++;
        } else {
          _wrongCells.add(r * cols + c);
        }
      }
    }
    _checkedComplete = score == maxScore;
    emit(_checkedComplete ? GameFx.win : (_wrongCells.isEmpty ? GameFx.tick : GameFx.wrong));
    notifyListeners();
    return score;
  }

  /// Reveals one hidden letter of an empty or wrong cell. Returns its index,
  /// or null when hints are exhausted. Score is not increased by hints.
  int? revealLetter(List<List<String>> entries) {
    for (var r = 0; r < rows; r++) {
      for (var c = 0; c < cols; c++) {
        final idx = r * cols + c;
        final sol = solution[r][c];
        if (sol == null || _revealed.contains(idx)) continue;
        if ((entries[r][c]).trim().toUpperCase() == sol) continue;
        _revealed.add(idx);
        entries[r][c] = sol;
        emit(GameFx.tick);
        notifyListeners();
        return idx;
      }
    }
    return null;
  }

  bool isWrongCell(int r, int c) => _wrongCells.contains(r * cols + c);

  void exitEarly() {}
}

class _Entry {
  final String word;
  final String clue;
  final int row;
  final int col;
  final bool across;
  const _Entry({
    required this.word,
    required this.clue,
    required this.row,
    required this.col,
    required this.across,
  });
}
