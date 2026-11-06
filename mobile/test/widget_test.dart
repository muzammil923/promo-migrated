import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/main.dart';

void main() {
  testWidgets('App loads', (WidgetTester tester) async {
    await tester.pumpWidget(const PromoGamesApp());
    expect(find.text('PromoGames'), findsWidgets);
  });
}
