import 'package:flutter/material.dart';
import 'package:promogames_engine/engine.dart';
import 'logic.dart';

/// Standardized module entry point.
Widget buildCatchPlayer(GameConfig config, GameFinished onFinished) =>
    buildCatchGame(config, onFinished);
