class Game {
  final int id;
  final String name;
  final String? slug;
  final String category;
  final String? description;
  final String? imageUrl;
  final String? redirectUrl;

  Game({
    required this.id,
    required this.name,
    this.slug,
    required this.category,
    this.description,
    this.imageUrl,
    this.redirectUrl,
  });

  factory Game.fromJson(Map<String, dynamic> json) {
    return Game(
      id: json['id'] ?? 0,
      name: json['name'] ?? '',
      slug: json['slug'],
      category: json['category'] ?? 'quiz',
      description: json['description'],
      imageUrl: json['image_url']?.toString(),
      redirectUrl: json['redirect_url'],
    );
  }
}
