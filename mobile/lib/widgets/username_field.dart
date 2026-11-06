import 'dart:async';
import 'package:flutter/material.dart';
import '../core/theme/app_colors.dart';
import '../core/theme/app_dimensions.dart';
import '../services/api_service.dart';

class UsernameField extends StatefulWidget {
  final TextEditingController controller;
  final String? initialValue;
  final String? currentUsername;
  final ValueChanged<bool>? onValidationChanged;

  const UsernameField({
    super.key,
    required this.controller,
    this.initialValue,
    this.currentUsername,
    this.onValidationChanged,
  });

  @override
  State<UsernameField> createState() => _UsernameFieldState();
}

enum _Status { idle, checking, available, taken, error }

class _UsernameFieldState extends State<UsernameField> {
  _Status _status = _Status.idle;
  String? _message;
  Timer? _debounce;

  @override
  void initState() {
    super.initState();
    if (widget.initialValue != null) {
      widget.controller.text = widget.initialValue!;
    }
    widget.controller.addListener(_onChanged);
  }

  @override
  void dispose() {
    _debounce?.cancel();
    widget.controller.removeListener(_onChanged);
    super.dispose();
  }

  void _onChanged() {
    _debounce?.cancel();
    final value = widget.controller.text.trim().toLowerCase();

    // Empty or same as current
    if (value.isEmpty) {
      _update(_Status.idle, null);
      return;
    }
    if (value == widget.currentUsername?.toLowerCase()) {
      _update(_Status.idle, null);
      return;
    }

    // Basic format validation
    if (value.length < 3) {
      _update(_Status.error, 'Must be at least 3 characters');
      return;
    }
    if (!RegExp(r'^[a-z0-9_]+$').hasMatch(value)) {
      _update(_Status.error, 'Only lowercase letters, numbers, and underscores');
      return;
    }

    // Debounced API check
    _update(_Status.checking, null);
    _debounce = Timer(const Duration(milliseconds: 300), () => _checkAvailability(value));
  }

  Future<void> _checkAvailability(String username) async {
    try {
      final data = await ApiService.post('/pauth/check-username', {'username': username}, auth: false);
      final available = data['available'] == true;
      _update(
        available ? _Status.available : _Status.taken,
        available ? 'Username available' : (data['message']?.toString() ?? 'Username already taken'),
      );
    } catch (_) {
      _update(_Status.error, 'Could not check availability');
    }
  }

  void _update(_Status status, String? message) {
    if (!mounted) return;
    setState(() {
      _status = status;
      _message = message;
    });
    widget.onValidationChanged?.call(status == _Status.available || status == _Status.idle);
  }

  @override
  Widget build(BuildContext context) {
    return TextField(
      controller: widget.controller,
      decoration: InputDecoration(
        labelText: 'Username',
        filled: true,
        fillColor: Colors.white,
        border: OutlineInputBorder(borderRadius: BorderRadius.circular(AppRadius.button)),
        suffixIcon: _buildSuffix(),
        helperText: _message,
        helperStyle: TextStyle(
          color: _status == _Status.available
              ? AppColors.success
              : _status == _Status.taken || _status == _Status.error
                  ? AppColors.danger
                  : AppColors.textSecondary,
          fontSize: 12,
        ),
      ),
    );
  }

  Widget? _buildSuffix() {
    switch (_status) {
      case _Status.checking:
        return const Padding(
          padding: EdgeInsets.all(12),
          child: SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2)),
        );
      case _Status.available:
        return const Icon(Icons.check_circle, color: AppColors.success);
      case _Status.taken:
      case _Status.error:
        return const Icon(Icons.cancel, color: AppColors.danger);
      case _Status.idle:
        return null;
    }
  }
}
