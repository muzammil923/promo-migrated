import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../services/api_service.dart';
import '../services/player_provider.dart';
import '../services/local_db_service.dart';
import '../core/theme/app_colors.dart';
import '../core/theme/app_dimensions.dart';
import '../core/widgets/app_button.dart';
import '../widgets/username_field.dart';

/// Match the exact avatars from React frontend (AvatarData.jsx)
const List<Map<String, dynamic>> _avatars = [
  {'id': 'av-1', 'label': 'Phoenix', 'gradient': [Color(0xFFf97316), Color(0xFFdc2626)]},
  {'id': 'av-2', 'label': 'Neon Cat', 'gradient': [Color(0xFFec4899), Color(0xFF8b5cf6)]},
  {'id': 'av-3', 'label': 'Cosmic Owl', 'gradient': [Color(0xFF6366f1), Color(0xFF0ea5e9)]},
  {'id': 'av-4', 'label': 'Cyber Robot', 'gradient': [Color(0xFF14b8a6), Color(0xFF22d3ee)]},
  {'id': 'av-5', 'label': 'Golden Crown', 'gradient': [Color(0xFFf59e0b), Color(0xFFf97316)]},
  {'id': 'av-6', 'label': 'Electric Wolf', 'gradient': [Color(0xFF8b5cf6), Color(0xFFec4899)]},
];

/// Widget initials for each avatar
const List<String> _avatarInitials = ['🔥', '🐱', '🦉', '🤖', '👑', '🐺'];

class EditProfilePage extends StatefulWidget {
  const EditProfilePage({super.key});

  @override
  State<EditProfilePage> createState() => _EditProfilePageState();
}

class _EditProfilePageState extends State<EditProfilePage> {
  late TextEditingController _nameCtrl;
  int _selectedAvatarIndex = 2; // default: Cosmic Owl (av-3)
  bool _saving = false;
  bool _usernameValid = true;

  @override
  void initState() {
    super.initState();
    final user = context.read<PlayerProvider>().user;
    _nameCtrl = TextEditingController(text: user?.username ?? 'Player');
    // Match avatar ID to index
    final avatarId = user?.avatarId ?? 'av-3';
    _selectedAvatarIndex = _avatars.indexWhere((a) => a['id'] == avatarId);
    if (_selectedAvatarIndex < 0) _selectedAvatarIndex = 2;
  }

  @override
  void dispose() {
    _nameCtrl.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    final name = _nameCtrl.text.trim();
    if (name.isEmpty || !_usernameValid) return;
    setState(() => _saving = true);
    final prov = context.read<PlayerProvider>();
    final avatarId = _avatars[_selectedAvatarIndex]['id'] as String;

    // Save to backend first
    try {
      await ApiService.patch('/pauth/me', {
        'avatar_id': avatarId,
        'username': name,
      });
    } catch (_) {}

    // Also save locally
    await LocalDbService.instance.savePlayerProfile({
      'id': prov.user?.id ?? 0,
      'username': name,
      'email': prov.user?.email ?? '',
      'pc_balance': prov.pcBalance,
      'avatar_id': avatarId,
    });

    // Reload from API to get server-confirmed data
    await prov.loadAll();
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Profile updated')),
      );
      context.pop();
    }
  }

  @override
  Widget build(BuildContext context) {
    final currentUsername = context.read<PlayerProvider>().user?.username;

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Edit Profile', style: TextStyle(fontWeight: FontWeight.bold)),
        leading: IconButton(icon: const Icon(Icons.arrow_back), onPressed: () => context.pop()),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(AppSpace.lg),
        child: Column(
          children: [
            const SizedBox(height: 20),
            // Current avatar preview
            Container(
              width: 100,
              height: 100,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                gradient: LinearGradient(
                  colors: (_avatars[_selectedAvatarIndex]['gradient'] as List<Color>),
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                boxShadow: [BoxShadow(
                  color: (_avatars[_selectedAvatarIndex]['gradient'] as List<Color>)[1].withAlpha(80),
                  blurRadius: 20,
                )],
              ),
              child: Center(
                child: Text(
                  _avatarInitials[_selectedAvatarIndex],
                  style: const TextStyle(fontSize: 44),
                ),
              ),
            ),
            const SizedBox(height: 8),
            Text(
              _avatars[_selectedAvatarIndex]['label'] as String,
              style: const TextStyle(color: AppColors.textSecondary, fontSize: 13),
            ),
            const SizedBox(height: 24),
            UsernameField(
              controller: _nameCtrl,
              initialValue: currentUsername,
              currentUsername: currentUsername,
              onValidationChanged: (valid) => setState(() => _usernameValid = valid),
            ),
            const SizedBox(height: 24),
            const Text('Choose Avatar', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
            const SizedBox(height: 12),
            // Avatar grid matching React's 3-column layout
            GridView.builder(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: 3,
                crossAxisSpacing: 12,
                mainAxisSpacing: 12,
                childAspectRatio: 0.85,
              ),
              itemCount: _avatars.length,
              itemBuilder: (_, i) {
                final av = _avatars[i];
                final selected = i == _selectedAvatarIndex;
                final gradient = av['gradient'] as List<Color>;
                return GestureDetector(
                  onTap: () => setState(() => _selectedAvatarIndex = i),
                  child: AnimatedContainer(
                    duration: const Duration(milliseconds: 200),
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(16),
                      gradient: selected ? LinearGradient(colors: gradient) : null,
                      color: selected ? null : Colors.white,
                      border: Border.all(
                        color: selected ? Colors.white.withAlpha(100) : Colors.transparent,
                        width: 2,
                      ),
                      boxShadow: selected ? [
                        BoxShadow(color: gradient[1].withAlpha(80), blurRadius: 12),
                      ] : AppShadow.card,
                    ),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Text(
                          _avatarInitials[i],
                          style: TextStyle(fontSize: 36, color: selected ? Colors.white : null),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          av['label'] as String,
                          style: TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.w600,
                            color: selected ? Colors.white : AppColors.textSecondary,
                          ),
                        ),
                      ],
                    ),
                  ),
                );
              },
            ),
            const SizedBox(height: 32),
            AppButton(
              label: _saving ? 'Saving…' : 'Save Changes',
              icon: Icons.check,
              onTap: (_saving || !_usernameValid) ? null : _save,
            ),
          ],
        ),
      ),
    );
  }
}
