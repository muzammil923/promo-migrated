import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:flutter/widgets.dart';

/// Shared vocabulary for every PromoGames native game.
///
/// This package is the ONLY cross-folder dependency a game is allowed to
/// import (`package:promogames_engine/engine.dart`). Everything else lives
/// fully inside its own `games/<game>/` folder.

/// Full payload the backend sends for one game (`/api/play/game-data/:id`).
class GameConfig {
  final int id;
  final String name;
  final String category;
  final String? description;
  final String? redirectUrl;
  final String? clientSlug;
  final String? companyName;
  final String? gameType;
  final String? status;
  final Map<String, dynamic> settings;
  final List<Map<String, dynamic>> questions;
  final List<Map<String, dynamic>> words;
  final List<Map<String, dynamic>> tiles;
  final List<Map<String, dynamic>> segments;
  final List<Map<String, dynamic>> formFields;
  final Map<String, String> soundMap;

  const GameConfig({
    required this.id,
    required this.name,
    required this.category,
    this.description,
    this.redirectUrl,
    this.clientSlug,
    this.companyName,
    this.gameType,
    this.status,
    this.settings = const {},
    this.questions = const [],
    this.words = const [],
    this.tiles = const [],
    this.segments = const [],
    this.formFields = const [],
    this.soundMap = const {},
  });

  factory GameConfig.fromJson(Map<String, dynamic> json) {
    return GameConfig(
      id: json['id'] ?? 0,
      name: json['name'] ?? '',
      category: json['category'] ?? 'quiz',
      description: json['description'],
      redirectUrl: json['redirect_url'],
      clientSlug: json['client_slug'],
      companyName: json['company_name'],
      gameType: json['game_type'],
      status: json['status'],
      settings: Map<String, dynamic>.from(json['settings'] ?? {}),
      questions: (json['questions'] as List?)
              ?.map((q) => Map<String, dynamic>.from(q as Map))
              .toList() ??
          [],
      words: (json['words'] as List?)
              ?.map((w) => Map<String, dynamic>.from(w as Map))
              .toList() ??
          [],
      tiles: (json['tiles'] as List?)
              ?.map((t) => Map<String, dynamic>.from(t as Map))
              .toList() ??
          [],
      segments: (json['segments'] as List?)
              ?.map((s) => Map<String, dynamic>.from(s as Map))
              .toList() ??
          [],
      formFields: (json['formFields'] as List?)
              ?.map((f) => Map<String, dynamic>.from(f as Map))
              .toList() ??
          [],
      soundMap: (json['soundMap'] as Map?)
              ?.map((k, v) => MapEntry(k.toString(), v?.toString() ?? '')) ??
          {},
    );
  }
}

/// Contract every native game must follow.
///
/// A game exports a plain builder function so it can be looked up by its
/// backend `category` key and rendered with its settings + finish callback.
typedef GameFinished = void Function(int score, int maxScore, bool completed);

typedef GameBuilder = Widget Function(
  GameConfig config,
  GameFinished onFinished,
);

/// Semantic feedback moments emitted by engines. The player page decides how
/// each one is expressed (haptics, sounds, visual juice).
enum GameFx { correct, wrong, match, mismatch, levelUp, tick, win, gameOver }

/// Base class for headless game engines living in `games/<game>/logic.dart`.
///
/// Engines own the rules: state machine, scoring, timing. They never build
/// widgets, never touch network, never read theme colors. UI shells
/// (`games/<game>/playerpage.dart`) listen via ChangeNotifier and translate
/// [fx] events into haptics/sounds.
abstract class GameEngine extends ChangeNotifier {
  final StreamController<GameFx> _fx = StreamController<GameFx>.broadcast();

  /// Feedback stream — fire-and-forget semantic events.
  Stream<GameFx> get fx => _fx.stream;

  int get score;
  int get maxScore;
  bool get completed;

  @protected
  void emit(GameFx effect) => _fx.add(effect);

  @mustCallSuper
  @override
  void dispose() {
    _fx.close();
    super.dispose();
  }
}
