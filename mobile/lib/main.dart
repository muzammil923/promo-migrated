import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'services/auth_service.dart';
import 'services/player_provider.dart';
import 'services/notification_service.dart';
import 'app_router.dart';
import 'core/theme/app_theme.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Initialize notification service
  await NotificationService.instance.initialize();
  await NotificationService.instance.requestPermission();

  runApp(
    MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => AuthService()),
        ChangeNotifierProvider(create: (_) => PlayerProvider()),
      ],
      child: const PromoGamesApp(),
    ),
  );
}

class PromoGamesApp extends StatelessWidget {
  const PromoGamesApp({super.key});

  @override
  Widget build(BuildContext ctx) {
    return MaterialApp.router(
      title: 'PromoGames',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.light,
      routerConfig: buildRouter(),
    );
  }
}
