module.exports = {
  table: 'nagaraja_settings',
  fields: [
    // Gameplay
    'world_width', 'world_height', 'speed', 'snake_color',
    'ai_snake_count', 'ai_speed', 'gift_count', 'gifts_json',
    'boost_enabled', 'show_timer', 'time_limit_seconds',
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
    world_width: 1600,
    world_height: 1200,
    speed: 5,
    snake_color: '#22c55e',
    ai_snake_count: 6,
    ai_speed: 3,
    gift_count: 40,
    gifts_json: JSON.stringify([
      { name: 'Ruby', emoji: '🔴', color: '#ef4444', points: 1, size: 1, spawnWeight: 10 },
      { name: 'Gold', emoji: '🟡', color: '#f59e0b', points: 3, size: 2, spawnWeight: 4 },
      { name: 'Emerald', emoji: '🟢', color: '#22c55e', points: 5, size: 2, spawnWeight: 3 },
    ]),
    boost_enabled: 1,
    show_timer: 0,
    time_limit_seconds: 0,
    bg_color: '#0d0a1a',
    primary_color: '#8b5cf6',
    font_family: 'DM Sans',
    heading_1_color: '#1a1a2e',
    heading_2_color: '#666666',
    heading_3_color: '#777777',
    description_color: '#888888',
  },
};
