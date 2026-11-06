import 'package:flutter/material.dart';

class SpinningLogo extends StatefulWidget {
  final double size;
  final Duration duration;

  const SpinningLogo({super.key, this.size = 80, this.duration = const Duration(milliseconds: 2000)});

  @override
  State<SpinningLogo> createState() => _SpinningLogoState();
}

class _SpinningLogoState extends State<SpinningLogo> with TickerProviderStateMixin {
  late final AnimationController _spin;
  late final AnimationController _entry;
  late final Animation<double> _scale;
  late final Animation<double> _fade;

  @override
  void initState() {
    super.initState();
    _spin = AnimationController(vsync: this, duration: widget.duration)..repeat();
    _entry = AnimationController(vsync: this, duration: const Duration(milliseconds: 1200));
    _scale = Tween<double>(begin: 0.6, end: 1.0).animate(
      CurvedAnimation(parent: _entry, curve: const Interval(0.0, 0.5, curve: Curves.easeOutBack)),
    );
    _fade = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(parent: _entry, curve: const Interval(0.3, 0.7, curve: Curves.easeIn)),
    );
    _entry.forward();
  }

  @override
  void dispose() {
    _spin.dispose();
    _entry.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: Listenable.merge([_spin, _entry]),
      builder: (_, __) => Transform.scale(
        scale: _scale.value,
        child: Opacity(
          opacity: _fade.value,
          child: Transform.rotate(
            angle: _spin.value * 6.2832,
            child: Container(
              width: widget.size,
              height: widget.size,
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(widget.size * 0.3),
                boxShadow: const [
                  BoxShadow(color: Color(0x447c3aed), blurRadius: 50, spreadRadius: 8),
                ],
              ),
              child: ClipRRect(
                borderRadius: BorderRadius.circular(widget.size * 0.3),
                child: Image.asset('assets/favicon.png',
                    width: widget.size, height: widget.size, fit: BoxFit.cover),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

// Full-screen spinner used while loading data / screens
class FullScreenSpinner extends StatelessWidget {
  final String? label;
  const FullScreenSpinner({super.key, this.label});

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [Color(0xFF0d0a1a), Color(0xFF1a0e2e), Color(0xFF0f0b1e), Color(0xFF080612)],
        ),
      ),
      child: Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const SpinningLogo(size: 72),
            if (label != null) ...[
              const SizedBox(height: 20),
              Text(label!, style: const TextStyle(color: Color(0xFFb0a0d0), fontSize: 14)),
            ],
          ],
        ),
      ),
    );
  }
}
