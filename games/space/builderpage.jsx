export default function SpaceBuilderPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [game, setGame] = useState(null);
  const [settings, setSettings] = useState(null);
  const [ships, setShips] = useState([]);
  const [weapons, setWeapons] = useState([]);
  const [enemies, setEnemies] = useState([]);
  const [levels, setLevels] = useState([]);
  const [selectedShip, setSelectedShip] = useState(null);
  const [selectedWeapon, setSelectedWeapon] = useState(null);
  const [selectedEnemy, setSelectedEnemy] = useState(null);
  const [selectedLevel, setSelectedLevel] = useState(null);
  const [activeTab, setActiveTab] = useState('settings');
  const [saving, setSaving] = useState(false);
  const [showShipModal, setShowShipModal] = useState(false);
  const [showWeaponModal, setShowWeaponModal] = useState(false);
  const [showEnemyModal, setShowEnemyModal] = useState(false);
  const [showLevelModal, setShowLevelModal] = useState(false);
  const [editingShip, setEditingShip] = useState(null);
  const [editingWeapon, setEditingWeapon] = useState(null);
  const [editingEnemy, setEditingEnemy] = useState(null);
  const [previewMode, setPreviewMode] = useState(false);
  
  const shipModalRef = useRef(null);
  const weaponModalRef = useRef(null);
  const enemyModalRef = useRef(null);
  
  // Load game data
  useEffect(() => {
    if (id) {
      api.get(`/space/settings/${id}`)
        .then(res => {
          setGame(res.data.game);
          setSettings(res.data.settings);
          setShips(res.data.ships);
          setWeapons(res.data.weapons);
          setEnemies(res.data.enemies);
          setLevels(res.data.levels);
          // Set default ship as selected
          const defaultShip = res.data.ships.find(s => s.is_default);
          if (defaultShip) setSelectedShip(defaultShip);
        })
        .catch(err => {
          console.error('Error loading game:', err);
          navigate('/dashboard/games');
        });
    }
  }, [id, navigate]);
  
  // Auto-save settings
  useEffect(() => {
    if (settings && id) {
      const timeout = setTimeout(() => {
        api.put(`space/settings/${id}`, settings)
          .catch(err => console.error('Settings auto-save failed:', err));
      }, 2000);
      
      return () => clearTimeout(timeout);
    }
  }, [settings, id]);
  
  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      await api.put(`space/settings/${id}`, settings);
      showToast('Settings saved ✅');
    } catch (err) {
      showToast('Error saving settings', 'error');
    } finally {
      setSaving(false);
    }
  };
  
  const handleAddShip = async () => {
    const newShip = {
      game_id: id,
      ship_name: 'New Ship',
      width: 40,
      height: 40,
      color: '#3b82f6',
      speed: 4,
      laser_speed: 6,
      laser_width: 4,
      laser_damage: 1,
      shield_points: 100,
      is_default: 0
    };
    
    try {
      const res = await api.post('space/ships', newShip);
      setShips(prev => [...prev, res.data.ship]);
      setShowShipModal(false);
      showToast('Ship added ✅');
    } catch (err) {
      showToast('Error adding ship', 'error');
    }
  };
  
  const handleUpdateShip = async (shipId, updates) => {
    try {
      await api.put(`space/ships/${shipId}`, updates);
      setShips(prev => prev.map(s => s.id === shipId ? { ...s, ...updates } : s));
      if (selectedShip?.id === shipId) {
        setSelectedShip({ ...selectedShip, ...updates });
      }
      showToast('Ship updated ✅');
    } catch (err) {
      showToast('Error updating ship', 'error');
    }
  };
  
  const handleDeleteShip = async (shipId) => {
    if (!confirm('Delete this ship?')) return;
    try {
      await api.delete(`space/ships/${shipId}`);
      setShips(prev => prev.filter(s => s.id !== shipId));
      if (selectedShip?.id === shipId) {
        setSelectedShip(null);
      }
      showToast('Ship deleted ✅');
    } catch (err) {
      showToast('Error deleting ship', 'error');
    }
  };
  
  const handleAddWeapon = async () => {
    const newWeapon = {
      game_id: id,
      weapon_name: 'New Weapon',
      laser_speed: 6,
      laser_width: 4,
      laser_damage: 1,
      fire_rate: 200,
      cost: 0,
      description: ''
    };
    
    try {
      const res = await api.post('space/weapons', newWeapon);
      setWeapons(prev => [...prev, res.data.weapon]);
      setShowWeaponModal(false);
      showToast('Weapon added ✅');
    } catch (err) {
      showToast('Error adding weapon', 'error');
    }
  };
  
  const handleUpdateWeapon = async (weaponId, updates) => {
    try {
      await api.put(`space/weapons/${weaponId}`, updates);
      setWeapons(prev => prev.map(w => w.id === weaponId ? { ...w, ...updates } : w));
      if (selectedWeapon?.id === weaponId) {
        setSelectedWeapon({ ...selectedWeapon, ...updates });
      }
      showToast('Weapon updated ✅');
    } catch (err) {
      showToast('Error updating weapon', 'error');
    }
  };
  
  const handleDeleteWeapon = async (weaponId) => {
    if (!confirm('Delete this weapon?')) return;
    try {
      await api.delete(`space/weapons/${weaponId}`);
      setWeapons(prev => prev.filter(w => w.id !== weaponId));
      if (selectedWeapon?.id === weaponId) {
        setSelectedWeapon(null);
      }
      showToast('Weapon deleted ✅');
    } catch (err) {
      showToast('Error deleting weapon', 'error');
    }
  };
  
  const handleAddEnemy = async () => {
    const newEnemy = {
      game_id: id,
      enemy_name: 'New Enemy',
      width: 30,
      height: 30,
      color: '#ef4444',
      speed: 2,
      hp: 1,
      points_value: 10,
      attack_damage: 1,
      move_pattern: 'straight',
      shoot_pattern: 'none'
    };
    
    try {
      const res = await api.post('space/enemies', newEnemy);
      setEnemies(prev => [...prev, res.data.enemy]);
      setShowEnemyModal(false);
      showToast('Enemy added ✅');
    } catch (err) {
      showToast('Error adding enemy', 'error');
    }
  };
  
  const handleUpdateEnemy = async (enemyId, updates) => {
    try {
      await api.put(`space/enemies/${enemyId}`, updates);
      setEnemies(prev => prev.map(e => e.id === enemyId ? { ...e, ...updates } : e));
      if (selectedEnemy?.id === enemyId) {
        setSelectedEnemy({ ...selectedEnemy, ...updates });
      }
      showToast('Enemy updated ✅');
    } catch (err) {
      showToast('Error updating enemy', 'error');
    }
  };
  
  const handleDeleteEnemy = async (enemyId) => {
    if (!confirm('Delete this enemy?')) return;
    try {
      await api.delete(`space/enemies/${enemyId}`);
      setEnemies(prev => prev.filter(e => e.id !== enemyId));
      if (selectedEnemy?.id === enemyId) {
        setSelectedEnemy(null);
      }
      showToast('Enemy deleted ✅');
    } catch (err) {
      showToast('Error deleting enemy', 'error');
    }
  };
  
  const handleAddLevel = async () => {
    const levelOrder = levels.length;
    const newLevel = {
      game_id: id,
      level_order: levelOrder,
      level_name: `Level ${levelOrder + 1}`,
      width: 800,
      height: 600,
      bg_color: null,
      bg_image_url: null,
      time_limit_seconds: 0,
      target_score: 0,
      enemy_spawn_rate: 1000
    };
    
    try {
      const res = await api.post('space/levels', newLevel);
      setLevels(prev => [...prev, res.data.level]);
      setShowLevelModal(false);
      showToast('Level added ✅');
    } catch (err) {
      showToast('Error adding level', 'error');
    }
  };
  
  const handleUpdateLevel = async (levelId, updates) => {
    try {
      await api.put(`space/levels/${levelId}`, updates);
      setLevels(prev => prev.map(l => l.id === levelId ? { ...l, ...updates } : l));
      if (selectedLevel?.id === levelId) {
        setSelectedLevel({ ...selectedLevel, ...updates });
      }
      showToast('Level updated ✅');
    } catch (err) {
      showToast('Error updating level', 'error');
    }
  };
  
  const handleDeleteLevel = async (levelId) => {
    if (!confirm('Delete this level?')) return;
    try {
      await api.delete(`space/levels/${levelId}`);
      setLevels(prev => prev.filter(l => l.id !== levelId));
      if (selectedLevel?.id === levelId) {
        setSelectedLevel(null);
      }
      showToast('Level deleted ✅');
    } catch (err) {
      showToast('Error deleting level', 'error');
    }
  };
  
  const showToast = (message, type = 'success') => {
    console.log(`[${type}] ${message}`);
  };
  
  if (!game) {
    return (
      <div className="sb-wrap" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <div>Loading game...</div>
      </div>
    );
  }
  
  return (
    <div className="sb-wrap" style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div style={{ display:'flex', gap:10, alignItems:'flex-start' }}>
          <button onClick={() => navigate('/dashboard/games')} style={{ width:30, height:30, borderRadius:7, border:'1.5px solid #E5E7EB', background:'#F9FAFB', display:'inline-flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:'#374151', fontSize:16, lineHeight:1, marginTop:1, flexShrink:0 }}>←</button>
          <div>
            <div style={{ fontWeight:700, fontSize:14, color:'#1e1e2e', lineHeight:1.3 }}>{game?.name || 'Untitled'}</div>
            <div style={{ fontSize:9.5, fontWeight:600, color:'#9899b8', letterSpacing:'.04em', textTransform:'uppercase', marginTop:1 }}>Space Fighter Builder</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={() => navigate(`/play/${game.slug}/${game.client_slug}`)}
            className="sb-btn sb-btn-ghost"
          >
            👁 View Game
          </button>
          <button
            onClick={() => setPreviewMode(!previewMode)}
            className="sb-btn sb-btn-primary"
          >
            {previewMode ? 'Exit Preview' : 'Preview Levels'}
          </button>
        </div>
      </div>
      
      {previewMode ? (
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '16px' }}>Ship & Weapon Previews</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px' }}>
            {ships.map((ship, index) => (
              <div
                key={ship.id}
                className="sb-ship-card"
                onClick={() => setSelectedShip(ship)}
              >
                <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '8px' }}>{ship.ship_name}</h3>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '8px' }}>
                  <div
                    style={{
                      width: ship.width,
                      height: ship.height,
                      backgroundColor: ship.color,
                      borderRadius: '50%',
                      border: ship.is_default ? '2px solid var(--sb-success)' : 'none'
                    }}
                  />
                </div>
                <p style={{ fontSize: '13px', color: 'var(--sb-text2)', marginBottom: '4px' }}>Speed: {ship.speed}</p>
                <p style={{ fontSize: '13px', color: 'var(--sb-text2)' }}>Shield: {ship.shield_points}</p>
                {selectedShip?.id === ship.id && (
                  <div style={{ marginTop: '8px', fontSize: '12px', color: 'var(--sb-primary)' }}>
                    ✏️ Selected
                  </div>
                )}
              </div>
            ))}
          </div>
          <h2 style={{ fontSize: '20px', fontWeight: '700', marginTop: '32px', marginBottom: '16px' }}>Weapon Previews</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '12px' }}>
            {weapons.map((weapon) => (
              <div
                key={weapon.id}
                className="sb-weapon-card"
                onClick={() => setSelectedWeapon(weapon)}
              >
                <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '8px' }}>{weapon.weapon_name}</h3>
                <p style={{ fontSize: '13px', color: 'var(--sb-text2)', marginBottom: '4px' }}>Damage: {weapon.laser_damage}</p>
                <p style={{ fontSize: '13px', color: 'var(--sb-text2)', marginBottom: '4px' }}>Fire Rate: {weapon.fire_rate}</p>
                <p style={{ fontSize: '13px', color: 'var(--sb-text2)' }}>Cost: {weapon.cost}</p>
                {selectedWeapon?.id === weapon.id && (
                  <div style={{ marginTop: '8px', fontSize: '12px', color: 'var(--sb-primary)' }}>
                    ✏️ Selected
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '24px' }}>
          {/* Left panel: Settings & Ships & Weapons & Enemies */}
          <div>
            {/* Settings Tab */}
            <div className="sb-section">
              <div className="sb-section-title">⚙️ Game Settings</div>
              
              <div className="sb-form-grid">
                <div>
                  <span className="sb-label">Primary Color</span>
                  <input
                    type="color"
                    value={settings?.primary_color || '#3b82f6'}
                    onChange={e => setSettings({ ...settings, primary_color: e.target.value })}
                  />
                </div>
                <div>
                  <span className="sb-label">Secondary Color</span>
                  <input
                    type="color"
                    value={settings?.secondary_color || '#1e40af'}
                    onChange={e => setSettings({ ...settings, secondary_color: e.target.value })}
                  />
                </div>
                <div>
                  <span className="sb-label">Accent Color</span>
                  <input
                    type="color"
                    value={settings?.accent_color || '#fbbf24'}
                    onChange={e => setSettings({ ...settings, accent_color: e.target.value })}
                  />
                </div>
                <div>
                  <span className="sb-label">Background Color</span>
                  <input
                    type="color"
                    value={settings?.bg_color || '#0f172a'}
                    onChange={e => setSettings({ ...settings, bg_color: e.target.value })}
                  />
                </div>
                <div>
                  <span className="sb-label">Enemy Speed</span>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={settings?.enemy_speed || 2}
                    onChange={e => setSettings({ ...settings, enemy_speed: parseInt(e.target.value) || 2 })}
                  />
                </div>
                <div>
                  <span className="sb-label">Player Speed</span>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={settings?.player_speed || 4}
                    onChange={e => setSettings({ ...settings, player_speed: parseInt(e.target.value) || 4 })}
                  />
                </div>
                <div>
                  <span className="sb-label">Laser Speed</span>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={settings?.laser_speed || 6}
                    onChange={e => setSettings({ ...settings, laser_speed: parseInt(e.target.value) || 6 })}
                  />
                </div>
                <div>
                  <span className="sb-label">Time Limit (seconds)</span>
                  <input
                    type="number"
                    min="0"
                    max="300"
                    value={settings?.time_limit_seconds || 0}
                    onChange={e => setSettings({ ...settings, time_limit_seconds: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>
              
              <div style={{ marginTop: '16px', display: 'flex', gap: '12px' }}>
                <button
                  onClick={handleSaveSettings}
                  disabled={saving}
                  className="sb-btn sb-btn-primary"
                >
                  {saving ? 'Saving...' : 'Save Settings'}
                </button>
              </div>
            </div>
            
            {/* Ships List */}
            <div className="sb-section">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <div className="sb-section-title">🚢 Ships</div>
                <button
                  onClick={() => setShowShipModal(true)}
                  className="sb-btn sb-btn-success sb-btn-sm"
                >
                  + Add Ship
                </button>
              </div>
              
              <div className="sb-ship-grid">
                {ships.map((ship, index) => (
                  <div
                    key={ship.id}
                    className="sb-ship-card"
                    onClick={() => setSelectedShip(ship)}
                  >
                    <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '8px' }}>{ship.ship_name}</h3>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '8px' }}>
                      <div
                        style={{
                          width: ship.width,
                          height: ship.height,
                          backgroundColor: ship.color,
                          borderRadius: '50%',
                          border: ship.is_default ? '2px solid var(--sb-success)' : 'none'
                        }}
                      />
                    </div>
                    <p style={{ fontSize: '13px', color: 'var(--sb-text2)', marginBottom: '4px' }}>Speed: {ship.speed}</p>
                    <p style={{ fontSize: '13px', color: 'var(--sb-text2)' }}>Shield: {ship.shield_points}</p>
                    {selectedShip?.id === ship.id && (
                      <div style={{ marginTop: '8px', fontSize: '12px', color: 'var(--sb-primary)' }}>
                        ✏️ Selected
                      </div>
                    )}
                    <div style={{ marginTop: '8px', display: 'flex', gap: '4px' }}>
                      <button
                        onClick={(e) => { e.stopPropagation(); setEditingShip(ship); }}
                        className="sb-btn sb-btn-ghost sb-btn-sm bb-btn-icon"
                        style={{ padding: '4px', fontSize: '11px' }}
                      >
                        ✏
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDeleteShip(ship.id); }}
                        className="sb-btn sb-btn-danger sb-btn-sm sb-btn-icon"
                        style={{ padding: '4px', fontSize: '11px' }}
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Weapons List */}
            <div className="sb-section">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <div className="sb-section-title">🔫 Weapons</div>
                <button
                  onClick={() => setShowWeaponModal(true)}
                  className="sb-btn sb-btn-success sb-btn-sm"
                >
                  + Add Weapon
                </button>
              </div>
              
              <div className="sb-weapon-grid">
                {weapons.map((weapon) => (
                  <div
                    key={weapon.id}
                    className="sb-weapon-card"
                    onClick={() => setSelectedWeapon(weapon)}
                  >
                    <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '8px' }}>{weapon.weapon_name}</h3>
                    <p style={{ fontSize: '13px', color: 'var(--sb-text2)', marginBottom: '4px' }}>Damage: {weapon.laser_damage}</p>
                    <p style={{ fontSize: '13px', color: 'var(--sb-text2)', marginBottom: '4px' }}>Fire Rate: {weapon.fire_rate}</p>
                    <p style={{ fontSize: '13px', color: 'var(--sb-text2)' }}>Cost: {weapon.cost}</p>
                    {selectedWeapon?.id === weapon.id && (
                      <div style={{ marginTop: '8px', fontSize: '12px', color: 'var(--sb-primary)' }}>
                        ✏️ Selected
                      </div>
                    )}
                    <div style={{ marginTop: '8px', display: 'flex', gap: '4px' }}>
                      <button
                        onClick={(e) => { e.stopPropagation(); setEditingWeapon(weapon); }}
                        className="sb-btn sb-btn-ghost sb-btn-sm bb-btn-icon"
                        style={{ padding: '4px', fontSize: '11px' }}
                      >
                        ✏
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDeleteWeapon(weapon.id); }}
                        className="sb-btn sb-btn-danger sb-btn-sm sb-btn-icon"
                        style={{ padding: '4px', fontSize: '11px' }}
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Enemies List */}
            <div className="sb-section">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <div className="sb-section-title">👾 Enemies</div>
                <button
                  onClick={() => setShowEnemyModal(true)}
                  className="sb-btn sb-btn-success sb-btn-sm"
                >
                  + Add Enemy
                </button>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '8px' }}>
                {enemies.map((enemy) => (
                  <div
                    key={enemy.id}
                    className="sb-level-card"
                    onClick={() => setSelectedEnemy(enemy)}
                  >
                    <h4 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '4px' }}>{enemy.enemy_name}</h4>
                    <p style={{ fontSize: '13px', color: 'var(--sb-text2)' }}>HP: {enemy.hp}</p>
                    <p style={{ fontSize: '13px', color: 'var(--sb-text2)' }}>Speed: {enemy.speed}</p>
                    <p style={{ fontSize: '13px', color: 'var(--sb-text2)' }}>Points: {enemy.points_value}</p>
                    {selectedEnemy?.id === enemy.id && (
                      <div style={{ marginTop: '4px', fontSize: '11px', color: 'var(--sb-primary)' }}>
                        ✏️ Selected
                      </div>
                    )}
                    <div style={{ marginTop: '8px', display: 'flex', gap: '4px' }}>
                      <button
                        onClick={(e) => { e.stopPropagation(); setEditingEnemy(enemy); }}
                        className="sb-btn sb-btn-ghost sb-btn-sm bb-btn-icon"
                        style={{ padding: '4px', fontSize: '11px' }}
                      >
                        ✏
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDeleteEnemy(enemy.id); }}
                        className="sb-btn sb-btn-danger sb-btn-sm bb-btn-icon"
                        style={{ padding: '4px', fontSize: '11px' }}
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Levels List */}
            <div className="sb-section">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <div className="sb-section-title">📋 Levels</div>
                <button
                  onClick={() => setShowLevelModal(true)}
                  className="sb-btn sb-btn-success sb-btn-sm"
                >
                  + Add Level
                </button>
              </div>
              
              <div className="sb-level-grid">
                {levels.map((level, index) => (
                  <div
                    key={level.id}
                    className="sb-level-card"
                    onClick={() => setSelectedLevel(level)}
                  >
                    <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '8px' }}>{level.level_name}</h3>
                    <p style={{ fontSize: '13px', color: 'var(--sb-text2)', marginBottom: '4px' }}>
                      Size: {level.width} × {level.height}
                    </p>
                    <p style={{ fontSize: '13px', color: 'var(--sb-text2)' }}>
                      Time: {level.time_limit_seconds}s
                    </p>
                    <p style={{ fontSize: '13px', color: 'var(--sb-text2)' }}>
                      Spawn Rate: {level.enemy_spawn_rate}
                    </p>
                    {selectedLevel?.id === level.id && (
                      <div style={{ marginTop: '8px', fontSize: '12px', color: 'var(--sb-primary)' }}>
                        ✏️ Selected
                      </div>
                    )}
                    <div style={{ marginTop: '8px', display: 'flex', gap: '4px' }}>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDeleteLevel(level.id); }}
                        className="sb-btn sb-btn-danger sb-btn-sm bb-btn-icon"
                        style={{ padding: '4px', fontSize: '11px' }}
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          {/* Right panel: Ship/Weapon/Enemy/Level Editor */}
          <div>
            {selectedShip ? (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h2 style={{ fontSize: '20px', fontWeight: '700' }}>Ship Properties</h2>
                  <button
                    onClick={() => setSelectedShip(null)}
                    className="sb-btn sb-btn-ghost sb-btn-sm"
                  >
                    ✕
                  </button>
                </div>
                
                {/* Ship Properties Panel */}
                <div className="sb-properties-panel">
                  <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px' }}>Properties</h3>
                  
                  <div className="sb-form-grid">
                    <div>
                      <span className="sb-label">Ship Name</span>
                      <input
                        value={selectedShip.ship_name}
                        onChange={e => handleUpdateShip(selectedShip.id, { ship_name: e.target.value })}
                      />
                    </div>
                    <div>
                      <span className="sb-label">Width</span>
                      <input
                        type="number"
                        value={selectedShip.width}
                        onChange={e => handleUpdateShip(selectedShip.id, { width: parseInt(e.target.value) || 40 })}
                      />
                    </div>
                    <div>
                      <span className="sb-label">Height</span>
                      <input
                        type="number"
                        value={selectedShip.height}
                        onChange={e => handleUpdateShip(selectedShip.id, { height: parseInt(e.target.value) || 40 })}
                      />
                    </div>
                    <div>
                      <span className="sb-label">Speed</span>
                      <input
                        type="number"
                        value={selectedShip.speed}
                        onChange={e => handleUpdateShip(selectedShip.id, { speed: parseInt(e.target.value) || 4 })}
                      />
                    </div>
                    <div>
                      <span className="sb-label">Laser Speed</span>
                      <input
                        type="number"
                        value={selectedShip.laser_speed}
                        onChange={e => handleUpdateShip(selectedShip.id, { laser_speed: parseInt(e.target.value) || 6 })}
                      />
                    </div>
                    <div>
                      <span className="sb-label">Laser Width</span>
                      <input
                        type="number"
                        value={selectedShip.laser_width}
                        onChange={e => handleUpdateShip(selectedShip.id, { laser_width: parseInt(e.target.value) || 4 })}
                      />
                    </div>
                    <div>
                      <span className="sb-label">Laser Damage</span>
                      <input
                        type="number"
                        value={selectedShip.laser_damage}
                        onChange={e => handleUpdateShip(selectedShip.id, { laser_damage: parseInt(e.target.value) || 1 })}
                      />
                    </div>
                    <div>
                      <span className="sb-label">Shield Points</span>
                      <input
                        type="number"
                        value={selectedShip.shield_points}
                        onChange={e => handleUpdateShip(selectedShip.id, { shield_points: parseInt(e.target.value) || 100 })}
                      />
                    </div>
                    <div>
                      <span className="sb-label">Is Default</span>
                      <select
                        value={selectedShip.is_default ? '1' : '0'}
                        onChange={e => handleUpdateShip(selectedShip.id, { is_default: parseInt(e.target.value) === 1 })}
                      >
                        <option value="1">Yes</option>
                        <option value="0">No</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            ) : selectedWeapon ? (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h2 style={{ fontSize: '20px', fontWeight: '700' }}>Weapon Properties</h2>
                  <button
                    onClick={() => setSelectedWeapon(null)}
                    className="sb-btn sb-btn-ghost sb-btn-sm"
                  >
                    ✕
                  </button>
                </div>
                
                {/* Weapon Properties Panel */}
                <div className="sb-properties-panel">
                  <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px' }}>Properties</h3>
                  
                  <div className="sb-form-grid">
                    <div>
                      <span className="sb-label">Weapon Name</span>
                      <input
                        value={selectedWeapon.weapon_name}
                        onChange={e => handleUpdateWeapon(selectedWeapon.id, { weapon_name: e.target.value })}
                      />
                    </div>
                    <div>
                      <span className="sb-label">Laser Speed</span>
                      <input
                        type="number"
                        value={selectedWeapon.laser_speed}
                        onChange={e => handleUpdateWeapon(selectedWeapon.id, { laser_speed: parseInt(e.target.value) || 6 })}
                      />
                    </div>
                    <div>
                      <span className="sb-label">Laser Width</span>
                      <input
                        type="number"
                        value={selectedWeapon.laser_width}
                        onChange={e => handleUpdateWeapon(selectedWeapon.id, { laser_width: parseInt(e.target.value) || 4 })}
                      />
                    </div>
                    <div>
                      <span className="sb-label">Laser Damage</span>
                      <input
                        type="number"
                        value={selectedWeapon.laser_damage}
                        onChange={e => handleUpdateWeapon(selectedWeapon.id, { laser_damage: parseInt(e.target.value) || 1 })}
                      />
                    </div>
                    <div>
                      <span className="sb-label">Fire Rate</span>
                      <input
                        type="number"
                        value={selectedWeapon.fire_rate}
                        onChange={e => handleUpdateWeapon(selectedWeapon.id, { fire_rate: parseInt(e.target.value) || 200 })}
                      />
                    </div>
                    <div>
                      <span className="sb-label">Cost</span>
                      <input
                        type="number"
                        value={selectedWeapon.cost}
                        onChange={e => handleUpdateWeapon(selectedWeapon.id, { cost: parseInt(e.target.value) || 0 })}
                      />
                    </div>
                    <div>
                      <span className="sb-label">Description</span>
                      <textarea
                        value={selectedWeapon.description}
                        onChange={e => handleUpdateWeapon(selectedWeapon.id, { description: e.target.value })}
                        rows={3}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ) : selectedEnemy ? (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h2 style={{ fontSize: '20px', fontWeight: '700' }}>Enemy Properties</h2>
                  <button
                    onClick={() => setSelectedEnemy(null)}
                    className="sb-btn sb-btn-ghost sb-btn-sm"
                  >
                    ✕
                  </button>
                </div>
                
                {/* Enemy Properties Panel */}
                <div className="sb-properties-panel">
                  <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px' }}>Properties</h3>
                  
                  <div className="sb-form-grid">
                    <div>
                      <span className="sb-label">Enemy Name</span>
                      <input
                        value={selectedEnemy.enemy_name}
                        onChange={e => handleUpdateEnemy(selectedEnemy.id, { enemy_name: e.target.value })}
                      />
                    </div>
                    <div>
                      <span className="sb-label">HP</span>
                      <input
                        type="number"
                        value={selectedEnemy.hp}
                        onChange={e => handleUpdateEnemy(selectedEnemy.id, { hp: parseInt(e.target.value) || 1 })}
                      />
                    </div>
                    <div>
                      <span className="sb-label">Speed</span>
                      <input
                        type="number"
                        value={selectedEnemy.speed}
                        onChange={e => handleUpdateEnemy(selectedEnemy.id, { speed: parseInt(e.target.value) || 2 })}
                      />
                    </div>
                    <div>
                      <span className="sb-label">Points Value</span>
                      <input
                        type="number"
                        value={selectedEnemy.points_value}
                        onChange={e => handleUpdateEnemy(selectedEnemy.id, { points_value: parseInt(e.target.value) || 10 })}
                      />
                    </div>
                    <div>
                      <span className="sb-label">Attack Damage</span>
                      <input
                        type="number"
                        value={selectedEnemy.attack_damage}
                        onChange={e => handleUpdateEnemy(selectedEnemy.id, { attack_damage: parseInt(e.target.value) || 1 })}
                      />
                    </div>
                    <div>
                      <span className="sb-label">Move Pattern</span>
                      <select
                        value={selectedEnemy.move_pattern}
                        onChange={e => handleUpdateEnemy(selectedEnemy.id, { move_pattern: e.target.value })}
                      >
                        <option value="straight">Straight</option>
                        <option value="zigzag">Zigzag</option>
                        <option value="circle">Circle</option>
                        <option value="sine">Sine</option>
                        <option value="random">Random</option>
                      </select>
                    </div>
                    <div>
                      <span className="sb-label">Shoot Pattern</span>
                      <select
                        value={selectedEnemy.shoot_pattern}
                        onChange={e => handleUpdateEnemy(selectedEnemy.id, { shoot_pattern: e.target.value })}
                      >
                        <option value="none">None</option>
                        <option value="single">Single</option>
                        <option value="double">Double</option>
                        <option value="spread">Spread</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            ) : selectedLevel ? (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h2 style={{ fontSize: '20px', fontWeight: '700' }}>Level Properties</h2>
                  <button
                    onClick={() => setSelectedLevel(null)}
                    className="sb-btn sb-btn-ghost sb-btn-sm"
                  >
                    ✕
                  </button>
                </div>
                
                {/* Level Properties Panel */}
                <div className="sb-properties-panel">
                  <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px' }}>Properties</h3>
                  
                  <div className="sb-form-grid">
                    <div>
                      <span className="sb-label">Level Name</span>
                      <input
                        value={selectedLevel.level_name}
                        onChange={e => handleUpdateLevel(selectedLevel.id, { level_name: e.target.value })}
                      />
                    </div>
                    <div>
                      <span className="sb-label">Width</span>
                      <input
                        type="number"
                        value={selectedLevel.width}
                        onChange={e => handleUpdateLevel(selectedLevel.id, { width: parseInt(e.target.value) || 800 })}
                      />
                    </div>
                    <div>
                      <span className="sb-label">Height</span>
                      <input
                        type="number"
                        value={selectedLevel.height}
                        onChange={e => handleUpdateLevel(selectedLevel.id, { height: parseInt(e.target.value) || 600 })}
                      />
                    </div>
                    <div>
                      <span className="sb-label">Time Limit (seconds)</span>
                      <input
                        type="number"
                        value={selectedLevel.time_limit_seconds}
                        onChange={e => handleUpdateLevel(selectedLevel.id, { time_limit_seconds: parseInt(e.target.value) || 0 })}
                      />
                    </div>
                    <div>
                      <span className="sb-label">Target Score</span>
                      <input
                        type="number"
                        value={selectedLevel.target_score}
                        onChange={e => handleUpdateLevel(selectedLevel.id, { target_score: parseInt(e.target.value) || 0 })}
                      />
                    </div>
                    <div>
                      <span className="sb-label">Enemy Spawn Rate</span>
                      <input
                        type="number"
                        value={selectedLevel.enemy_spawn_rate}
                        onChange={e => handleUpdateLevel(selectedLevel.id, { enemy_spawn_rate: parseInt(e.target.value) || 1000 })}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '400px', color: 'var(--sb-text2)' }}>
                Select a ship, weapon, enemy, or level to edit
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Modals */}
      {showShipModal && (
        <ShipModal
          onClose={() => setShowShipModal(false)}
          onSave={handleAddShip}
        />
      )}
      
      {showWeaponModal && (
        <WeaponModal
          onClose={() => setShowWeaponModal(false)}
          onSave={handleAddWeapon}
        />
      )}
      
      {showEnemyModal && (
        <EnemyModal
          onClose={() => setShowEnemyModal(false)}
          onSave={handleAddEnemy}
        />
      )}
      
      {showLevelModal && (
        <LevelModal
          onClose={() => setShowLevelModal(false)}
          onSave={handleAddLevel}
        />
      )}
    </div>
  );
}

// Helper components
function ShipModal({ onClose, onSave }) {
  const [shipName, setShipName] = useState('New Ship');
  const [width, setWidth] = useState(40);
  const [height, setHeight] = useState(40);
  const [color, setColor] = useState('#3b82f6');
  const [speed, setSpeed] = useState(4);
  const [laserSpeed, setLaserSpeed] = useState(6);
  const [laserWidth, setLaserWidth] = useState(4);
  const [laserDamage, setLaserDamage] = useState(1);
  const [shieldPoints, setShieldPoints] = useState(100);
  const [isDefault, setIsDefault] = useState(0);
  
  const handleSave = () => {
    onSave({
      ship_name: shipName,
      width,
      height,
      color,
      speed,
      laser_speed: laserSpeed,
      laser_width: laserWidth,
      laser_damage: laserDamage,
      shield_points: shieldPoints,
      is_default: isDefault
    });
  };
  
  return (
    <div className="sb-modal-overlay" onClick={onClose}>
      <div className="sb-modal-content" onClick={e => e.stopPropagation()}>
        <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '16px' }}>Add New Ship</h2>
        
        <div className="sb-form-grid">
          <div>
            <span className="sb-label">Ship Name</span>
            <input
              value={shipName}
              onChange={e => setShipName(e.target.value)}
              placeholder="New Ship"
            />
          </div>
          <div>
            <span className="sb-label">Width</span>
            <input
              type="number"
              value={width}
              onChange={e => setWidth(parseInt(e.target.value) || 40)}
            />
          </div>
          <div>
            <span className="sb-label">Height</span>
            <input
              type="number"
              value={height}
              onChange={e => setHeight(parseInt(e.target.value) || 40)}
            />
          </div>
          <div>
            <span className="sb-label">Color</span>
            <input
              type="color"
              value={color}
              onChange={e => setColor(e.target.value)}
            />
          </div>
          <div>
            <span className="sb-label">Speed</span>
            <input
              type="number"
              value={speed}
              onChange={e => setSpeed(parseInt(e.target.value) || 4)}
            />
          </div>
          <div>
            <span className="sb-label">Laser Speed</span>
            <input
              type="number"
              value={laserSpeed}
              onChange={e => setLaserSpeed(parseInt(e.target.value) || 6)}
            />
          </div>
          <div>
            <span className="sb-label">Laser Width</span>
            <input
              type="number"
              value={laserWidth}
              onChange={e => setLaserWidth(parseInt(e.target.value) || 4)}
            />
          </div>
          <div>
            <span className="sb-label">Laser Damage</span>
            <input
              type="number"
              value={laserDamage}
              onChange={e => setLaserDamage(parseInt(e.target.value) || 1)}
            />
          </div>
          <div>
            <span className="sb-label">Shield Points</span>
            <input
              type="number"
              value={shieldPoints}
              onChange={e => setShieldPoints(parseInt(e.target.value) || 100)}
            />
          </div>
          <div>
            <span className="sb-label">Is Default</span>
            <select
              value={isDefault}
              onChange={e => setIsDefault(parseInt(e.target.value))}
            >
              <option value="0">No</option>
              <option value="1">Yes</option>
            </select>
          </div>
        </div>
        
        <div style={{ marginTop: '24px', display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
            className="sb-btn sb-btn-ghost"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="sb-btn sb-btn-primary"
          >
            Add Ship
          </button>
        </div>
      </div>
    </div>
  );
}

function WeaponModal({ onClose, onSave }) {
  const [weaponName, setWeaponName] = useState('New Weapon');
  const [laserSpeed, setLaserSpeed] = useState(6);
  const [laserWidth, setLaserWidth] = useState(4);
  const [laserDamage, setLaserDamage] = useState(1);
  const [fireRate, setFireRate] = useState(200);
  const [cost, setCost] = useState(0);
  const [description, setDescription] = useState('');
  
  const handleSave = () => {
    onSave({
      weapon_name: weaponName,
      laser_speed: laserSpeed,
      laser_width: laserWidth,
      laser_damage: laserDamage,
      fire_rate: fireRate,
      cost,
      description
    });
  };
  
  return (
    <div className="sb-modal-overlay" onClick={onClose}>
      <div className="sb-modal-content" onClick={e => e.stopPropagation()}>
        <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '16px' }}>Add New Weapon</h2>
        
        <div className="sb-form-grid">
          <div>
            <span className="sb-label">Weapon Name</span>
            <input
              value={weaponName}
              onChange={e => setWeaponName(e.target.value)}
              placeholder="New Weapon"
            />
          </div>
          <div>
            <span className="sb-label">Laser Speed</span>
            <input
              type="number"
              value={laserSpeed}
              onChange={e => setLaserSpeed(parseInt(e.target.value) || 6)}
            />
          </div>
          <div>
            <span className="sb-label">Laser Width</span>
            <input
              type="number"
              value={laserWidth}
              onChange={e => setLaserWidth(parseInt(e.target.value) || 4)}
            />
          </div>
          <div>
            <span className="sb-label">Laser Damage</span>
            <input
              type="number"
              value={laserDamage}
              onChange={e => setLaserDamage(parseInt(e.target.value) || 1)}
            />
          </div>
          <div>
            <span className="sb-label">Fire Rate</span>
            <input
              type="number"
              value={fireRate}
              onChange={e => setFireRate(parseInt(e.target.value) || 200)}
            />
          </div>
          <div>
            <span className="sb-label">Cost</span>
            <input
              type="number"
              value={cost}
              onChange={e => setCost(parseInt(e.target.value) || 0)}
            />
          </div>
          <div>
            <span className="sb-label">Description</span>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={3}
            />
          </div>
        </div>
        
        <div style={{ marginTop: '24px', display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
            className="sb-btn sb-btn-ghost"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="sb-btn sb-btn-primary"
          >
            Add Weapon
          </button>
        </div>
      </div>
    </div>
  );
}

function EnemyModal({ onClose, onSave }) {
  const [enemyName, setEnemyName] = useState('New Enemy');
  const [width, setWidth] = useState(30);
  const [height, setHeight] = useState(30);
  const [color, setColor] = useState('#ef4444');
  const [speed, setSpeed] = useState(2);
  const [hp, setHp] = useState(1);
  const [pointsValue, setPointsValue] = useState(10);
  const [attackDamage, setAttackDamage] = useState(1);
  const [movePattern, setMovePattern] = useState('straight');
  const [shootPattern, setShootPattern] = useState('none');
  
  const handleSave = () => {
    onSave({
      enemy_name: enemyName,
      width,
      height,
      color,
      speed,
      hp,
      points_value: pointsValue,
      attack_damage: attackDamage,
      move_pattern: movePattern,
      shoot_pattern: shootPattern
    });
  };
  
  return (
    <div className="sb-modal-overlay" onClick={onClose}>
      <div className="sb-modal-content" onClick={e => e.stopPropagation()}>
        <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '16px' }}>Add New Enemy</h2>
        
        <div className="sb-form-grid">
          <div>
            <span className="sb-label">Enemy Name</span>
            <input
              value={enemyName}
              onChange={e => setEnemyName(e.target.value)}
              placeholder="New Enemy"
            />
          </div>
          <div>
            <span className="sb-label">Width</span>
            <input
              type="number"
              value={width}
              onChange={e => setWidth(parseInt(e.target.value) || 30)}
            />
          </div>
          <div>
            <span className="sb-label">Height</span>
            <input
              type="number"
              value={height}
              onChange={e => setHeight(parseInt(e.target.value) || 30)}
            />
          </div>
          <div>
            <span className="sb-label">Color</span>
            <input
              type="color"
              value={color}
              onChange={e => setColor(e.target.value)}
            />
          </div>
          <div>
            <span className="sb-label">Speed</span>
            <input
              type="number"
              value={speed}
              onChange={e => setSpeed(parseInt(e.target.value) || 2)}
            />
          </div>
          <div>
            <span className="sb-label">HP</span>
            <input
              type="number"
              value={hp}
              onChange={e => setHp(parseInt(e.target.value) || 1)}
            />
          </div>
          <div>
            <span className="sb-label">Points Value</span>
            <input
              type="number"
              value={pointsValue}
              onChange={e => setPointsValue(parseInt(e.target.value) || 10)}
            />
          </div>
          <div>
            <span className="sb-label">Attack Damage</span>
            <input
              type="number"
              value={attackDamage}
              onChange={e => setAttackDamage(parseInt(e.target.value) || 1)}
            />
          </div>
          <div>
            <span className="sb-label">Move Pattern</span>
            <select
              value={movePattern}
              onChange={e => setMovePattern(e.target.value)}
            >
              <option value="straight">Straight</option>
              <option value="zigzag">Zigzag</option>
              <option value="circle">Circle</option>
              <option value="sine">Sine</option>
              <option value="random">Random</option>
            </select>
          </div>
          <div>
            <span className="sb-label">Shoot Pattern</span>
            <select
              value={shootPattern}
              onChange={e => setShootPattern(e.target.value)}
            >
              <option value="none">None</option>
              <option value="single">Single</option>
              <option value="double">Double</option>
              <option value="spread">Spread</option>
            </select>
          </div>
        </div>
        
        <div style={{ marginTop: '24px', display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
            className="sb-btn sb-btn-ghost"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="sb-btn sb-btn-primary"
          >
            Add Enemy
          </button>
        </div>
      </div>
    </div>
  );
}

function LevelModal({ onClose, onSave }) {
  const [levelName, setLevelName] = useState('Level');
  const [width, setWidth] = useState(800);
  const [height, setHeight] = useState(600);
  const [timeLimit, setTimeLimit] = useState(0);
  const [targetScore, setTargetScore] = useState(0);
  const [enemySpawnRate, setEnemySpawnRate] = useState(1000);
  
  const handleSave = () => {
    onSave({
      level_name: levelName,
      width,
      height,
      time_limit_seconds: timeLimit,
      target_score: targetScore,
      enemy_spawn_rate: enemySpawnRate
    });
  };
  
  return (
    <div className="sb-modal-overlay" onClick={onClose}>
      <div className="sb-modal-content" onClick={e => e.stopPropagation()}>
        <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '16px' }}>Add New Level</h2>
        
        <div className="sb-form-grid">
          <div>
            <span className="sb-label">Level Name</span>
            <input
              value={levelName}
              onChange={e => setLevelName(e.target.value)}
              placeholder="Level 1"
            />
          </div>
          <div>
            <span className="sb-label">Width</span>
            <input
              type="number"
              value={width}
              onChange={e => setWidth(parseInt(e.target.value) || 800)}
            />
          </div>
          <div>
            <span className="sb-label">Height</span>
            <input
              type="number"
              value={height}
              onChange={e => setHeight(parseInt(e.target.value) || 600)}
            />
          </div>
          <div>
            <span className="sb-label">Time Limit (seconds)</span>
            <input
              type="number"
              value={timeLimit}
              onChange={e => setTimeLimit(parseInt(e.target.value) || 0)}
            />
          </div>
          <div>
            <span className="sb-label">Target Score</span>
            <input
              type="number"
              value={targetScore}
              onChange={e => setTargetScore(parseInt(e.target.value) || 0)}
            />
          </div>
          <div>
            <span className="sb-label">Enemy Spawn Rate</span>
            <input
              type="number"
              value={enemySpawnRate}
              onChange={e => setEnemySpawnRate(parseInt(e.target.value) || 1000)}
            />
          </div>
        </div>
        
        <div style={{ marginTop: '24px', display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
            className="sb-btn sb-btn-ghost"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="sb-btn sb-btn-primary"
          >
            Add Level
          </button>
        </div>
      </div>
    </div>
  );
}