import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_dimensions.dart';
import '../../core/widgets/app_button.dart';

class SupportPage extends StatelessWidget {
  const SupportPage({super.key});

  static const _faqs = [
    ('How do Promo Coins work?', 'Promo Coins (PC) are earned by playing games. Branded games award 50 PC per completion, and PromoGames award 10 PC. You can redeem PC for rewards in the Rewards store.'),
    ('How do I earn more PC?', 'Play games to earn PC. Branded games give 50 PC, regular games give 10 PC. Invite friends using your referral link to earn 5 PC per their game completion.'),
    ('What games can I play?', 'Games available depend on the brands partnered with PromoGames. Check the Games tab for the latest selection. New games are added regularly.'),
    ('How do referrals work?', 'Share your unique referral link with friends. When they complete a game using your link, you earn 5 PC. There is no cap on referral earnings.'),
    ('How do I contact support?', 'Use the button below to send us an email. We typically respond within 24 hours.'),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Help & Support', style: TextStyle(fontWeight: FontWeight.bold)),
        leading: BackButton(onPressed: () => context.pop()),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(AppSpace.lg),
          child: Column(
            children: [
              ..._faqs.map((faq) => Container(
                margin: const EdgeInsets.only(bottom: 10),
                decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(AppRadius.card), boxShadow: AppShadow.card),
                child: ExpansionTile(
                  tilePadding: const EdgeInsets.symmetric(horizontal: 18),
                  childrenPadding: const EdgeInsets.fromLTRB(18, 0, 18, 18),
                  title: Text(faq.$1, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 15)),
                  iconColor: AppColors.primary,
                  children: [Text(faq.$2, style: const TextStyle(color: AppColors.textSecondary, fontSize: 14, height: 1.5))],
                ),
              )),
              const SizedBox(height: AppSpace.lg),
              AppButton(
                label: 'Contact Support',
                icon: Icons.email_outlined,
                onTap: () async {
                  final uri = Uri(
                    scheme: 'mailto',
                    path: 'support@promogames.app',
                    query: 'subject=PromoGames Support Request',
                  );
                  if (await canLaunchUrl(uri)) {
                    await launchUrl(uri);
                  }
                },
              ),
            ],
          ),
        ),
      ),
    );
  }
}
