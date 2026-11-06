import 'package:flutter/material.dart';
import 'package:promogames_engine/engine.dart';
import 'logic.dart';

/// Standardized module entry point.
Widget buildBreakoutPlayer(GameConfig config, GameFinished onFinished) =>
    buildBreakoutGame(config, onFinished);
