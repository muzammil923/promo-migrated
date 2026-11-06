import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_dimensions.dart';

class SettingsPage extends StatelessWidget {
  const SettingsPage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(title: const Text('Settings', style: TextStyle(fontWeight: FontWeight.bold)), leading: IconButton(icon: const Icon(Icons.arrow_back), onPressed: () => context.pop())),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(AppSpace.lg),
          child: Column(
            children: [
              _item(Icons.person_rounded, 'Edit Profile', () => context.push('/edit-profile')),
              _item(Icons.photo_library_rounded, 'Change Avatar', () => context.push('/edit-profile')),
              _item(Icons.notifications_rounded, 'Notifications', () => context.push('/settings/notifications')),
              _item(Icons.language_rounded, 'Language', () => context.push('/settings/language')),
              _item(Icons.privacy_tip_rounded, 'Privacy', () => context.push('/settings/privacy')),
              _item(Icons.support_agent_rounded, 'Support', () => context.push('/settings/support')),
              _item(Icons.info_rounded, 'About', () => context.push('/settings/about')),
            ],
          ),
        ),
      ),
    );
  }

  Widget _item(IconData icon, String label, VoidCallback onTap) {
    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(AppRadius.card), boxShadow: AppShadow.card),
      child: ListTile(
        leading: Icon(icon, color: AppColors.primary),
        title: Text(label),
        trailing: const Icon(Icons.chevron_right, color: AppColors.textSecondary),
        onTap: onTap,
      ),
    );
  }
}
