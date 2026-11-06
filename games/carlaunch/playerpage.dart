import 'package:flutter/material.dart';
import 'package:promogames_engine/engine.dart';
import 'logic.dart';

/// Standardized module entry point.
Widget buildCarLaunchPlayer(GameConfig config, GameFinished onFinished) =>
    buildCarLaunchGame(config, onFinished);
