import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_dimensions.dart';
import '../../core/data/mock_data.dart';
import '../../core/widgets/app_button.dart';

class RewardDetailsPage extends StatelessWidget {
  final RewardItem reward;
  const RewardDetailsPage({super.key, required this.reward});

  @override
  Widget build(BuildContext context) {
    final canRedeem = reward.available && 1240 >= reward.coins;
    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.only(bottom: AppSpace.xl),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                height: 200,
                decoration: BoxDecoration(gradient: LinearGradient(colors: reward.gradient)),
                child: Stack(
                  children: [
                    Center(child: Icon(reward.icon, size: 80, color: Colors.white)),
                    Positioned(top: 12, left: 12, child: IconButton(onPressed: () => context.pop(), icon: const Icon(Icons.arrow_back, color: Colors.white))),
                  ],
                ),
              ),
              Padding(
                padding: const EdgeInsets.all(AppSpace.lg),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(reward.brand, style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold)),
                    const SizedBox(height: 4),
                    Text(reward.title, style: const TextStyle(color: AppColors.textSecondary)),
                    const SizedBox(height: 14),
                    Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(AppRadius.card), boxShadow: AppShadow.card),
                      child: Row(children: [
                        const CoinIcon(size: 24),
                        const SizedBox(width: 8),
                        Text('${reward.coins} PC', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 20)),
                        const Spacer(),
                        Text(reward.available ? 'In stock' : 'Coming soon', style: TextStyle(color: reward.available ? AppColors.success : AppColors.warning, fontWeight: FontWeight.w600)),
                      ]),
                    ),
                    const SizedBox(height: 16),
                    const Text('Description', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                    const SizedBox(height: 6),
                    Text('Redeem your Promo Coins for a ${reward.brand} ${reward.title}. The voucher code will be sent to your registered email instantly.',
                        style: const TextStyle(color: AppColors.textSecondary, height: 1.4)),
                    const SizedBox(height: 14),
                    const Text('Terms', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                    const SizedBox(height: 6),
                    const Text('• Non-refundable. \n• One redemption per account per day. \n• Valid for 30 days.',
                        style: TextStyle(color: AppColors.textSecondary, height: 1.5)),
                    const SizedBox(height: AppSpace.lg),
                    AppButton(
                      label: canRedeem ? 'Redeem for ${reward.coins} PC' : (reward.available ? 'Need more PC' : 'Unavailable'),
                      icon: Icons.card_giftcard,
                      onTap: canRedeem ? () => context.push('/success') : null,
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
