import 'package:flutter/material.dart';
import 'package:promogames_engine/engine.dart';
import 'logic.dart';

/// Standardized module entry point.
Widget buildSpacePlayer(GameConfig config, GameFinished onFinished) =>
    buildSpaceGame(config, onFinished);
