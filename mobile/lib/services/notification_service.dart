import 'package:flutter_local_notifications/flutter_local_notifications.dart';

class NotificationService {
  static final NotificationService instance = NotificationService._();
  NotificationService._();

  final FlutterLocalNotificationsPlugin _plugin = FlutterLocalNotificationsPlugin();
  bool _initialized = false;

  Future<void> initialize() async {
    if (_initialized) return;
    _initialized = true;

    const androidSettings = AndroidInitializationSettings('@mipmap/ic_launcher');
    const iosSettings = DarwinInitializationSettings(
      requestAlertPermission: true,
      requestBadgePermission: true,
      requestSoundPermission: true,
    );
    const settings = InitializationSettings(
      android: androidSettings,
      iOS: iosSettings,
    );

    await _plugin.initialize(
      settings,
      onDidReceiveNotificationResponse: _onNotificationTapped,
    );
  }

  void _onNotificationTapped(NotificationResponse response) {
    // Handle notification tap — could navigate to a specific page
  }

  /// Show a local notification for game sync completion.
  Future<void> showSyncComplete(int syncedCount) async {
    if (syncedCount <= 0) return;
    const androidDetails = AndroidNotificationDetails(
      'sync_channel',
      'Game Sync',
      channelDescription: 'Notifications about game synchronization',
      importance: Importance.low,
      priority: Priority.low,
      icon: '@mipmap/ic_launcher',
    );
    const iosDetails = DarwinNotificationDetails(
      presentAlert: false,
      presentBadge: true,
      presentSound: false,
    );
    const details = NotificationDetails(
      android: androidDetails,
      iOS: iosDetails,
    );
    await _plugin.show(
      1,
      'Games Synced',
      '$syncedCount game(s) synced successfully',
      details,
    );
  }

  /// Show a local notification for new games available.
  Future<void> showNewGamesAvailable(int count) async {
    const androidDetails = AndroidNotificationDetails(
      'games_channel',
      'New Games',
      channelDescription: 'Notifications about new games',
      importance: Importance.defaultImportance,
      priority: Priority.defaultPriority,
      icon: '@mipmap/ic_launcher',
    );
    const iosDetails = DarwinNotificationDetails(
      presentAlert: true,
      presentBadge: true,
      presentSound: true,
    );
    const details = NotificationDetails(
      android: androidDetails,
      iOS: iosDetails,
    );
    await _plugin.show(
      2,
      'New Games Available!',
      '$count new game(s) just arrived. Check them out!',
      details,
    );
  }

  /// Show a local notification for PC earned.
  Future<void> showPcEarned(int amount, String gameName) async {
    const androidDetails = AndroidNotificationDetails(
      'pc_channel',
      'PC Earned',
      channelDescription: 'Notifications about Promo Coins earned',
      importance: Importance.defaultImportance,
      priority: Priority.defaultPriority,
      icon: '@mipmap/ic_launcher',
    );
    const iosDetails = DarwinNotificationDetails(
      presentAlert: true,
      presentBadge: true,
      presentSound: true,
    );
    const details = NotificationDetails(
      android: androidDetails,
      iOS: iosDetails,
    );
    await _plugin.show(
      3,
      'You earned $amount PC!',
      'Completed: $gameName',
      details,
    );
  }

  /// Request notification permissions (iOS).
  Future<bool> requestPermission() async {
    final ios = _plugin.resolvePlatformSpecificImplementation<
        IOSFlutterLocalNotificationsPlugin>();
    if (ios != null) {
      final result = await ios.requestPermissions(
        alert: true,
        badge: true,
        sound: true,
      );
      return result ?? false;
    }
    return true; // Android doesn't need runtime permission for local notifications
  }
}
