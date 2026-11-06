import 'package:promogames_engine/engine.dart';

class PouringEngine extends GameEngine {
  static const int capacity = 4;

  late List<List<int>> tubes;
  int? selected;
  int _moves = 0;
  bool _solved = false;
  int _numColors;
  int _seed;

  @override
  int get score => _moves;
  @override
  int get maxScore => _moves;
  @override
  bool get completed => _solved;

  int get moves => _moves;
  bool get isSolved => _solved;

  PouringEngine({Map<String, dynamic> settings = const {}})
      : _numColors = _int(settings['num_colors'], 4),
        _seed = DateTime.now().microsecondsSinceEpoch {
    _newGame();
  }

  static int _int(dynamic v, int fallback) =>
      v is num ? v.toInt() : (int.tryParse(v?.toString() ?? '') ?? fallback);

  int _next() {
    _seed = (_seed * 1103515245 + 12345) & 0x7fffffff;
    return _seed;
  }

  void _newGame() {
    final colors = <int>[];
    for (int c = 0; c < _numColors; c++) {
      for (int k = 0; k < capacity; k++) {
        colors.add(c);
      }
    }
    for (int i = colors.length - 1; i > 0; i--) {
      final j = _next() % (i + 1);
      final tmp = colors[i];
      colors[i] = colors[j];
      colors[j] = tmp;
    }
    tubes = [];
    int idx = 0;
    for (int t = 0; t < _numColors; t++) {
      tubes.add(colors.sublist(idx, idx + capacity));
      idx += capacity;
    }
    tubes.add([]);
    tubes.add([]);
    _moves = 0;
    selected = null;
    _solved = false;
  }

  bool _isSolved() {
    for (final tube in tubes) {
      if (tube.isEmpty) continue;
      final first = tube.first;
      if (tube.length != capacity || tube.any((e) => e != first)) return false;
    }
    return true;
  }

  void newGame() {
    _newGame();
    notifyListeners();
  }

  void tap(int i) {
    if (_solved) return;
    if (selected == null) {
      if (tubes[i].isNotEmpty) {
        selected = i;
        emit(GameFx.tick);
      }
    } else if (selected == i) {
      selected = null;
    } else {
      _pour(selected!, i);
      selected = null;
    }
    notifyListeners();
  }

  void _pour(int from, int to) {
    final src = tubes[from];
    final dst = tubes[to];
    if (src.isEmpty || dst.length >= capacity) return;
    final color = src.last;
    int space = capacity - dst.length;
    while (src.isNotEmpty && src.last == color && space > 0) {
      dst.add(src.removeLast());
      space--;
    }
    _moves++;
    if (_isSolved()) {
      _solved = true;
      emit(GameFx.win);
    } else {
      emit(GameFx.tick);
    }
  }

  void exitEarly() {}
}
