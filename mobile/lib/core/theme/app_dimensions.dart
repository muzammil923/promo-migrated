import 'package:flutter/material.dart';

/// Border radius tokens (8pt grid friendly).
class AppRadius {
  static const double button = 20;
  static const double card = 24;
  static const double bottomNav = 30;
  static const double dialog = 28;
  static const double image = 20;
  static const double pill = 999;
}

/// Spacing tokens (8pt grid).
class AppSpace {
  static const double xs = 4;
  static const double sm = 8;
  static const double md = 16;
  static const double lg = 24;
  static const double xl = 32;
  static const double xxl = 48;
}

/// Elevation / shadow tokens — very subtle, soft floating.
class AppShadow {
  static List<BoxShadow> get soft => [
        BoxShadow(
          color: const Color(0xFF6B21A8).withAlpha(40),
          blurRadius: 24,
          offset: const Offset(0, 10),
        ),
      ];
  static List<BoxShadow> get card => [
        BoxShadow(
          color: Colors.black.withAlpha(30),
          blurRadius: 18,
          offset: const Offset(0, 8),
        ),
      ];
}
