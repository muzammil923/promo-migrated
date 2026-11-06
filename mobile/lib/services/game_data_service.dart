import 'package:promogames_engine/engine.dart';
import 'api_service.dart';
import 'local_db_service.dart';

class GameDataService {
  static final GameDataService instance = GameDataService._();
  GameDataService._();

  /// Fetch full game config from backend, with local cache fallback.
  Future<GameConfig> fetch(int gameId) async {
    // Try network first
    try {
      final data = await ApiService.get('/play/game-data/$gameId');
      final gameData = data['game'] as Map<String, dynamic>?;
      if (gameData != null) {
        final config = GameConfig.fromJson(gameData);
        // Cache in local DB
        await LocalDbService.instance.cacheGameConfig(gameId, gameData);
        return config;
      }
    } catch (_) {}

    // Fallback to local cache
    final cached = await LocalDbService.instance.getCachedGameConfig(gameId);
    if (cached != null) {
      return GameConfig.fromJson(cached);
    }

    // Last resort: return minimal config with just IDs
    return GameConfig(id: gameId, name: 'Game', category: 'quiz');
  }
}
