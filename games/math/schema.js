module.exports = {
  table: 'math_settings',
  fields: [
    // Gameplay
    'total_levels', 'questions_per_level',
    'operations', 'number_range_start', 'number_range_end',
    'allow_negative', 'show_timer', 'time_per_question',
    'pass_threshold',
    // Headings
    'heading_1', 'heading_2', 'heading_3',
    'heading_1_color', 'heading_2_color', 'heading_3_color',
    'description_text', 'description_color',
    // Theme
    'bg_color', 'primary_color', 'font_family',
    // Sounds
    'sound_correct_id', 'sound_wrong_id',
    // Animations
    'overlay_animation_in', 'overlay_animation_out',
    // Text
    'intro_text', 'outro_text',
    'submit_button_text', 'continue_button_text', 'start_button_text',
    // Legal
    'terms_enabled', 'terms_text', 'terms_url',
    // SEO
    'meta_description',
  ],
  uploads: [],
  defaults: {
    total_levels: 100,
    questions_per_level: 5,
    operations: '+,-,×',
    number_range_start: 1,
    number_range_end: 100,
    allow_negative: 0,
    show_timer: 1,
    time_per_question: 0,
    pass_threshold: 5,
    bg_color: '#f0fdf4',
    primary_color: '#22c55e',
    font_family: 'DM Sans',
    heading_1_color: '#1a1a2e',
    heading_2_color: '#666666',
    heading_3_color: '#777777',
    description_color: '#888888',
    overlay_animation_in: 'flyFromBottom',
    overlay_animation_out: 'flyToTop',
  },
};
