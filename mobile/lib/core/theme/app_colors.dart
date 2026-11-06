import 'package:flutter/material.dart';

/// Centralized color palette for PromoGames — deep purple dark theme.
class AppColors {
  // Brand
  static const Color primary = Color(0xFF6B21A8);
  static const Color primaryDark = Color(0xFF581C87);
  static const Color secondaryPurple = Color(0xFF9333EA);
  static const Color accentGold = Color(0xFFFDBB2D);

  // Surfaces
  static const Color background = Color(0xFF120822);
  static const Color surface = Color(0xFF1A0E33);
  static const Color surfaceVariant = Color(0xFF1F1240);

  // Dark theme surfaces
  static const Color darkBackground = Color(0xFF0A0514);
  static const Color darkSurface = Color(0xFF120822);
  static const Color darkText = Color(0xFFE8E0F0);

  // Text
  static const Color text = Colors.white;
  static const Color textSecondary = Color(0xFFB8A0D2);
  static const Color textOnPrimary = Colors.white;

  // Lines
  static const Color divider = Color(0xFF3D2066);

  // Semantic
  static const Color success = Color(0xFF34C759);
  static const Color warning = Color(0xFFFF9500);
  static const Color danger = Color(0xFFFF3B30);

  // Gradients
  static const Gradient primaryGradient = LinearGradient(
    colors: [primary, secondaryPurple],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );
  static const Gradient goldGradient = LinearGradient(
    colors: [Color(0xFFFDBB2D), Color(0xFFFFD76A)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );
  static const Gradient heroGradient = LinearGradient(
    colors: [Color(0xFF6B21A8), Color(0xFF9333EA), Color(0xFFD946EF)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );
  static const Gradient bgGradient = LinearGradient(
    colors: [Color(0xFF1A0A2E), Color(0xFF0D0519)],
    begin: Alignment.topCenter,
    end: Alignment.bottomCenter,
  );
}
