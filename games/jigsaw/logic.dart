import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:promogames_engine/engine.dart';

const _bg = LinearGradient(
  begin: Alignment.topLeft,
  end: Alignment.bottomRight,
  colors: [Color(0xFF0d0a1a), Color(0xFF1a0e2e), Color(0xFF0f0b1e), Color(0xFF080612)],
);
const _purple = Color(0xFF8b5cf6);
const _green = Color(0xFF22c55e);

Widget buildJigsawGame(GameConfig config, GameFinished onFinished) {
  return _JigsawGame(config: config, onFinished: onFinished);
}

class _JigsawGame extends StatefulWidget {
  final GameConfig config;
  final GameFinished onFinished;
  const _JigsawGame({required this.config, required this.onFinished});

  @override
  State<_JigsawGame> createState() => _JigsawGameState();
}

class _Piece {
  final int id;
  final Color color;
  final String label;
  const _Piece(this.id, this.color, this.label);
}

class _JigsawGameState extends State<_JigsawGame> {
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

  static const int _count = 4;
  final List<_Piece> _pieces = const [
    _Piece(0, Color(0xFF8b5cf6), '1'),
    _Piece(1, Color(0xFF22c55e), '2'),
    _Piece(2, Color(0xFFeab308), '3'),
    _Piece(3, Color(0xFF06b6d4), '4'),
  ];
  // slot index -> piece id placed there
  late List<int?> _slots;

  @override
  void initState() {
    super.initState();
    _parseSettings();
    _slots = List.filled(_count, null);
  }

  int get _placed => _slots.where((s) => s != null).length;

  void _onPlaced(int slot, int pieceId) {
    setState(() => _slots[slot] = pieceId);
    if (_slots.every((s) => s != null)) {
      widget.onFinished(_count, _count, true);
    }
  }

  Widget _buildPiece(_Piece p) {
    final used = _slots.contains(p.id);
    if (used) return const SizedBox(width: 64, height: 64);
    return Draggable<int>(
      data: p.id,
      feedback: _tile(p, 64),
      childWhenDragging: Opacity(opacity: 0.3, child: _tile(p, 64)),
      child: _tile(p, 64),
    );
  }

  Widget _tile(_Piece p, double s) {
    return Container(
      width: s,
      height: s,
      decoration: BoxDecoration(
        color: p.color,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: Colors.white, width: 2),
      ),
      child: Center(child: Text(p.label, style: const TextStyle(fontSize: 28, color: Colors.white))),
    );
  }

  Widget _buildSlot(int slot) {
    final filled = _slots[slot];
    return DragTarget<int>(
      builder: (context, candidate, rejected) {
        final piece = filled == null ? null : _pieces.firstWhere((p) => p.id == filled);
        return Container(
          width: 64,
          height: 64,
          decoration: BoxDecoration(
            color: piece == null ? Colors.white10 : piece.color,
            borderRadius: BorderRadius.circular(8),
            border: Border.all(color: candidate.isNotEmpty ? _green : _purple, width: 2),
          ),
          child: piece == null
              ? null
              : Center(child: Text(piece.label, style: const TextStyle(fontSize: 28, color: Colors.white))),
        );
      },
      onWillAcceptWithDetails: (d) => d.data == slot,
      onAcceptWithDetails: (d) => _onPlaced(slot, d.data),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        backgroundColor: _bgColor,
        title: Text(widget.config.name ?? 'Game'),
        leading: IconButton(
          icon: const Icon(Icons.close),
          onPressed: () {
            widget.onFinished(_placed, _count, false);
            Navigator.of(context).maybePop();
          },
        ),
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

          SafeArea(

            child: Padding(

              padding: const EdgeInsets.all(16),

              child:  Column(
          children: [
            Text('Placed: $_placed / $_count',
                style: const TextStyle(color: _green, fontSize: 18, fontWeight: FontWeight.bold)),
            const SizedBox(height: 24),
            const Text('Drag each piece onto its matching slot (1→1, 2→2, ...).',
                style: TextStyle(color: Colors.white54, fontSize: 13)),
            const SizedBox(height: 16),
            GridView.count(
              shrinkWrap: true,
              crossAxisCount: 2,
              mainAxisSpacing: 16,
              crossAxisSpacing: 16,
              childAspectRatio: 1,
              children: List.generate(_count, (i) => _buildSlot(i)),
            ),
            const Spacer(),
            const Text('Pieces:', style: TextStyle(color: Colors.white54, fontSize: 13)),
            const SizedBox(height: 8),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceEvenly,
              children: _pieces.map(_buildPiece).toList(),
            ),
            const SizedBox(height: 16),
          ],
        ),
      ),
    ),
  ],
  ),
);
  }
}
