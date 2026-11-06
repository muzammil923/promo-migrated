import 'package:flutter/material.dart';
import 'package:promogames_engine/engine.dart';
import 'package:promogames_engine/engine.dart';

const _bg = LinearGradient(
  begin: Alignment.topLeft,
  end: Alignment.bottomRight,
  colors: [Color(0xFF0d0a1a), Color(0xFF1a0e2e), Color(0xFF0f0b1e), Color(0xFF080612)],
);
const _purple = Color(0xFF8b5cf6);
const _green = Color(0xFF22c55e);

Widget buildQuizGame(GameConfig config, GameFinished onFinished) {
  return _QuizGame(config: config, onFinished: onFinished);
}

class _Question {
  final String q;
  final List<String> options;
  final int answer;
  const _Question(this.q, this.options, this.answer);
}

const _questions = <_Question>[
  _Question('What is the capital of France?', ['London', 'Paris', 'Berlin', 'Madrid'], 1),
  _Question('How many continents are there?', ['5', '6', '7', '8'], 2),
  _Question('What is 9 x 6?', ['54', '48', '56', '63'], 0),
  _Question('Which planet is the Red Planet?', ['Venus', 'Jupiter', 'Mars', 'Saturn'], 2),
  _Question('What gas do plants absorb?', ['Oxygen', 'Nitrogen', 'Hydrogen', 'Carbon Dioxide'], 3),
];

class _QuizGame extends StatefulWidget {
  final GameConfig config;
  final GameFinished onFinished;
  const _QuizGame({required this.config, required this.onFinished});

  @override
  State<_QuizGame> createState() => _QuizGameState();
}

class _QuizGameState extends State<_QuizGame> {
  int _index = 0;
  int _score = 0;
  int? _selected;
  bool _answered = false;

  void _select(int i) {
    if (_answered) return;
    setState(() {
      _selected = i;
      _answered = true;
      if (i == _questions[_index].answer) _score++;
    });
  }

  void _next() {
    if (_index < _questions.length - 1) {
      setState(() {
        _index++;
        _selected = null;
        _answered = false;
      });
    } else {
      widget.onFinished(_score, _questions.length, true);
      Navigator.of(context).maybePop();
    }
  }

  Color _optColor(int i) {
    if (!_answered) return Colors.white10;
    if (i == _questions[_index].answer) return _green.withOpacity(0.7);
    if (i == _selected) return Colors.red.withOpacity(0.6);
    return Colors.white10;
  }

  @override
  Widget build(BuildContext context) {
    final q = _questions[_index];
    return Scaffold(
      appBar: AppBar(
        backgroundColor: const Color(0xFF1a0e2e),
        title: Text(widget.config.name),
        leading: IconButton(
          icon: const Icon(Icons.close),
          onPressed: () {
            widget.onFinished(_score, _questions.length, false);
            Navigator.of(context).maybePop();
          },
        ),
      ),
      body: Container(
        decoration: const BoxDecoration(gradient: _bg),
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text('Question ${_index + 1}/${_questions.length}',
                style: const TextStyle(color: _purple, fontSize: 16, fontWeight: FontWeight.bold)),
            const SizedBox(height: 8),
            Text('Score: $_score', style: const TextStyle(color: _green, fontSize: 14)),
            const SizedBox(height: 24),
            Text(q.q, style: const TextStyle(color: Colors.white, fontSize: 22, fontWeight: FontWeight.w600)),
            const SizedBox(height: 24),
            ...List.generate(q.options.length, (i) {
              return Padding(
                padding: const EdgeInsets.only(bottom: 12),
                child: ElevatedButton(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: _optColor(i),
                    padding: const EdgeInsets.symmetric(vertical: 16),
                  ),
                  onPressed: () => _select(i),
                  child: Text(q.options[i], style: const TextStyle(color: Colors.white, fontSize: 16)),
                ),
              );
            }),
            const Spacer(),
            if (_answered)
              ElevatedButton(
                style: ElevatedButton.styleFrom(backgroundColor: _purple, padding: const EdgeInsets.symmetric(vertical: 16)),
                onPressed: _next,
                child: Text(_index < _questions.length - 1 ? 'Next' : 'Finish',
                    style: const TextStyle(color: Colors.white, fontSize: 16)),
              ),
          ],
        ),
      ),
    );
  }
}
