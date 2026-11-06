import 'package:flutter/material.dart';
import 'package:promogames_engine/engine.dart';
import 'logic.dart';

/// Standardized module entry point.
Widget buildSimonPlayer(GameConfig config, GameFinished onFinished) =>
    buildSimonGame(config, onFinished);
