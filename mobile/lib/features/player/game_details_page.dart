import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_dimensions.dart';
import '../../core/data/mock_data.dart';
import '../../core/widgets/app_button.dart';
import '../../core/widgets/cards.dart';
import '../../models/game.dart';

class GameDetailsPage extends StatelessWidget {
  final GameItem game;
  const GameDetailsPage({super.key, required this.game});

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
              // Hero
              Container(
                height: 200,
                decoration: BoxDecoration(gradient: LinearGradient(colors: game.gradient)),
                child: Stack(
                  children: [
                    Center(child: Icon(game.icon, size: 84, color: Colors.white)),
                    Positioned(top: 12, left: 12, child: IconButton(onPressed: () => context.pop(), icon: const Icon(Icons.arrow_back, color: Colors.white))),
                  ],
                ),
              ),
              Padding(
                padding: const EdgeInsets.all(AppSpace.lg),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(children: [
                      Expanded(child: Text(game.name, style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold))),
                      const SizedBox(width: 8),
                      DifficultyBadge(difficulty: game.difficulty),
                    ]),
                    const SizedBox(height: 6),
                    Text('${game.reward} · ${game.playTime}', style: const TextStyle(color: AppColors.textSecondary)),
                    const SizedBox(height: 14),
                    const Text('About this game', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                    const SizedBox(height: 6),
                    Text('${game.name} is a fun ${game.category.toLowerCase()} game. Play daily to earn Promo Coins and climb the leaderboard.',
                        style: const TextStyle(color: AppColors.textSecondary, height: 1.4)),
                    const SizedBox(height: 14),
                    Row(children: [
                      Expanded(child: Container(
                        padding: const EdgeInsets.all(14),
                        decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(AppRadius.card), boxShadow: AppShadow.card),
                        child: const Column(children: [Text('Best Score', style: TextStyle(color: AppColors.textSecondary, fontSize: 12)), SizedBox(height: 4), Text('0', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 20))]),
                      )),
                      const SizedBox(width: 12),
                      Expanded(child: Container(
                        padding: const EdgeInsets.all(14),
                        decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(AppRadius.card), boxShadow: AppShadow.card),
                        child: Column(children: [Text('Completed', style: TextStyle(color: AppColors.textSecondary, fontSize: 12)), SizedBox(height: 4), Text('${(game.completionRate * 100).toInt()}%', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 20))]),
                      )),
                    ]),
                    const SizedBox(height: 16),
                    const Text('Achievements', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                    const SizedBox(height: 10),
                    SizedBox(height: 130, child: ListView.separated(
                      scrollDirection: Axis.horizontal,
                      itemCount: MockData.achievements.length,
                      separatorBuilder: (_, __) => const SizedBox(width: 12),
                      itemBuilder: (_, i) => SizedBox(width: 120, child: AchievementMedal(achievement: MockData.achievements[i])),
                    )),
                    const SizedBox(height: AppSpace.lg),
                    AppButton(
                      label: 'Play Now',
                      icon: Icons.play_arrow,
                      onTap: () => context.push('/games/play', extra: Game(
                        id: int.tryParse(game.id) ?? 0,
                        name: game.name,
                        category: game.category,
                        description: '${game.name} game',
                      )),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
