import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import 'package:fl_chart/fl_chart.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_dimensions.dart';
import '../../core/data/mock_data.dart';
import '../../services/player_provider.dart';
import '../../core/widgets/app_button.dart';

class WalletPage extends StatelessWidget {
  const WalletPage({super.key});

  @override
  Widget build(BuildContext context) {
    final prov = context.watch<PlayerProvider>();
    final balance = prov.pcBalance;
    final txs = prov.transactions;
    final history = MockData.monthlyHistory;
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(title: const Text('Wallet', style: TextStyle(fontWeight: FontWeight.bold)), leading: BackButton(onPressed: () => context.pop())),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(AppSpace.lg),
          child: Column(
            children: [
              Container(
                padding: const EdgeInsets.all(AppSpace.lg),
                decoration: BoxDecoration(gradient: AppColors.goldGradient, borderRadius: BorderRadius.circular(AppRadius.card), boxShadow: AppShadow.soft),
                child: Column(children: [
                  const Text('Current Balance', style: TextStyle(color: Colors.black87, fontSize: 14)),
                  const SizedBox(height: 6),
                  Row(mainAxisAlignment: MainAxisAlignment.center, children: [
                    const CoinIcon(size: 34),
                    const SizedBox(width: 10),
                    Text('$balance PC', style: const TextStyle(color: Colors.white, fontSize: 34, fontWeight: FontWeight.bold)),
                  ]),
                  const SizedBox(height: 6),
                  Text('${txs.length} transactions', style: const TextStyle(color: Colors.black54, fontSize: 13)),
                ]),
              ),
              const SizedBox(height: AppSpace.lg),
              Container(
                padding: const EdgeInsets.all(AppSpace.lg),
                decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(AppRadius.card), boxShadow: AppShadow.card),
                child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  const Text('Monthly Activity', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                  const SizedBox(height: 14),
                  SizedBox(
                    height: 180,
                    child: BarChart(
                      BarChartData(
                        gridData: const FlGridData(show: false),
                        borderData: FlBorderData(show: false),
                        titlesData: FlTitlesData(
                          leftTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
                          topTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
                          rightTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
                          bottomTitles: AxisTitles(sideTitles: SideTitles(showTitles: true, getTitlesWidget: (v, _) => Text(['M','T','W','T','F','S','S'][v.toInt() % 7], style: const TextStyle(fontSize: 10, color: AppColors.textSecondary)))),
                        ),
                        barGroups: history.asMap().entries.map((e) => BarChartGroupData(x: e.key, barRods: [
                          BarChartRodData(toY: e.value.toDouble(), width: 16, borderRadius: BorderRadius.circular(8), gradient: AppColors.primaryGradient),
                        ])).toList(),
                      ),
                    ),
                  ),
                ]),
              ),
              const SizedBox(height: AppSpace.lg),
              Container(
                decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(AppRadius.card), boxShadow: AppShadow.card),
                child: txs.isEmpty
                  ? const Padding(
                      padding: EdgeInsets.all(24),
                      child: Center(child: Text('No transactions yet', style: TextStyle(color: AppColors.textSecondary))),
                    )
                  : Column(
                  children: txs.map((t) => ListTile(
                    leading: Icon((t['points'] ?? 0) > 0 ? Icons.add_circle : Icons.remove_circle, color: (t['points'] ?? 0) > 0 ? AppColors.success : AppColors.danger),
                    title: Text(t['note']?.toString() ?? ''),
                    subtitle: Text(t['created_at']?.toString() ?? ''),
                    trailing: Text('${(t['points'] ?? 0) > 0 ? '+' : ''}${t['points'] ?? 0} PC', style: TextStyle(fontWeight: FontWeight.bold, color: (t['points'] ?? 0) > 0 ? AppColors.success : AppColors.danger)),
                  )).toList(),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
