import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:promogames_engine/engine.dart';

Widget buildMinesweeperGame(GameConfig config, GameFinished onFinished) {
  return _MinesweeperGame(config: config, onFinished: onFinished);
}

class _MinesweeperGame extends StatefulWidget {
  final GameConfig config;
  final GameFinished onFinished;
  const _MinesweeperGame({required this.config, required this.onFinished});

  @override
  State<_MinesweeperGame> createState() => _MinesweeperGameState();
}

class _MinesweeperGameState extends State<_MinesweeperGame> {
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

  final String title = 'Minesweeper';
  static const int size = 8;
  static const int mines = 10;

  late List<List<int>> board; // -1 mine, else adjacent mine count
  late List<List<bool>> revealed;
  late List<List<bool>> flagged;
  int cleared = 0;
  bool dead = false;
  bool won = false;

  @override
  void initState() {
    super.initState();
    _parseSettings();
    _newGame();
  }

  void _newGame() {
    board = List.generate(size, (_) => List.filled(size, 0));
    revealed = List.generate(size, (_) => List.filled(size, false));
    flagged = List.generate(size, (_) => List.filled(size, false));
    cleared = 0;
    dead = false;
    won = false;
    int placed = 0;
    while (placed < mines) {
      final x = DateTime.now().microsecondsSinceEpoch + placed * 31;
      final r = x % size;
      final c = (x ~/ size) % size;
      if (board[r][c] != -1) {
        board[r][c] = -1;
        placed++;
      }
    }
    for (int r = 0; r < size; r++) {
      for (int c = 0; c < size; c++) {
        if (board[r][c] == -1) continue;
        int n = 0;
        for (int dr = -1; dr <= 1; dr++) {
          for (int dc = -1; dc <= 1; dc++) {
            final nr = r + dr, nc = c + dc;
            if (nr >= 0 && nr < size && nc >= 0 && nc < size && board[nr][nc] == -1) n++;
          }
        }
        board[r][c] = n;
      }
    }
  }

  void _reveal(int r, int c) {
    if (dead || won || revealed[r][c] || flagged[r][c]) return;
    setState(() {
      revealed[r][c] = true;
      if (board[r][c] == -1) {
        dead = true;
        _finish();
        return;
      }
      cleared++;
      if (board[r][c] == 0) _flood(r, c);
      _checkWin();
    });
  }

  void _flood(int r, int c) {
    for (int dr = -1; dr <= 1; dr++) {
      for (int dc = -1; dc <= 1; dc++) {
        final nr = r + dr, nc = c + dc;
        if (nr >= 0 && nr < size && nc >= 0 && nc < size && !revealed[nr][nc] && !flagged[nr][nc] && board[nr][nc] != -1) {
          revealed[nr][nc] = true;
          cleared++;
          if (board[nr][nc] == 0) _flood(nr, nc);
        }
      }
    }
  }

  void _toggleFlag(int r, int c) {
    if (dead || won || revealed[r][c]) return;
    setState(() => flagged[r][c] = !flagged[r][c]);
  }

  void _checkWin() {
    if (cleared == size * size - mines) {
      won = true;
      _finish();
    }
  }

  void _finish() {
    widget.onFinished(cleared, size * size - mines, won);
  }

  Color _cellColor(int r, int c) {
    if (!revealed[r][c]) return const Color(0xFF1a0e2e);
    if (board[r][c] == -1) return Colors.red.shade900;
    return const Color(0xFF080612);
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
            onPressed: () => widget.onFinished(cleared, size * size - mines, false),
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
                  Text('Cleared: $cleared/${size * size - mines}',
                      style: const TextStyle(color: Color(0xFF22c55e), fontSize: 16)),
                  if (dead)
                    const Text('BOOM!', style: TextStyle(color: Colors.red, fontSize: 18)),
                  if (won)
                    const Text('WIN!', style: TextStyle(color: Color(0xFF22c55e), fontSize: 18)),
                ],
              ),
            ),
            Expanded(
              child: Padding(
                padding: const EdgeInsets.all(8),
                child: GridView.builder(
                  gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                    crossAxisCount: size,
                    crossAxisSpacing: 2,
                    mainAxisSpacing: 2,
                  ),
                  itemCount: size * size,
                  itemBuilder: (ctx, idx) {
                    final r = idx ~/ size, c = idx % size;
                    return GestureDetector(
                      onTap: () => _reveal(r, c),
                      onLongPress: () => _toggleFlag(r, c),
                      child: Container(
                        decoration: BoxDecoration(
                          color: _cellColor(r, c),
                          borderRadius: BorderRadius.circular(3),
                          border: Border.all(color: _primaryColor, width: 0.5),
                        ),
                        child: Center(
                          child: revealed[r][c]
                              ? (board[r][c] > 0
                                  ? Text('${board[r][c]}',
                                      style: const TextStyle(color: Colors.white, fontSize: 11))
                                  : (board[r][c] == -1
                                      ? const Icon(Icons.brightness_1, size: 12, color: Colors.red)
                                      : null))
                              : (flagged[r][c]
                                  ? const Icon(Icons.flag, size: 12, color: Color(0xFF22c55e))
                                  : null),
                        ),
                      ),
                    );
                  },
                ),
              ),
            ),
            ElevatedButton(
              style: ElevatedButton.styleFrom(
                backgroundColor: _primaryColor,
                foregroundColor: Colors.white,
              ),
              onPressed: () => setState(_newGame),
              child: const Text('NEW GAME'),
            ),
            const SizedBox(height: 12),
          ],
        ),
        ],
      ),
    );
  }
}
