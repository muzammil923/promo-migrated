import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../theme/app_colors.dart';
import '../theme/app_dimensions.dart';
import '../data/mock_data.dart';
import 'app_button.dart';

/// Game card for grids and carousels.
class GameCard extends StatelessWidget {
  final GameItem game;
  final VoidCallback onTap;
  final bool compact;

  const GameCard({super.key, required this.game, required this.onTap, this.compact = false});

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(AppRadius.card),
      child: Container(
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.circular(AppRadius.card),
          boxShadow: AppShadow.card,
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Artwork header
            Container(
              height: compact ? 84 : 110,
              decoration: BoxDecoration(
                gradient: LinearGradient(colors: game.gradient),
                borderRadius: const BorderRadius.vertical(top: Radius.circular(AppRadius.card)),
              ),
              child: Stack(
                children: [
                  Positioned.fill(
                    child: Center(
                      child: Icon(game.icon, size: compact ? 40 : 52, color: Colors.white.withAlpha(220)),
                    ),
                  ),
                  Positioned(top: 10, right: 10, child: DifficultyBadge(difficulty: game.difficulty)),
                ],
              ),
            ),
            Padding(
              padding: const EdgeInsets.all(14),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(game.name, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
                  const SizedBox(height: 4),
                  Row(
                    children: [
                      const CoinIcon(size: 14),
                      const SizedBox(width: 4),
                      Text(game.reward, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600)),
                      const Spacer(),
                      Text(game.playTime, style: const TextStyle(fontSize: 11, color: AppColors.textSecondary)),
                    ],
                  ),
                  if (!compact) ...[
                    const SizedBox(height: 10),
                    ClipRRect(
                      borderRadius: BorderRadius.circular(8),
                      child: LinearProgressIndicator(
                        value: game.completionRate,
                        backgroundColor: AppColors.surfaceVariant,
                        valueColor: const AlwaysStoppedAnimation(AppColors.primary),
                        minHeight: 6,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text('${(game.completionRate * 100).toInt()}% completed',
                        style: const TextStyle(fontSize: 11, color: AppColors.textSecondary)),
                  ],
                ],
              ),
            ),
          ],
        ),
      ),
    ).animate().fadeIn(duration: 300.ms).moveY(begin: 8, end: 0, duration: 300.ms);
  }
}

/// Reward card for the reward store.
class RewardCard extends StatelessWidget {
  final RewardItem reward;
  final VoidCallback onTap;
  final bool compact;

  const RewardCard({super.key, required this.reward, required this.onTap, this.compact = false});

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(AppRadius.card),
      child: Container(
        width: compact ? 160 : null,
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.circular(AppRadius.card),
          boxShadow: AppShadow.card,
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              height: compact ? 90 : 110,
              decoration: BoxDecoration(
                gradient: LinearGradient(colors: reward.gradient),
                borderRadius: const BorderRadius.vertical(top: Radius.circular(AppRadius.card)),
              ),
              child: Center(child: Icon(reward.icon, size: 46, color: Colors.white)),
            ),
            Padding(
              padding: const EdgeInsets.all(14),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(reward.brand, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
                  const SizedBox(height: 2),
                  Text(reward.title, style: const TextStyle(fontSize: 12, color: AppColors.textSecondary)),
                  const SizedBox(height: 10),
                  Row(
                    children: [
                      const CoinIcon(size: 14),
                      const SizedBox(width: 4),
                      Text('${reward.coins}', style: const TextStyle(fontWeight: FontWeight.bold)),
                      const Spacer(),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                        decoration: BoxDecoration(
                          color: reward.available ? AppColors.primary : AppColors.surfaceVariant,
                          borderRadius: BorderRadius.circular(AppRadius.pill),
                        ),
                        child: Text(reward.available ? 'Redeem' : 'Soon',
                            style: TextStyle(color: reward.available ? Colors.white : AppColors.textSecondary, fontSize: 11, fontWeight: FontWeight.w600)),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    ).animate().fadeIn(duration: 300.ms).shimmer(delay: 400.ms, duration: 900.ms, color: AppColors.accentGold.withAlpha(60));
  }
}

/// Premium achievement medal.
class AchievementMedal extends StatelessWidget {
  final Achievement achievement;
  const AchievementMedal({super.key, required this.achievement});

  Color get _ring => achievement.tier == 'legendary'
      ? AppColors.accentGold
      : achievement.tier == 'rare'
          ? AppColors.secondaryPurple
          : AppColors.primary;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(AppRadius.card),
        boxShadow: AppShadow.card,
        border: achievement.unlocked ? Border.all(color: _ring.withAlpha(60), width: 1.5) : null,
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 48,
            height: 48,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              gradient: achievement.unlocked ? LinearGradient(colors: [_ring, _ring.withAlpha(160)]) : null,
              color: achievement.unlocked ? null : AppColors.surfaceVariant,
              boxShadow: achievement.unlocked ? [BoxShadow(color: _ring.withAlpha(90), blurRadius: 12, offset: const Offset(0, 4))] : null,
            ),
            child: Center(
              child: Icon(achievement.icon,
                  size: 24, color: achievement.unlocked ? Colors.white : AppColors.textSecondary.withAlpha(120)),
            ),
          ).animate().scale(duration: 600.ms, begin: const Offset(0.8, 0.8), end: const Offset(1, 1)),
          const SizedBox(height: 8),
          Text(achievement.title, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 12), textAlign: TextAlign.center),
          const SizedBox(height: 2),
          Text(achievement.subtitle, maxLines: 2, overflow: TextOverflow.ellipsis, style: const TextStyle(fontSize: 10, color: AppColors.textSecondary), textAlign: TextAlign.center),
        ],
      ),
    );
  }
}

/// Leaderboard row.
class LeaderboardTile extends StatelessWidget {
  final Map<String, dynamic> entry;
  final int rank;
  const LeaderboardTile({super.key, required this.entry, required this.rank});

  @override
  Widget build(BuildContext context) {
    final name = entry['name']?.toString() ?? entry['username']?.toString() ?? '';
    final coins = entry['pc_balance'] ?? 0;
    final avatar = (name)[0].toUpperCase();
    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(AppRadius.card),
        boxShadow: AppShadow.card,
      ),
      child: Row(
        children: [
          Text('#$rank', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: AppColors.textSecondary)),
          const SizedBox(width: 12),
          CircleAvatar(
            radius: 18,
            backgroundColor: AppColors.primary.withAlpha(30),
            child: Text(avatar, style: const TextStyle(fontWeight: FontWeight.bold, color: AppColors.primary)),
          ),
          const SizedBox(width: 12),
          Expanded(child: Text(name, style: const TextStyle(fontWeight: FontWeight.w600))),
          const CoinIcon(size: 14),
          const SizedBox(width: 4),
          Text('$coins', style: const TextStyle(fontWeight: FontWeight.bold)),
        ],
      ),
    );
  }
}
