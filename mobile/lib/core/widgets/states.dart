import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../theme/app_colors.dart';
import '../theme/app_dimensions.dart';
import 'app_button.dart';

/// Animated Promo Coin loading indicator.
class LoadingCoin extends StatelessWidget {
  const LoadingCoin({super.key});

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        const CoinIcon(size: 56),
        const SizedBox(height: 18),
        const CircularProgressIndicator(color: AppColors.primary),
        const SizedBox(height: 12),
        const Text('Loading…', style: TextStyle(color: AppColors.textSecondary)),
      ],
    ).animate().fadeIn();
  }
}

/// Shimmer placeholder card.
class ShimmerCard extends StatelessWidget {
  final double height;
  const ShimmerCard({super.key, this.height = 120});

  @override
  Widget build(BuildContext context) {
    return Container(
      height: height,
      decoration: BoxDecoration(
        color: AppColors.surfaceVariant,
        borderRadius: BorderRadius.circular(AppRadius.card),
      ),
    ).animate().shimmer(duration: 1200.ms, color: Colors.white);
  }
}

/// Friendly illustrated empty state.
class EmptyState extends StatelessWidget {
  final IconData icon;
  final String title;
  final String subtitle;
  const EmptyState({super.key, required this.icon, required this.title, required this.subtitle});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(AppSpace.xl),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 96,
              height: 96,
              decoration: BoxDecoration(color: AppColors.primary.withAlpha(12), shape: BoxShape.circle),
              child: Icon(icon, size: 44, color: AppColors.primary),
            ),
            const SizedBox(height: 20),
            Text(title, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
            const SizedBox(height: 6),
            Text(subtitle, style: const TextStyle(color: AppColors.textSecondary), textAlign: TextAlign.center),
          ],
        ),
      ),
    );
  }
}

/// Success screen with animated coin burst.
class SuccessScreen extends StatelessWidget {
  final String title;
  final String subtitle;
  final VoidCallback onContinue;
  const SuccessScreen({super.key, required this.title, required this.subtitle, required this.onContinue});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(AppSpace.xl),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const CoinIcon(size: 90)
                  .animate()
                  .scale(duration: 600.ms, begin: const Offset(0.4, 0.4), end: const Offset(1, 1), curve: Curves.elasticOut),
              const SizedBox(height: 24),
              Text(title, style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold)),
              const SizedBox(height: 8),
              Text(subtitle, style: const TextStyle(color: AppColors.textSecondary), textAlign: TextAlign.center),
              const SizedBox(height: 28),
              AppButton(label: 'Continue', onTap: onContinue),
            ],
          ),
        ),
      ),
    );
  }
}
