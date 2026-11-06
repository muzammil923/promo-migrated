module.exports = {
  table: 'candyblast_settings',
  fields: [
    'grid_size', 'logo_url', 'logo_name', 'levels_json',
    'candy_types', 'match_score', 'combo_multiplier',
    'special_spawn_rate', 'is_active',
  ],
  uploads: [],
  defaults: {
    grid_size: 8,
    candy_types: 6,
    match_score: 10,
    combo_multiplier: 40,
    special_spawn_rate: 0.17,
    is_active: 1,
  },
};
