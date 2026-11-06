import 'package:flutter/material.dart';
import 'package:promogames_engine/engine.dart';
import 'logic.dart';

/// Standardized module entry point.
Widget buildStackPlayer(GameConfig config, GameFinished onFinished) =>
    buildStackGame(config, onFinished);
