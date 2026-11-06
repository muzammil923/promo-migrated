import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_dimensions.dart';
import '../../services/player_provider.dart';
import '../../core/data/mock_data.dart';
import '../../core/widgets/app_button.dart';
import '../../core/widgets/cards.dart';


class RewardsScreen extends StatelessWidget {
  const RewardsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final prov = context.watch<PlayerProvider>();
    final balance = prov.pcBalance;
    final items = prov.rewards;
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(title: const Text('Rewards', style: TextStyle(fontWeight: FontWeight.bold, color: Colors.white)), automaticallyImplyLeading: false),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.only(bottom: AppSpace.xl),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                margin: const EdgeInsets.all(AppSpace.lg),
                padding: const EdgeInsets.all(AppSpace.lg),
                decoration: BoxDecoration(gradient: AppColors.goldGradient, borderRadius: BorderRadius.circular(16), boxShadow: AppShadow.soft),
                child: Row(
                  children: [
                    const CoinIcon(size: 60),
                    const SizedBox(width: 12),
                    Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                      const Text('Your Balance', style: TextStyle(color: Colors.black87, fontSize: 14)),
                      Text('$balance PC', style: const TextStyle(color: Colors.white, fontSize: 28, fontWeight: FontWeight.bold)),
                    ]),
                    const Spacer(),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                      decoration: BoxDecoration(
                        color: AppColors.primary,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: Colors.white.withAlpha(80), width: 1),
                        boxShadow: [
                          BoxShadow(color: AppColors.primary.withAlpha(80), blurRadius: 12, offset: const Offset(0, 4)),
                        ],
                      ),
                      child: GestureDetector(
                        onTap: () => context.push('/wallet'),
                        child: const Text('Wallet', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w600, fontSize: 14)),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 12),
              items.isEmpty
                ? const Padding(
                    padding: EdgeInsets.all(40),
                    child: Center(child: Text('No rewards available', style: TextStyle(color: AppColors.textSecondary))),
                  )
                : GridView.builder(
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    padding: const EdgeInsets.all(AppSpace.lg),
                    gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                      crossAxisCount: 2,
                      mainAxisSpacing: 14,
                      crossAxisSpacing: 14,
                      childAspectRatio: 0.72,
                    ),
                    itemCount: items.length,
                    itemBuilder: (_, i) {
                      final r = items[i];
                      return RewardCard(
                        reward: RewardItem(
                          id: r['id']?.toString() ?? '',
                          brand: r['brand'] ?? '',
                          title: r['title'] ?? '',
                          coins: r['pp_cost'] ?? 0,
                          category: r['description'] ?? '',
                          available: (r['stock'] ?? -1) != 0,
                          gradient: [AppColors.primary, AppColors.secondaryPurple],
                          icon: Icons.card_giftcard,
                        ),
                        onTap: () => context.push('/rewards/details', extra: RewardItem(
                          id: r['id']?.toString() ?? '',
                          brand: r['brand'] ?? '',
                          title: r['title'] ?? '',
                          coins: r['pp_cost'] ?? 0,
                          category: r['description'] ?? '',
                          available: (r['stock'] ?? -1) != 0,
                          gradient: [AppColors.primary, AppColors.secondaryPurple],
                          icon: Icons.card_giftcard,
                        )),
                      );
                    },
                  ),
            ],
          ),
        ),
      ),
    );
  }
}
