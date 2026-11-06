import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_dimensions.dart';

import '../../services/auth_service.dart';
import '../../core/widgets/app_button.dart';

class ReferralPage extends StatelessWidget {
  const ReferralPage({super.key});

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthService>();
    final username = auth.user?.username ?? '';
    final host = 'https://promogames.app';
    final shareUrl = '$host?utm_source=@$username';

    void copy() {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Link copied: $shareUrl')),
      );
    }

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(title: const Text('Invite Friends', style: TextStyle(fontWeight: FontWeight.bold)), leading: BackButton(onPressed: () => context.pop())),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(AppSpace.lg),
          child: Column(
            children: [
              Container(
                padding: const EdgeInsets.all(AppSpace.lg),
                decoration: BoxDecoration(gradient: AppColors.primaryGradient, borderRadius: BorderRadius.circular(AppRadius.card), boxShadow: AppShadow.soft),
                child: const Column(children: [
                  Icon(Icons.group_add_rounded, color: Colors.white, size: 48),
                  SizedBox(height: 10),
                  Text('Invite & Earn', style: TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.bold)),
                  SizedBox(height: 6),
                  Text('Share games with friends and earn 5 PC per play', style: TextStyle(color: Colors.white70, fontSize: 13), textAlign: TextAlign.center),
                ]),
              ),
              const SizedBox(height: AppSpace.lg),
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(AppRadius.card), boxShadow: AppShadow.card),
                child: Row(children: [
                  Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    const Text('Your referral handle', style: TextStyle(color: AppColors.textSecondary, fontSize: 12)),
                    Text('@$username', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 22, color: AppColors.primary)),
                  ])),
                  IconButton(
                    onPressed: copy,
                    icon: const Icon(Icons.copy, color: AppColors.primary),
                  ),
                ]),
              ),
              const SizedBox(height: AppSpace.lg),
              Row(children: [
                Expanded(child: _Stat(value: '5 PC', label: 'Per referral play')),
                const SizedBox(width: 12),
                Expanded(child: _Stat(value: 'Unlimited', label: 'No cap')),
              ]),
              const SizedBox(height: AppSpace.lg),
              AppButton(label: 'Share Invite Link', icon: Icons.share, onTap: copy),
            ],
          ),
        ),
      ),
    );
  }
}

class _Stat extends StatelessWidget {
  final String value;
  final String label;
  const _Stat({required this.value, required this.label});
  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(AppRadius.card), boxShadow: AppShadow.card),
      child: Column(children: [Text(value, style: const TextStyle(fontSize: 22, fontWeight: FontWeight.bold)), Text(label, style: const TextStyle(color: AppColors.textSecondary, fontSize: 12))]),
    );
  }
}
