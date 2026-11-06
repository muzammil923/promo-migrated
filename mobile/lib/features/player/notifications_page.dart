import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_dimensions.dart';
import '../../core/data/mock_data.dart';
import '../../core/widgets/states.dart';

class NotificationsPage extends StatelessWidget {
  const NotificationsPage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(title: const Text('Notifications', style: TextStyle(fontWeight: FontWeight.bold)), leading: BackButton(onPressed: () => context.pop())),
      body: SafeArea(
        child: MockData.notifications.isEmpty
            ? const EmptyState(icon: Icons.notifications_off, title: 'No notifications', subtitle: 'You\'re all caught up')
            : ListView.separated(
                padding: const EdgeInsets.all(AppSpace.lg),
                itemCount: MockData.notifications.length,
                separatorBuilder: (_, __) => const SizedBox(height: 12),
                itemBuilder: (_, i) {
                  final n = MockData.notifications[i];
                  return Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(AppRadius.card), boxShadow: AppShadow.card),
                    child: Row(children: [
                      Container(width: 44, height: 44, decoration: BoxDecoration(color: n.color.withAlpha(18), borderRadius: BorderRadius.circular(14)), child: Icon(n.icon, color: n.color)),
                      const SizedBox(width: 14),
                      Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                        Text(n.title, style: const TextStyle(fontWeight: FontWeight.bold)),
                        const SizedBox(height: 2),
                        Text(n.body, style: const TextStyle(color: AppColors.textSecondary, fontSize: 13)),
                      ])),
                      Text(n.time, style: const TextStyle(color: AppColors.textSecondary, fontSize: 12)),
                    ]),
                  );
                },
              ),
      ),
    );
  }
}
