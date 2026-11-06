import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_dimensions.dart';
import '../../services/player_provider.dart';
import '../../core/widgets/cards.dart';
import '../../core/widgets/app_button.dart';

class LeaderboardScreen extends StatefulWidget {
  const LeaderboardScreen({super.key});

  @override
  State<LeaderboardScreen> createState() => _LeaderboardScreenState();
}

class _LeaderboardScreenState extends State<LeaderboardScreen> {
  int tab = 0;
  final tabs = ['Global', 'Friends', 'Weekly', 'Monthly'];

  @override
  Widget build(BuildContext context) {
    final prov = context.watch<PlayerProvider>();
    final top = prov.leaderboard;
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(title: const Text('Leaderboard', style: TextStyle(fontWeight: FontWeight.bold)), automaticallyImplyLeading: false),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.only(bottom: AppSpace.xl),
          child: Column(
            children: [
              const SizedBox(height: 8),
              SizedBox(
                height: 40,
                child: ListView.separated(
                  scrollDirection: Axis.horizontal,
                  padding: const EdgeInsets.symmetric(horizontal: AppSpace.lg),
                  itemCount: tabs.length,
                  separatorBuilder: (_, __) => const SizedBox(width: 8),
                  itemBuilder: (_, i) => ChoiceChip(label: Text(tabs[i]), selected: tab == i, onSelected: (_) => setState(() => tab = i)),
                ),
              ),
              const SizedBox(height: AppSpace.md),
              if (top.length >= 3)
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: AppSpace.lg),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: [
                      _Podium(entry: top[1], rank: 2, height: 110),
                      _Podium(entry: top[0], rank: 1, height: 150),
                      _Podium(entry: top[2], rank: 3, height: 90),
                    ],
                  ),
                ),
              if (top.length >= 3) const SizedBox(height: AppSpace.md),
              if (top.length > 3)
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: AppSpace.lg),
                  child: Column(
                    children: top.skip(3).toList().asMap().entries.map((e) => LeaderboardTile(entry: e.value, rank: e.key + 4)).toList(),
                  ),
                ),
              const SizedBox(height: AppSpace.lg),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: AppSpace.lg),
                child: AppButton(label: 'Climb the Ranks — Play Now', icon: Icons.play_arrow, onTap: () {}),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _Podium extends StatelessWidget {
  final Map<String, dynamic> entry;
  final int rank;
  final double height;
  const _Podium({required this.entry, required this.rank, required this.height});

  @override
  Widget build(BuildContext context) {
    final medal = [AppColors.accentGold, AppColors.textSecondary, const Color(0xFFCD7F32)][rank - 1];
    final name = entry['name']?.toString() ?? entry['username']?.toString() ?? '';
    final coins = entry['pc_balance'] ?? 0;
    final avatar = (entry['name']?.toString() ?? '?')[0].toUpperCase();
    return Expanded(
      child: Column(
        children: [
          CircleAvatar(radius: 22, backgroundColor: AppColors.primary.withAlpha(24), child: Text(avatar, style: const TextStyle(fontWeight: FontWeight.bold, color: AppColors.primary))),
          const SizedBox(height: 6),
          Text(name, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 12)),
          Row(mainAxisSize: MainAxisSize.min, children: [
            const CoinIcon(size: 12),
            const SizedBox(width: 4),
            Text('$coins', style: const TextStyle(fontSize: 11, color: AppColors.textSecondary)),
          ]),
          const SizedBox(height: 6),
          Container(
            height: height,
            decoration: BoxDecoration(color: medal.withAlpha(24), borderRadius: const BorderRadius.vertical(top: Radius.circular(16))),
            child: Center(child: Text('#$rank', style: TextStyle(color: medal, fontSize: 26, fontWeight: FontWeight.bold))),
          ),
        ],
      ),
    );
  }
}
