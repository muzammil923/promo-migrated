import 'package:flutter/material.dart';
import '../services/api_service.dart';
import '../models/game.dart';

class GamesListPage extends StatefulWidget {
  const GamesListPage({super.key});

  @override
  State<GamesListPage> createState() => _GamesListPageState();
}

class _GamesListPageState extends State<GamesListPage> {
  List<Map<String, dynamic>> games = [];
  bool loading = true;

  @override
  void initState() {
    super.initState();
    fetchGames();
  }

  Future<void> fetchGames() async {
    try {
      final data = await ApiService.get('/play/play-page-games');
      final list = data['games'] as List?;
      setState(() {
        games = list?.map((g) => g as Map<String, dynamic>).toList() ?? [];
        loading = false;
      });
    } catch (e) {
      setState(() => loading = false);
    }
  }

  @override
  Widget build(BuildContext c) {
    return Scaffold(
      appBar: AppBar(title: const Text('Games')),
      body: loading
          ? const Center(child: CircularProgressIndicator())
          : games.isEmpty
              ? const Center(child: Text('No games available'))
              : ListView.builder(
                  padding: const EdgeInsets.all(16),
                  itemCount: games.length,
                  itemBuilder: (_, i) {
                    final g = games[i];
                    return Card(
                      margin: const EdgeInsets.only(bottom: 12),
                      child: ListTile(
                        leading: const CircleAvatar(child: Icon(Icons.play_arrow)),
                        title: Text(g['name']?.toString() ?? ''),
                        subtitle: Text(g['category']?.toString() ?? ''),
                        onTap: () => Navigator.pushNamed(c, '/game', arguments: Game.fromJson(g)),
                      ),
                    );
                  },
                ),
    );
  }
}
