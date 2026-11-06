class User {
  final int id;
  final String username;
  final String? email;
  final int? pcBalance;
  final String? avatarId;

  User({
    required this.id,
    required this.username,
    this.email,
    this.pcBalance,
    this.avatarId,
  });

  factory User.fromJson(Map<String, dynamic> json) {
    return User(
      id: json['id'] ?? 0,
      username: json['username'] ?? json['name'] ?? '',
      email: json['email'],
      pcBalance: json['pc_balance'],
      avatarId: json['avatar_id']?.toString(),
    );
  }
}
