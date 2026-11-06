import 'package:flutter/material.dart';
import 'package:promogames_engine/engine.dart';
import 'logic.dart';

/// Standardized module entry point.
Widget buildJigsawPlayer(GameConfig config, GameFinished onFinished) =>
    buildJigsawGame(config, onFinished);
