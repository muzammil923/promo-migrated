import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../theme/app_colors.dart';
import '../theme/app_dimensions.dart';

/// Primary gradient button with a subtle scale-on-tap micro-interaction.
class AppButton extends StatelessWidget {
  final String label;
  final VoidCallback? onTap;
  final bool expanded;
  final Color? color;
  final IconData? icon;
  final bool secondary;
  final bool white;

  const AppButton({
    super.key,
    required this.label,
    this.onTap,
    this.expanded = true,
    this.color,
    this.icon,
    this.secondary = false,
    this.white = false,
  });

  @override
  Widget build(BuildContext context) {
    final child = Container(
      width: expanded ? double.infinity : null,
      padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 22),
      decoration: BoxDecoration(
        gradient: (!secondary && !white) ? (color == null ? AppColors.primaryGradient : null) : null,
        color: white ? Colors.white : (secondary ? Colors.transparent : color),
        borderRadius: BorderRadius.circular(AppRadius.button),
        border: white ? null : (secondary ? Border.all(color: Colors.white.withAlpha(80), width: 1) : null),
        boxShadow: white ? AppShadow.soft : (secondary ? null : AppShadow.soft),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        mainAxisSize: MainAxisSize.min,
        children: [
          if (icon != null) ...[
            Icon(icon, color: white ? AppColors.primary : (secondary ? Colors.white : Colors.white), size: 20),
            const SizedBox(width: 8),
          ],
          Text(
            label,
            style: TextStyle(
              color: white ? AppColors.primary : Colors.white,
              fontWeight: FontWeight.w600,
              fontSize: 16,
            ),
          ),
        ],
      ),
    );

    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(AppRadius.button),
      splashColor: Colors.transparent,
      highlightColor: Colors.transparent,
      child: child
          .animate(onPlay: (c) => c.repeat(reverse: true, count: 1))
          .scaleXY(begin: 1, end: 0.97, duration: 120.ms, curve: Curves.easeOut),
    );
  }
}

/// Floating Promo Coin balance pill.
class CoinPill extends StatelessWidget {
  final int balance;
  final bool showIcon;

  const CoinPill({super.key, required this.balance, this.showIcon = true});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(AppRadius.pill),
        boxShadow: AppShadow.card,
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (showIcon) const CoinIcon(size: 18),
          const SizedBox(width: 6),
          Text(
            '$balance PC',
            style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
          ),
        ],
      ),
    );
  }
}

/// Animated Promo Coin (gradient disc with sparkle).
class CoinIcon extends StatelessWidget {
  final double size;
  const CoinIcon({super.key, this.size = 24});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        gradient: AppColors.goldGradient,
        boxShadow: [
          BoxShadow(color: AppColors.accentGold.withAlpha(80), blurRadius: 8, offset: const Offset(0, 2)),
        ],
      ),
      child: ClipOval(
        child: Image.asset('assets/coin.png', width: size, height: size, fit: BoxFit.cover),
      ),
    ).animate().scale(duration: 800.ms, begin: const Offset(0.9, 0.9), end: const Offset(1, 1))
      .then(delay: 400.ms).shake(hz: 2, duration: 300.ms);
  }
}

/// Section header with an optional "View all" action.
class SectionHeader extends StatelessWidget {
  final String title;
  final VoidCallback? onViewAll;
  const SectionHeader({super.key, required this.title, this.onViewAll});

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(title, style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
        if (onViewAll != null)
          TextButton(
            onPressed: onViewAll,
            style: TextButton.styleFrom(foregroundColor: AppColors.primary, padding: EdgeInsets.zero),
            child: const Text('View all', style: TextStyle(fontWeight: FontWeight.w600)),
          ),
      ],
    );
  }
}

/// Small stat tile used on Home / Profile.
class StatTile extends StatelessWidget {
  final String label;
  final String value;
  final IconData icon;
  final Color color;
  const StatTile({super.key, required this.label, required this.value, required this.icon, required this.color});

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.circular(AppRadius.card),
          boxShadow: AppShadow.card,
        ),
        child: Column(
          children: [
            Icon(icon, color: color, size: 22),
            const SizedBox(height: 6),
            Text(value, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
            const SizedBox(height: 2),
            Text(label, style: const TextStyle(color: AppColors.textSecondary, fontSize: 12)),
          ],
        ),
      ),
    );
  }
}

/// Difficulty badge.
class DifficultyBadge extends StatelessWidget {
  final String difficulty;
  const DifficultyBadge({super.key, required this.difficulty});

  Color get _color => switch (difficulty) {
        'Easy' => AppColors.success,
        'Medium' => AppColors.warning,
        'Hard' => AppColors.danger,
        _ => AppColors.textSecondary,
      };

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: _color.withAlpha(22),
        borderRadius: BorderRadius.circular(AppRadius.pill),
      ),
      child: Text(difficulty, style: TextStyle(color: _color, fontWeight: FontWeight.w600, fontSize: 11)),
    );
  }
}
