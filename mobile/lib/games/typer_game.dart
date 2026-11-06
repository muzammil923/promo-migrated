import 'dart:async';
import 'dart:math';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:promogames_engine/engine.dart';
import 'package:promogames_engine/engine.dart';

Widget buildTyperGame(GameConfig config, GameFinished onFinished) {
  return _TyperGame(config: config, onFinished: onFinished);
}

// ─── Color Palette ───────────────────────────────────────────────────────
class _Palette {
  static const ink900 = Color(0xFF1c122f);
  static const paper100 = Color(0xFFF8F2FC);
  static const paper200 = Color(0xFFECE0F6);
  static const paper300 = Color(0xFFDCC5EE);
  static const paperLine = Color(0xFFB89BD6);
  static const paperShadow = Color(0xFF9C7EC0);
  static const copper300 = Color(0xFFD3B0F7);
  static const copper400 = Color(0xFFB98AF0);
  static const copper500 = Color(0xFF9C5FE0);
  static const copper700 = Color(0xFF5B2D94);
  static const ribbon400 = Color(0xFFE0578A);
  static const ribbon500 = Color(0xFFC23468);
  static const ribbon600 = Color(0xFF9C2452);
  static const teal300 = Color(0xFFF0D68F);
  static const teal500 = Color(0xFFC89B3A);
  static const brass400 = Color(0xFFD8B96A);
  static const cream = Color(0xFFF3ECFA);
  static const inkText = Color(0xFF291C38);
  static const inkTextSoft = Color(0xFF6D5A80);
}

// ─── Word Banks ──────────────────────────────────────────────────────────
const _builtinWords = {
  'easy': [
    'CAT', 'DOG', 'RUN', 'JUMP', 'BLUE', 'TREE', 'FISH', 'BOOK', 'LAMP', 'DOOR',
    'MILK', 'RAIN', 'STAR', 'WIND', 'GOLD', 'LEAF', 'SNOW', 'FIRE', 'MOON', 'SHIP',
    'KING', 'ROCK', 'SAND', 'WAVE', 'BELL', 'CORN', 'DESK', 'FARM', 'GATE', 'HALL',
    'IRON', 'KITE', 'LION', 'MINT', 'NEST', 'OVAL', 'PEAR', 'ROAD', 'SALT', 'TENT',
  ],
  'medium': [
    'GARDEN', 'PLANET', 'WINDOW', 'BOTTLE', 'CASTLE', 'FOREST', 'HUNTER', 'JACKET',
    'KITCHEN', 'ORANGE', 'PENCIL', 'RABBIT', 'VILLAGE', 'YELLOW', 'BRIDGE', 'CAMERA',
    'DRAGON', 'ENERGY', 'FABRIC', 'ISLAND', 'JUNGLE', 'LADDER', 'MARKET', 'PUZZLE',
    'RIBBON', 'SIGNAL', 'TUNNEL', 'UPLOAD', 'VALLEY', 'WEAVER', 'ALMANAC', 'COBALT',
  ],
  'hard': [
    'ADVENTURE', 'ALGORITHM', 'BLUEPRINT', 'CHRONICLE', 'DISCIPLINE', 'FANTASTIC',
    'GRAVITY', 'HORIZON', 'IMAGINARY', 'JOURNALIST', 'KNOWLEDGE', 'LABYRINTH',
    'MECHANISM', 'NEGOTIATE', 'OBSTACLE', 'PARADOX', 'QUANTUM', 'RESILIENT',
    'SYMPHONY', 'TELESCOPE', 'UNIVERSE', 'VOCABULARY', 'WILDERNESS', 'CATHEDRAL',
    'DIPLOMAT', 'ENGINEER', 'FORTITUDE', 'GYMNASIUM', 'HARMONIC', 'INSOMNIA',
  ],
};

// ─── Game Phases ─────────────────────────────────────────────────────────
enum _Phase { setup, countdown, playing, ended }

// ─── Main Game Widget ────────────────────────────────────────────────────
class _TyperGame extends StatefulWidget {
  final GameConfig config;
  final GameFinished onFinished;
  const _TyperGame({required this.config, required this.onFinished});

  @override
  State<_TyperGame> createState() => _TyperGameState();
}

class _TyperGameState extends State<_TyperGame> with TickerProviderStateMixin {
  // ── Settings ──
  Color _bgColor = _Palette.ink900;
  String? _bgImageUrl;
  String? _logoUrl;
  late int _fallSpeed;
  late int _maxSimultaneous;
  late int _timeLimit;
  late int _maxMisses;
  late int _targetWords;
  String _difficultyMode = 'progressive';

  // ── Game State ──
  _Phase _phase = _Phase.setup;
  String _selectedDifficulty = 'medium';
  int _selectedDuration = 60;
  String _currentWord = '';
  String _typed = '';
  List<_WordEntry> _history = [];
  List<String> _queue = [];
  int _wordGen = 0;
  bool _wordLocked = false;

  // ── Stats ──
  int _correctChars = 0;
  int _wordsCompleted = 0;
  int _correctWords = 0;
  int _mistakes = 0;
  int _streak = 0;
  int _bestStreak = 0;
  double _score = 0;
  int _remainingSeconds = 60;

  // ── Timers ──
  Timer? _roundTimer;
  Timer? _countdownTimer;
  int _countdownNum = 0;
  DateTime? _roundStart;
  DateTime? _wordStart;
  double _ringProgress = 1.0;

  // ── Animations ──
  late AnimationController _ringAnimCtrl;
  late AnimationController _flashCtrl;
  late AnimationController _shakeCtrl;
  late AnimationController _carriageCtrl;
  late AnimationController _bellCtrl;
  late AnimationController _stampCtrl;
  late AnimationController _countdownCtrl;
  late AnimationController _streakPopCtrl;

  // ── Input ──
  final TextEditingController _inputCtrl = TextEditingController();
  final FocusNode _inputFocus = FocusNode();

  // ── Sound Toggle ──
  bool _soundOn = true;

  @override
  void initState() {
    super.initState();
    _parseSettings();
    _initAnimations();
  }

  void _parseSettings() {
    final s = widget.config.settings;
    _bgColor = _hexToColor(s['bg_color']?.toString()) ?? _Palette.ink900;
    _bgImageUrl = s['bg_image_url']?.toString();
    _logoUrl = s['game_logo_url']?.toString();
    _fallSpeed = (s['fall_speed'] as num?)?.toInt() ?? 2;
    _maxSimultaneous = (s['max_simultaneous'] as num?)?.toInt() ?? 3;
    _timeLimit = (s['time_limit_seconds'] as num?)?.toInt() ?? 60;
    _maxMisses = (s['max_misses'] as num?)?.toInt() ?? 5;
    _targetWords = (s['target_words'] as num?)?.toInt() ?? 0;
    _difficultyMode = s['difficulty_mode']?.toString() ?? 'progressive';
    _selectedDuration = _timeLimit;
    if (_difficultyMode != 'progressive' &&
        _difficultyMode != 'fixed' &&
        ['easy', 'medium', 'hard'].contains(_difficultyMode)) {
      _selectedDifficulty = _difficultyMode;
    }
  }

  Color? _hexToColor(String? hex) {
    if (hex == null || hex.isEmpty) return null;
    hex = hex.replaceFirst('#', '');
    if (hex.length == 6) hex = 'FF$hex';
    try {
      return Color(int.parse(hex, radix: 16));
    } catch (_) {
      return null;
    }
  }

  void _initAnimations() {
    _ringAnimCtrl = AnimationController(vsync: this, duration: const Duration(seconds: 1));
    _flashCtrl = AnimationController(vsync: this, duration: const Duration(milliseconds: 300));
    _shakeCtrl = AnimationController(vsync: this, duration: const Duration(milliseconds: 300));
    _carriageCtrl = AnimationController(vsync: this, duration: const Duration(milliseconds: 340));
    _bellCtrl = AnimationController(vsync: this, duration: const Duration(milliseconds: 550));
    _stampCtrl = AnimationController(vsync: this, duration: const Duration(milliseconds: 400));
    _countdownCtrl = AnimationController(vsync: this, duration: const Duration(milliseconds: 500));
    _streakPopCtrl = AnimationController(vsync: this, duration: const Duration(milliseconds: 900));
  }

  @override
  void dispose() {
    _roundTimer?.cancel();
    _countdownTimer?.cancel();
    _ringAnimCtrl.dispose();
    _flashCtrl.dispose();
    _shakeCtrl.dispose();
    _carriageCtrl.dispose();
    _bellCtrl.dispose();
    _stampCtrl.dispose();
    _countdownCtrl.dispose();
    _streakPopCtrl.dispose();
    _inputCtrl.dispose();
    _inputFocus.dispose();
    super.dispose();
  }

  // ─── Word Management ─────────────────────────────────────────────────
  double _speedScale() => 2.0 / _fallSpeed;

  double _wordBudget(int len) {
    final base = switch (_selectedDifficulty) {
      'easy' => 1500 + 1500 + len * 220,
      'hard' => 850 + 1500 + len * 160,
      _ => 1100 + 1500 + len * 190,
    };
    return base * _speedScale();
  }

  List<String> _getWordBank(String diff) {
    final customWords = widget.config.words;
    if (customWords.isNotEmpty) {
      final filtered = customWords
          .where((w) => (w['difficulty']?.toString() ?? 'medium') == diff)
          .map((w) => (w['word_text']?.toString() ?? '').toUpperCase())
          .where((w) => w.isNotEmpty)
          .toList();
      if (filtered.isNotEmpty) return filtered;
    }
    return _builtinWords[diff] ?? _builtinWords['medium']!;
  }

  void _fillQueue() {
    final bank = _getWordBank(_selectedDifficulty);
    final shuffled = List<String>.from(bank)..shuffle(Random());
    _queue.addAll(shuffled);
  }

  String _nextWord() {
    if (_queue.length < 5) _fillQueue();
    return _queue.removeAt(0);
  }

  // ─── Sound Effects (Haptics + Visual Feedback) ──────────────────────
  void _hapticLight() => HapticFeedback.lightImpact();
  void _hapticMedium() => HapticFeedback.mediumImpact();
  void _hapticHeavy() => HapticFeedback.heavyImpact();
  void _hapticSelection() => HapticFeedback.selectionClick();

  // ─── Game Flow ──────────────────────────────────────────────────────
  void _startRound() {
    _queue = [];
    _history = [];
    _correctChars = 0;
    _wordsCompleted = 0;
    _correctWords = 0;
    _mistakes = 0;
    _streak = 0;
    _bestStreak = 0;
    _score = 0;
    _wordGen = 0;
    _wordLocked = false;
    _typed = '';
    _inputCtrl.clear();

    setState(() => _phase = _Phase.countdown);
    _countdownNum = 3;
    _countdownCtrl.forward(from: 0);

    _countdownTimer?.cancel();
    _countdownTimer = Timer.periodic(const Duration(milliseconds: 800), (t) {
      if (!mounted) {
        t.cancel();
        return;
      }
      _countdownCtrl.forward(from: 0);
      _hapticLight();
      if (_countdownNum > 1) {
        setState(() => _countdownNum--);
      } else {
        t.cancel();
        setState(() {
          _countdownNum = 0;
          _phase = _Phase.playing;
        });
        _hapticHeavy();
        _beginPlay();
      }
    });
  }

  void _beginPlay() {
    _roundStart = DateTime.now();
    _remainingSeconds = _selectedDuration;
    _loadNextWord();

    _roundTimer?.cancel();
    _roundTimer = Timer.periodic(const Duration(seconds: 1), (t) {
      if (!mounted) {
        t.cancel();
        return;
      }
      setState(() => _remainingSeconds--);
      if (_remainingSeconds <= 0) {
        t.cancel();
        _endRound();
      }
    });

    WidgetsBinding.instance.addPostFrameCallback((_) {
      _inputFocus.requestFocus();
    });
  }

  void _loadNextWord() {
    _wordGen++;
    _wordLocked = false;
    _typed = '';
    _inputCtrl.clear();
    _currentWord = _nextWord();
    _wordStart = DateTime.now();
    _ringProgress = 1.0;
    _startRingTimer();
    setState(() {});
  }

  void _startRingTimer() {
    final budget = _wordBudget(_currentWord.length);
    final gen = _wordGen;

    Timer.periodic(const Duration(milliseconds: 16), (t) {
      if (!mounted || _wordGen != gen || _phase != _Phase.playing) {
        t.cancel();
        return;
      }
      final elapsed = DateTime.now().difference(_wordStart!).inMilliseconds;
      final remaining = budget - elapsed;
      if (remaining <= 0) {
        t.cancel();
        _submitWord(true, gen);
        return;
      }
      setState(() => _ringProgress = (remaining / budget).clamp(0.0, 1.0));
    });
  }

  void _submitWord(bool timedOut, int gen) {
    if (gen != _wordGen || _wordLocked) return;
    _wordLocked = true;
    _wordsCompleted++;

    final ok = !timedOut && _typed.toUpperCase() == _currentWord;
    _history.add(_WordEntry(word: _currentWord, ok: ok));

    if (ok) {
      _correctWords++;
      _correctChars += _currentWord.length;
      _streak++;
      _bestStreak = max(_bestStreak, _streak);
      _score += _currentWord.length * 10 * (1 + min(_streak, 10) * 0.1);
      _hapticMedium();
      _flashCtrl.forward(from: 0);
      _carriageCtrl.forward(from: 0);
      _bellCtrl.forward(from: 0);
    } else {
      _mistakes++;
      _streak = 0;
      _hapticHeavy();
      _shakeCtrl.forward(from: 0);
    }

    setState(() {});

    if (_targetWords > 0 && _correctWords >= _targetWords) {
      _endRound();
      return;
    }
    if (_maxMisses > 0 && _mistakes >= _maxMisses) {
      _endRound();
      return;
    }

    Future.delayed(const Duration(milliseconds: 200), () {
      if (mounted && _phase == _Phase.playing) _loadNextWord();
    });
  }

  void _endRound() {
    _roundTimer?.cancel();
    _countdownTimer?.cancel();
    setState(() => _phase = _Phase.ended);
    _stampCtrl.forward(from: 0);
    _hapticHeavy();
  }

  void _onInputChanged(String value) {
    _hapticLight();
    setState(() => _typed = value);
    if (value.toUpperCase() == _currentWord) {
      _submitWord(false, _wordGen);
    }
  }

  void _onInputSubmitted(String value) {
    _submitWord(false, _wordGen);
  }

  // ─── Computed Stats ─────────────────────────────────────────────────
  int get _wpm {
    if (_roundStart == null) return 0;
    final elapsed = max(DateTime.now().difference(_roundStart!).inMilliseconds, 1);
    return ((_correctChars / 5) / (elapsed / 60000)).round();
  }

  int get _accuracy =>
      _wordsCompleted > 0 ? (_correctWords / _wordsCompleted * 100).round() : 100;

  // ─── Build ──────────────────────────────────────────────────────────
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: _bgColor,
      body: Stack(
        fit: StackFit.expand,
        children: [
          if (_bgImageUrl != null)
            CachedNetworkImage(
              imageUrl: _bgImageUrl!,
              fit: BoxFit.cover,
              placeholder: (_, __) => Container(color: _bgColor),
              errorWidget: (_, __, ___) => Container(color: _bgColor),
            ),
          if (_bgImageUrl != null)
            Container(color: Colors.black.withValues(alpha: 0.4)),
          SafeArea(
            child: switch (_phase) {
              _Phase.setup => _buildSetupScreen(),
              _Phase.countdown => _buildCountdownOverlay(),
              _Phase.playing => _buildGameScreen(),
              _Phase.ended => _buildEndScreen(),
            },
          ),
        ],
      ),
    );
  }

  // ─── Setup Screen ───────────────────────────────────────────────────
  Widget _buildSetupScreen() {
    return SingleChildScrollView(
      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
      child: Column(
        children: [
          const SizedBox(height: 20),
          if (_logoUrl != null) ...[
            ClipRRect(
              borderRadius: BorderRadius.circular(12),
              child: CachedNetworkImage(
                imageUrl: _logoUrl!,
                height: 48,
                fit: BoxFit.contain,
                errorWidget: (_, __, ___) => const SizedBox(),
              ),
            ),
            const SizedBox(height: 16),
          ],
          // Title
          Text(
            widget.config.name,
            style: const TextStyle(
              fontFamily: 'Special Elite',
              fontSize: 36,
              color: _Palette.cream,
              fontWeight: FontWeight.w400,
              letterSpacing: 1,
            ),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 8),
          Text(
            'Type the words before time runs out',
            style: TextStyle(
              color: _Palette.cream.withValues(alpha: 0.6),
              fontSize: 14,
            ),
          ),
          const SizedBox(height: 32),

          // Settings Card
          _PaperCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _fieldLabel('DIFFICULTY'),
                const SizedBox(height: 8),
                _keyRow(
                  options: const ['easy', 'medium', 'hard'],
                  labels: const ['Easy', 'Medium', 'Hard'],
                  selected: _selectedDifficulty,
                  onSelect: (v) {
                    setState(() => _selectedDifficulty = v);
                    _hapticSelection();
                  },
                ),
                const SizedBox(height: 20),
                _fieldLabel('ROUND LENGTH'),
                const SizedBox(height: 8),
                _keyRow(
                  options: const [30, 60, 90],
                  labels: const ['30s', '60s', '90s'],
                  selected: _selectedDuration,
                  onSelect: (v) {
                    setState(() => _selectedDuration = v);
                    _hapticSelection();
                  },
                ),
                const SizedBox(height: 24),
                SizedBox(
                  width: double.infinity,
                  child: _TypewriterButton(
                    onPressed: () {
                      _hapticMedium();
                      _startRound();
                    },
                    child: const Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Text('Start typing',
                            style: TextStyle(fontSize: 17, letterSpacing: 0.5)),
                        SizedBox(width: 8),
                        Icon(Icons.arrow_forward, size: 18),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 12),
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(Icons.keyboard,
                        size: 14, color: _Palette.copper700.withValues(alpha: 0.6)),
                    const SizedBox(width: 6),
                    Text(
                      'Works with keyboard or phone keyboard',
                      style: TextStyle(
                        fontSize: 12,
                        color: _Palette.copper700.withValues(alpha: 0.6),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(height: 20),

          // Stats preview
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              _miniStat('3', 'Difficulties'),
              const SizedBox(width: 28),
              _miniStat('30-90s', 'Round lengths'),
              const SizedBox(width: 28),
              _miniStat('∞', 'Retries'),
            ],
          ),
          const SizedBox(height: 32),
        ],
      ),
    );
  }

  // ─── Game Screen ────────────────────────────────────────────────────
  Widget _buildGameScreen() {
    return Column(
      children: [
        // Top bar
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'Round in progress',
                style: TextStyle(
                  fontFamily: 'IBM Plex Mono',
                  fontSize: 11,
                  letterSpacing: 2,
                  color: _Palette.teal300.withValues(alpha: 0.7),
                ),
              ),
              GestureDetector(
                onTap: () {
                  setState(() => _soundOn = !_soundOn);
                  _hapticLight();
                },
                child: Icon(
                  _soundOn ? Icons.volume_up : Icons.volume_off,
                  color: _Palette.cream.withValues(alpha: 0.6),
                  size: 20,
                ),
              ),
            ],
          ),
        ),

        // Stats console
        _PaperCard(
          padding: const EdgeInsets.symmetric(vertical: 12),
          child: Row(
            children: [
              _gauge(Icons.timer_outlined, '$_remainingSeconds', 'Seconds',
                  warn: _remainingSeconds <= 10),
              _gauge(Icons.bolt, '$_wpm', 'WPM'),
              _gauge(Icons.gps_fixed, '$_accuracy%', 'Accuracy'),
              _gauge(Icons.local_fire_department, '$_streak', 'Streak',
                  hot: _streak >= 5),
            ],
          ),
        ),

        const SizedBox(height: 12),

        // Paper card with word ladder
        Expanded(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: Column(
              children: [
                // Rollers
                _buildRollers(),
                // Paper
                Expanded(
                  child: _PaperCard(
                    clipBehavior: Clip.antiAlias,
                    padding: EdgeInsets.zero,
                    child: Stack(
                      children: [
                        // Flash overlay
                        AnimatedBuilder(
                          animation: _flashCtrl,
                          builder: (_, __) => Container(
                            color: _Palette.copper400
                                .withValues(alpha: 0.4 * (1 - _flashCtrl.value)),
                          ),
                        ),
                        // Letters badge
                        Positioned(
                          top: 12,
                          left: 16,
                          child: Text(
                            '${_currentWord.length} letters',
                            style: TextStyle(
                              fontFamily: 'IBM Plex Mono',
                              fontSize: 11,
                              fontWeight: FontWeight.w600,
                              color: _Palette.copper700.withValues(alpha: 0.7),
                            ),
                          ),
                        ),
                        // Bell indicator
                        Positioned(
                          top: 12,
                          right: 16,
                          child: AnimatedBuilder(
                            animation: _bellCtrl,
                            builder: (_, child) {
                              final shake = _bellCtrl.value < 1.0
                                  ? sin(_bellCtrl.value * pi * 4) * 15 * (1 - _bellCtrl.value)
                                  : 0.0;
                              return Transform.rotate(
                                angle: shake * pi / 180,
                                child: Icon(
                                  Icons.notifications_active,
                                  size: 16,
                                  color: _Palette.teal500.withValues(
                                      alpha: 0.3 + 0.7 * _bellCtrl.value),
                                ),
                              );
                            },
                          ),
                        ),
                        // Word ladder + ring
                        Center(
                          child: SizedBox(
                            width: 280,
                            height: 280,
                            child: CustomPaint(
                              painter: _RingPainter(
                                progress: _ringProgress,
                                low: _ringProgress < 0.25,
                              ),
                              child: Center(child: _buildWordLadder()),
                            ),
                          ),
                        ),
                        // Tap veil (when keyboard hidden)
                        if (_inputFocus.hasFocus == false)
                          GestureDetector(
                            onTap: () {
                              _inputFocus.requestFocus();
                            },
                            child: Container(
                              color: Colors.black.withValues(alpha: 0.5),
                              child: Center(
                                child: Column(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    Icon(Icons.keyboard,
                                        color: _Palette.cream.withValues(alpha: 0.8),
                                        size: 28),
                                    const SizedBox(height: 8),
                                    Text(
                                      'Tap to bring up keyboard',
                                      style: TextStyle(
                                        color: _Palette.cream.withValues(alpha: 0.7),
                                        fontSize: 13,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ),
                          ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),

        // Hidden input
        TextField(
          controller: _inputCtrl,
          focusNode: _inputFocus,
          autofocus: true,
          autocorrect: false,
          enableSuggestions: false,
          textInputAction: TextInputAction.done,
          style: const TextStyle(color: Colors.transparent, fontSize: 1),
          decoration: const InputDecoration.collapsed(hintText: ''),
          onChanged: _onInputChanged,
          onSubmitted: _onInputSubmitted,
        ),

        // Footer
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              GestureDetector(
                onTap: () {
                  _hapticMedium();
                  _endRound();
                },
                child: Row(
                  children: [
                    Icon(Icons.close,
                        size: 14, color: _Palette.cream.withValues(alpha: 0.5)),
                    const SizedBox(width: 4),
                    Text(
                      'End round',
                      style: TextStyle(
                        color: _Palette.cream.withValues(alpha: 0.5),
                        fontSize: 13,
                      ),
                    ),
                  ],
                ),
              ),
              Text(
                '$_mistakes ${_mistakes == 1 ? 'mistake' : 'mistakes'}',
                style: TextStyle(
                  fontFamily: 'IBM Plex Mono',
                  fontSize: 12,
                  color: _Palette.cream.withValues(alpha: 0.4),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildWordLadder() {
    final doneSlice = _history.length > 2
        ? _history.sublist(_history.length - 2)
        : _history;
    final nextSlice = _queue.take(max(1, _maxSimultaneous)).toList();

    return Column(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        // Past words
        for (final entry in doneSlice) ...[
          Opacity(
            opacity: 0.85,
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Text(
                  entry.word,
                  style: TextStyle(
                    fontFamily: 'Special Elite',
                    fontSize: 16,
                    color: entry.ok ? _Palette.teal500 : _Palette.ribbon500,
                    decoration:
                        entry.ok ? null : TextDecoration.lineThrough,
                    decorationColor: _Palette.ribbon500,
                  ),
                ),
                const SizedBox(width: 6),
                Icon(
                  entry.ok ? Icons.check : Icons.close,
                  size: 14,
                  color: entry.ok ? _Palette.teal500 : _Palette.ribbon500,
                ),
              ],
            ),
          ),
          const SizedBox(height: 6),
        ],

        // Current word (large)
        if (_currentWord.isNotEmpty)
          AnimatedBuilder(
            animation: _shakeCtrl,
            builder: (_, __) {
              final shakeOffset = _shakeCtrl.value < 1.0
                  ? sin(_shakeCtrl.value * pi * 6) * 4 * (1 - _shakeCtrl.value)
                  : 0.0;
              return Transform.translate(
                offset: Offset(shakeOffset, 0),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    for (int i = 0; i < _currentWord.length; i++) ...[
                      AnimatedDefaultTextStyle(
                        duration: const Duration(milliseconds: 100),
                        style: TextStyle(
                          fontFamily: 'Special Elite',
                          fontSize: 38,
                          color: i < _typed.length
                              ? (_typed[i].toUpperCase() == _currentWord[i]
                                  ? _Palette.copper700
                                  : _Palette.ribbon500)
                              : _Palette.inkText.withValues(alpha: 0.5),
                          decoration: i < _typed.length &&
                                  _typed[i].toUpperCase() != _currentWord[i]
                              ? TextDecoration.underline
                              : null,
                          decorationColor: _Palette.ribbon500,
                          decorationStyle: TextDecorationStyle.wavy,
                        ),
                        child: Text(_currentWord[i]),
                      ),
                    ],
                    // Caret
                    Container(
                      width: 2,
                      height: 28,
                      margin: const EdgeInsets.only(left: 1),
                      color: _Palette.ribbon500,
                    ),
                  ],
                ),
              );
            },
          ),

        const SizedBox(height: 12),

        // Next words
        for (final w in nextSlice.take(2)) ...[
          Opacity(
            opacity: 0.35,
            child: Text(
              w,
              style: const TextStyle(
                fontFamily: 'Special Elite',
                fontSize: 16,
                color: _Palette.inkTextSoft,
              ),
            ),
          ),
          const SizedBox(height: 6),
        ],
      ],
    );
  }

  Widget _buildRollers() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 24),
      child: SizedBox(
        height: 16,
        child: Row(
          children: [
            Container(
              width: 14,
              height: 14,
              decoration: const BoxDecoration(
                shape: BoxShape.circle,
                gradient: RadialGradient(
                  colors: [Color(0xFF5A3F78), Color(0xFF1C1228)],
                ),
              ),
            ),
            Expanded(
              child: Container(
                height: 2,
                margin: const EdgeInsets.symmetric(horizontal: 2),
                decoration: const BoxDecoration(
                  gradient: LinearGradient(
                    colors: [
                      Colors.transparent,
                      _Palette.brass400,
                      Colors.transparent,
                    ],
                  ),
                ),
              ),
            ),
            Container(
              width: 14,
              height: 14,
              decoration: const BoxDecoration(
                shape: BoxShape.circle,
                gradient: RadialGradient(
                  colors: [Color(0xFF5A3F78), Color(0xFF1C1228)],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  // ─── Countdown Overlay ──────────────────────────────────────────────
  Widget _buildCountdownOverlay() {
    return Center(
      child: AnimatedBuilder(
        animation: _countdownCtrl,
        builder: (_, __) {
          final scale = 0.35 + 0.65 * Curves.elasticOut.transform(_countdownCtrl.value);
          return Transform.scale(
            scale: scale,
            child: Text(
              _countdownNum > 0 ? '$_countdownNum' : 'Go!',
              style: const TextStyle(
                fontFamily: 'Special Elite',
                fontSize: 80,
                color: _Palette.cream,
                shadows: [
                  Shadow(
                    color: _Palette.copper400,
                    blurRadius: 30,
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }

  // ─── End Screen ─────────────────────────────────────────────────────
  Widget _buildEndScreen() {
    return SingleChildScrollView(
      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 20),
      child: Column(
        children: [
          const SizedBox(height: 40),
          // Stamp
          AnimatedBuilder(
            animation: _stampCtrl,
            builder: (_, __) {
              final scale = _stampCtrl.value < 0.5
                  ? 2.4 - 1.5 * _stampCtrl.value
                  : 0.9 + 0.1 * ((_stampCtrl.value - 0.5) * 2);
              return Transform.scale(
                scale: scale,
                child: Opacity(
                  opacity: _stampCtrl.value.clamp(0.0, 1.0),
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 22, vertical: 8),
                    decoration: BoxDecoration(
                      border: Border.all(color: _Palette.ribbon500, width: 3),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Text(
                      "TIME'S UP",
                      style: TextStyle(
                        fontFamily: 'Special Elite',
                        fontSize: 28,
                        color: _Palette.ribbon400,
                        letterSpacing: 2,
                      ),
                    ),
                  ),
                ),
              );
            },
          ),
          const SizedBox(height: 32),

          // Results card
          _PaperCard(
            padding: const EdgeInsets.all(28),
            child: Column(
              children: [
                // Results grid
                GridView.count(
                  crossAxisCount: 3,
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  mainAxisSpacing: 0,
                  crossAxisSpacing: 0,
                  children: [
                    _resultItem(Icons.bolt, '$_wpm', 'Words / min'),
                    _resultItem(Icons.gps_fixed, '$_accuracy%', 'Accuracy'),
                    _resultItem(Icons.local_fire_department, '$_bestStreak', 'Best streak'),
                    _resultItem(Icons.trending_up, '$_correctWords', 'Words typed'),
                    _resultItem(Icons.warning_amber, '$_mistakes', 'Mistakes'),
                    _resultItem(Icons.star, '${_score.round()}', 'Score'),
                  ],
                ),

                const SizedBox(height: 28),

                // Buttons
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    _TypewriterButton(
                      onPressed: () {
                        _hapticMedium();
                        _startRound();
                      },
                      child: const Row(
                        children: [
                          Icon(Icons.refresh, size: 16),
                          SizedBox(width: 6),
                          Text('Type again', style: TextStyle(fontSize: 16)),
                        ],
                      ),
                    ),
                    const SizedBox(width: 14),
                    _GhostButton(
                      onPressed: () {
                        _hapticLight();
                        setState(() => _phase = _Phase.setup);
                      },
                      child: const Text('Change settings'),
                    ),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(height: 20),
        ],
      ),
    );
  }

  // ─── Helper Widgets ─────────────────────────────────────────────────
  Widget _fieldLabel(String text) {
    return Text(
      text,
      style: TextStyle(
        fontFamily: 'IBM Plex Mono',
        fontSize: 11,
        letterSpacing: 1.4,
        color: _Palette.copper700.withValues(alpha: 0.8),
      ),
    );
  }

  Widget _keyRow<T>({required List<T> options, required List<String> labels, required T selected, required ValueChanged<T> onSelect}) {
    return Row(
      children: List.generate(options.length, (i) {
        final isActive = options[i] == selected;
        return Padding(
          padding: const EdgeInsets.only(right: 10),
          child: GestureDetector(
            onTap: () => onSelect(options[i]),
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 150),
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 11),
              decoration: BoxDecoration(
                gradient: isActive
                    ? const LinearGradient(
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                        colors: [Color(0xFFF0D9A0), Color(0xFFD3A94F), Color(0xFFA67A2E)],
                      )
                    : LinearGradient(
                        colors: [_Palette.paper100, _Palette.paper200, _Palette.paper300],
                      ),
                borderRadius: BorderRadius.circular(40),
                border: Border.all(
                  color: isActive ? const Color(0xFF5C3F18) : _Palette.paperShadow,
                ),
                boxShadow: isActive
                    ? [
                        const BoxShadow(
                            color: Color(0xFF5C3F18), offset: Offset(0, 2), blurRadius: 0),
                      ]
                    : [
                        BoxShadow(
                            color: const Color(0xFF3C0F15).withValues(alpha: 0.28),
                            offset: const Offset(0, 8),
                            blurRadius: 14),
                      ],
              ),
              child: Text(
                labels[i],
                style: TextStyle(
                  fontFamily: 'Special Elite',
                  fontSize: 15,
                  color: isActive ? const Color(0xFF3A2708) : _Palette.inkText,
                ),
              ),
            ),
          ),
        );
      }),
    );
  }

  Widget _gauge(IconData icon, String value, String label, {bool warn = false, bool hot = false}) {
    return Expanded(
      child: Column(
        children: [
          Icon(icon, size: 14, color: _Palette.copper700.withValues(alpha: 0.7)),
          const SizedBox(height: 2),
          Text(
            value,
            style: TextStyle(
              fontFamily: 'Special Elite',
              fontSize: 22,
              color: warn
                  ? _Palette.ribbon600
                  : hot
                      ? _Palette.ribbon600
                      : _Palette.inkText,
              shadows: hot
                  ? [Shadow(color: _Palette.ribbon600.withValues(alpha: 0.5), blurRadius: 12)]
                  : null,
            ),
          ),
          Text(
            label,
            style: TextStyle(
              fontSize: 9,
              letterSpacing: 1,
              color: _Palette.inkTextSoft,
            ),
          ),
        ],
      ),
    );
  }

  Widget _miniStat(String value, String label) {
    return Column(
      children: [
        Text(
          value,
          style: TextStyle(
            fontFamily: 'IBM Plex Mono',
            fontWeight: FontWeight.w700,
            fontSize: 20,
            color: _Palette.copper300,
          ),
        ),
        Text(
          label,
          style: TextStyle(
            fontSize: 11,
            color: _Palette.cream.withValues(alpha: 0.35),
          ),
        ),
      ],
    );
  }

  Widget _resultItem(IconData icon, String value, String label) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        border: Border(
          right: BorderSide(color: _Palette.copper700.withValues(alpha: 0.15)),
          bottom: BorderSide(color: _Palette.copper700.withValues(alpha: 0.15)),
        ),
      ),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(icon, size: 14, color: _Palette.copper700.withValues(alpha: 0.6)),
          const SizedBox(height: 4),
          Text(
            value,
            style: const TextStyle(
              fontFamily: 'Special Elite',
              fontSize: 24,
              color: _Palette.inkText,
            ),
          ),
          Text(
            label,
            style: TextStyle(
              fontSize: 10,
              letterSpacing: 1,
              color: _Palette.inkTextSoft,
            ),
          ),
        ],
      ),
    );
  }
}

// ─── Data Models ─────────────────────────────────────────────────────────
class _WordEntry {
  final String word;
  final bool ok;
  const _WordEntry({required this.word, required this.ok});
}

// ─── Custom Widgets ──────────────────────────────────────────────────────

class _PaperCard extends StatelessWidget {
  final Widget child;
  final EdgeInsetsGeometry padding;
  final Clip clipBehavior;

  const _PaperCard({
    required this.child,
    this.padding = const EdgeInsets.all(20),
    this.clipBehavior = Clip.none,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: padding,
      clipBehavior: clipBehavior,
      decoration: BoxDecoration(
        color: _Palette.paper100,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: _Palette.paperShadow),
        boxShadow: const [
          BoxShadow(
            color: Color(0xFF050F0E),
            offset: Offset(0, 24),
            blurRadius: 60,
            spreadRadius: -4,
          ),
        ],
      ),
      child: CustomPaint(
        painter: _PaperLinesBg(),
        child: child,
      ),
    );
  }
}

class _PaperLinesBg extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = _Palette.paperLine.withValues(alpha: 0.3)
      ..strokeWidth = 1;
    for (double y = 30; y < size.height; y += 32) {
      canvas.drawLine(Offset(0, y), Offset(size.width, y), paint);
    }
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}

class _TypewriterButton extends StatelessWidget {
  final VoidCallback onPressed;
  final Widget child;

  const _TypewriterButton({required this.onPressed, required this.child});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onPressed,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 28, vertical: 14),
        decoration: BoxDecoration(
          gradient: const LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [Color(0xFFF0D9A0), Color(0xFFD3A94F), Color(0xFFA67A2E), Color(0xFF7A5620)],
          ),
          borderRadius: BorderRadius.circular(8),
          border: Border.all(color: const Color(0xFF5C3F18)),
          boxShadow: const [
            BoxShadow(
              color: Color(0xFF5C3F18),
              offset: Offset(0, 4),
              blurRadius: 0,
            ),
            BoxShadow(
              color: Color(0xFF0F050F),
              offset: Offset(0, 10),
              blurRadius: 18,
              spreadRadius: -2,
            ),
          ],
        ),
        child: DefaultTextStyle(
          style: const TextStyle(
            fontFamily: 'Special Elite',
            color: Color(0xFF3A2708),
            fontSize: 17,
            shadows: [Shadow(color: Color(0x66FFF0D2), offset: Offset(0, 1))],
          ),
          child: child,
        ),
      ),
    );
  }
}

class _GhostButton extends StatelessWidget {
  final VoidCallback onPressed;
  final Widget child;

  const _GhostButton({required this.onPressed, required this.child});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onPressed,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
        decoration: BoxDecoration(
          color: Colors.transparent,
          borderRadius: BorderRadius.circular(8),
          border: Border.all(
            color: _Palette.cream.withValues(alpha: 0.22),
            width: 1.5,
          ),
        ),
        child: DefaultTextStyle(
          style: TextStyle(
            fontFamily: 'Special Elite',
            color: _Palette.cream.withValues(alpha: 0.8),
            fontSize: 15,
          ),
          child: child,
        ),
      ),
    );
  }
}

// ─── Ring Timer Painter ──────────────────────────────────────────────────
class _RingPainter extends CustomPainter {
  final double progress;
  final bool low;

  _RingPainter({required this.progress, required this.low});

  @override
  void paint(Canvas canvas, Size size) {
    final center = Offset(size.width / 2, size.height / 2);
    final radius = size.width / 2 - 8;

    // Track
    final trackPaint = Paint()
      ..color = _Palette.paperShadow.withValues(alpha: 0.35)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 3;
    canvas.drawCircle(center, radius, trackPaint);

    // Progress
    final progressPaint = Paint()
      ..color = low ? _Palette.ribbon500 : _Palette.copper500
      ..style = PaintingStyle.stroke
      ..strokeWidth = 3
      ..strokeCap = StrokeCap.round;
    final sweepAngle = 2 * pi * progress;
    canvas.drawArc(
      Rect.fromCircle(center: center, radius: radius),
      -pi / 2,
      sweepAngle,
      false,
      progressPaint,
    );

    // Dots
    final dotPaint = Paint()..color = _Palette.copper500.withValues(alpha: 0.4);
    for (int i = 0; i < 6; i++) {
      final angle = (i / 6) * 2 * pi - pi / 2;
      final dotCenter = Offset(
        center.dx + radius * cos(angle),
        center.dy + radius * sin(angle),
      );
      canvas.drawCircle(dotCenter, 3, dotPaint);
    }
  }

  @override
  bool shouldRepaint(covariant _RingPainter old) =>
      old.progress != progress || old.low != low;
}
