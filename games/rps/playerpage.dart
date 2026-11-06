import 'package:flutter/material.dart';
import 'package:promogames_engine/engine.dart';
import 'logic.dart';

/// Standardized module entry point.
Widget buildRpsPlayer(GameConfig config, GameFinished onFinished) =>
    buildRpsGame(config, onFinished);
