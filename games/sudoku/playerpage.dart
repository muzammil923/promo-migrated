import 'package:flutter/material.dart';
import 'package:promogames_engine/engine.dart';
import 'logic.dart';

/// Standardized module entry point.
Widget buildSudokuPlayer(GameConfig config, GameFinished onFinished) =>
    buildSudokuGame(config, onFinished);
