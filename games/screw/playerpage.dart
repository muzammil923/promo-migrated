import 'package:flutter/material.dart';
import 'package:promogames_engine/engine.dart';
import 'logic.dart';

/// Standardized module entry point.
Widget buildScrewPlayer(GameConfig config, GameFinished onFinished) =>
    buildScrewGame(config, onFinished);
