import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../services/api_service.dart';
import '../services/auth_service.dart';
import '../widgets/spinning_logo.dart';

class FranchiseDashboardPage extends StatelessWidget {
  const FranchiseDashboardPage({super.key});

  Future<void> _logout(BuildContext context) async {
    await context.read<AuthService>().logout();
    if (!context.mounted) return;
    Navigator.pushReplacementNamed(context, '/login');
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      extendBodyBehindAppBar: true,
      appBar: AppBar(
        title: const Text('Franchise Dashboard'),
        backgroundColor: Colors.transparent,
        elevation: 0,
        actions: [
          IconButton(
            icon: const Icon(Icons.logout),
            tooltip: 'Logout',
            onPressed: () => _logout(context),
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
        child: const SafeArea(child: _DashboardBody()),
      ),
    );
  }
}

class _DashboardBody extends StatefulWidget {
  const _DashboardBody();

  @override
  State<_DashboardBody> createState() => _DashboardBodyState();
}

class _DashboardBodyState extends State<_DashboardBody> {
  Map<String, dynamic>? _dashboard;
  bool _loading = true;

  // null => view self (parent) games; otherwise a child franchise id
  String? _selectedId;
  List<dynamic>? _childGames;
  bool _childLoading = false;
  final Map<String, List<dynamic>> _childGamesCache = {};

  @override
  void initState() {
    super.initState();
    _loadDashboard();
  }

  Future<void> _loadDashboard() async {
    try {
      final data = await ApiService.get('/franchise/dashboard');
      if (!mounted) return;
      setState(() {
        _dashboard = data;
        _loading = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() => _loading = false);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(e is ApiException ? e.message : e.toString())),
      );
    }
  }

  List<dynamic> get _games {
    if (_selectedId == null) {
      return (_dashboard?['games'] as List?) ?? [];
    }
    return _childGames ?? [];
  }

  Future<void> _selectFranchise(String? id) async {
    if (id == _selectedId) return;
    setState(() => _selectedId = id);
    if (id == null) {
      setState(() => _childGames = null);
      return;
    }
    if (_childGamesCache.containsKey(id)) {
      setState(() => _childGames = _childGamesCache[id]);
      return;
    }
    setState(() => _childLoading = true);
    try {
      final data = await ApiService.get('/franchise/dashboard/$id/games');
      if (!mounted) return;
      final games = (data['games'] as List?) ?? [];
      _childGamesCache[id] = games;
      setState(() {
        _childGames = games;
        _childLoading = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() => _childLoading = false);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(e is ApiException ? e.message : e.toString())),
      );
    }
  }

  Future<void> _retry() async {
    setState(() {
      _loading = true;
      _dashboard = null;
    });
    await _loadDashboard();
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) return const FullScreenSpinner(label: 'Loading dashboard…');

    final dashboard = _dashboard ?? {};
    final childFranchises = (dashboard['child_franchises'] as List?) ?? [];
    final games = _games;
    final totalGames = (dashboard['total_games'] as int?) ?? games.length;
    final totalPlays = games.fold<int>(
      0,
      (sum, g) => sum + ((g is Map ? g['play_count'] : null) as int? ?? 0),
    );
    final totalRedemptions = games.fold<int>(
      0,
      (sum, g) => sum + ((g is Map ? g['redemption_count'] : null) as int? ?? 0),
    );

    return RefreshIndicator(
      onRefresh: () async {
        if (_selectedId == null) {
          await _retry();
        } else {
          _childGamesCache.remove(_selectedId);
          await _selectFranchise(_selectedId);
        }
      },
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Text(
            'Welcome, ${_businessName(dashboard)}',
            style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: Colors.white),
          ),
          const SizedBox(height: 16),
          _buildStatCards(totalGames, totalPlays, totalRedemptions),
          const SizedBox(height: 20),
          if (childFranchises.isNotEmpty) ...[
            const Text(
              'Franchises',
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600, color: Color(0xFFb0a0d0)),
            ),
            const SizedBox(height: 8),
            SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              child: Row(
                children: [
                  _buildChip('My Franchise', _selectedId == null, () => _selectFranchise(null)),
                  for (final c in childFranchises)
                    _buildChip(
                      (c is Map ? c['business_name'] : null)?.toString() ?? 'Branch',
                      _selectedId == (c is Map ? c['id'] : null)?.toString(),
                      () => _selectFranchise((c is Map ? c['id'] : null)?.toString()),
                    ),
                ],
              ),
            ),
            const SizedBox(height: 20),
          ],
          const Text(
            'Games',
            style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.white),
          ),
          const SizedBox(height: 12),
          if (_childLoading)
            const FullScreenSpinner(label: 'Loading games…')
          else if (games.isEmpty)
            const Padding(
              padding: EdgeInsets.symmetric(vertical: 32),
              child: Center(
                child: Text('No games found.', style: TextStyle(color: Colors.grey)),
              ),
            )
          else
            ...games.map((g) => _buildGameCard(g)),
          const SizedBox(height: 24),
        ],
      ),
    );
  }

  String _businessName(Map<String, dynamic> dashboard) {
    final franchises = (dashboard['franchises'] as List?) ?? [];
    if (franchises.isNotEmpty && franchises.first is Map) {
      return (franchises.first['business_name'] as String?) ?? 'Franchise Owner';
    }
    return 'Franchise Owner';
  }

  Widget _buildStatCards(int games, int plays, int redemptions) {
    return Row(
      children: [
        Expanded(child: _statCard('Total Games', games.toString(), Icons.sports_esports)),
        Expanded(child: _statCard('Total Plays', plays.toString(), Icons.play_arrow)),
        Expanded(child: _statCard('Redemptions', redemptions.toString(), Icons.card_giftcard)),
      ],
    );
  }

  Widget _statCard(String label, String value, IconData icon) {
    return Card(
      margin: const EdgeInsets.symmetric(horizontal: 4),
      color: const Color(0xFF1a0e2e),
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 8),
        child: Column(
          children: [
            Icon(icon, color: const Color(0xFF9c6bff), size: 26),
            const SizedBox(height: 8),
            Text(
              value,
              style: const TextStyle(fontSize: 22, fontWeight: FontWeight.bold, color: Colors.white),
            ),
            const SizedBox(height: 4),
            Text(
              label,
              textAlign: TextAlign.center,
              style: const TextStyle(fontSize: 11, color: Color(0xFFb0a0d0)),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildChip(String label, bool selected, VoidCallback onTap) {
    return Padding(
      padding: const EdgeInsets.only(right: 8),
      child: ChoiceChip(
        label: Text(label),
        selected: selected,
        onSelected: (_) => onTap(),
        selectedColor: const Color(0xFF9c6bff),
        backgroundColor: const Color(0xFF1a0e2e),
        labelStyle: TextStyle(
          color: selected ? Colors.white : const Color(0xFFb0a0d0),
        ),
      ),
    );
  }

  Widget _buildGameCard(dynamic raw) {
    final g = raw is Map ? raw : <String, dynamic>{};
    final name = (g['name'] as String?) ?? 'Untitled Game';
    final status = (g['status'] as String?) ?? 'unknown';
    final plays = (g['play_count'] as int?) ?? 0;
    final redemptions = (g['redemption_count'] as int?) ?? 0;
    final location = (g['location_name'] as String?) ?? '';

    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      color: const Color(0xFF1a0e2e),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Expanded(
                  child: Text(
                    name,
                    style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.white),
                  ),
                ),
                _statusChip(status),
              ],
            ),
            const SizedBox(height: 10),
            if (location.isNotEmpty) ...[
              Text(location, style: const TextStyle(color: Color(0xFFb0a0d0), fontSize: 13)),
              const SizedBox(height: 8),
            ],
            Row(
              children: [
                const Icon(Icons.play_arrow, size: 16, color: Color(0xFF9c6bff)),
                const SizedBox(width: 4),
                Text('$plays plays', style: const TextStyle(color: Colors.white70)),
                const SizedBox(width: 16),
                const Icon(Icons.card_giftcard, size: 16, color: Color(0xFF9c6bff)),
                const SizedBox(width: 4),
                Text('$redemptions redemptions', style: const TextStyle(color: Colors.white70)),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _statusChip(String status) {
    final active = status.toLowerCase() == 'active';
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: active ? const Color(0x339c6bff) : const Color(0x33ffffff),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Text(
        status,
        style: TextStyle(
          fontSize: 12,
          color: active ? const Color(0xFF9c6bff) : Colors.grey,
        ),
      ),
    );
  }
}
