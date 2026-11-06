import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_dimensions.dart';
import '../../core/widgets/app_button.dart';

class PrivacyPage extends StatelessWidget {
  const PrivacyPage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Privacy', style: TextStyle(fontWeight: FontWeight.bold)),
        leading: BackButton(onPressed: () => context.pop()),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(AppSpace.lg),
          child: Column(
            children: [
              _section('Data Usage', 'We collect your email address, username, and gameplay data to provide and improve the PromoGames experience. Your data is used to track your progress, PC balance, and game completions.'),
              _section('Data Storage', 'Game data and your profile are stored locally on your device for offline access. When connected to the internet, data syncs with our servers. You can clear local data from the Settings page.'),
              _section('Third Parties', 'We do not sell or share your personal data with third parties. Game analytics are anonymized and used only for platform improvement.'),
              _section('Account Deletion', 'You can request account deletion by contacting support. This will permanently remove your profile, PC balance, and game history from our servers.'),
              const SizedBox(height: AppSpace.lg),
              AppButton(
                label: 'Request Account Deletion',
                icon: Icons.delete_outline,
                secondary: true,
                onTap: () {
                  showDialog(
                    context: context,
                    builder: (_) => AlertDialog(
                      title: const Text('Delete Account?'),
                      content: const Text('This action is permanent and cannot be undone. All your data including PC balance will be lost.'),
                      actions: [
                        TextButton(onPressed: () => context.pop(), child: const Text('Cancel')),
                        TextButton(
                          onPressed: () {
                            context.pop();
                            ScaffoldMessenger.of(context).showSnackBar(
                              const SnackBar(content: Text('Deletion request submitted. We will contact you via email.')),
                            );
                          },
                          child: const Text('Delete', style: TextStyle(color: Colors.red)),
                        ),
                      ],
                    ),
                  );
                },
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _section(String title, String body) {
    return Container(
      margin: const EdgeInsets.only(bottom: 14),
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(AppRadius.card), boxShadow: AppShadow.card),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(title, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
          const SizedBox(height: 8),
          Text(body, style: const TextStyle(color: AppColors.textSecondary, fontSize: 14, height: 1.5)),
        ],
      ),
    );
  }
}
