import 'package:flutter/material.dart';
import 'package:promogames_engine/engine.dart';
import 'logic.dart';

/// Standardized module entry point.
Widget buildSoundifyPlayer(GameConfig config, GameFinished onFinished) =>
    buildSoundifyGame(config, onFinished);
