import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../services/api_service.dart';
import '../services/auth_service.dart';
import '../widgets/spinning_logo.dart';

class BODashboardPage extends StatelessWidget {
  const BODashboardPage({super.key});

  Future<Map<String, dynamic>> _loadData() async {
    final dashboard = await ApiService.get('/franchise/dashboard');
    final games = await ApiService.get('/business/games');
    return {'dashboard': dashboard, 'games': games};
  }

  int _sumInt(List<dynamic>? list, String key) {
    if (list == null) return 0;
    var total = 0;
    for (final item in list) {
      final value = item is Map<String, dynamic> ? item[key] : null;
      if (value is int) {
        total += value;
      } else if (value is num) {
        total += value.toInt();
      }
    }
    return total;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      extendBodyBehindAppBar: true,
      appBar: AppBar(
        title: const Text('Brand Dashboard'),
        backgroundColor: Colors.transparent,
        elevation: 0,
        actions: [
          IconButton(
            icon: const Icon(Icons.logout),
            tooltip: 'Logout',
            onPressed: () async {
              await context.read<AuthService>().logout();
              if (context.mounted) {
                Navigator.pushReplacementNamed(context, '/login');
              }
            },
          ),
        ],
      ),
      body: Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [
              Color(0xFF0d0a1a),
              Color(0xFF1a0e2e),
              Color(0xFF0f0b1e),
              Color(0xFF080612),
            ],
          ),
        ),
        child: FutureBuilder<Map<String, dynamic>>(
          future: _loadData(),
          builder: (context, snapshot) {
            if (snapshot.connectionState == ConnectionState.waiting) {
              return const FullScreenSpinner();
            }
            if (snapshot.hasError) {
              final e = snapshot.error;
              WidgetsBinding.instance.addPostFrameCallback((_) {
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(
                    content: Text(
                      e is ApiException ? e.message : e.toString(),
                    ),
                  ),
                );
              });
              return SafeArea(
                child: Center(
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Icon(Icons.error_outline, color: Colors.redAccent, size: 48),
                      const SizedBox(height: 12),
                      Text(
                        e is ApiException ? e.message : e.toString(),
                        style: const TextStyle(color: Colors.white70),
                        textAlign: TextAlign.center,
                      ),
                    ],
                  ),
                ),
              );
            }

            final data = snapshot.data ?? {};
            final dashboard = data['dashboard'] as Map<String, dynamic>? ?? {};
            final gamesData = data['games'] as Map<String, dynamic>? ?? {};

            final dashboardGames =
                (dashboard['games'] as List<dynamic>? ?? []).cast<Map<String, dynamic>>();
            final totalGames = (dashboard['total_games'] as int?) ??
                (dashboardGames.isNotEmpty
                    ? dashboardGames.length
                    : (gamesData['games'] as List<dynamic>? ?? []).length);
            final totalFranchises = dashboard['total_franchises'] as int? ?? 0;
            final totalPlays = _sumInt(dashboardGames, 'play_count');
            final totalRedemptions = _sumInt(dashboardGames, 'redemption_count');

            final gamesList = (gamesData['games'] as List<dynamic>? ?? [])
                .cast<Map<String, dynamic>>();

            return SafeArea(
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Expanded(
                          child: _StatCard(
                            label: 'Total Games',
                            value: totalGames.toString(),
                            icon: Icons.sports_esports,
                            color: const Color(0xFF7c3aed),
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: _StatCard(
                            label: 'Total Plays',
                            value: totalPlays.toString(),
                            icon: Icons.play_circle_fill,
                            color: const Color(0xFF2dd4bf),
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: _StatCard(
                            label: 'Total Redemptions',
                            value: totalRedemptions.toString(),
                            icon: Icons.redeem,
                            color: const Color(0xFFf59e0b),
                          ),
                        ),
                      ],
                    ),
                    if (totalFranchises > 0) ...[
                      const SizedBox(height: 8),
                      Text(
                        'Franchises: $totalFranchises',
                        style: const TextStyle(color: Color(0xFFb0a0d0), fontSize: 13),
                      ),
                    ],
                    const SizedBox(height: 24),
                    const Text(
                      'My Games',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 20,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 12),
                    if (gamesList.isEmpty)
                      const Text(
                        'No games found.',
                        style: TextStyle(color: Colors.white70),
                      )
                    else
                      ...gamesList.map((game) => _GameCard(game: game)),
                    const SizedBox(height: 24),
                    const _AcceptRedemptionSection(),
                  ],
                ),
              ),
            );
          },
        ),
      ),
    );
  }
}

class _StatCard extends StatelessWidget {
  final String label;
  final String value;
  final IconData icon;
  final Color color;

  const _StatCard({
    required this.label,
    required this.value,
    required this.icon,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.05),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.white.withOpacity(0.08)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, color: color, size: 22),
          const SizedBox(height: 10),
          Text(
            value,
            style: const TextStyle(
              color: Colors.white,
              fontSize: 22,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            label,
            style: const TextStyle(color: Color(0xFFb0a0d0), fontSize: 11),
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
          ),
        ],
      ),
    );
  }
}

class _GameCard extends StatelessWidget {
  final Map<String, dynamic> game;

  const _GameCard({required this.game});

  @override
  Widget build(BuildContext context) {
    final name = game['game_name'] ??
        game['name'] ??
        game['slug'] ??
        'Untitled Game';
    final status = game['status']?.toString() ?? 'unknown';
    final playCount = game['play_count'] as int? ??
        (game['play_count'] is num ? (game['play_count'] as num).toInt() : 0);
    final redemptionCount = game['redemption_count'] as int? ??
        (game['redemption_count'] is num
            ? (game['redemption_count'] as num).toInt()
            : 0);
    final location = game['location_name']?.toString();

    final statusColor = switch (status.toLowerCase()) {
      'active' || 'live' => const Color(0xFF2dd4bf),
      'paused' || 'inactive' => const Color(0xFFf59e0b),
      'draft' => const Color(0xFF94a3b8),
      _ => const Color(0xFFef4444),
    };

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.05),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.white.withOpacity(0.08)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Text(
                  name.toString(),
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: statusColor.withOpacity(0.15),
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: statusColor.withOpacity(0.4)),
                ),
                child: Text(
                  status,
                  style: TextStyle(color: statusColor, fontSize: 12),
                ),
              ),
            ],
          ),
          if (location != null) ...[
            const SizedBox(height: 4),
            Text(
              location,
              style: const TextStyle(color: Color(0xFFb0a0d0), fontSize: 12),
            ),
          ],
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: _CountTile(label: 'Plays', value: playCount.toString()),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _CountTile(
                  label: 'Redemptions',
                  value: redemptionCount.toString(),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _CountTile extends StatelessWidget {
  final String label;
  final String value;

  const _CountTile({required this.label, required this.value});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 12),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.04),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            value,
            style: const TextStyle(
              color: Colors.white,
              fontSize: 18,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 2),
          Text(
            label,
            style: const TextStyle(color: Color(0xFFb0a0d0), fontSize: 11),
          ),
        ],
      ),
    );
  }
}

class _AcceptRedemptionSection extends StatefulWidget {
  const _AcceptRedemptionSection();

  @override
  State<_AcceptRedemptionSection> createState() => _AcceptRedemptionSectionState();
}

class _AcceptRedemptionSectionState extends State<_AcceptRedemptionSection> {
  final _codeController = TextEditingController();
  bool _submitting = false;

  @override
  void dispose() {
    _codeController.dispose();
    super.dispose();
  }

  Future<void> _accept() async {
    final code = _codeController.text.trim();
    if (code.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please enter a redemption code')),
      );
      return;
    }
    setState(() => _submitting = true);
    try {
      final data = await ApiService.post('/business/accept-with-code', {
        'code': code,
      });
      final message = data['message']?.toString() ?? 'Redemption accepted';
      if (mounted) {
        ScaffoldMessenger.of(context)
            .showSnackBar(SnackBar(content: Text(message)));
        _codeController.clear();
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(e is ApiException ? e.message : e.toString()),
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Accept Redemption',
          style: TextStyle(
            color: Colors.white,
            fontSize: 20,
            fontWeight: FontWeight.bold,
          ),
        ),
        const SizedBox(height: 12),
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: Colors.white.withOpacity(0.05),
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: Colors.white.withOpacity(0.08)),
          ),
          child: Column(
            children: [
              TextField(
                controller: _codeController,
                style: const TextStyle(color: Colors.white),
                decoration: InputDecoration(
                  labelText: 'Redemption Code',
                  labelStyle: const TextStyle(color: Color(0xFFb0a0d0)),
                  filled: true,
                  fillColor: Colors.white.withOpacity(0.04),
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                    borderSide: BorderSide.none,
                  ),
                  prefixIcon:
                      const Icon(Icons.confirmation_number, color: Color(0xFFb0a0d0)),
                ),
              ),
              const SizedBox(height: 12),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: _submitting ? null : _accept,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF7c3aed),
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                  child: _submitting
                      ? const SizedBox(
                          height: 18,
                          width: 18,
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            color: Colors.white,
                          ),
                        )
                      : const Text('Accept Redemption'),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}
