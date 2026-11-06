import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../core/theme/app_colors.dart';
import '../../core/theme/app_dimensions.dart';
import '../../services/player_provider.dart';
import '../../services/api_service.dart';
import '../../core/widgets/states.dart';

class GamesScreen extends StatefulWidget {
  const GamesScreen({super.key});

  @override
  State<GamesScreen> createState() => _GamesScreenState();
}

class _GamesScreenState extends State<GamesScreen> {
  String query = '';
  String category = 'All';

  List<Map<String, dynamic>> get _allGames =>
    context.watch<PlayerProvider>().brandedGames +
    context.watch<PlayerProvider>().promoGames;

  List<Map<String, dynamic>> get filtered {
    final games = _allGames;
    return games.where((g) {
      final name = (g['name'] as String? ?? '').toLowerCase();
      final cat = (g['category'] as String? ?? '');
      final matchesQuery = name.contains(query.toLowerCase());
      final matchesCat = category == 'All' || cat.toLowerCase() == category.toLowerCase();
      return matchesQuery && matchesCat;
    }).toList();
  }

  List<String> get _categories {
    final cats = <String>{'All'};
    for (final g in _allGames) {
      final c = g['category'] as String?;
      if (c != null && c.isNotEmpty) cats.add(c);
    }
    return cats.toList();
  }

  Future<void> _onRefresh() async {
    await context.read<PlayerProvider>().loadAll();
  }

  @override
  Widget build(BuildContext context) {
    final games = _allGames;
    final cats = _categories;
    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: games.isEmpty
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: _onRefresh,
              color: AppColors.primary,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Header + Search in one row
                  Padding(
                    padding: const EdgeInsets.fromLTRB(AppSpace.lg, AppSpace.md, AppSpace.lg, 0),
                    child: Row(
                      children: [
                        const Text('Games', style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: Colors.white)),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Container(
                            height: 40,
                            decoration: BoxDecoration(
                              color: AppColors.surface,
                              borderRadius: BorderRadius.circular(20),
                            ),
                            child: TextField(
                              onChanged: (v) => setState(() => query = v),
                              style: const TextStyle(color: Colors.white, fontSize: 14),
                              decoration: InputDecoration(
                                hintText: 'Search games…',
                                hintStyle: TextStyle(color: Colors.white.withAlpha(100), fontSize: 14),
                                prefixIcon: Icon(Icons.search, color: Colors.white.withAlpha(120), size: 20),
                                border: InputBorder.none,
                                contentPadding: const EdgeInsets.symmetric(vertical: 10),
                              ),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 12),
                  // Category chips
                  SizedBox(
                    height: 40,
                    child: ListView.separated(
                      scrollDirection: Axis.horizontal,
                      padding: const EdgeInsets.symmetric(horizontal: AppSpace.lg),
                      itemCount: cats.length,
                      separatorBuilder: (_, __) => const SizedBox(width: 8),
                      itemBuilder: (_, i) {
                        final c = cats[i];
                        final active = c == category;
                        return ChoiceChip(
                          label: Text(c, style: TextStyle(color: active ? Colors.white : Colors.white.withAlpha(180), fontSize: 13)),
                          selected: active,
                          selectedColor: AppColors.primary,
                          backgroundColor: AppColors.surface,
                          onSelected: (_) => setState(() => category = c),
                        );
                      },
                    ),
                  ),
                  const SizedBox(height: 12),
                  // Games masonry layout
                  Expanded(
                    child: filtered.isEmpty
                        ? const EmptyState(icon: Icons.sports_esports, title: 'No games found', subtitle: 'Try a different search or category')
                        : _MasonryGrid(games: filtered),
                  ),
                ],
              ),
            ),
      ),
    );
  }
}

class _MasonryGrid extends StatelessWidget {
  final List<Map<String, dynamic>> games;
  const _MasonryGrid({required this.games});

  @override
  Widget build(BuildContext context) {
    final col1 = <Map<String, dynamic>>[];
    final col2 = <Map<String, dynamic>>[];
    for (var i = 0; i < games.length; i++) {
      if (i % 2 == 0) {
        col1.add(games[i]);
      } else {
        col2.add(games[i]);
      }
    }

    return SingleChildScrollView(
      padding: const EdgeInsets.symmetric(horizontal: AppSpace.lg),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Expanded(child: _MasonryColumn(games: col1)),
          const SizedBox(width: 12),
          Expanded(child: _MasonryColumn(games: col2)),
        ],
      ),
    );
  }
}

class _MasonryColumn extends StatelessWidget {
  final List<Map<String, dynamic>> games;
  const _MasonryColumn({required this.games});

  @override
  Widget build(BuildContext context) {
    return Column(
      children: games.asMap().entries.map((entry) {
        final i = entry.key;
        final g = entry.value;
        return Padding(
          padding: const EdgeInsets.only(bottom: 12),
          child: _GameCard(g: g, index: i),
        );
      }).toList(),
    );
  }
}

class _GameCard extends StatelessWidget {
  final Map<String, dynamic> g;
  final int index;
  const _GameCard({required this.g, required this.index});

  @override
  Widget build(BuildContext context) {
    final gameName = g['name'] ?? '';
    final category = g['category'] ?? '';
    final gameType = g['game_type'] ?? '';
    final logoUrl = g['game_logo_url'] ?? g['bg_image_url'];
    final clientSlug = g['client_slug'] ?? '';
    final gameSlug = g['slug'] ?? '';

    final heights = [200.0, 160.0, 180.0, 150.0, 190.0, 170.0];
    final cardHeight = heights[index % heights.length];

    return GestureDetector(
      onTap: () => context.push('/games/play', extra: {
        'game': {
          'id': g['id'],
          'name': gameName,
          'category': category,
          'slug': gameSlug,
          'client_slug': clientSlug,
        },
      }),
      child: Container(
        height: cardHeight,
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.circular(14),
          boxShadow: AppShadow.card,
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Expanded(
              flex: 3,
              child: Stack(
                children: [
                  Positioned.fill(
                    child: ClipRRect(
                      borderRadius: const BorderRadius.vertical(top: Radius.circular(14)),
                      child: _GameImage(logoUrl: logoUrl),
                    ),
                  ),
                  Positioned(
                    bottom: 8,
                    left: 8,
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                      decoration: BoxDecoration(
                        color: Colors.black.withAlpha(140),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Text(
                        category.toUpperCase(),
                        style: const TextStyle(color: Colors.white, fontSize: 9, fontWeight: FontWeight.w700, letterSpacing: 0.5),
                      ),
                    ),
                  ),
                ],
              ),
            ),
            Expanded(
              flex: 2,
              child: Padding(
                padding: const EdgeInsets.all(10),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      gameName,
                      style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13, color: Colors.white),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                      decoration: BoxDecoration(
                        color: gameType == 'branded' ? AppColors.accentGold.withAlpha(30) : AppColors.primary.withAlpha(30),
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: Text(
                        gameType == 'branded' ? '50 PC' : '10 PC',
                        style: TextStyle(
                          color: gameType == 'branded' ? AppColors.accentGold : AppColors.secondaryPurple,
                          fontSize: 10,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    ).animate().fadeIn(duration: 300.ms, delay: (index * 50).ms);
  }
}

class _GameImage extends StatelessWidget {
  final dynamic logoUrl;
  const _GameImage({required this.logoUrl});

  String? _buildUrl() {
    if (logoUrl == null) return null;
    final url = logoUrl.toString();
    if (url.isEmpty) return null;
    if (url.startsWith('http')) return url;
    return '${ApiService.webBase}$url';
  }

  @override
  Widget build(BuildContext context) {
    final url = _buildUrl();
    print('[GameImage] logoUrl=$logoUrl, builtUrl=$url');
    if (url == null) {
      return Container(
        decoration: BoxDecoration(
          gradient: LinearGradient(colors: [AppColors.primary, AppColors.secondaryPurple]),
        ),
        child: const Center(child: Icon(Icons.sports_esports, color: Colors.white, size: 36)),
      );
    }
    return Image.network(
      url,
      fit: BoxFit.cover,
      loadingBuilder: (context, child, loadingProgress) {
        if (loadingProgress == null) return child;
        return Container(
          decoration: BoxDecoration(
            gradient: LinearGradient(colors: [AppColors.primary, AppColors.secondaryPurple]),
          ),
          child: const Center(
            child: SizedBox(
              width: 24,
              height: 24,
              child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
            ),
          ),
        );
      },
      errorBuilder: (_, __, ___) => Container(
        decoration: BoxDecoration(
          gradient: LinearGradient(colors: [AppColors.primary, AppColors.secondaryPurple]),
        ),
        child: const Center(child: Icon(Icons.sports_esports, color: Colors.white, size: 36)),
      ),
    );
  }
}
