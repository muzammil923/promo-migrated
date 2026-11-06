import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_dimensions.dart';
import '../../core/data/mock_data.dart';
import '../../core/widgets/app_button.dart';

class ChallengesPage extends StatelessWidget {
  const ChallengesPage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(title: const Text('Challenges', style: TextStyle(fontWeight: FontWeight.bold)), leading: BackButton(onPressed: () => context.pop())),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(AppSpace.lg),
          child: Column(
            children: MockData.challenges.map((c) => Container(
              margin: const EdgeInsets.only(bottom: 14),
              padding: const EdgeInsets.all(18),
              decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(AppRadius.card), boxShadow: AppShadow.card),
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Row(children: [
                  Container(width: 44, height: 44, decoration: BoxDecoration(color: AppColors.primary.withAlpha(16), borderRadius: BorderRadius.circular(14)), child: const Icon(Icons.task_alt, color: AppColors.primary)),
                  const SizedBox(width: 14),
                  Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    Text(c.title, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                    Text(c.subtitle, style: const TextStyle(color: AppColors.textSecondary, fontSize: 13)),
                  ])),
                  Container(padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6), decoration: BoxDecoration(color: AppColors.accentGold.withAlpha(22), borderRadius: BorderRadius.circular(AppRadius.pill)), child: Text('${c.reward} PC', style: const TextStyle(fontWeight: FontWeight.bold, color: AppColors.accentGold))),
                ]),
                const SizedBox(height: 14),
                ClipRRect(borderRadius: BorderRadius.circular(8), child: LinearProgressIndicator(value: c.progress, minHeight: 8, backgroundColor: AppColors.surfaceVariant, valueColor: const AlwaysStoppedAnimation(AppColors.primary))
                    .animate().scale(begin: const Offset(0, 1), end: const Offset(1, 1), duration: 800.ms, curve: Curves.easeOut, alignment: Alignment.centerLeft)),
                const SizedBox(height: 14),
                AppButton(label: c.claimed ? 'Claimed' : 'Claim Reward', icon: Icons.check_circle, onTap: c.claimed ? null : () {}),
              ]),
            )).toList(),
          ),
        ),
      ),
    );
  }
}
