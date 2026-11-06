import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../core/theme/app_colors.dart';
import '../core/theme/app_dimensions.dart';

class PlayerShell extends StatelessWidget {
  final StatefulNavigationShell navigationShell;
  const PlayerShell({super.key, required this.navigationShell});

  void _go(int index) {
    navigationShell.goBranch(index, initialLocation: index == navigationShell.currentIndex);
  }

  @override
  Widget build(BuildContext context) {
    const items = [
      (Icons.home_rounded, 'Home'),
      (Icons.sports_esports_rounded, 'Games'),
      (Icons.card_giftcard_rounded, 'Rewards'),
      (Icons.leaderboard_rounded, 'Ranks'),
      (Icons.person_rounded, 'Profile'),
    ];
    final current = navigationShell.currentIndex;
    final bottomPad = MediaQuery.of(context).padding.bottom;

    return PopScope(
      canPop: false,
      onPopInvokedWithResult: (didPop, _) {
        if (didPop) return;
        if (current != 0) {
          _go(0);
        }
      },
      child: Scaffold(
        backgroundColor: AppColors.background,
        body: Stack(
          children: [
            // Body fills entire screen — content scrolls behind pill area
            Positioned.fill(
              child: navigationShell,
            ),
            // Floating glass pill — overlaid on top of body content
            Positioned(
              left: 20,
              right: 20,
              bottom: bottomPad + 10,
              height: 70,
              child: ClipRRect(
                borderRadius: BorderRadius.circular(AppRadius.bottomNav),
                child: BackdropFilter(
                  filter: ImageFilter.blur(sigmaX: 40, sigmaY: 40),
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 8),
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(AppRadius.bottomNav),
                      color: Colors.white.withAlpha(15),
                      border: Border.all(color: Colors.white.withAlpha(128), width: 0.5),
                      boxShadow: [
                        BoxShadow(
                          color: AppColors.primary.withAlpha(25),
                          blurRadius: 40,
                          offset: const Offset(0, 10),
                        ),
                      ],
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceAround,
                      children: items.asMap().entries.map((e) {
                        final i = e.key;
                        final item = e.value;
                        final active = current == i;
                        return GestureDetector(
                          onTap: () => _go(i),
                          child: AnimatedContainer(
                            duration: const Duration(milliseconds: 300),
                            curve: Curves.easeOutCubic,
                            padding: EdgeInsets.symmetric(
                              horizontal: active ? 16 : 12,
                              vertical: 10,
                            ),
                            decoration: BoxDecoration(
                              gradient: active
                                  ? LinearGradient(
                                      colors: [
                                        AppColors.primary,
                                        AppColors.secondaryPurple,
                                      ],
                                    )
                                  : null,
                              borderRadius: BorderRadius.circular(20),
                              boxShadow: active
                                  ? [
                                      BoxShadow(
                                        color: AppColors.primary.withAlpha(60),
                                        blurRadius: 16,
                                        offset: const Offset(0, 4),
                                      ),
                                    ]
                                  : null,
                            ),
                            child: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Icon(
                                  item.$1,
                                  color: active ? Colors.white : Colors.white.withAlpha(180),
                                  size: active ? 22 : 24,
                                ),
                                if (active) ...[
                                  const SizedBox(width: 8),
                                  Text(
                                    item.$2,
                                    style: const TextStyle(
                                      color: Colors.white,
                                      fontWeight: FontWeight.w700,
                                      fontSize: 13,
                                      letterSpacing: 0.2,
                                    ),
                                  ),
                                ],
                              ],
                            ),
                          ),
                        );
                      }).toList(),
                    ),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
