module.exports = {
  table: 'bounce_settings',
  fields: [
    'primary_color', 'bg_color', 'bg_image_url', 'ball_image_url', 'ball_color',
    'ball_size', 'gravity', 'jump_force', 'friction', 'max_speed',
    'intro_text', 'intro_text_color', 'outro_text', 'outro_text_color',
    'time_limit_seconds', 'show_timer',
    'sound_jump_id', 'sound_coin_id', 'sound_hit_id', 'sound_win_id', 'sound_lose_id',
  ],
  uploads: ['bg_image_url'],
  defaults: {
    primary_color: '#e53935',
    bg_color: '#f5f5f5',
    ball_color: '#e53935',
    ball_size: 24,
    gravity: 0.5,
    jump_force: -12,
    friction: 0.85,
    max_speed: 8,
    time_limit_seconds: 0,
    show_timer: 1,
  },
};
