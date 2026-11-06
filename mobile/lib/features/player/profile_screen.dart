import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_dimensions.dart';
import '../../core/data/mock_data.dart';
import '../../services/player_provider.dart';
import '../../services/auth_service.dart';

class ProfileScreen extends StatelessWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final bottomPad = MediaQuery.of(context).padding.bottom;
    final items = [
      (Icons.history_rounded, 'History', () => context.push('/wallet')),
      (Icons.emoji_events_rounded, 'Achievements', () => context.push('/achievements')),
      (Icons.task_alt_rounded, 'Challenges', () => context.push('/challenges')),
      (Icons.group_add_rounded, 'Referral', () => context.push('/referral')),
      (Icons.settings_rounded, 'Settings', () => context.push('/settings')),
      (Icons.help_outline_rounded, 'Help & Support', () => context.push('/settings/support')),
    ];

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(title: const Text('Profile', style: TextStyle(fontWeight: FontWeight.bold, color: Colors.white)), automaticallyImplyLeading: false),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: EdgeInsets.fromLTRB(AppSpace.lg, AppSpace.lg, AppSpace.lg, 100 + bottomPad),
          child: Column(
            children: [
              // Avatar + Name/Email row
              Consumer<PlayerProvider>(
                builder: (_, prov, __) {
                  final name = prov.user?.username ?? MockData.username;
                  final email = prov.user?.email ?? '';
                  final avatarId = prov.user?.avatarId ?? 'av-3';
                  const avatars = [
                    {'id': 'av-1', 'gradient': [Color(0xFFf97316), Color(0xFFdc2626)], 'emoji': '🔥'},
                    {'id': 'av-2', 'gradient': [Color(0xFFec4899), Color(0xFF8b5cf6)], 'emoji': '🐱'},
                    {'id': 'av-3', 'gradient': [Color(0xFF6366f1), Color(0xFF0ea5e9)], 'emoji': '🦉'},
                    {'id': 'av-4', 'gradient': [Color(0xFF14b8a6), Color(0xFF22d3ee)], 'emoji': '🤖'},
                    {'id': 'av-5', 'gradient': [Color(0xFFf59e0b), Color(0xFFf97316)], 'emoji': '👑'},
                    {'id': 'av-6', 'gradient': [Color(0xFF8b5cf6), Color(0xFFec4899)], 'emoji': '🐺'},
                  ];
                  final avIndex = avatars.indexWhere((a) => a['id'] == avatarId);
                  final av = avatars[avIndex >= 0 ? avIndex : 2];
                  final gradient = av['gradient'] as List<Color>;

                  return Row(
                    children: [
                      Container(
                        width: 72,
                        height: 72,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          gradient: LinearGradient(colors: gradient, begin: Alignment.topLeft, end: Alignment.bottomRight),
                          boxShadow: [BoxShadow(color: gradient[1].withAlpha(80), blurRadius: 16)],
                        ),
                        child: Center(child: Text(av['emoji'] as String, style: const TextStyle(fontSize: 34))),
                      ),
                      const SizedBox(width: 16),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(name, style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: Colors.white)),
                            const SizedBox(height: 4),
                            Text(email.isNotEmpty ? email : 'No email', style: TextStyle(color: Colors.white.withAlpha(150), fontSize: 14)),
                          ],
                        ),
                      ),
                    ],
                  );
                },
              ),
              const SizedBox(height: AppSpace.lg),
              // Settings card
              Container(
                decoration: BoxDecoration(
                  color: AppColors.surfaceVariant,
                  borderRadius: BorderRadius.circular(AppRadius.card),
                  boxShadow: AppShadow.card,
                ),
                child: Column(
                  children: items.map((it) => ListTile(
                        leading: Icon(it.$1, color: AppColors.primary),
                        title: Text(it.$2, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w500)),
                        trailing: const Icon(Icons.chevron_right, color: AppColors.textSecondary),
                        onTap: it.$3,
                      )).toList(),
                ),
              ),
              const SizedBox(height: AppSpace.lg),
              // Logout button
              Container(
                width: double.infinity,
                padding: const EdgeInsets.symmetric(vertical: 16),
                decoration: BoxDecoration(
                  color: Colors.transparent,
                  borderRadius: BorderRadius.circular(AppRadius.button),
                  border: Border.all(color: Colors.white.withAlpha(60), width: 1),
                ),
                child: GestureDetector(
                  onTap: () async {
                    await context.read<AuthService>().logout();
                    if (context.mounted) context.go('/login');
                  },
                  child: const Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.logout, color: Colors.white, size: 20),
                      SizedBox(width: 8),
                      Text('Log Out', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w600, fontSize: 16)),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
