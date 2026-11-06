import 'package:flutter/material.dart';
import 'package:promogames_engine/engine.dart';
import 'logic.dart';

/// Standardized module entry point.
Widget buildHanoiPlayer(GameConfig config, GameFinished onFinished) =>
    buildHanoiGame(config, onFinished);
