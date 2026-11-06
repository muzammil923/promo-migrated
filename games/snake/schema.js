module.exports = {
  table: 'snake_settings',
  fields: [
    // Gameplay
    'board_width', 'board_height', 'speed',
    'snake_color', 'food_color', 'wall_mode',
    // Timer
    'show_timer', 'time_limit_seconds',
    // Headings
    'heading_1', 'heading_2', 'heading_3',
    'heading_1_color', 'heading_2_color', 'heading_3_color',
    'description_text', 'description_color',
    // Theme
    'bg_color', 'primary_color', 'font_family',
    // Images
    'bg_image_url', 'thankyou_bg_image_url',
    'game_logo_url', 'submit_confirm_gif_url',
    // Sounds
    'sound_eat_id', 'sound_gameover_id',
    // Text
    'intro_text', 'outro_text',
    'submit_button_text', 'continue_button_text', 'start_button_text',
    'reveal_text',
    // Legal
    'terms_enabled', 'terms_text', 'terms_url',
    // SEO
    'meta_description',
  ],
  uploads: ['bg_image_url', 'thankyou_bg_image_url', 'game_logo_url', 'submit_confirm_gif_url'],
  defaults: {
    board_width: 20,
    board_height: 20,
    speed: 5,
    snake_color: '#22c55e',
    food_color: '#ef4444',
    wall_mode: 'wall',
    show_timer: 1,
    time_limit_seconds: 0,
    bg_color: '#0f172a',
    primary_color: '#22c55e',
    font_family: 'DM Sans',
    heading_1_color: '#1a1a2e',
    heading_2_color: '#666666',
    heading_3_color: '#777777',
    description_color: '#888888',
  },
};
