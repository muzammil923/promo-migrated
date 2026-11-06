import 'package:flutter/material.dart';
import '../services/api_service.dart';

class RewardsPage extends StatefulWidget {
  const RewardsPage({super.key});

  @override
  State<RewardsPage> createState() => _RewardsPageState();
}

class _RewardsPageState extends State<RewardsPage> {
  List<Map<String, dynamic>> rewards = [];
  bool loading = true;

  @override
  void initState() {
    super.initState();
    fetchRewards();
  }

  Future<void> fetchRewards() async {
    try {
      final data = await ApiService.get('/play/redemptions');
      setState(() {
        rewards = List.from(data['rewards'] ?? []);
        loading = false;
      });
    } catch (e) {
      setState(() => loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Rewards')),
      body: loading
        ? const Center(child: CircularProgressIndicator())
        : rewards.isEmpty
          ? const Center(child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [Icon(Icons.card_giftcard, size: 64, color: Colors.grey), SizedBox(height: 12), Text('No rewards yet', style: TextStyle(fontSize: 16))]))
          : ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: rewards.length,
              itemBuilder: (_, i) {
                final r = rewards[i];
                return Card(margin: const EdgeInsets.only(bottom: 8), child: ListTile(title: Text(r['game_name'] ?? ''), trailing: Chip(label: Text(r['status'] ?? ''))));
              },
            ),
    );
  }
}
