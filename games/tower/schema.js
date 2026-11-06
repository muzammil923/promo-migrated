module.exports = {
  table: 'tower_settings',
  fields: [
    'target_score',
    'heading_1', 'heading_2',
    'heading_1_color', 'heading_2_color',
    'bg_color', 'primary_color', 'font_family',
    'bg_image_url', 'thankyou_bg_image_url', 'game_logo_url',
    'start_button_text', 'meta_description',
  ],
  uploads: ['bg_image_url', 'thankyou_bg_image_url', 'game_logo_url'],
  defaults: {
    target_score: 1000,
    bg_color: '#f95240',
    primary_color: '#ff735c',
    font_family: 'DM Sans',
    heading_1_color: '#1a1a2e',
    heading_2_color: '#666666',
  },
};
