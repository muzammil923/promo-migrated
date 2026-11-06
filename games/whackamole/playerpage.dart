import 'package:flutter/material.dart';
import 'package:promogames_engine/engine.dart';
import 'logic.dart';

/// Standardized module entry point.
Widget buildWhackamolePlayer(GameConfig config, GameFinished onFinished) =>
    buildWhackamoleGame(config, onFinished);
