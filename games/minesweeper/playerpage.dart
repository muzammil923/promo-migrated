import 'package:flutter/material.dart';
import 'package:promogames_engine/engine.dart';
import 'logic.dart';

/// Standardized module entry point.
Widget buildMinesweeperPlayer(GameConfig config, GameFinished onFinished) =>
    buildMinesweeperGame(config, onFinished);
