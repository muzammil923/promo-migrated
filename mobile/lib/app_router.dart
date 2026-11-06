import 'package:go_router/go_router.dart';

import 'pages/splash_page.dart';
import 'pages/login_page.dart';
import 'pages/game_player_page.dart';
import 'pages/edit_profile_page.dart';
import 'pages/admin_dashboard_page.dart';
import 'pages/it_dashboard_page.dart';
import 'pages/bo_dashboard_page.dart';
import 'pages/franchise_dashboard_page.dart';

import 'widgets/player_shell.dart';
import 'features/player/home_screen.dart';
import 'features/player/games_screen.dart';
import 'features/player/rewards_screen.dart';
import 'features/player/leaderboard_screen.dart';
import 'features/player/profile_screen.dart';
import 'features/player/game_details_page.dart';
import 'features/player/reward_details_page.dart';
import 'features/player/wallet_page.dart';
import 'features/player/notifications_page.dart';
import 'features/player/challenges_page.dart';
import 'features/player/achievements_page.dart';
import 'features/player/referral_page.dart';
import 'features/player/settings_page.dart';
import 'features/player/notification_settings_page.dart';
import 'features/player/language_page.dart';
import 'features/player/privacy_page.dart';
import 'features/player/support_page.dart';
import 'features/player/about_page.dart';

import 'models/game.dart';
import 'core/data/mock_data.dart';
import 'core/widgets/states.dart';

GoRouter buildRouter() {
  return GoRouter(
    initialLocation: '/',
    routes: [
      GoRoute(path: '/', builder: (_, __) => const SplashPage()),
      GoRoute(path: '/login', builder: (_, __) => const LoginPage()),
      GoRoute(path: '/wallet', builder: (_, __) => const WalletPage()),
      GoRoute(path: '/notifications', builder: (_, __) => const NotificationsPage()),
      GoRoute(path: '/challenges', builder: (_, __) => const ChallengesPage()),
      GoRoute(path: '/achievements', builder: (_, __) => const AchievementsPage()),
      GoRoute(path: '/referral', builder: (_, __) => const ReferralPage()),
      GoRoute(path: '/settings', builder: (_, __) => const SettingsPage()),
      GoRoute(path: '/settings/notifications', builder: (_, __) => const NotificationSettingsPage()),
      GoRoute(path: '/settings/language', builder: (_, __) => const LanguagePage()),
      GoRoute(path: '/settings/privacy', builder: (_, __) => const PrivacyPage()),
      GoRoute(path: '/settings/support', builder: (_, __) => const SupportPage()),
      GoRoute(path: '/settings/about', builder: (_, __) => const AboutPage()),
      GoRoute(path: '/edit-profile', builder: (_, __) => const EditProfilePage()),
      GoRoute(
        path: '/success',
        builder: (context, _) => SuccessScreen(
          title: 'Reward Redeemed!',
          subtitle: 'Your voucher is on its way to your email.',
          onContinue: () => context.go('/rewards'),
        ),
      ),
      GoRoute(path: '/admin', builder: (_, __) => const AdminDashboardPage()),
      GoRoute(path: '/it', builder: (_, __) => const ITDashboardPage()),
      GoRoute(path: '/bo', builder: (_, __) => const BODashboardPage()),
      GoRoute(path: '/franchise', builder: (_, __) => const FranchiseDashboardPage()),
      StatefulShellRoute.indexedStack(
        builder: (context, state, shell) => PlayerShell(navigationShell: shell),
        branches: [
          StatefulShellBranch(
            initialLocation: '/home',
            routes: [GoRoute(path: '/home', builder: (_, __) => const HomeScreen())],
          ),
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: '/games',
                builder: (_, __) => const GamesScreen(),
                routes: [
                  GoRoute(
                    path: 'details',
                    builder: (context, state) => GameDetailsPage(game: state.extra as GameItem),
                  ),
                  GoRoute(
                    path: 'play',
                    builder: (context, state) {
                      Game game;
                      String? utmSource;
                      final extra = state.extra;
                      if (extra is Game) {
                        game = extra;
                      } else if (extra is Map<String, dynamic>) {
                        game = extra['game'] as Game;
                        utmSource = extra['utm_source'] as String?;
                      } else {
                        game = Game(id: 0, name: 'Unknown', category: 'quiz');
                      }
                      return GamePlayerPage(game: game, utmSource: utmSource);
                    },
                  ),
                ],
              ),
            ],
          ),
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: '/rewards',
                builder: (_, __) => const RewardsScreen(),
                routes: [
                  GoRoute(
                    path: 'details',
                    builder: (context, state) => RewardDetailsPage(reward: state.extra as RewardItem),
                  ),
                ],
              ),
            ],
          ),
          StatefulShellBranch(
            routes: [GoRoute(path: '/leaderboard', builder: (_, __) => const LeaderboardScreen())],
          ),
          StatefulShellBranch(
            routes: [GoRoute(path: '/profile', builder: (_, __) => const ProfileScreen())],
          ),
        ],
      ),
    ],
  );
}
