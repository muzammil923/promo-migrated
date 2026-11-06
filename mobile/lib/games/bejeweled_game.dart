import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:promogames_engine/engine.dart';
import 'package:promogames_engine/engine.dart';

Widget buildBejeweledGame(GameConfig config, GameFinished onFinished) {
  return _BejeweledGame(config: config, onFinished: onFinished);
}

class _BejeweledGame extends StatefulWidget {
  final GameConfig config;
  final GameFinished onFinished;
  const _BejeweledGame({required this.config, required this.onFinished});

  @override
  State<_BejeweledGame> createState() => _BejeweledGameState();
}

class _BejeweledGameState extends State<_BejeweledGame> {
  Color _bgColor = const Color(0xFF0d0a1a);
  Color _primaryColor = const Color(0xFF8b5cf6);
  String? _bgImageUrl;
  String? _logoUrl;

  void _parseSettings() {
    final s = widget.config.settings;
    _bgColor = _hexToColor(s['bg_color']?.toString()) ?? const Color(0xFF0d0a1a);
    _primaryColor = _hexToColor(s['primary_color']?.toString()) ?? const Color(0xFF8b5cf6);
    _bgImageUrl = s['bg_image_url']?.toString();
    _logoUrl = s['game_logo_url']?.toString();
  }

  Color? _hexToColor(String? hex) {
    if (hex == null || hex.isEmpty) return null;
    hex = hex.replaceFirst('#', '');
    if (hex.length == 6) hex = 'FF$hex';
    try { return Color(int.parse(hex, radix: 16)); } catch (_) { return null; }
  }

  final String title = 'Bejeweled';
  static const int n = 8;
  static const int colors = 6;

  late List<List<int>> board;
  List<int>? selected;
  int score = 0;

  final List<Color> palette = const [
    Color(0xFF8b5cf6),
    Color(0xFF22c55e),
    Color(0xFFef4444),
    Color(0xFFf59e0b),
    Color(0xFF06b6d4),
    Color(0xFFec4899),
  ];

  @override
  void initState() {
    super.initState();
    _parseSettings();
    _newGame();
  }

  void _newGame() {
    board = List.generate(n, (r) => List.generate(n, (c) {
      int v;
      do {
        v = (DateTime.now().microsecondsSinceEpoch + r * 31 + c * 17 + score) % colors;
      } while (_createsMatch(r, c, v));
      return v;
    }));
    selected = null;
    score = 0;
  }

  bool _createsMatch(int r, int c, int v) {
    if (c >= 2 && board[r][c - 1] == v && board[r][c - 2] == v) return true;
    if (r >= 2 && board[r - 1][c] == v && board[r - 2][c] == v) return true;
    return false;
  }

  bool _adjacent(List<int> a, List<int> b) =>
      (a[0] - b[0]).abs() + (a[1] - b[1]).abs() == 1;

  void _tap(int r, int c) {
    if (selected == null) {
      setState(() => selected = [r, c]);
      return;
    }
    if (selected![0] == r && selected![1] == c) {
      setState(() => selected = null);
      return;
    }
    if (_adjacent(selected!, [r, c])) {
      _swap(selected!, [r, c]);
    } else {
      setState(() => selected = [r, c]);
    }
  }

  void _swap(List<int> a, List<int> b) {
    final tmp = board[a[0]][a[1]];
    board[a[0]][a[1]] = board[b[0]][b[1]];
    board[b[0]][b[1]] = tmp;
    if (_findMatches().isEmpty) {
      // revert
      final t2 = board[a[0]][a[1]];
      board[a[0]][a[1]] = board[b[0]][b[1]];
      board[b[0]][b[1]] = t2;
      setState(() {
        selected = null;
      });
    } else {
      setState(() => selected = null);
      _resolve();
    }
  }

  Set<String> _findMatches() {
    final matched = <String>{};
    for (int r = 0; r < n; r++) {
      for (int c = 0; c < n - 2; c++) {
        final v = board[r][c];
        if (v < 0) continue;
        if (board[r][c + 1] == v && board[r][c + 2] == v) {
          int k = c;
          while (k < n && board[r][k] == v) {
            matched.add('$r,$k');
            k++;
          }
        }
      }
    }
    for (int c = 0; c < n; c++) {
      for (int r = 0; r < n - 2; r++) {
        final v = board[r][c];
        if (v < 0) continue;
        if (board[r + 1][c] == v && board[r + 2][c] == v) {
          int k = r;
          while (k < n && board[k][c] == v) {
            matched.add('$k,$c');
            k++;
          }
        }
      }
    }
    return matched;
  }

  void _resolve() {
    int gained = 0;
    for (int pass = 0; pass < 20; pass++) {
      final matched = _findMatches();
      if (matched.isEmpty) break;
      gained += matched.length;
      for (final m in matched) {
        final parts = m.split(',');
        board[int.parse(parts[0])][int.parse(parts[1])] = -1;
      }
      // gravity
      for (int c = 0; c < n; c++) {
        final col = <int>[];
        for (int r = n - 1; r >= 0; r--) {
          if (board[r][c] != -1) col.add(board[r][c]);
        }
        for (int r = n - 1; r >= 0; r--) {
          board[r][c] = col.length > (n - 1 - r) ? col[n - 1 - r] : -1;
        }
        for (int r = 0; r < n; r++) {
          if (board[r][c] == -1) {
            board[r][c] = DateTime.now().microsecondsSinceEpoch % colors;
          }
        }
      }
    }
    setState(() => score += gained);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(widget.config.name ?? title),
        backgroundColor: _bgColor,
        actions: [
          IconButton(
            icon: const Icon(Icons.close),
            onPressed: () => widget.onFinished(score, 0, false),
          )
        ],
      ),
      body: Stack(

        fit: StackFit.expand,

        children: [

          if (_bgImageUrl != null)

            CachedNetworkImage(

              imageUrl: _bgImageUrl!,

              fit: BoxFit.cover,

              placeholder: (_, __) => Container(color: _bgColor),

              errorWidget: (_, __, ___) => Container(color: _bgColor),

            )

          else Container(color: _bgColor),

          Container(color: Colors.black.withOpacity(0.3)),

           Column(
          children: [
            Padding(
              padding: const EdgeInsets.all(10),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text('Score: $score',
                      style: const TextStyle(color: Color(0xFF22c55e), fontSize: 18)),
                  Text('Tap two adjacent gems',
                      style: TextStyle(color: Colors.white70, fontSize: 12)),
                ],
              ),
            ),
            Expanded(
              child: Padding(
                padding: const EdgeInsets.all(8),
                child: GridView.builder(
                  gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                    crossAxisCount: n,
                    crossAxisSpacing: 2,
                    mainAxisSpacing: 2,
                  ),
                  itemCount: n * n,
                  itemBuilder: (ctx, idx) {
                    final r = idx ~/ n, c = idx % n;
                    final v = board[r][c];
                    final isSel = selected != null && selected![0] == r && selected![1] == c;
                    return GestureDetector(
                      onTap: () => _tap(r, c),
                      child: Container(
                        decoration: BoxDecoration(
                          color: v < 0 ? Colors.black : palette[v],
                          borderRadius: BorderRadius.circular(6),
                          border: Border.all(
                            color: isSel ? const Color(0xFF22c55e) : Colors.transparent,
                            width: isSel ? 3 : 0,
                          ),
                        ),
                      ),
                    );
                  },
                ),
              ),
            ),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceEvenly,
              children: [
                ElevatedButton(
                  style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF1a0e2e)),
                  onPressed: () => widget.onFinished(score, 0, false),
                  child: const Text('FINISH', style: TextStyle(color: Color(0xFF8b5cf6))),
                ),
                ElevatedButton(
                  style: ElevatedButton.styleFrom(backgroundColor: _primaryColor),
                  onPressed: () => setState(_newGame),
                  child: const Text('RESTART', style: TextStyle(color: Colors.white)),
                ),
              ],
            ),
            const SizedBox(height: 12),
          ],
        ),
        ],
      ),
    );
  }
}
