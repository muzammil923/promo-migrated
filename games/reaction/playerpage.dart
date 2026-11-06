import 'package:flutter/material.dart';
import 'package:promogames_engine/engine.dart';
import 'logic.dart';

/// Standardized module entry point.
Widget buildReactionPlayer(GameConfig config, GameFinished onFinished) =>
    buildReactionGame(config, onFinished);
