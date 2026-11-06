import 'package:flutter/material.dart';
import 'package:promogames_engine/engine.dart';
import 'logic.dart';

/// Standardized module entry point.
Widget buildTetrisPlayer(GameConfig config, GameFinished onFinished) =>
    buildTetrisGame(config, onFinished);
