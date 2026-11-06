import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../services/api_service.dart';
import '../services/auth_service.dart';
import '../widgets/spinning_logo.dart';

class ITDashboardPage extends StatelessWidget {
  const ITDashboardPage({super.key});

  Future<void> _logout(BuildContext context) async {
    await context.read<AuthService>().logout();
    if (context.mounted) {
      Navigator.pushReplacementNamed(context, '/login');
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Internal Team'),
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
        child: DefaultTabController(
          length: 3,
          child: Column(
            children: const [
              TabBar(
                tabs: [
                  Tab(text: 'My Requests'),
                  Tab(text: 'Business Owners'),
                  Tab(text: 'Redemptions'),
                ],
                indicatorColor: Color(0xFF7c3aed),
                labelColor: Colors.white,
                unselectedLabelColor: Color(0xFF8b7fb0),
              ),
              Expanded(
                child: TabBarView(
                  children: [
                    _RequestsTab(),
                    _BusinessOwnersTab(),
                    _RedemptionsTab(),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

const List<String> _statusOptions = [
  'pending',
  'approved',
  'started_working',
  'game_creating',
  'testing',
  'live',
  'rejected',
];

Color _statusColor(String? status) {
  switch (status) {
    case 'approved':
      return Colors.green;
    case 'started_working':
      return Colors.blue;
    case 'game_creating':
      return Colors.orange;
    case 'testing':
      return Colors.purple;
    case 'live':
      return Colors.teal;
    case 'rejected':
      return Colors.red;
    case 'pending':
    default:
      return Colors.grey;
  }
}

Widget _statusChip(String? status) {
  final s = status ?? 'unknown';
  return Chip(
    label: Text(
      s.replaceAll('_', ' ').toUpperCase(),
      style: const TextStyle(color: Colors.white, fontSize: 11),
    ),
    backgroundColor: _statusColor(status).withAlpha(64),
    side: BorderSide(color: _statusColor(status)),
    visualDensity: VisualDensity.compact,
  );
}

class _RequestsTab extends StatefulWidget {
  const _RequestsTab();

  @override
  State<_RequestsTab> createState() => _RequestsTabState();
}

class _RequestsTabState extends State<_RequestsTab> {
  late Future<Map<String, dynamic>> _future;
  bool _busy = false;

  @override
  void initState() {
    super.initState();
    _future = _load();
  }

  Future<Map<String, dynamic>> _load() =>
      ApiService.get('/internal-team/requests');

  Future<void> _refresh() async {
    setState(() {
      _future = _load();
    });
  }

  Future<void> _updateStatus(Map<String, dynamic> request, String status) async {
    setState(() => _busy = true);
    try {
      final id = request['id'];
      await ApiService.put(
        '/internal-team/requests/$id/status',
        {'status': status},
      );
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Status updated')),
        );
        await _refresh();
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
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<Map<String, dynamic>>(
      future: _future,
      builder: (context, snap) {
        if (snap.connectionState == ConnectionState.waiting) {
          return const FullScreenSpinner(label: 'Loading requests...');
        }
        if (snap.hasError) {
          return Center(
            child: Text(
              snap.error is ApiException
                  ? (snap.error as ApiException).message
                  : snap.error.toString(),
              style: const TextStyle(color: Colors.redAccent),
            ),
          );
        }
        final data = snap.data ?? {};
        final requests = (data['requests'] as List<dynamic>?)
                ?.map((e) => e as Map<String, dynamic>)
                .toList() ??
            [];
        if (requests.isEmpty) {
          return const Center(
            child: Text('No requests assigned',
                style: TextStyle(color: Color(0xFFb0a0d0))),
          );
        }
        return RefreshIndicator(
          onRefresh: _refresh,
          child: ListView.separated(
            padding: const EdgeInsets.all(16),
            itemCount: requests.length,
            separatorBuilder: (_, __) => const SizedBox(height: 12),
            itemBuilder: (context, i) {
              final r = requests[i];
              final current = (r['status'] as String?) ?? 'pending';
              return Card(
                color: const Color(0xFF1a1330),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(16),
                  side: const BorderSide(color: Color(0xFF2c2148)),
                ),
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        r['business_name']?.toString() ?? 'Unknown Business',
                        style: const TextStyle(
                            color: Colors.white,
                            fontSize: 16,
                            fontWeight: FontWeight.bold),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        'Game: ${r['game_name']?.toString() ?? 'N/A'}',
                        style: const TextStyle(color: Color(0xFFb0a0d0)),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        'BD: ${r['bd_name']?.toString() ?? 'N/A'}',
                        style: const TextStyle(color: Color(0xFF8b7fb0)),
                      ),
                      const SizedBox(height: 10),
                      _statusChip(current),
                      const SizedBox(height: 12),
                      Row(
                        children: [
                          Expanded(
                            child: DropdownButtonFormField<String>(
                              value: _statusOptions.contains(current)
                                  ? current
                                  : null,
                              hint: const Text('Set status',
                                  style:
                                      TextStyle(color: Color(0xFF8b7fb0))),
                              dropdownColor: const Color(0xFF1a1330),
                              decoration: InputDecoration(
                                filled: true,
                                fillColor: const Color(0xFF0f0b1e),
                                border: OutlineInputBorder(
                                  borderRadius: BorderRadius.circular(12),
                                  borderSide: BorderSide.none,
                                ),
                                contentPadding: const EdgeInsets.symmetric(
                                    horizontal: 12, vertical: 8),
                              ),
                              style: const TextStyle(color: Colors.white),
                              items: _statusOptions
                                  .map((s) => DropdownMenuItem(
                                        value: s,
                                        child: Text(s.replaceAll('_', ' ')),
                                      ))
                                  .toList(),
                              onChanged: _busy
                                  ? null
                                  : (val) {
                                      if (val != null) _updateStatus(r, val);
                                    },
                            ),
                          ),
                          if (_busy) ...[
                            const SizedBox(width: 12),
                            const SizedBox(
                              width: 18,
                              height: 18,
                              child: CircularProgressIndicator(
                                  strokeWidth: 2, color: Color(0xFF7c3aed)),
                            ),
                          ],
                        ],
                      ),
                    ],
                  ),
                ),
              );
            },
          ),
        );
      },
    );
  }
}

class _BusinessOwnersTab extends StatefulWidget {
  const _BusinessOwnersTab();

  @override
  State<_BusinessOwnersTab> createState() => _BusinessOwnersTabState();
}

class _BusinessOwnersTabState extends State<_BusinessOwnersTab> {
  late Future<Map<String, dynamic>> _future;

  @override
  void initState() {
    super.initState();
    _future = ApiService.get('/internal-team/bo-logs');
  }

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<Map<String, dynamic>>(
      future: _future,
      builder: (context, snap) {
        if (snap.connectionState == ConnectionState.waiting) {
          return const FullScreenSpinner(label: 'Loading business owners...');
        }
        if (snap.hasError) {
          return Center(
            child: Text(
              snap.error is ApiException
                  ? (snap.error as ApiException).message
                  : snap.error.toString(),
              style: const TextStyle(color: Colors.redAccent),
            ),
          );
        }
        final data = snap.data ?? {};
        final bos = (data['business_owners'] as List<dynamic>?)
                ?.map((e) => e as Map<String, dynamic>)
                .toList() ??
            [];
        if (bos.isEmpty) {
          return const Center(
            child: Text('No business owners',
                style: TextStyle(color: Color(0xFFb0a0d0))),
          );
        }
        return ListView.separated(
          padding: const EdgeInsets.all(16),
          itemCount: bos.length,
          separatorBuilder: (_, __) => const SizedBox(height: 12),
          itemBuilder: (context, i) {
            final bo = bos[i];
            return Card(
              color: const Color(0xFF1a1330),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(16),
                side: const BorderSide(color: Color(0xFF2c2148)),
              ),
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      bo['business_name']?.toString() ?? 'Unknown',
                      style: const TextStyle(
                          color: Colors.white,
                          fontSize: 16,
                          fontWeight: FontWeight.bold),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      bo['email']?.toString() ?? '',
                      style: const TextStyle(color: Color(0xFF8b7fb0)),
                    ),
                    const SizedBox(height: 10),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceAround,
                      children: [
                        _Stat(
                            label: 'Games',
                            value: bo['total_games']?.toString() ?? '0'),
                        _Stat(
                            label: 'Plays',
                            value: bo['total_plays']?.toString() ?? '0'),
                        _Stat(
                            label: 'Redemptions',
                            value: bo['total_redemptions']?.toString() ?? '0'),
                      ],
                    ),
                  ],
                ),
              ),
            );
          },
        );
      },
    );
  }
}

class _Stat extends StatelessWidget {
  final String label;
  final String value;
  const _Stat({required this.label, required this.value});

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Text(value,
            style: const TextStyle(
                color: Colors.white,
                fontSize: 18,
                fontWeight: FontWeight.bold)),
        const SizedBox(height: 2),
        Text(label,
            style: const TextStyle(color: Color(0xFF8b7fb0), fontSize: 12)),
      ],
    );
  }
}

class _RedemptionsTab extends StatefulWidget {
  const _RedemptionsTab();

  @override
  State<_RedemptionsTab> createState() => _RedemptionsTabState();
}

class _RedemptionsTabState extends State<_RedemptionsTab> {
  late Future<Map<String, dynamic>> _future;

  @override
  void initState() {
    super.initState();
    _future = ApiService.get('/internal-team/redemption-logs');
  }

  String _fmt(dynamic v) => v?.toString() ?? 'N/A';

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<Map<String, dynamic>>(
      future: _future,
      builder: (context, snap) {
        if (snap.connectionState == ConnectionState.waiting) {
          return const FullScreenSpinner(label: 'Loading redemptions...');
        }
        if (snap.hasError) {
          return Center(
            child: Text(
              snap.error is ApiException
                  ? (snap.error as ApiException).message
                  : snap.error.toString(),
              style: const TextStyle(color: Colors.redAccent),
            ),
          );
        }
        final data = snap.data ?? {};
        final reds = (data['redemptions'] as List<dynamic>?)
                ?.map((e) => e as Map<String, dynamic>)
                .toList() ??
            [];
        if (reds.isEmpty) {
          return const Center(
            child: Text('No redemptions',
                style: TextStyle(color: Color(0xFFb0a0d0))),
          );
        }
        return ListView.separated(
          padding: const EdgeInsets.all(16),
          itemCount: reds.length,
          separatorBuilder: (_, __) => const SizedBox(height: 10),
          itemBuilder: (context, i) {
            final r = reds[i];
            return Card(
              color: const Color(0xFF150f29),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
                side: const BorderSide(color: Color(0xFF2c2148)),
              ),
              child: ListTile(
                title: Text(
                  _fmt(r['player_name'] ?? r['name']),
                  style: const TextStyle(color: Colors.white),
                ),
                subtitle: Text(
                  'Reward: ${_fmt(r['reward_name'] ?? r['reward'])} • '
                  'Business: ${_fmt(r['business_name'])}',
                  style: const TextStyle(color: Color(0xFF8b7fb0)),
                ),
                trailing: r['status'] != null
                    ? _statusChip(r['status']?.toString())
                    : null,
              ),
            );
          },
        );
      },
    );
  }
}
