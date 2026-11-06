import 'dart:math';
import 'package:flutter/material.dart';
import '../theme/app_colors.dart';

/// Lightweight mock models + data so the player UI is fully populated.
/// Swap these for real API calls when endpoints are ready.

class GameItem {
  final String id;
  final String name;
  final String category;
  final String reward;
  final String playTime;
  final String difficulty;
  final double completionRate;
  final List<Color> gradient;
  final IconData icon;

  const GameItem({
    required this.id,
    required this.name,
    required this.category,
    required this.reward,
    required this.playTime,
    required this.difficulty,
    required this.completionRate,
    required this.gradient,
    required this.icon,
  });
}

class RewardItem {
  final String id;
  final String brand;
  final String title;
  final int coins;
  final String category;
  final bool available;
  final List<Color> gradient;
  final IconData icon;

  const RewardItem({
    required this.id,
    required this.brand,
    required this.title,
    required this.coins,
    required this.category,
    required this.available,
    required this.gradient,
    required this.icon,
  });
}

class LeaderboardEntry {
  final String name;
  final int coins;
  final String avatar;
  final bool isUser;

  const LeaderboardEntry({
    required this.name,
    required this.coins,
    required this.avatar,
    this.isUser = false,
  });
}

class Achievement {
  final String id;
  final String title;
  final String subtitle;
  final IconData icon;
  final bool unlocked;
  final String tier; // common | rare | legendary

  const Achievement({
    required this.id,
    required this.title,
    required this.subtitle,
    required this.icon,
    required this.unlocked,
    required this.tier,
  });
}

class NotificationItem {
  final String id;
  final String title;
  final String body;
  final String time;
  final IconData icon;
  final Color color;

  const NotificationItem({
    required this.id,
    required this.title,
    required this.body,
    required this.time,
    required this.icon,
    required this.color,
  });
}

class Transaction {
  final String id;
  final String title;
  final int amount; // + earned, - redeemed
  final String date;

  const Transaction({
    required this.id,
    required this.title,
    required this.amount,
    required this.date,
  });
}

class Challenge {
  final String id;
  final String title;
  final String subtitle;
  final double progress;
  final int reward;
  final bool claimed;

  const Challenge({
    required this.id,
    required this.title,
    required this.subtitle,
    required this.progress,
    required this.reward,
    required this.claimed,
  });
}

class MockData {
  static int coinBalance = 1240;
  static int level = 7;
  static int xp = 640;
  static int xpMax = 1000;
  static int streak = 5;
  static String username = 'Muzammil';

  static const List<GameItem> games = [
    GameItem(id: 'spin', name: 'Spin & Win', category: 'Arcade', reward: '50 PC', playTime: '2 min', difficulty: 'Easy', completionRate: 0.82, gradient: [Color(0xFF7B3EFF), Color(0xFF9A5BFF)], icon: Icons.casino),
    GameItem(id: 'quiz', name: 'Quiz Blitz', category: 'Quiz', reward: '40 PC', playTime: '3 min', difficulty: 'Medium', completionRate: 0.64, gradient: [Color(0xFFFDBB2D), Color(0xFFFF9500)], icon: Icons.quiz),
    GameItem(id: 'sudoku', name: 'Sudoku', category: 'Puzzle', reward: '60 PC', playTime: '8 min', difficulty: 'Hard', completionRate: 0.41, gradient: [Color(0xFF34C759), Color(0xFF0AA45A)], icon: Icons.grid_4x4),
    GameItem(id: 'crossword', name: 'Crossword', category: 'Puzzle', reward: '45 PC', playTime: '6 min', difficulty: 'Medium', completionRate: 0.55, gradient: [Color(0xFF5AC8FA), Color(0xFF007AFF)], icon: Icons.grid_on),
    GameItem(id: 'memory', name: 'Memory Match', category: 'Arcade', reward: '35 PC', playTime: '2 min', difficulty: 'Easy', completionRate: 0.78, gradient: [Color(0xFFFF2D55), Color(0xFFFF5E7A)], icon: Icons.memory),
    GameItem(id: 'arkanoid', name: 'Arkanoid', category: 'Action', reward: '55 PC', playTime: '4 min', difficulty: 'Medium', completionRate: 0.49, gradient: [Color(0xFF7B3EFF), Color(0xFF00C2FF)], icon: Icons.sports_esports),
    GameItem(id: 'scratch', name: 'Scratch Card', category: 'Arcade', reward: 'Up to 100 PC', playTime: '1 min', difficulty: 'Easy', completionRate: 0.9, gradient: [Color(0xFFFDBB2D), Color(0xFF7B3EFF)], icon: Icons.celebration),
    GameItem(id: 'snake', name: 'Snake', category: 'Arcade', reward: '30 PC', playTime: '3 min', difficulty: 'Easy', completionRate: 0.71, gradient: [Color(0xFF34C759), Color(0xFF9A5BFF)], icon: Icons.pets),
    GameItem(id: '2048', name: '2048', category: 'Puzzle', reward: '50 PC', playTime: '5 min', difficulty: 'Medium', completionRate: 0.58, gradient: [Color(0xFFFF9500), Color(0xFFFDBB2D)], icon: Icons.filter_9_plus),
    GameItem(id: 'wordsearch', name: 'Word Search', category: 'Puzzle', reward: '40 PC', playTime: '4 min', difficulty: 'Easy', completionRate: 0.66, gradient: [Color(0xFF007AFF), Color(0xFF5AC8FA)], icon: Icons.search),
    GameItem(id: 'tictactoe', name: 'Tic Tac Toe', category: 'Strategy', reward: '25 PC', playTime: '2 min', difficulty: 'Easy', completionRate: 0.84, gradient: [Color(0xFF9A5BFF), Color(0xFFFF2D55)], icon: Icons.close),
  ];

  static const List<RewardItem> rewards = [
    RewardItem(id: 'amazon', brand: 'Amazon', title: '₹100 Gift Card', coins: 1000, category: 'Shopping', available: true, gradient: [Color(0xFFFF9900), Color(0xFFFFAD33)], icon: Icons.shopping_bag),
    RewardItem(id: 'flipkart', brand: 'Flipkart', title: '₹100 Gift Card', coins: 1000, category: 'Shopping', available: true, gradient: [Color(0xFF047BD6), Color(0xFF2BB3F0)], icon: Icons.shopping_cart),
    RewardItem(id: 'swiggy', brand: 'Swiggy', title: '₹150 Food Voucher', coins: 1200, category: 'Food', available: true, gradient: [Color(0xFFFC5A1D), Color(0xFFFF8A4C)], icon: Icons.restaurant),
    RewardItem(id: 'zomato', brand: 'Zomato', title: '₹150 Food Voucher', coins: 1200, category: 'Food', available: true, gradient: [Color(0xFFE23744), Color(0xFFFF5E5E)], icon: Icons.local_dining),
    RewardItem(id: 'steam', brand: 'Steam', title: '₹200 Wallet', coins: 1800, category: 'Gaming', available: false, gradient: [Color(0xFF1B2838), Color(0xFF3A6EA5)], icon: Icons.videogame_asset),
    RewardItem(id: 'gplay', brand: 'Google Play', title: '₹100 Credit', coins: 1000, category: 'Subscriptions', available: true, gradient: [Color(0xFF00C2FF), Color(0xFF007AFF)], icon: Icons.play_circle),
  ];

  static const List<String> categories = ['All', 'Trending', 'New', 'Puzzle', 'Arcade', 'Quiz', 'Action', 'Strategy'];

  static const List<LeaderboardEntry> leaderboard = [
    LeaderboardEntry(name: 'Aarav', coins: 8420, avatar: 'A'),
    LeaderboardEntry(name: 'Diya', coins: 7650, avatar: 'D'),
    LeaderboardEntry(name: 'Kabir', coins: 6980, avatar: 'K'),
    LeaderboardEntry(name: 'Muzammil', coins: 1240, avatar: 'M', isUser: true),
    LeaderboardEntry(name: 'Anaya', coins: 1120, avatar: 'A'),
    LeaderboardEntry(name: 'Vivaan', coins: 980, avatar: 'V'),
    LeaderboardEntry(name: 'Saanvi', coins: 870, avatar: 'S'),
  ];

  static const List<Achievement> achievements = [
    Achievement(id: 'a1', title: 'First Win', subtitle: 'Win your first game', icon: Icons.emoji_events, unlocked: true, tier: 'common'),
    Achievement(id: 'a2', title: 'Coin Hoarder', subtitle: 'Earn 1,000 PC', icon: Icons.savings, unlocked: true, tier: 'rare'),
    Achievement(id: 'a3', title: 'Streak Master', subtitle: '7-day streak', icon: Icons.local_fire_department, unlocked: true, tier: 'rare'),
    Achievement(id: 'a4', title: 'Quiz Champion', subtitle: 'Top quiz score', icon: Icons.military_tech, unlocked: false, tier: 'legendary'),
    Achievement(id: 'a5', title: 'Night Owl', subtitle: 'Play after midnight', icon: Icons.nightlight, unlocked: false, tier: 'common'),
    Achievement(id: 'a6', title: 'Legend', subtitle: 'Reach level 20', icon: Icons.workspace_premium, unlocked: false, tier: 'legendary'),
  ];

  static const List<NotificationItem> notifications = [
    NotificationItem(id: 'n1', title: 'Reward earned', body: 'You earned 50 PC from Spin & Win', time: '2m', icon: Icons.stars, color: AppColors.accentGold),
    NotificationItem(id: 'n2', title: 'Challenge complete', body: 'Daily goal unlocked!', time: '1h', icon: Icons.task_alt, color: AppColors.success),
    NotificationItem(id: 'n3', title: 'New reward', body: 'Swiggy ₹150 voucher is now live', time: '3h', icon: Icons.card_giftcard, color: AppColors.primary),
    NotificationItem(id: 'n4', title: 'Leaderboard', body: 'You moved up 2 spots!', time: '1d', icon: Icons.leaderboard, color: AppColors.secondaryPurple),
  ];

  static const List<Transaction> transactions = [
    Transaction(id: 't1', title: 'Spin & Win', amount: 50, date: 'Today'),
    Transaction(id: 't2', title: 'Redeemed Amazon', amount: -1000, date: 'Yesterday'),
    Transaction(id: 't3', title: 'Quiz Blitz', amount: 40, date: 'Yesterday'),
    Transaction(id: 't4', title: 'Daily bonus', amount: 10, date: '2d'),
    Transaction(id: 't5', title: 'Crossword', amount: 45, date: '3d'),
  ];

  static const List<Challenge> challenges = [
    Challenge(id: 'c1', title: 'Daily Spin', subtitle: 'Play Spin & Win once', progress: 1.0, reward: 10, claimed: false),
    Challenge(id: 'c2', title: 'Puzzle Streak', subtitle: 'Complete 3 puzzles', progress: 0.66, reward: 30, claimed: false),
    Challenge(id: 'c3', title: 'Weekly Warrior', subtitle: 'Earn 500 PC this week', progress: 0.4, reward: 100, claimed: false),
  ];

  static List<int> get monthlyHistory => List.generate(7, (i) => 200 + Random(i * 7).nextInt(900));
}
