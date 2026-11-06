import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'api_service.dart';
import '../models/user.dart';

class AuthService extends ChangeNotifier {
  User? _user;
  String? _role; // 'player' | 'admin' | 'business_owner' | 'internal_team'
  bool _isBranch = false; // business_owner with parent_id (branch/franchise)
  bool _loading = false;
  String? _error;
  String? _pendingEmail;
  String? _tempToken;

  User? get user => _user;
  String? get role => _role;
  bool get isLoggedIn => _user != null || _role != null;
  bool get isPlayer => _role == 'player' && _user != null;
  bool get loading => _loading;
  String? get error => _error;
  String? get pendingEmail => _pendingEmail;
  String? get tempToken => _tempToken;

  // In-app dashboard route for the current role
  String get dashboardRoute {
    switch (_role) {
      case 'admin':
        return '/admin';
      case 'internal_team':
        return '/it';
      case 'business_owner':
        return _isBranch ? '/franchise' : '/bo';
      case 'player':
      default:
        return '/home';
    }
  }

  void clearError() {
    _error = null;
    notifyListeners();
  }

  void setError(String msg) {
    _error = msg;
    notifyListeners();
  }

  void setPendingEmail(String email) {
    _pendingEmail = email;
    notifyListeners();
  }

  void setTempToken(String token) {
    _tempToken = token;
    notifyListeners();
  }

  // POST /api/pauth/check-email → returns type
  Future<String> checkEmail(String email) async {
    _loading = true;
    _error = null;
    notifyListeners();
    try {
      final data = await ApiService.post('/pauth/check-email', {'email': email}, auth: false);
      _pendingEmail = email;
      _loading = false;
      notifyListeners();
      return data['type'] ?? 'new';
    } catch (e) {
      _error = _msg(e);
      _loading = false;
      notifyListeners();
      rethrow;
    }
  }

  // POST /api/pauth/send-otp
  Future<void> sendOtp(String email) async {
    _loading = true;
    _error = null;
    notifyListeners();
    try {
      await ApiService.post('/pauth/send-otp', {'email': email}, auth: false);
      _loading = false;
      notifyListeners();
    } catch (e) {
      _error = _msg(e);
      _loading = false;
      notifyListeners();
      rethrow;
    }
  }

  // POST /api/pauth/verify-otp → returns 'player' or 'new'
  Future<String> verifyOtp(String email, String otp) async {
    _loading = true;
    _error = null;
    notifyListeners();
    try {
      final data = await ApiService.post(
        '/pauth/verify-otp',
        {'email': email, 'otp': otp},
        auth: false,
      );
      if (data['type'] == 'player') {
        await _storePlayer(data['token'], data['player']);
        _loading = false;
        notifyListeners();
        return 'player';
      } else {
        _tempToken = data['tempToken'];
        _loading = false;
        notifyListeners();
        return 'new';
      }
    } catch (e) {
      _error = _msg(e);
      _loading = false;
      notifyListeners();
      rethrow;
    }
  }

  // POST /api/pauth/register
  Future<void> register({
    required String name,
    required String username,
    String? dob,
    String? whatsapp,
    String? city,
    String? pincode,
    String? avatarId,
  }) async {
    _loading = true;
    _error = null;
    notifyListeners();
    try {
      final data = await ApiService.post(
        '/pauth/register',
        {
          'tempToken': _tempToken,
          'name': name,
          'username': username,
          'dob': dob,
          'whatsapp': whatsapp,
          'city': city,
          'pincode': pincode,
          'avatar_id': avatarId ?? 'av-3',
        },
        auth: false,
      );
      await _storePlayer(data['token'], data['player']);
      _loading = false;
      notifyListeners();
    } catch (e) {
      _error = _msg(e);
      _loading = false;
      notifyListeners();
      rethrow;
    }
  }

  // POST /api/auth/login (admin)
  Future<void> loginAdmin(String email, String password) async {
    _loading = true;
    _error = null;
    notifyListeners();
    try {
      final data = await ApiService.post(
        '/auth/login',
        {'email': email, 'password': password},
        auth: false,
      );
      await _storeStaff('admin', data['token'], data['user']);
      _loading = false;
      notifyListeners();
    } catch (e) {
      _error = _msg(e);
      _loading = false;
      notifyListeners();
      rethrow;
    }
  }

  // POST /api/business/login (brand / branch owner)
  Future<void> loginBusiness(String email, String password) async {
    _loading = true;
    _error = null;
    notifyListeners();
    try {
      final data = await ApiService.post(
        '/business/login',
        {'business_name': email, 'password': password},
        auth: false,
      );
      await _storeStaff('business_owner', data['token'], data['bo']);
      _loading = false;
      notifyListeners();
    } catch (e) {
      _error = _msg(e);
      _loading = false;
      notifyListeners();
      rethrow;
    }
  }

  // POST /api/internal-team/login
  Future<void> loginInternal(String email, String password) async {
    _loading = true;
    _error = null;
    notifyListeners();
    try {
      final data = await ApiService.post(
        '/internal-team/login',
        {'email': email, 'password': password},
        auth: false,
      );
      await _storeStaff('internal_team', data['token'], data['member']);
      _loading = false;
      notifyListeners();
    } catch (e) {
      _error = _msg(e);
      _loading = false;
      notifyListeners();
      rethrow;
    }
  }

  Future<void> _storePlayer(String token, Map<String, dynamic> player) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('auth_token', token);
    await prefs.setString('auth_role', 'player');
    await prefs.setString('auth_user', jsonEncode(player));
    _role = 'player';
    _user = User.fromJson(player);
  }

  Future<void> _storeStaff(String role, String token, Map<String, dynamic> data) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('auth_token', token);
    await prefs.setString('auth_role', role);
    await prefs.setString('auth_user', jsonEncode(data));
    _role = role;
    _isBranch = role == 'business_owner' && data['parent_id'] != null;
    _user = null;
  }

  Future<void> checkSession() async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('auth_token');
    final role = prefs.getString('auth_role');
    final userJson = prefs.getString('auth_user');
    _role = role;
    if (role == 'business_owner' && userJson != null) {
      try {
        final decoded = jsonDecode(userJson) as Map<String, dynamic>;
        _isBranch = decoded['parent_id'] != null;
      } catch (_) {
        _isBranch = false;
      }
    }
    if (token != null && role == 'player') {
      try {
        final data = await ApiService.get('/pauth/me');
        _user = User.fromJson(data['player']);
        notifyListeners();
      } catch (_) {
        await logout();
      }
    } else {
      notifyListeners();
    }
  }

  Future<void> logout() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('auth_token');
    await prefs.remove('auth_role');
    await prefs.remove('auth_user');
    _user = null;
    _role = null;
    _tempToken = null;
    _pendingEmail = null;
    notifyListeners();
  }

  String _msg(dynamic e) => e is ApiException ? e.message : e.toString();
}
