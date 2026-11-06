module.exports = {
  table: 'bejeweled_settings',
  fields: [
    'grid_size', 'logo_url', 'logo_name', 'theme_colors',
    'match_score', 'chain_score_multiplier', 'is_active',
  ],
  uploads: [],
  defaults: {
    grid_size: 8,
    match_score: 10,
    chain_score_multiplier: 2,
    is_active: 1,
  },
};
