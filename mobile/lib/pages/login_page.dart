import 'dart:ui' as ui;
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../services/auth_service.dart';
import '../services/api_service.dart';

// Steps mirror the webapp LoginPage exactly
const String _kEmail = 'email';
const String _kPassword = 'password';
const String _kOtp = 'otp';
const String _kRegister = 'register';

// Avatar options mirrored from the webapp AvatarData (av-1 .. av-6)
const List<Map<String, dynamic>> _kAvatars = [
  {'id': 'av-1', 'colors': [Color(0xfff97316), Color(0xffdc2626)]},
  {'id': 'av-2', 'colors': [Color(0xffec4899), Color(0xff8b5cf6)]},
  {'id': 'av-3', 'colors': [Color(0xff6366f1), Color(0xff0ea5e9)]},
  {'id': 'av-4', 'colors': [Color(0xff14b8a6), Color(0xff22d3ee)]},
  {'id': 'av-5', 'colors': [Color(0xfff59e0b), Color(0xfff97316)]},
  {'id': 'av-6', 'colors': [Color(0xff8b5cf6), Color(0xffec4899)]},
];

class LoginPage extends StatefulWidget {
  const LoginPage({super.key});

  @override
  State<LoginPage> createState() => _LoginPageState();
}

class _LoginPageState extends State<LoginPage> {
  final emailCtrl = TextEditingController();
  final passwordCtrl = TextEditingController();
  final nameCtrl = TextEditingController();
  final usernameCtrl = TextEditingController();
  final dobCtrl = TextEditingController();
  final whatsappCtrl = TextEditingController();
  final cityCtrl = TextEditingController();
  final pincodeCtrl = TextEditingController();
  final List<TextEditingController> otpCtrls =
      List.generate(4, (_) => TextEditingController());
  final List<FocusNode> otpNodes = List.generate(4, (_) => FocusNode());

  String step = _kEmail;
  String? passwordRole; // 'admin' | 'business' | 'it'
  bool showPassword = false;
  int resendCd = 0;

  String usernameStatus = '';
  String usernameMsg = '';

  @override
  void dispose() {
    emailCtrl.dispose();
    passwordCtrl.dispose();
    nameCtrl.dispose();
    usernameCtrl.dispose();
    dobCtrl.dispose();
    whatsappCtrl.dispose();
    cityCtrl.dispose();
    pincodeCtrl.dispose();
    for (final c in otpCtrls) {
      c.dispose();
    }
    for (final n in otpNodes) {
      n.dispose();
    }
    super.dispose();
  }

  String get otpValue =>
      otpCtrls.map((c) => c.text).join();

  void _clearError() => context.read<AuthService>().clearError();

  // ── EMAIL STEP ───────────────────────────────────────────────────────────
  Future<void> _handleEmailSubmit() async {
    final email = emailCtrl.text.trim();
    if (email.isEmpty) return _setError('Please enter your email');
    if (!RegExp(r'^[^\s@]+@[^\s@]+\.[^\s@]+$').hasMatch(email)) {
      return _setError('Please enter a valid email address');
    }
    _clearError();
    final auth = context.read<AuthService>();
    try {
      final type = await auth.checkEmail(email);
      if (type == 'admin') {
        setState(() => step = _kPassword);
        passwordRole = 'admin';
      } else if (type == 'business_owner') {
        setState(() => step = _kPassword);
        passwordRole = 'business';
      } else if (type == 'internal_team') {
        setState(() => step = _kPassword);
        passwordRole = 'it';
      } else {
        await auth.sendOtp(email);
        _startCountdown();
        setState(() => step = _kOtp);
      }
    } catch (_) {
      // error already stored in auth
    }
  }

  // ── PASSWORD STEP (staff → web dashboard) ────────────────────────────────
  Future<void> _handlePasswordSubmit() async {
    final auth = context.read<AuthService>();
    final email = emailCtrl.text.trim();
    final pw = passwordCtrl.text;
    if (pw.isEmpty) {
      return _setError(passwordRole == 'business' || passwordRole == 'it'
          ? 'Please enter your phone number'
          : 'Please enter your password');
    }
    if (passwordRole == 'it' && !RegExp(r'^\d{10}$').hasMatch(pw)) {
      return _setError('Phone number must be exactly 10 digits');
    }
    _clearError();
    try {
      if (passwordRole == 'admin') {
        await auth.loginAdmin(email, pw);
      } else if (passwordRole == 'business') {
        await auth.loginBusiness(email, pw);
      } else {
        await auth.loginInternal(email, pw);
      }
      // Staff dashboards live inside the app — navigate to the role's dashboard
      if (mounted) {
        context.go(context.read<AuthService>().dashboardRoute);
      }
    } catch (_) {
      // error stored in auth
    }
  }

  // ── OTP STEP ─────────────────────────────────────────────────────────────
  Future<void> _handleOtpSubmit() async {
    if (otpValue.length < 4) return _setError('Enter the 4-digit code');
    _clearError();
    final auth = context.read<AuthService>();
    try {
      final type = await auth.verifyOtp(emailCtrl.text.trim(), otpValue);
      if (type == 'player') {
        if (mounted) context.go('/home');
      } else {
        setState(() => step = _kRegister);
      }
    } catch (_) {
      for (final c in otpCtrls) {
        c.clear();
      }
      otpNodes.first.requestFocus();
    }
  }

  Future<void> _handleResend() async {
    if (resendCd > 0) return;
    _clearError();
    for (final c in otpCtrls) {
      c.clear();
    }
    try {
      await context.read<AuthService>().sendOtp(emailCtrl.text.trim());
      _startCountdown();
    } catch (_) {
      // error stored in auth
    }
  }

  void _startCountdown() {
    setState(() => resendCd = 30);
    Future.doWhile(() async {
      await Future.delayed(const Duration(seconds: 1));
      if (!mounted) return false;
      if (resendCd <= 1) {
        setState(() => resendCd = 0);
        return false;
      }
      setState(() => resendCd -= 1);
      return true;
    });
  }

  // ── REGISTER STEP ────────────────────────────────────────────────────────
  void _checkUsername() {
    final val = usernameCtrl.text.trim().toLowerCase();
    if (val.length < 3) {
      setState(() {
        usernameStatus = '';
        usernameMsg = val.isNotEmpty ? 'At least 3 characters' : '';
      });
      return;
    }
    if (!RegExp(r'^[a-z0-9_]+$').hasMatch(val)) {
      setState(() {
        usernameStatus = '';
        usernameMsg = 'Only lowercase, numbers and _';
      });
      return;
    }
    setState(() {
      usernameStatus = 'checking';
      usernameMsg = '';
    });
    Future.delayed(const Duration(milliseconds: 500), () async {
      if (!mounted) return;
      try {
        final data = await ApiService.post(
          '/pauth/check-username',
          {'username': val},
          auth: false,
        );
        if (!mounted) return;
        setState(() {
          usernameStatus = data['available'] ? 'available' : 'taken';
          usernameMsg = data['available'] ? 'Available!' : 'Already taken';
        });
      } catch (_) {
        if (mounted) setState(() => usernameStatus = '');
      }
    });
  }

  Future<void> _handleRegister() async {
    final auth = context.read<AuthService>();
    if (nameCtrl.text.trim().isEmpty) return _setError('Name is required');
    final uname = usernameCtrl.text.trim().toLowerCase();
    if (uname.length < 3) return _setError('Username must be at least 3 characters');
    if (!RegExp(r'^[a-z0-9_]+$').hasMatch(uname)) {
      return _setError('Only lowercase letters, numbers and underscores');
    }
    if (usernameStatus == 'taken') return _setError('Username is already taken');
    if (usernameStatus == 'checking') return _setError('Checking username…');
    _clearError();
    try {
      await auth.register(
        name: nameCtrl.text.trim(),
        username: uname,
        dob: dobCtrl.text.isEmpty ? null : dobCtrl.text,
        whatsapp: whatsappCtrl.text.isEmpty ? null : whatsappCtrl.text,
        city: cityCtrl.text.isEmpty ? null : cityCtrl.text,
        pincode: pincodeCtrl.text.isEmpty ? null : pincodeCtrl.text,
        avatarId: _selectedAvatar,
      );
      if (mounted) context.go('/home');
    } catch (_) {
      // error stored in auth
    }
  }

  String _selectedAvatar = 'av-3';

  void _setError(String msg) {
    context.read<AuthService>().setError(msg);
  }

  // ── BUILD ────────────────────────────────────────────────────────────────
  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthService>();
    final pct = {
      _kEmail: 15,
      _kOtp: 55,
      _kPassword: 70,
      _kRegister: 88,
    }[step] ?? 0;

    return Scaffold(
      body: Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [
              Color(0xFF0d0a1a),
              Color(0xFF1a0e2e),
              Color(0xFF0f0b1e),
              Color(0xFF080612),
            ],
          ),
        ),
        child: SafeArea(
          child: Center(
            child: SingleChildScrollView(
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 20),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  _buildGlassCard(auth, pct),
                  const SizedBox(height: 24),
                  Text(
                    'Secured by PromoGames',
                    style: TextStyle(
                        color: Colors.white.withAlpha(35),
                        fontSize: 11,
                        fontWeight: FontWeight.w600,
                        letterSpacing: 1),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildGlassCard(AuthService auth, int pct) {
    return ClipRRect(
      borderRadius: BorderRadius.circular(28),
      child: Stack(
        children: [
          Positioned.fill(
            child: ClipRRect(
              borderRadius: BorderRadius.circular(28),
              child: BackdropFilter(
                filter: ui.ImageFilter.blur(sigmaX: 30, sigmaY: 30),
                child: Container(color: Colors.transparent),
              ),
            ),
          ),
          Container(
            width: double.infinity,
            padding: const EdgeInsets.symmetric(vertical: 36, horizontal: 28),
            decoration: BoxDecoration(
              color: const Color(0x7A120a22),
              borderRadius: BorderRadius.circular(28),
              border: Border.all(
                color: const Color(0x357c3aed),
                width: 1.2,
              ),
              boxShadow: [
                BoxShadow(
                  color: const Color(0x307c3aed),
                  blurRadius: 80,
                  spreadRadius: 5,
                ),
                BoxShadow(
                  color: Colors.black.withAlpha(140),
                  blurRadius: 60,
                  offset: const Offset(0, 30),
                ),
              ],
            ),
            child: Column(
              children: [
                // progress bar
                Container(
                  height: 3,
                  margin: const EdgeInsets.only(bottom: 24),
                  decoration: BoxDecoration(
                    color: Colors.white.withAlpha(20),
                    borderRadius: BorderRadius.circular(2),
                  ),
                  child: Row(
                    children: [
                      Container(
                        width: (MediaQuery.of(context).size.width - 112) * pct / 100,
                        decoration: BoxDecoration(
                          gradient: const LinearGradient(
                            colors: [Color(0xFF8b5cf6), Color(0xFFa78bfa)],
                          ),
                          borderRadius: BorderRadius.circular(2),
                        ),
                      ),
                    ],
                  ),
                ),
                // logo
                Container(
                  width: 56,
                  height: 56,
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(16),
                    boxShadow: const [
                      BoxShadow(
                        color: Color(0x447c3aed),
                        blurRadius: 40,
                        spreadRadius: 5,
                      ),
                    ],
                  ),
                  child: ClipRRect(
                    borderRadius: BorderRadius.circular(16),
                    child: Image.asset('assets/favicon.png',
                        width: 56, height: 56, fit: BoxFit.cover),
                  ),
                ),
                const SizedBox(height: 12),
                const Text('PromoGames',
                    style: TextStyle(
                        color: Color(0xFFf0ecff),
                        fontSize: 22,
                        fontWeight: FontWeight.w800,
                        letterSpacing: -0.5)),
                const SizedBox(height: 20),

                if (auth.error != null)
                  Padding(
                    padding: const EdgeInsets.only(bottom: 12),
                    child: Container(
                      width: double.infinity,
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: const Color(0x0Fef4444),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: const Color(0x1Fef4444)),
                      ),
                      child: Row(
                        children: [
                          const Icon(Icons.warning_amber_rounded,
                              color: Color(0xFFfca5a5), size: 16),
                          const SizedBox(width: 8),
                          Expanded(
                            child: Text(auth.error!,
                                style: const TextStyle(
                                    color: Color(0xFFfca5a5),
                                    fontSize: 13,
                                    fontWeight: FontWeight.w600)),
                          ),
                        ],
                      ),
                    ),
                  ),

                if (step == _kEmail) _emailStep(auth),
                if (step == _kOtp) _otpStep(auth),
                if (step == _kRegister) _registerStep(auth),
                if (step == _kPassword) _passwordStep(auth),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _emailStep(AuthService auth) {
    return Column(
      children: [
        const Text('Welcome back',
            style: TextStyle(
                color: Color(0xFFf0ecff),
                fontSize: 24,
                fontWeight: FontWeight.w800,
                letterSpacing: -0.5)),
        const SizedBox(height: 6),
        Text('Enter your email to get started',
            style: TextStyle(
                color: const Color(0xFFb0a0d0),
                fontSize: 13,
                fontWeight: FontWeight.w400)),
        const SizedBox(height: 24),
        _field(
          controller: emailCtrl,
          icon: Icons.email_outlined,
          hint: 'you@example.com',
          label: 'Email Address',
          keyboardType: TextInputType.emailAddress,
          onChanged: (_) => _clearError(),
          onSubmitted: (_) => _handleEmailSubmit(),
        ),
        const SizedBox(height: 20),
        _primaryButton(
          auth.loading || emailCtrl.text.trim().isEmpty
              ? null
              : () => _handleEmailSubmit(),
          auth.loading,
          'Continue →',
        ),
      ],
    );
  }

  Widget _passwordStep(AuthService auth) {
    final isStaffPhone = passwordRole == 'business' || passwordRole == 'it';
    final IconData icon;
    final String title;
    final String subtitle;
    if (passwordRole == 'admin') {
      icon = Icons.shield_outlined;
      title = 'Admin Login';
      subtitle = emailCtrl.text.trim();
    } else if (passwordRole == 'business') {
      icon = Icons.business_outlined;
      title = 'Business Owner';
      subtitle = emailCtrl.text.trim();
    } else {
      icon = Icons.build_outlined;
      title = 'Internal Team';
      subtitle = emailCtrl.text.trim();
    }

    return Column(
      children: [
        Align(
          alignment: Alignment.centerLeft,
          child: TextButton.icon(
            onPressed: () {
              passwordCtrl.clear();
              _clearError();
              setState(() => step = _kEmail);
            },
            icon: Icon(Icons.arrow_back_ios,
                size: 14, color: Colors.white.withAlpha(150)),
            label: Text('Back',
                style: TextStyle(
                    color: Colors.white.withAlpha(150),
                    fontSize: 13,
                    fontWeight: FontWeight.w600)),
          ),
        ),
        Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: Colors.white.withAlpha(20),
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: Colors.white.withAlpha(40)),
          ),
          child: Row(
            children: [
              Container(
                width: 44,
                height: 44,
                decoration: BoxDecoration(
                  color: const Color(0x1A7c3aed),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(icon, color: const Color(0xFFa78bfa)),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(title,
                        style: const TextStyle(
                            color: Color(0xFFf0ecff),
                            fontSize: 15,
                            fontWeight: FontWeight.w700)),
                    Text(subtitle,
                        style: const TextStyle(
                            color: Color(0xFFa78bfa),
                            fontSize: 12,
                            fontWeight: FontWeight.w600)),
                  ],
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 22),
        _field(
          controller: passwordCtrl,
          icon: Icons.lock_outline,
          hint: isStaffPhone ? 'Enter your phone number' : '••••••••',
          label: isStaffPhone ? 'Password (Phone Number)' : 'Password',
          obscure: !showPassword,
          suffix: IconButton(
            icon: Icon(
              showPassword ? Icons.visibility_off_outlined : Icons.visibility_outlined,
              color: const Color(0x66b0a0d0),
              size: 20,
            ),
            onPressed: () => setState(() => showPassword = !showPassword),
          ),
          onChanged: (_) => _clearError(),
          onSubmitted: (_) => _handlePasswordSubmit(),
        ),
        const SizedBox(height: 20),
        _primaryButton(
          auth.loading || passwordCtrl.text.isEmpty
              ? null
              : () => _handlePasswordSubmit(),
          auth.loading,
          'Sign In →',
        ),
      ],
    );
  }

  Widget _otpStep(AuthService auth) {
    return Column(
      children: [
        Align(
          alignment: Alignment.centerLeft,
          child: TextButton.icon(
            onPressed: () {
              for (final c in otpCtrls) {
                c.clear();
              }
              _clearError();
              setState(() => step = _kEmail);
            },
            icon: Icon(Icons.arrow_back_ios,
                size: 14, color: Colors.white.withAlpha(150)),
            label: Text('Back',
                style: TextStyle(
                    color: Colors.white.withAlpha(150),
                    fontSize: 13,
                    fontWeight: FontWeight.w600)),
          ),
        ),
        const Text('Check your email',
            style: TextStyle(
                color: Color(0xFFf0ecff),
                fontSize: 24,
                fontWeight: FontWeight.w800,
                letterSpacing: -0.5)),
        const SizedBox(height: 6),
        const Text('We sent a 4-digit code to',
            style: TextStyle(
                color: Color(0xFFb0a0d0), fontSize: 13, fontWeight: FontWeight.w400)),
        const SizedBox(height: 8),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 5),
          decoration: BoxDecoration(
            color: Colors.white.withAlpha(40),
            borderRadius: BorderRadius.circular(100),
            border: Border.all(color: Colors.white.withAlpha(60)),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(Icons.email_outlined, size: 14, color: Color(0xFFa78bfa)),
              const SizedBox(width: 6),
              Text(emailCtrl.text.trim(),
                  style: const TextStyle(
                      color: Color(0xFFf0ecff),
                      fontSize: 13,
                      fontWeight: FontWeight.w600)),
            ],
          ),
        ),
        const SizedBox(height: 24),
        Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: List.generate(4, (i) => _otpBox(i)),
        ),
        const SizedBox(height: 24),
        _primaryButton(
          auth.loading || otpValue.length < 4 ? null : () => _handleOtpSubmit(),
          auth.loading,
          'Verify Code →',
        ),
        const SizedBox(height: 16),
        Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Text("Didn't receive it?",
                style: TextStyle(
                    color: Color(0xFFb0a0d0), fontSize: 13, fontWeight: FontWeight.w400)),
            const SizedBox(width: 6),
            if (resendCd > 0)
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 3),
                decoration: BoxDecoration(
                  color: Colors.white.withAlpha(40),
                  borderRadius: BorderRadius.circular(100),
                ),
                child: Text('⏱ $resendCd s',
                    style: const TextStyle(
                        color: Color(0xFFb0a0d0),
                        fontSize: 12,
                        fontWeight: FontWeight.w700)),
              )
            else
              TextButton(
                onPressed: _handleResend,
                child: const Text('Resend code',
                    style: TextStyle(
                        color: Color(0xFFa78bfa),
                        fontSize: 13,
                        fontWeight: FontWeight.w700)),
              ),
          ],
        ),
      ],
    );
  }

  Widget _otpBox(int i) {
    final focused = otpNodes[i].hasFocus;
    final filled = otpCtrls[i].text.isNotEmpty;
    return Container(
      width: 56,
      height: 64,
      margin: const EdgeInsets.symmetric(horizontal: 6),
      decoration: BoxDecoration(
        color: const Color(0x12FFFFFF),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(
          color: focused
              ? const Color(0xFF7c3aed)
              : filled
                  ? const Color(0xFF22c55e)
                  : const Color(0x1AFFFFFF),
          width: 1.5,
        ),
      ),
      child: TextField(
        controller: otpCtrls[i],
        focusNode: otpNodes[i],
        textAlign: TextAlign.center,
        keyboardType: TextInputType.number,
        maxLength: 1,
        style: const TextStyle(
          color: Color(0xFFf0ecff),
          fontSize: 26,
          fontWeight: FontWeight.w800,
        ),
        decoration: const InputDecoration(
          counterText: '',
          border: InputBorder.none,
        ),
        onChanged: (v) {
          _clearError();
          if (v.isNotEmpty && i < 3) otpNodes[i + 1].requestFocus();
          if (v.isEmpty && i > 0) otpNodes[i - 1].requestFocus();
          setState(() {});
        },
        onSubmitted: (_) => _handleOtpSubmit(),
      ),
    );
  }

  Widget _registerStep(AuthService auth) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text('Almost there!',
            style: TextStyle(
                color: Color(0xFFf0ecff),
                fontSize: 24,
                fontWeight: FontWeight.w800,
                letterSpacing: -0.5)),
        const SizedBox(height: 6),
        Text('A few details to set up your wallet.',
            style: TextStyle(
                color: const Color(0xFFb0a0d0),
                fontSize: 13,
                fontWeight: FontWeight.w400)),
        const SizedBox(height: 20),
        _field(
          controller: emailCtrl,
          icon: Icons.email_outlined,
          label: 'Email',
          enabled: false,
        ),
        const SizedBox(height: 12),
        _field(
          controller: nameCtrl,
          icon: Icons.person_outline,
          label: 'Full Name *',
          hint: 'Your full name',
          onChanged: (_) => _clearError(),
        ),
        const SizedBox(height: 12),
        _field(
          controller: usernameCtrl,
          icon: Icons.alternate_email,
          label: 'Username *',
          hint: 'e.g. venu_gamer',
          onChanged: (_) {
            _clearError();
            _checkUsername();
          },
        ),
        if (usernameMsg.isNotEmpty)
          Padding(
            padding: const EdgeInsets.only(top: 4, left: 4),
            child: Text(
              usernameMsg,
              style: TextStyle(
                fontSize: 11,
                fontWeight: FontWeight.w700,
                color: usernameStatus == 'available'
                    ? const Color(0xFF34d399)
                    : usernameStatus == 'taken'
                        ? const Color(0xFFf87171)
                        : usernameStatus == 'checking'
                            ? const Color(0xFFa78bfa)
                            : const Color(0xFF9ca3af),
              ),
            ),
          ),
        const SizedBox(height: 12),
        Row(
          children: [
            Expanded(
              child: _field(
                controller: dobCtrl,
                icon: Icons.cake_outlined,
                label: 'Date of Birth',
                hint: 'YYYY-MM-DD',
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: _field(
                controller: whatsappCtrl,
                icon: Icons.phone_android_outlined,
                label: 'WhatsApp',
                hint: '+91 ...',
                keyboardType: TextInputType.phone,
              ),
            ),
          ],
        ),
        const SizedBox(height: 12),
        Row(
          children: [
            Expanded(
              child: _field(
                controller: cityCtrl,
                icon: Icons.location_city_outlined,
                label: 'City',
                hint: 'Bangalore',
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: _field(
                controller: pincodeCtrl,
                icon: Icons.pin_drop_outlined,
                label: 'Pincode',
                hint: '560001',
                keyboardType: TextInputType.number,
              ),
            ),
          ],
        ),
        const SizedBox(height: 16),
        Text('Choose Avatar',
            style: TextStyle(
                color: const Color(0x88b0a0d0),
                fontSize: 12,
                fontWeight: FontWeight.w600)),
        const SizedBox(height: 10),
        Wrap(
          spacing: 12,
          runSpacing: 12,
          children: _kAvatars.map((a) {
            final selected = _selectedAvatar == a['id'];
            return GestureDetector(
              onTap: () => setState(() => _selectedAvatar = a['id']),
              child: Container(
                width: 56,
                height: 56,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  gradient: LinearGradient(colors: a['colors']),
                  border: selected
                      ? Border.all(color: const Color(0xFF22c55e), width: 3)
                      : null,
                ),
                child: selected
                    ? const Icon(Icons.check, color: Colors.white)
                    : null,
              ),
            );
          }).toList(),
        ),
        const SizedBox(height: 20),
        _primaryButton(
          auth.loading ||
                  nameCtrl.text.trim().isEmpty ||
                  usernameCtrl.text.trim().isEmpty ||
                  usernameStatus == 'taken' ||
                  usernameStatus == 'checking'
              ? null
              : () => _handleRegister(),
          auth.loading,
          'Create Account →',
        ),
      ],
    );
  }

  Widget _field({
    required TextEditingController controller,
    IconData? icon,
    bool obscure = false,
    Widget? suffix,
    TextInputType? keyboardType,
    String? hint,
    String? label,
    bool enabled = true,
    void Function(String)? onChanged,
    void Function(String)? onSubmitted,
  }) {
    return Container(
      decoration: BoxDecoration(
        color: const Color(0x12FFFFFF),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0x1AFFFFFF)),
      ),
      child: TextField(
        controller: controller,
        obscureText: obscure,
        enabled: enabled,
        keyboardType: keyboardType,
        onChanged: onChanged,
        onSubmitted: onSubmitted,
        style: const TextStyle(
            color: Color(0xFFf0ecff), fontSize: 14, fontWeight: FontWeight.w500),
        decoration: InputDecoration(
          hintText: hint ?? label,
          hintStyle: const TextStyle(color: Colors.white54, fontSize: 14),
          labelText: label,
          labelStyle: const TextStyle(
              color: Color(0x88b0a0d0), fontSize: 12, fontWeight: FontWeight.w600),
          prefixIcon:
              icon != null ? Icon(icon, color: const Color(0x66b0a0d0), size: 20) : null,
          suffixIcon: suffix,
          border: InputBorder.none,
          contentPadding:
              const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        ),
      ),
    );
  }

  Widget _primaryButton(VoidCallback? onPressed, bool loading, String text) {
    return SizedBox(
      width: double.infinity,
      child: DecoratedBox(
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(18),
          gradient: const LinearGradient(
            colors: [Color(0xFF22c55e), Color(0xFF16a34a)],
          ),
          boxShadow: const [
            BoxShadow(
              color: Color(0x5522c55e),
              blurRadius: 24,
              offset: Offset(0, 6),
            ),
          ],
        ),
        child: ElevatedButton(
          onPressed: onPressed,
          style: ElevatedButton.styleFrom(
            backgroundColor: Colors.transparent,
            shadowColor: Colors.transparent,
            padding: const EdgeInsets.symmetric(vertical: 16),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(18)),
            disabledBackgroundColor: Colors.white.withAlpha(10),
          ),
          child: loading
              ? const SizedBox(
                  width: 20,
                  height: 20,
                  child: CircularProgressIndicator(
                      strokeWidth: 2, color: Colors.white),
                )
              : Text(text,
                  style: const TextStyle(
                      color: Colors.white,
                      fontSize: 16,
                      fontWeight: FontWeight.w700)),
        ),
      ),
    );
  }
}
