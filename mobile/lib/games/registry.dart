import 'package:promogames_engine/engine.dart';
import 'fallback_game.dart';

import 'gamelinks/quiz/playerpage.dart';
import 'gamelinks/memory/playerpage.dart';
import 'gamelinks/snake/playerpage.dart';
import 'gamelinks/nagaraja/playerpage.dart';
import 'gamelinks/math/playerpage.dart';
import 'gamelinks/crossword/playerpage.dart';
import 'gamelinks/wordsearch/playerpage.dart';
import 'gamelinks/wordscramble/playerpage.dart';
import 'gamelinks/bubbleshooter/playerpage.dart';
import 'gamelinks/tictactoe/playerpage.dart';
import 'gamelinks/tictactoemulti/playerpage.dart';
import 'gamelinks/flappy/playerpage.dart';
import 'gamelinks/typer/playerpage.dart';
import 'gamelinks/chess/playerpage.dart';
import 'gamelinks/arrowescape/playerpage.dart';
import 'gamelinks/bounce/playerpage.dart';
import 'gamelinks/bowling/playerpage.dart';
import 'gamelinks/bejeweled/playerpage.dart';
import 'gamelinks/classicmaze/playerpage.dart';
import 'gamelinks/stickmaze/playerpage.dart';
import 'gamelinks/connect4/playerpage.dart';
import 'gamelinks/stressbuster/playerpage.dart';
import 'gamelinks/2048/playerpage.dart';
import 'gamelinks/ludo/playerpage.dart';
import 'gamelinks/snakeandladder/playerpage.dart';
import 'gamelinks/pouring/playerpage.dart';
import 'gamelinks/simon/playerpage.dart';
import 'gamelinks/reaction/playerpage.dart';
import 'gamelinks/whackamole/playerpage.dart';
import 'gamelinks/breakout/playerpage.dart';
import 'gamelinks/space/playerpage.dart';
import 'gamelinks/catch/playerpage.dart';
import 'gamelinks/sudoku/playerpage.dart';
import 'gamelinks/jigsaw/playerpage.dart';
import 'gamelinks/screw/playerpage.dart';
import 'gamelinks/stack/playerpage.dart';
import 'gamelinks/hanoi/playerpage.dart';
import 'gamelinks/minesweeper/playerpage.dart';
import 'gamelinks/rps/playerpage.dart';
import 'gamelinks/tetris/playerpage.dart';
import 'gamelinks/carlaunch/playerpage.dart';
import 'gamelinks/soundify/playerpage.dart';
import 'gamelinks/carrom/playerpage.dart';
import 'gamelinks/tower/playerpage.dart';
import 'canva_game.dart';
import 'brickimages_game.dart';

final Map<String, GameBuilder> _builders = {
  'quiz': buildQuizPlayer,
  'memory': buildMemoryPlayer,
  'math': buildMathPlayer,
  'tictactoe': buildTicTacToePlayer,
  'simon': buildSimonPlayer,
  'reaction': buildReactionPlayer,
  'whackamole': buildWhackamolePlayer,
  'snake': buildSnakePlayer,
  'nagaraja': buildNagarajaPlayer,
  'crossword': buildCrosswordPlayer,
  'wordsearch': buildWordSearchPlayer,
  'wordscramble': buildWordScramblePlayer,
  'bubbleshooter': buildBubbleShooterPlayer,
  'tictactoemulti': buildTicTacToeMultiPlayer,
  'flappy': buildFlappyPlayer,
  '2048': build2048Player,
  'breakout': buildBreakoutPlayer,
  'space': buildSpacePlayer,
  'catch': buildCatchPlayer,
  'maze': buildClassicMazePlayer,
  'stickmaze': buildStickMazePlayer,
  'sudoku': buildSudokuPlayer,
  'jigsaw': buildJigsawPlayer,
  'pouring': buildPouringPlayer,
  'typer': buildTyperPlayer,
  'screw': buildScrewPlayer,
  'bounce': buildBouncePlayer,
  'stack': buildStackPlayer,
  'hanoi': buildHanoiPlayer,
  'bowling': buildBowlingPlayer,
  'minesweeper': buildMinesweeperPlayer,
  'rps': buildRpsPlayer,
  'arrowescape': buildArrowEscapePlayer,
  'bejeweled': buildBejeweledPlayer,
  'tetris': buildTetrisPlayer,
  'carlaunch': buildCarLaunchPlayer,
  'stressbuster': buildStressBusterPlayer,
  'soundify': buildSoundifyPlayer,
  'connect4': buildConnect4Player,
  'chess': buildChessPlayer,
  'ludo': buildLudoPlayer,
  'snakeandladder': buildSnakeAndLadderPlayer,
  'carrom': buildCarromPlayer,
  'tower': buildTowerPlayer,
  'canva': buildCanvaGame,
  'brickimages': buildBrickImagesGame,
};

/// Returns the native builder for a backend game-type (`category`).
/// Unknown types resolve to a playable native fallback so the app is functional.
GameBuilder gameBuilder(String category) {
  final key = (category).toLowerCase();
  return _builders[key] ?? buildFallbackGame;
}
