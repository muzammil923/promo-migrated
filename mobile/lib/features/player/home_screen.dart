import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_dimensions.dart';
import '../../core/data/mock_data.dart';
import '../../services/player_provider.dart';
import '../../core/widgets/app_button.dart';
import '../../core/widgets/cards.dart';

class HomeScreen extends StatelessWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.only(bottom: AppSpace.xl),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _Header(),
              const SizedBox(height: AppSpace.lg),
              _Hero(),
              const SizedBox(height: AppSpace.lg),
              _QuickActions(),
              const SizedBox(height: AppSpace.lg),
              _GameSections(),
              const SizedBox(height: AppSpace.lg),
              _AchievementsPreview(),
              const SizedBox(height: AppSpace.lg),
              _LeaderboardPreview(onMore: () => context.go('/leaderboard')),
              const SizedBox(height: AppSpace.lg),
              _RewardPreview(onMore: () => context.go('/rewards')),
            ],
          ),
        ),
      ),
    );
  }
}

class _Header extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    final prov = context.watch<PlayerProvider>();
    final name = prov.user?.username ?? MockData.username;
    final bal = prov.pcBalance;
    final pending = prov.pendingCount;
    return Padding(
      padding: const EdgeInsets.fromLTRB(AppSpace.lg, AppSpace.md, AppSpace.lg, 0),
      child: SizedBox(
        height: 44,
        child: Stack(
          children: [
            Positioned.fill(
              child: Align(
                alignment: Alignment.centerLeft,
                child: Padding(
                  padding: const EdgeInsets.only(right: 50),
                  child: FittedBox(
                    fit: BoxFit.scaleDown,
                    alignment: Alignment.centerLeft,
                    child: Text('Welcome, $name 👋',
                        style: const TextStyle(fontSize: 22, fontWeight: FontWeight.bold, color: Colors.white)),
                  ),
                ),
              ),
            ),
            Positioned(
              right: 0,
              top: 0,
              child: Stack(
                children: [
                  Container(
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      color: AppColors.surface,
                      shape: BoxShape.circle,
                      border: Border.all(color: Colors.white.withAlpha(60), width: 1),
                    ),
                    child: GestureDetector(
                      onTap: () => context.go('/notifications'),
                      child: const Icon(Icons.notifications_outlined, color: Colors.white, size: 22),
                    ),
                  ),
                  if (pending > 0)
                    Positioned(
                      right: 0,
                      top: 0,
                      child: Container(
                        padding: const EdgeInsets.all(4),
                        decoration: const BoxDecoration(color: AppColors.accentGold, shape: BoxShape.circle),
                        child: Text('$pending', style: const TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.bold)),
                      ),
                    ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _Hero extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    final prov = context.watch<PlayerProvider>();
    final bal = prov.pcBalance;
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: AppSpace.lg),
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 12),
      decoration: BoxDecoration(
        gradient: AppColors.heroGradient,
        borderRadius: BorderRadius.circular(16),
        boxShadow: AppShadow.soft,
      ),
      child: Column(
        children: [
          Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('PC Balance', style: TextStyle(color: Colors.white70, fontSize: 14)),
                    const SizedBox(height: 4),
                    Row(
                      crossAxisAlignment: CrossAxisAlignment.center,
                      children: [
                        Text('$bal',
                            style: const TextStyle(color: Colors.white, fontSize: 34, fontWeight: FontWeight.bold)),
                        const Text(' PC', style: TextStyle(color: Colors.white70, fontSize: 18)),
                      ],
                    ),
                    const SizedBox(height: 10),
                    Text('Level ${MockData.level}', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w600)),
                    const SizedBox(height: 6),
                    ClipRRect(
                      borderRadius: BorderRadius.circular(10),
                      child: LinearProgressIndicator(
                        value: MockData.xp / MockData.xpMax,
                        minHeight: 8,
                        backgroundColor: Colors.white.withAlpha(30),
                        valueColor: const AlwaysStoppedAnimation(Colors.white),
                      ).animate().scale(begin: const Offset(0, 1), end: const Offset(1, 1), duration: 900.ms, curve: Curves.easeOut, alignment: Alignment.centerLeft),
                    ),
                    const SizedBox(height: 4),
                    Text('${MockData.xp} / ${MockData.xpMax} XP to Level ${MockData.level + 1}', style: const TextStyle(color: Colors.white70, fontSize: 12)),
                  ],
                ),
              ),
              const SizedBox(width: 8),
              SizedBox(
                height: 160,
                child: Image.asset(
                  'assets/hero-mascot.png',
                  fit: BoxFit.contain,
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
          Row(
            children: [
              Expanded(child: AppButton(label: 'Play Games', icon: Icons.play_arrow, white: true, onTap: () => context.go('/games'))),
              const SizedBox(width: 12),
              Expanded(
                child: Container(
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  decoration: BoxDecoration(
                    color: AppColors.primary,
                    borderRadius: BorderRadius.circular(AppRadius.button),
                    border: Border.all(color: Colors.white.withAlpha(80), width: 1),
                    boxShadow: [
                      BoxShadow(color: AppColors.primary.withAlpha(80), blurRadius: 16, offset: const Offset(0, 6)),
                      BoxShadow(color: Colors.white.withAlpha(20), blurRadius: 4, offset: const Offset(0, -2)),
                    ],
                  ),
                  child: GestureDetector(
                    onTap: () => context.go('/wallet'),
                    child: const Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(Icons.account_balance_wallet, color: Colors.white, size: 20),
                        SizedBox(width: 8),
                        Text('Wallet', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w600, fontSize: 16)),
                      ],
                    ),
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    ).animate().fadeIn(duration: 400.ms).moveY(begin: 12, end: 0, duration: 400.ms);
  }
}

class _QuickActions extends StatelessWidget {
  static const _items = [
    (Icons.sports_esports_rounded, 'Play', AppColors.primary),
    (Icons.card_giftcard_rounded, 'Rewards', AppColors.accentGold),
    (Icons.leaderboard_rounded, 'Ranks', AppColors.secondaryPurple),
    (Icons.group_add_rounded, 'Invite', AppColors.success),
  ];

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: AppSpace.lg),
      child: Row(
        children: _items.map((it) {
          return Expanded(
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 6),
              child: InkWell(
                borderRadius: BorderRadius.circular(AppRadius.card),
                onTap: () {
                  if (it.$2 == 'Play') context.go('/games');
                  if (it.$2 == 'Rewards') context.go('/rewards');
                  if (it.$2 == 'Ranks') context.go('/leaderboard');
                  if (it.$2 == 'Invite') context.go('/referral');
                },
                child: Container(
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  decoration: BoxDecoration(
                    color: AppColors.surfaceVariant,
                    borderRadius: BorderRadius.circular(AppRadius.card),
                    boxShadow: AppShadow.card,
                  ),
                  child: Column(
                    children: [
                      Container(
                        width: 48,
                        height: 48,
                        decoration: BoxDecoration(
                          color: AppColors.primary.withAlpha(40),
                          borderRadius: BorderRadius.circular(16),
                        ),
                        child: Icon(it.$1, color: Colors.white, size: 24),
                      ),
                      const SizedBox(height: 8),
                      Text(it.$2, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: Colors.white)),
                    ],
                  ),
                ),
              ),
            ),
          );
        }).toList(),
      ),
    );
  }
}

class _DailyGoals extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: AppSpace.lg),
      child: Container(
        padding: const EdgeInsets.all(AppSpace.lg),
        decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(AppRadius.card), boxShadow: AppShadow.card),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                const Icon(Icons.local_fire_department, color: AppColors.warning),
                const SizedBox(width: 8),
                const Text('Daily Goals', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.white)),
                const Spacer(),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                  decoration: BoxDecoration(color: AppColors.warning.withAlpha(18), borderRadius: BorderRadius.circular(AppRadius.pill)),
                  child: const Text('🔥 5 day streak', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 12)),
                ),
              ],
            ),
            const SizedBox(height: 14),
            _GoalRow(label: 'Play 1 game', progress: 1.0, reward: '10 PC', done: true),
            const SizedBox(height: 10),
            _GoalRow(label: 'Earn 100 PC', progress: 0.64, reward: '20 PC', done: false),
            const SizedBox(height: 14),
            AppButton(
              label: 'Claim Daily Bonus',
              icon: Icons.check_circle,
              onTap: () {},
            ),
          ],
        ),
      ),
    );
  }
}

class _GoalRow extends StatelessWidget {
  final String label;
  final double progress;
  final String reward;
  final bool done;
  const _GoalRow({required this.label, required this.progress, required this.reward, required this.done});

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Icon(done ? Icons.check_circle : Icons.radio_button_unchecked, color: done ? AppColors.success : AppColors.textSecondary),
        const SizedBox(width: 10),
        Expanded(child: Text(label, style: const TextStyle(fontWeight: FontWeight.w500, color: Colors.white))),
        SizedBox(width: 90, child: ClipRRect(
          borderRadius: BorderRadius.circular(6),
          child: LinearProgressIndicator(value: progress, minHeight: 6, backgroundColor: AppColors.surfaceVariant, valueColor: const AlwaysStoppedAnimation(AppColors.primary)),
        )),
        const SizedBox(width: 10),
        Text(reward, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: Colors.white)),
      ],
    );
  }
}

class _HorizontalGames extends StatelessWidget {
  final String title;
  final List<GameItem> games;
  final VoidCallback onMore;
  const _HorizontalGames({required this.title, required this.games, required this.onMore});

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: AppSpace.lg),
          child: SectionHeader(title: title, onViewAll: onMore),
        ),
        const SizedBox(height: 12),
        SizedBox(
          height: 250,
          child: ListView.separated(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: AppSpace.lg),
            itemCount: games.length,
            separatorBuilder: (_, __) => const SizedBox(width: 14),
            itemBuilder: (_, i) => SizedBox(
              width: 170,
              child: GameCard(
                game: games[i],
                onTap: () => context.push('/games/details', extra: games[i]),
              ),
            ),
          ),
        ),
      ],
    );
  }
}

class _AchievementsPreview extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    final items = MockData.achievements.take(4).toList();
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: AppSpace.lg),
          child: SectionHeader(title: 'Achievements', onViewAll: () => context.go('/achievements')),
        ),
        const SizedBox(height: 12),
        SizedBox(
          height: 150,
          child: ListView.separated(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: AppSpace.lg),
            itemCount: items.length,
            separatorBuilder: (_, __) => const SizedBox(width: 14),
            itemBuilder: (_, i) => SizedBox(width: 130, child: AchievementMedal(achievement: items[i])),
          ),
        ),
      ],
    );
  }
}

class _LeaderboardPreview extends StatelessWidget {
  final VoidCallback onMore;
  const _LeaderboardPreview({required this.onMore});

  @override
  Widget build(BuildContext context) {
    final prov = context.watch<PlayerProvider>();
    final lb = prov.leaderboard;
    if (lb.length < 3) return const SizedBox.shrink();
    final top = lb.take(3).toList();
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: AppSpace.lg),
          child: SectionHeader(title: 'Top Players', onViewAll: onMore),
        ),
        const SizedBox(height: 12),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: AppSpace.lg),
          child: Row(
            children: top.asMap().entries.map((e) {
              final entry = e.value;
              final rank = e.key + 1;
              final name = entry['name']?.toString() ?? entry['username']?.toString() ?? '';
              final coins = entry['pc_balance'] ?? 0;
              final medal = [AppColors.accentGold, AppColors.textSecondary, const Color(0xFFCD7F32)][e.key];
              return Expanded(
                child: Container(
                  margin: const EdgeInsets.symmetric(horizontal: 5),
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(AppRadius.card), boxShadow: AppShadow.card),
                  child: Column(
                    children: [
                      Stack(
                        alignment: Alignment.topRight,
                        children: [
                          CircleAvatar(radius: 22, backgroundColor: AppColors.primary.withAlpha(24), child: Text(name.isNotEmpty ? name[0].toUpperCase() : '?', style: const TextStyle(fontWeight: FontWeight.bold, color: AppColors.primary))),
                          CircleAvatar(radius: 9, backgroundColor: medal, child: Text('$rank', style: const TextStyle(fontSize: 9, color: Colors.white, fontWeight: FontWeight.bold))),
                        ],
                      ),
                      const SizedBox(height: 8),
                      Text(name, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 12, color: Colors.white)),
                      const SizedBox(height: 2),
                      Row(mainAxisSize: MainAxisSize.min, children: [
                        const CoinIcon(size: 12),
                        const SizedBox(width: 4),
                        Text('$coins', style: const TextStyle(fontSize: 11, color: AppColors.textSecondary)),
                      ]),
                    ],
                  ),
                ),
              );
            }).toList(),
          ),
        ),
      ],
    );
  }
}

class _GameSections extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    final prov = context.watch<PlayerProvider>();
    final allGames = [...prov.brandedGames, ...prov.promoGames];
    if (allGames.isEmpty) return const SizedBox.shrink();
    final gameItems = allGames.map((g) => GameItem(
      id: g['id']?.toString() ?? '',
      name: g['name'] ?? '',
      category: g['category'] ?? '',
      reward: g['game_type'] == 'branded' ? '50 PC' : '10 PC',
      playTime: '',
      difficulty: '',
      completionRate: 0,
      gradient: [Colors.purple, Colors.indigo],
      icon: Icons.sports_esports,
    )).toList();
    return Column(
      children: [
        _HorizontalGames(title: 'Continue Playing', games: gameItems.take(4).toList(), onMore: () => context.go('/games')),
        const SizedBox(height: AppSpace.lg),
        _HorizontalGames(title: 'Featured Games', games: gameItems.skip(4).take(5).toList(), onMore: () => context.go('/games')),
      ],
    );
  }
}

class _RewardPreview extends StatelessWidget {
  final VoidCallback onMore;
  const _RewardPreview({required this.onMore});

  @override
  Widget build(BuildContext context) {
    final prov = context.watch<PlayerProvider>();
    final rewards = prov.rewards;
    if (rewards.isEmpty) return const SizedBox.shrink();
    final items = rewards.take(4).map((r) => RewardItem(
      id: r['id']?.toString() ?? '',
      brand: r['brand'] ?? '',
      title: r['title'] ?? '',
      coins: r['pp_cost'] ?? 0,
      category: r['description'] ?? '',
      available: (r['stock'] ?? -1) != 0,
      gradient: [AppColors.primary, AppColors.secondaryPurple],
      icon: Icons.card_giftcard,
    )).toList();
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: AppSpace.lg),
          child: SectionHeader(title: 'Reward Store', onViewAll: onMore),
        ),
        const SizedBox(height: 12),
        SizedBox(
          height: 230,
          child: ListView.separated(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: AppSpace.lg),
            itemCount: items.length,
            separatorBuilder: (_, __) => const SizedBox(width: 14),
            itemBuilder: (_, i) => SizedBox(
              width: 160,
              child: RewardCard(reward: items[i], onTap: () => context.push('/rewards/details', extra: items[i]), compact: true),
            ),
          ),
        ),
      ],
    );
  }
}
