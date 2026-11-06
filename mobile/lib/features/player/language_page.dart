import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_dimensions.dart';

class LanguagePage extends StatefulWidget {
  const LanguagePage({super.key});

  @override
  State<LanguagePage> createState() => _LanguagePageState();
}

class _LanguagePageState extends State<LanguagePage> {
  String _selected = 'English';
  bool _loading = true;

  static const _languages = [
    'English', 'Spanish', 'French', 'German', 'Hindi',
    'Japanese', 'Korean', 'Portuguese', 'Chinese', 'Arabic',
  ];

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final prefs = await SharedPreferences.getInstance();
    setState(() {
      _selected = prefs.getString('app_language') ?? 'English';
      _loading = false;
    });
  }

  Future<void> _select(String lang) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('app_language', lang);
    setState(() => _selected = lang);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Language', style: TextStyle(fontWeight: FontWeight.bold)),
        leading: BackButton(onPressed: () => context.pop()),
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : SafeArea(
              child: Padding(
                padding: const EdgeInsets.all(AppSpace.lg),
                child: Container(
                  decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(AppRadius.card), boxShadow: AppShadow.card),
                  child: ListView.separated(
                    itemCount: _languages.length,
                    separatorBuilder: (_, __) => const Divider(height: 1),
                    itemBuilder: (_, i) {
                      final lang = _languages[i];
                      final selected = lang == _selected;
                      return ListTile(
                        title: Text(lang, style: TextStyle(fontWeight: selected ? FontWeight.bold : FontWeight.w500)),
                        trailing: selected ? const Icon(Icons.check_circle, color: AppColors.primary) : null,
                        onTap: () => _select(lang),
                      );
                    },
                  ),
                ),
              ),
            ),
    );
  }
}
