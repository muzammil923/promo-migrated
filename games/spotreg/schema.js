module.exports = {
  table: 'spotreg_settings',
  fields: [
    'bg_color', 'primary_color', 'font_family', 'heading_1', 'heading_2', 'heading_3',
    'description_text', 'heading_1_color', 'heading_2_color', 'heading_3_color', 'description_color',
    'label_color', 'field_border_color', 'card_bg_color', 'card_radius', 'stations_heading', 'stations_subheading',
    'station_done_color', 'bg_image_url', 'game_logo_url', 'station_bg_image_url', 'thankyou_bg_image_url',
    'intro_text', 'outro_text', 'intro_text_color', 'outro_text_color', 'start_button_text',
    'start_button_text_color', 'start_button_bg_color', 'scan_button_text', 'scan_button_text_color',
    'scan_button_bg_color', 'submit_button_text', 'submit_button_text_color', 'submit_button_bg_color',
    'skip_button_text', 'skip_button_text_color', 'skip_button_bg_color', 'thankyou_heading', 'thankyou_text',
    'thankyou_heading_color', 'thankyou_text_color', 'thankyou_summary_heading', 'show_entries_summary',
    'complete_heading', 'complete_text', 'scan_hint_text', 'require_order', 'require_qr', 'show_progress',
    'allow_rescan', 'terms_enabled', 'terms_text', 'terms_url', 'meta_description',
    'heading_1_size', 'heading_2_size', 'heading_3_size', 'description_size', 'thankyou_heading_size',
    'thankyou_text_size', 'finish_button_text', 'finish_button_text_color', 'finish_button_bg_color'
  ],
  uploads: ['bg_image_url', 'game_logo_url', 'station_bg_image_url', 'thankyou_bg_image_url'],
  defaults: {},
};
