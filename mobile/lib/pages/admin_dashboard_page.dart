import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../services/api_service.dart';
import '../services/auth_service.dart';
import '../widgets/spinning_logo.dart';

class AdminDashboardPage extends StatelessWidget {
  const AdminDashboardPage({super.key});

  @override
  Widget build(BuildContext context) {
    return const _AdminDashboardView();
  }
}

class _DashboardData {
  final List<Map<String, dynamic>> owners;
  final List<Map<String, dynamic>> members;
  final List<Map<String, dynamic>> players;

  const _DashboardData({
    this.owners = const [],
    this.members = const [],
    this.players = const [],
  });
}

class _AdminDashboardView extends StatefulWidget {
  const _AdminDashboardView();

  @override
  State<_AdminDashboardView> createState() => _AdminDashboardViewState();
}

class _AdminDashboardViewState extends State<_AdminDashboardView>
    with SingleTickerProviderStateMixin {
  late Future<_DashboardData> _future;
  late TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
    _future = _loadData();
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  Future<_DashboardData> _loadData() async {
    final bo = await ApiService.get('/business/list');
    final it = await ApiService.get('/internal-team/list');
    final pl = await ApiService.get('/players-admin');

    final owners = (bo['owners'] as List?)
            ?.map((e) => (e as Map).cast<String, dynamic>())
            .toList() ??
        <Map<String, dynamic>>[];
    final members = (it['members'] as List?)
            ?.map((e) => (e as Map).cast<String, dynamic>())
            .toList() ??
        <Map<String, dynamic>>[];
    final players = (pl['players'] as List?)
            ?.map((e) => (e as Map).cast<String, dynamic>())
            .toList() ??
        <Map<String, dynamic>>[];

    return _DashboardData(owners: owners, members: members, players: players);
  }

  Future<void> _refresh() async {
    setState(() => _future = _loadData());
    await _future;
  }

  void _showError(String message) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: const Color(0xFFef4444),
      ),
    );
  }

  Future<void> _toggleActive(Map<String, dynamic> owner) async {
    final id = owner['id'];
    final current = owner['is_active'] == true;
    try {
      await ApiService.put(
        '/business/$id/toggle-active',
        {'is_active': !current},
      );
      await _refresh();
    } catch (e) {
      _showError(e is ApiException ? e.message : e.toString());
    }
  }

  Future<void> _createBusiness(String name, String email, String phone) async {
    try {
      await ApiService.post('/business/create', {
        'business_name': name,
        'email': email,
        'phone': phone,
      });
      await _refresh();
    } catch (e) {
      _showError(e is ApiException ? e.message : e.toString());
    }
  }

  Future<void> _createInternal(String name, String email, String phone) async {
    try {
      await ApiService.post('/internal-team/create', {
        'name': name,
        'email': email,
        'phone': phone,
      });
      await _refresh();
    } catch (e) {
      _showError(e is ApiException ? e.message : e.toString());
    }
  }

  Future<void> _logout() async {
    try {
      await context.read<AuthService>().logout();
      if (mounted) Navigator.pushReplacementNamed(context, '/login');
    } catch (e) {
      _showError(e is ApiException ? e.message : e.toString());
    }
  }

  void _showCreateDialog() {
    showDialog(
      context: context,
      builder: (_) => _CreateDialog(
        onCreateBusiness: _createBusiness,
        onCreateInternal: _createInternal,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Admin Dashboard'),
        backgroundColor: Colors.transparent,
        elevation: 0,
        actions: [
          IconButton(
            icon: const Icon(Icons.logout),
            tooltip: 'Logout',
            onPressed: _logout,
          ),
        ],
        bottom: TabBar(
          controller: _tabController,
          indicatorColor: const Color(0xFFa78bfa),
          labelColor: const Color(0xFFf0ecff),
          unselectedLabelColor: const Color(0x88b0a0d0),
          tabs: const [
            Tab(text: 'Business Owners'),
            Tab(text: 'Internal Team'),
            Tab(text: 'Players'),
          ],
        ),
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
        child: FutureBuilder<_DashboardData>(
          future: _future,
          builder: (context, snapshot) {
            if (snapshot.connectionState != ConnectionState.done) {
              return const FullScreenSpinner(label: 'Loading dashboard…');
            }
            if (snapshot.hasError) {
              return Center(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(
                      snapshot.error is ApiException
                          ? (snapshot.error as ApiException).message
                          : snapshot.error.toString(),
                      style: const TextStyle(color: Color(0xFFfca5a5)),
                      textAlign: TextAlign.center,
                    ),
                    const SizedBox(height: 16),
                    ElevatedButton(
                      onPressed: _refresh,
                      child: const Text('Retry'),
                    ),
                  ],
                ),
              );
            }

            final data = snapshot.data ?? const _DashboardData();

            return Column(
              children: [
                _StatCards(
                  owners: data.owners.length,
                  members: data.members.length,
                  players: data.players.length,
                ),
                Expanded(
                  child: TabBarView(
                    controller: _tabController,
                    children: [
                      _OwnerList(
                        owners: data.owners,
                        onToggle: _toggleActive,
                      ),
                      _MemberList(members: data.members),
                      _PlayerList(players: data.players),
                    ],
                  ),
                ),
              ],
            );
          },
        ),
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: _showCreateDialog,
        backgroundColor: const Color(0xFF7c3aed),
        icon: const Icon(Icons.add),
        label: const Text('Create'),
      ),
    );
  }
}

class _StatCards extends StatelessWidget {
  final int owners;
  final int members;
  final int players;

  const _StatCards({
    required this.owners,
    required this.members,
    required this.players,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(16),
      child: Row(
        children: [
          Expanded(child: _StatCard(label: 'Business Owners', value: owners, color: Color(0xFFa78bfa))),
          const SizedBox(width: 12),
          Expanded(child: _StatCard(label: 'Internal Team', value: members, color: Color(0xFF22c55e))),
          const SizedBox(width: 12),
          Expanded(child: _StatCard(label: 'Players', value: players, color: Color(0xFFf59e0b))),
        ],
      ),
    );
  }
}

class _StatCard extends StatelessWidget {
  final String label;
  final int value;
  final Color color;

  const _StatCard({
    required this.label,
    required this.value,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: const Color(0x12121212),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: color.withAlpha(60)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            value.toString(),
            style: TextStyle(
              color: color,
              fontSize: 26,
              fontWeight: FontWeight.w800,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            label,
            style: const TextStyle(
              color: Color(0xFFb0a0d0),
              fontSize: 12,
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ),
    );
  }
}

class _OwnerList extends StatelessWidget {
  final List<Map<String, dynamic>> owners;
  final void Function(Map<String, dynamic>) onToggle;

  const _OwnerList({required this.owners, required this.onToggle});

  @override
  Widget build(BuildContext context) {
    if (owners.isEmpty) {
      return const Center(
        child: Text('No business owners yet.',
            style: TextStyle(color: Color(0xFFb0a0d0))),
      );
    }
    return ListView.separated(
      padding: const EdgeInsets.fromLTRB(16, 4, 16, 16),
      itemCount: owners.length,
      separatorBuilder: (_, __) => const SizedBox(height: 10),
      itemBuilder: (context, i) {
        final o = owners[i];
        final active = o['is_active'] == true;
        return Card(
          color: const Color(0x12121212),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(16),
            side: const BorderSide(color: Color(0x1AFFFFFF)),
          ),
          child: ListTile(
            leading: CircleAvatar(
              backgroundColor: const Color(0x1A7c3aed),
              child: Text(
                (o['business_name']?.toString() ?? '?').isNotEmpty
                    ? (o['business_name']?.toString() ?? '?')[0].toUpperCase()
                    : '?',
                style: const TextStyle(color: Color(0xFFa78bfa)),
              ),
            ),
            title: Text(
              o['business_name']?.toString() ?? 'Unnamed',
              style: const TextStyle(color: Color(0xFFf0ecff), fontWeight: FontWeight.w700),
            ),
            subtitle: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(o['email']?.toString() ?? '',
                    style: const TextStyle(color: Color(0xFFb0a0d0))),
                Text(o['phone']?.toString() ?? '',
                    style: const TextStyle(color: Color(0x66b0a0d0), fontSize: 12)),
              ],
            ),
            trailing: ElevatedButton(
              onPressed: () => onToggle(o),
              style: ElevatedButton.styleFrom(
                backgroundColor: active ? const Color(0xFFef4444) : const Color(0xFF22c55e),
              ),
              child: Text(active ? 'Deactivate' : 'Activate'),
            ),
          ),
        );
      },
    );
  }
}

class _MemberList extends StatelessWidget {
  final List<Map<String, dynamic>> members;

  const _MemberList({required this.members});

  @override
  Widget build(BuildContext context) {
    if (members.isEmpty) {
      return const Center(
        child: Text('No internal team members yet.',
            style: TextStyle(color: Color(0xFFb0a0d0))),
      );
    }
    return ListView.separated(
      padding: const EdgeInsets.fromLTRB(16, 4, 16, 16),
      itemCount: members.length,
      separatorBuilder: (_, __) => const SizedBox(height: 10),
      itemBuilder: (context, i) {
        final m = members[i];
        return Card(
          color: const Color(0x12121212),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(16),
            side: const BorderSide(color: Color(0x1AFFFFFF)),
          ),
          child: ListTile(
            leading: CircleAvatar(
              backgroundColor: const Color(0x1A22c55e),
              child: Text(
                (m['name']?.toString() ?? '?').isNotEmpty
                    ? (m['name']?.toString() ?? '?')[0].toUpperCase()
                    : '?',
                style: const TextStyle(color: Color(0xFF34d399)),
              ),
            ),
            title: Text(
              m['name']?.toString() ?? 'Unnamed',
              style: const TextStyle(color: Color(0xFFf0ecff), fontWeight: FontWeight.w700),
            ),
            subtitle: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(m['email']?.toString() ?? '',
                    style: const TextStyle(color: Color(0xFFb0a0d0))),
                Text(m['role']?.toString() ?? '',
                    style: const TextStyle(color: Color(0x66b0a0d0), fontSize: 12)),
              ],
            ),
            trailing: Text(
              m['phone']?.toString() ?? '',
              style: const TextStyle(color: Color(0x88b0a0d0)),
            ),
          ),
        );
      },
    );
  }
}

class _PlayerList extends StatelessWidget {
  final List<Map<String, dynamic>> players;

  const _PlayerList({required this.players});

  @override
  Widget build(BuildContext context) {
    if (players.isEmpty) {
      return const Center(
        child: Text('No players yet.', style: TextStyle(color: Color(0xFFb0a0d0))),
      );
    }
    return ListView.separated(
      padding: const EdgeInsets.fromLTRB(16, 4, 16, 16),
      itemCount: players.length,
      separatorBuilder: (_, __) => const SizedBox(height: 10),
      itemBuilder: (context, i) {
        final p = players[i];
        return Card(
          color: const Color(0x12121212),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(16),
            side: const BorderSide(color: Color(0x1AFFFFFF)),
          ),
          child: ListTile(
            leading: CircleAvatar(
              backgroundColor: const Color(0x1Af59e0b),
              child: Text(
                (p['name']?.toString() ?? '?').isNotEmpty
                    ? (p['name']?.toString() ?? '?')[0].toUpperCase()
                    : '?',
                style: const TextStyle(color: Color(0xFFfbbf24)),
              ),
            ),
            title: Text(
              p['name']?.toString() ?? 'Unnamed',
              style: const TextStyle(color: Color(0xFFf0ecff), fontWeight: FontWeight.w700),
            ),
            subtitle: Text(p['email']?.toString() ?? '',
                style: const TextStyle(color: Color(0xFFb0a0d0))),
            trailing: Text(
              'PC: ${p['pc_balance']?.toString() ?? '0'}',
              style: const TextStyle(color: Color(0xFFfbbf24), fontWeight: FontWeight.w700),
            ),
          ),
        );
      },
    );
  }
}

class _CreateDialog extends StatefulWidget {
  final Future<void> Function(String, String, String) onCreateBusiness;
  final Future<void> Function(String, String, String) onCreateInternal;

  const _CreateDialog({
    required this.onCreateBusiness,
    required this.onCreateInternal,
  });

  @override
  State<_CreateDialog> createState() => _CreateDialogState();
}

class _CreateDialogState extends State<_CreateDialog> {
  bool _isBusiness = true;
  final _nameCtrl = TextEditingController();
  final _emailCtrl = TextEditingController();
  final _phoneCtrl = TextEditingController();
  bool _submitting = false;

  @override
  void dispose() {
    _nameCtrl.dispose();
    _emailCtrl.dispose();
    _phoneCtrl.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    final name = _nameCtrl.text.trim();
    final email = _emailCtrl.text.trim();
    final phone = _phoneCtrl.text.trim();
    if (name.isEmpty || email.isEmpty || phone.isEmpty) return;
    setState(() => _submitting = true);
    try {
      if (_isBusiness) {
        await widget.onCreateBusiness(name, email, phone);
      } else {
        await widget.onCreateInternal(name, email, phone);
      }
      if (mounted) Navigator.pop(context);
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(e is ApiException ? e.message : e.toString()),
            backgroundColor: const Color(0xFFef4444),
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      backgroundColor: const Color(0xFF150b26),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
      title: const Text('Create', style: TextStyle(color: Color(0xFFf0ecff))),
      content: SingleChildScrollView(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            ToggleButtons(
              isSelected: [_isBusiness, !_isBusiness],
              onPressed: (i) => setState(() => _isBusiness = i == 0),
              color: const Color(0xFFb0a0d0),
              selectedColor: const Color(0xFFf0ecff),
              fillColor: const Color(0x1A7c3aed),
              children: const [
                Padding(padding: EdgeInsets.symmetric(horizontal: 12), child: Text('Business Owner')),
                Padding(padding: EdgeInsets.symmetric(horizontal: 12), child: Text('Internal Team')),
              ],
            ),
            const SizedBox(height: 12),
            _dialogField(_nameCtrl, _isBusiness ? 'Business Name' : 'Name', Icons.person_outline),
            const SizedBox(height: 10),
            _dialogField(_emailCtrl, 'Email', Icons.email_outlined,
                type: TextInputType.emailAddress),
            const SizedBox(height: 10),
            _dialogField(_phoneCtrl, 'Phone', Icons.phone_outlined,
                type: TextInputType.phone),
          ],
        ),
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.pop(context),
          child: const Text('Cancel', style: TextStyle(color: Color(0x88b0a0d0))),
        ),
        ElevatedButton(
          onPressed: _submitting ? null : _submit,
          style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF7c3aed)),
          child: _submitting
              ? const SizedBox(
                  width: 16,
                  height: 16,
                  child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                )
              : const Text('Create'),
        ),
      ],
    );
  }

  Widget _dialogField(
    TextEditingController ctrl,
    String label,
    IconData icon, {
    TextInputType? type,
  }) {
    return TextField(
      controller: ctrl,
      keyboardType: type,
      style: const TextStyle(color: Color(0xFFf0ecff)),
      decoration: InputDecoration(
        labelText: label,
        labelStyle: const TextStyle(color: Color(0x88b0a0d0)),
        prefixIcon: Icon(icon, color: const Color(0x66b0a0d0), size: 20),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: Color(0x1AFFFFFF)),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: Color(0xFF7c3aed)),
        ),
      ),
    );
  }
}
