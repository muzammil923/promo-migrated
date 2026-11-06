import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../../apps/frontend/src/api'

export default function BounceBuilderPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [game, setGame] = useState(null);
  const [settings, setSettings] = useState(null);
  const [levels, setLevels] = useState([]);
  const [selectedLevel, setSelectedLevel] = useState(null);
  const [objects, setObjects] = useState([]);
  const [activeTab, setActiveTab] = useState('settings');
  const [saving, setSaving] = useState(false);
  const [showLevelModal, setShowLevelModal] = useState(false);
  const [showObjectModal, setShowObjectModal] = useState(false);
  const [editingObject, setEditingObject] = useState(null);
  const [previewMode, setPreviewMode] = useState(false);
  
  const levelModalRef = useRef(null);
  const objectModalRef = useRef(null);
  
  // Load game data
  useEffect(() => {
    if (id) {
      api.get(`/bounce/settings/${id}`)
        .then(res => {
          setGame(res.data.game);
          setSettings(res.data.settings);
          setLevels(res.data.levels);
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
        api.put(`bounce/settings/${id}`, settings)
          .catch(err => console.error('Settings auto-save failed:', err));
      }, 2000);
      
      return () => clearTimeout(timeout);
    }
  }, [settings, id]);
  
  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      await api.put(`bounce/settings/${id}`, settings);
      showToast('Settings saved ✅');
    } catch (err) {
      showToast('Error saving settings', 'error');
    } finally {
      setSaving(false);
    }
  };
  
  const handleAddLevel = async () => {
    const levelOrder = levels.length;
    const newLevel = {
      game_id: id,
      level_order: levelOrder,
      level_name: `Level ${levelOrder + 1}`,
      width: 3000,
      height: 600,
      bg_color: null,
      bg_image_url: null,
      parallax_bg_url: null,
      time_limit_seconds: 0,
      target_score: 0
    };
    
    try {
      const res = await api.post('bounce/levels', newLevel);
      setLevels(prev => [...prev, res.data.level]);
      setShowLevelModal(false);
      showToast('Level added ✅');
    } catch (err) {
      showToast('Error adding level', 'error');
    }
  };
  
  const handleUpdateLevel = async (levelId, updates) => {
    try {
      await api.put(`bounce/levels/${levelId}`, updates);
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
      await api.delete(`bounce/levels/${levelId}`);
      setLevels(prev => prev.filter(l => l.id !== levelId));
      if (selectedLevel?.id === levelId) {
        setSelectedLevel(null);
      }
      showToast('Level deleted ✅');
    } catch (err) {
      showToast('Error deleting level', 'error');
    }
  };
  
  const handleAddObject = async (levelId, objectData) => {
    try {
      const res = await api.post('bounce/objects', { ...objectData, level_id: levelId });
      setObjects(prev => [...prev, res.data.object]);
      setShowObjectModal(false);
      showToast('Object added ✅');
    } catch (err) {
      showToast('Error adding object', 'error');
    }
  };
  
  const handleUpdateObject = async (objectId, updates) => {
    try {
      await api.put(`bounce/objects/${objectId}`, updates);
      setObjects(prev => prev.map(o => o.id === objectId ? { ...o, ...updates } : o));
      if (editingObject?.id === objectId) {
        setEditingObject({ ...editingObject, ...updates });
      }
      showToast('Object updated ✅');
    } catch (err) {
      showToast('Error updating object', 'error');
    }
  };
  
  const handleDeleteObject = async (objectId) => {
    if (!confirm('Delete this object?')) return;
    try {
      await api.delete(`bounce/objects/${objectId}`);
      setObjects(prev => prev.filter(o => o.id !== objectId));
      if (editingObject?.id === objectId) {
        setEditingObject(null);
      }
      showToast('Object deleted ✅');
    } catch (err) {
      showToast('Error deleting object', 'error');
    }
  };
  
  const handleReorderObjects = async (levelId, objects) => {
    try {
      await api.post('bounce/objects/reorder', { level_id: levelId, objects });
      setObjects(prev => [...objects]);
    } catch (err) {
      showToast('Error reordering objects', 'error');
    }
  };
  
  const showToast = (message, type = 'success') => {
    console.log(`[${type}] ${message}`);
  };
  
  if (!game) {
    return (
      <div className="bb-wrap" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <div>Loading game...</div>
      </div>
    );
  }
  
  return (
    <div className="bb-wrap" style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div style={{ display:'flex', gap:10, alignItems:'flex-start' }}>
          <button onClick={() => navigate('/dashboard/games')} style={{ width:30, height:30, borderRadius:7, border:'1.5px solid #E5E7EB', background:'#F9FAFB', display:'inline-flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:'#374151', fontSize:16, lineHeight:1, marginTop:1, flexShrink:0 }}>←</button>
          <div>
            <div style={{ fontWeight:700, fontSize:14, color:'#1e1e2e', lineHeight:1.3 }}>{game?.name || 'Untitled'}</div>
            <div style={{ fontSize:9.5, fontWeight:600, color:'#9899b8', letterSpacing:'.04em', textTransform:'uppercase', marginTop:1 }}>Bounce Ball Builder</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={() => navigate(`/play/${game.slug}/${game.client_slug}`)}
            className="bb-btn bb-btn-ghost"
          >
            👁 View Game
          </button>
          <button
            onClick={() => setPreviewMode(!previewMode)}
            className="bb-btn bb-btn-primary"
          >
            {previewMode ? 'Exit Preview' : 'Preview Levels'}
          </button>
        </div>
      </div>
      
      {previewMode ? (
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '16px' }}>Level Previews</h2>
          <div className="bb-level-grid">
            {levels.map((level, index) => (
              <div
                key={level.id}
                className="bb-level-card"
                onClick={() => setSelectedLevel(level)}
              >
                <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '8px' }}>{level.level_name}</h3>
                <p style={{ fontSize: '13px', color: 'var(--bb-text2)', marginBottom: '8px' }}>
                  Size: {level.width} × {level.height}
                </p>
                <p style={{ fontSize: '13px', color: 'var(--bb-text2)' }}>
                  Objects: {objects.filter(o => o.level_id === level.id).length}
                </p>
                {selectedLevel?.id === level.id && (
                  <div style={{ marginTop: '8px', fontSize: '12px', color: 'var(--bb-primary)' }}>
                    ✏️ Selected
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '24px' }}>
          {/* Left panel: Settings & Levels */}
          <div>
            {/* Settings Tab */}
            <div className="bb-section">
              <div className="bb-section-title">⚙️ Game Settings</div>
              
              <div className="bb-form-grid">
                <div>
                  <span className="bb-label">Primary Color</span>
                  <input
                    type="color"
                    value={settings?.primary_color || '#e53935'}
                    onChange={e => setSettings({ ...settings, primary_color: e.target.value })}
                  />
                </div>
                <div>
                  <span className="bb-label">Background Color</span>
                  <input
                    type="color"
                    value={settings?.bg_color || '#f5f5f5'}
                    onChange={e => setSettings({ ...settings, bg_color: e.target.value })}
                  />
                </div>
                <div>
                  <span className="bb-label">Ball Color</span>
                  <input
                    type="color"
                    value={settings?.ball_color || '#e53935'}
                    onChange={e => setSettings({ ...settings, ball_color: e.target.value })}
                  />
                </div>
                <div>
                  <span className="bb-label">Ball Size</span>
                  <input
                    type="number"
                    min="10"
                    max="100"
                    value={settings?.ball_size || 24}
                    onChange={e => setSettings({ ...settings, ball_size: parseInt(e.target.value) || 24 })}
                  />
                </div>
                <div>
                  <span className="bb-label">Gravity</span>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    max="2"
                    value={settings?.gravity || 0.5}
                    onChange={e => setSettings({ ...settings, gravity: parseFloat(e.target.value) || 0.5 })}
                  />
                </div>
                <div>
                  <span className="bb-label">Jump Force</span>
                  <input
                    type="number"
                    step="0.5"
                    min="-20"
                    max="-1"
                    value={settings?.jump_force || -12}
                    onChange={e => setSettings({ ...settings, jump_force: parseFloat(e.target.value) || -12 })}
                  />
                </div>
                <div>
                  <span className="bb-label">Max Speed</span>
                  <input
                    type="number"
                    step="0.5"
                    min="1"
                    max="20"
                    value={settings?.max_speed || 8}
                    onChange={e => setSettings({ ...settings, max_speed: parseFloat(e.target.value) || 8 })}
                  />
                </div>
                <div>
                  <span className="bb-label">Time Limit (seconds)</span>
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
                  className="bb-btn bb-btn-primary"
                >
                  {saving ? 'Saving...' : 'Save Settings'}
                </button>
              </div>
            </div>
            
            {/* Levels List */}
            <div className="bb-section">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <div className="bb-section-title">📋 Levels</div>
                <button
                  onClick={() => setShowLevelModal(true)}
                  className="bb-btn bb-btn-success bb-btn-sm"
                >
                  + Add Level
                </button>
              </div>
              
              <div className="bb-level-grid">
                {levels.map((level, index) => (
                  <div
                    key={level.id}
                    className={`bb-level-card ${selectedLevel?.id === level.id ? 'selected' : ''} ${level.completed ? 'completed' : ''}`}
                    onClick={() => setSelectedLevel(level)}
                  >
                    <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '8px' }}>{level.level_name}</h3>
                    <p style={{ fontSize: '13px', color: 'var(--bb-text2)', marginBottom: '4px' }}>
                      Size: {level.width} × {level.height}
                    </p>
                    <p style={{ fontSize: '13px', color: 'var(--bb-text2)', marginBottom: '4px' }}>
                      Time: {level.time_limit_seconds}s
                    </p>
                    <p style={{ fontSize: '13px', color: 'var(--bb-text2)' }}>
                      Target: {level.target_score > 0 ? level.target_score : 'None'}
                    </p>
                    <div style={{ marginTop: '8px', display: 'flex', gap: '4px' }}>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDeleteLevel(level.id); }}
                        className="bb-btn bb-btn-danger bb-btn-sm bb-btn-icon"
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
          
          {/* Right panel: Level Editor */}
          <div>
            {selectedLevel ? (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h2 style={{ fontSize: '20px', fontWeight: '700' }}>{selectedLevel.level_name}</h2>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => setShowObjectModal(true)}
                      className="bb-btn bb-btn-success bb-btn-sm"
                    >
                      + Add Object
                    </button>
                  </div>
                </div>
                
                {/* Level Preview */}
                <div className="bb-canvas-container" style={{ height: '400px', marginBottom: '16px' }}>
                  <LevelPreview
                    level={selectedLevel}
                    objects={objects.filter(o => o.level_id === selectedLevel.id)}
                    settings={settings}
                    onObjectSelect={setEditingObject}
                  />
                </div>
                
                {/* Level Properties */}
                <div className="bb-section">
                  <div className="bb-section-title">⚙️ Level Properties</div>
                  <div className="bb-form-grid">
                    <div>
                      <span className="bb-label">Level Name</span>
                      <input
                        value={selectedLevel.level_name}
                        onChange={e => handleUpdateLevel(selectedLevel.id, { level_name: e.target.value })}
                      />
                    </div>
                    <div>
                      <span className="bb-label">Width</span>
                      <input
                        type="number"
                        value={selectedLevel.width}
                        onChange={e => handleUpdateLevel(selectedLevel.id, { width: parseInt(e.target.value) || 3000 })}
                      />
                    </div>
                    <div>
                      <span className="bb-label">Height</span>
                      <input
                        type="number"
                        value={selectedLevel.height}
                        onChange={e => handleUpdateLevel(selectedLevel.id, { height: parseInt(e.target.value) || 600 })}
                      />
                    </div>
                    <div>
                      <span className="bb-label">Time Limit (seconds)</span>
                      <input
                        type="number"
                        value={selectedLevel.time_limit_seconds}
                        onChange={e => handleUpdateLevel(selectedLevel.id, { time_limit_seconds: parseInt(e.target.value) || 0 })}
                      />
                    </div>
                    <div>
                      <span className="bb-label">Target Score</span>
                      <input
                        type="number"
                        value={selectedLevel.target_score}
                        onChange={e => handleUpdateLevel(selectedLevel.id, { target_score: parseInt(e.target.value) || 0 })}
                      />
                    </div>
                  </div>
                </div>
                
                {/* Objects List */}
                <div className="bb-section">
                  <div className="bb-section-title">📦 Objects</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '8px' }}>
                    {objects.filter(o => o.level_id === selectedLevel.id).map((obj) => (
                      <div
                        key={obj.id}
                        className="bb-level-card"
                        onClick={() => setEditingObject(obj)}
                        style={{ cursor: 'pointer' }}
                      >
                        <h4 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '4px' }}>{obj.type}</h4>
                        <p style={{ fontSize: '12px', color: 'var(--bb-text2)' }}>X: {obj.x}, Y: {obj.y}</p>
                        <p style={{ fontSize: '12px', color: 'var(--bb-text2)' }}>W: {obj.width}, H: {obj.height}</p>
                        {editingObject?.id === obj.id && (
                          <div style={{ marginTop: '4px', fontSize: '11px', color: 'var(--bb-primary)' }}>
                            ✏️ Editing
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Object Properties */}
                {editingObject && editingObject.level_id === selectedLevel.id && (
                  <div className="bb-section">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <div className="bb-section-title">⚙️ Object Properties</div>
                      <button
                        onClick={() => setEditingObject(null)}
                        className="bb-btn bb-btn-ghost bb-btn-sm"
                      >
                        ✕
                      </button>
                    </div>
                    
                    <ObjectPropertiesPanel
                      object={editingObject}
                      onUpdate={(updates) => handleUpdateObject(editingObject.id, updates)}
                      onDelete={() => handleDeleteObject(editingObject.id)}
                    />
                  </div>
                )}
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '400px', color: 'var(--bb-text2)' }}>
                Select a level to edit
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Modals */}
      {showLevelModal && (
        <LevelModal
          onClose={() => setShowLevelModal(false)}
          onSave={handleAddLevel}
        />
      )}
      
      {showObjectModal && selectedLevel && (
        <ObjectModal
          levelId={selectedLevel.id}
          onClose={() => setShowObjectModal(false)}
          onSave={handleAddObject}
        />
      )}
    </div>
  );
}

// Helper components
function LevelModal({ onClose, onSave }) {
  const [levelName, setLevelName] = useState('Level');
  const [width, setWidth] = useState(3000);
  const [height, setHeight] = useState(600);
  const [timeLimit, setTimeLimit] = useState(0);
  const [targetScore, setTargetScore] = useState(0);
  
  return (
    <div className="bb-modal-overlay" onClick={onClose}>
      <div className="bb-modal-content" onClick={e => e.stopPropagation()}>
        <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '16px' }}>Add New Level</h2>
        
        <div className="bb-form-grid">
          <div>
            <span className="bb-label">Level Name</span>
            <input
              value={levelName}
              onChange={e => setLevelName(e.target.value)}
              placeholder="Level 1"
            />
          </div>
          <div>
            <span className="bb-label">Width</span>
            <input
              type="number"
              value={width}
              onChange={e => setWidth(parseInt(e.target.value) || 3000)}
            />
          </div>
          <div>
            <span className="bb-label">Height</span>
            <input
              type="number"
              value={height}
              onChange={e => setHeight(parseInt(e.target.value) || 600)}
            />
          </div>
          <div>
            <span className="bb-label">Time Limit (seconds)</span>
            <input
              type="number"
              value={timeLimit}
              onChange={e => setTimeLimit(parseInt(e.target.value) || 0)}
            />
          </div>
          <div>
            <span className="bb-label">Target Score</span>
            <input
              type="number"
              value={targetScore}
              onChange={e => setTargetScore(parseInt(e.target.value) || 0)}
            />
          </div>
        </div>
        
        <div style={{ marginTop: '24px', display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
            className="bb-btn bb-btn-ghost"
          >
            Cancel
          </button>
          <button
            onClick={() => onSave({ level_name: levelName, width, height, time_limit_seconds: timeLimit, target_score: targetScore })}
            className="bb-btn bb-btn-primary"
          >
            Add Level
          </button>
        </div>
      </div>
    </div>
  );
}

function ObjectModal({ levelId, onClose, onSave }) {
  const objectTypes = [
    { type: 'platform', label: 'Platform', color: '#333' },
    { type: 'moving_platform', label: 'Moving Platform', color: '#666' },
    { type: 'spike', label: 'Spike', color: '#dc2626' },
    { type: 'spring', label: 'Spring', color: '#16a34a' },
    { type: 'coin', label: 'Coin', color: '#f59e0b' },
    { type: 'goal', label: 'Goal', color: '#3b82f6' },
    { type: 'wall', label: 'Wall', color: '#4b5563' },
    { type: 'death_zone', label: 'Death Zone', color: '#991b1b' }
  ];
  
  const [selectedType, setSelectedType] = useState(objectTypes[0].type);
  const [x, setX] = useState(100);
  const [y, setY] = useState(100);
  const [width, setWidth] = useState(100);
  const [height, setHeight] = useState(20);
  const [color, setColor] = useState('#333');
  
  const handleSave = () => {
    onSave({
      type: selectedType,
      x, y, width, height, color,
      move_type: selectedType === 'moving_platform' ? 'horizontal' : 'none',
      move_distance: 200,
      move_speed: 1,
      spring_force: -18,
      coin_value: 10,
      goal_text: 'FINISH',
      z_index: 0,
      object_order: 0
    });
  };
  
  return (
    <div className="bb-modal-overlay" onClick={onClose}>
      <div className="bb-modal-content" onClick={e => e.stopPropagation()}>
        <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '16px' }}>Add Object</h2>
        
        <div style={{ marginBottom: '16px' }}>
          <span className="bb-label">Object Type</span>
          <div className="bb-object-palette">
            {objectTypes.map(obj => (
              <div
                key={obj.type}
                className="bb-object-palette-item"
                onClick={() => {
                  setSelectedType(obj.type);
                  setColor(obj.color);
                }}
                style={{ borderColor: selectedType === obj.type ? 'var(--bb-primary)' : 'var(--bb-border)' }}
              >
                <div style={{ fontSize: '20px', marginBottom: '4px' }}>📦</div>
                <div style={{ fontSize: '11px' }}>{obj.label}</div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="bb-form-grid">
          <div>
            <span className="bb-label">X Position</span>
            <input
              type="number"
              value={x}
              onChange={e => setX(parseInt(e.target.value) || 0)}
            />
          </div>
          <div>
            <span className="bb-label">Y Position</span>
            <input
              type="number"
              value={y}
              onChange={e => setY(parseInt(e.target.value) || 0)}
            />
          </div>
          <div>
            <span className="bb-label">Width</span>
            <input
              type="number"
              value={width}
              onChange={e => setWidth(parseInt(e.target.value) || 100)}
            />
          </div>
          <div>
            <span className="bb-label">Height</span>
            <input
              type="number"
              value={height}
              onChange={e => setHeight(parseInt(e.target.value) || 20)}
            />
          </div>
          <div>
            <span className="bb-label">Color</span>
            <input
              type="color"
              value={color}
              onChange={e => setColor(e.target.value)}
            />
          </div>
        </div>
        
        <div style={{ marginTop: '24px', display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
            className="bb-btn bb-btn-ghost"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="bb-btn bb-btn-primary"
          >
            Add Object
          </button>
        </div>
      </div>
    </div>
  );
}

function ObjectPropertiesPanel({ object, onUpdate, onDelete }) {
  const [localObject, setLocalObject] = useState(object);
  
  const handleUpdate = (field, value) => {
    const updated = { ...localObject, [field]: value };
    setLocalObject(updated);
    onUpdate(updated);
  };
  
  return (
    <div className="bb-properties-panel">
      <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px' }}>Properties</h3>
      
      <div style={{ marginBottom: '12px' }}>
        <span className="bb-label">Type</span>
        <select
          value={localObject.type}
          onChange={e => handleUpdate('type', e.target.value)}
        >
          <option value="platform">Platform</option>
          <option value="moving_platform">Moving Platform</option>
          <option value="spike">Spike</option>
          <option value="spring">Spring</option>
          <option value="coin">Coin</option>
          <option value="goal">Goal</option>
          <option value="wall">Wall</option>
          <option value="death_zone">Death Zone</option>
        </select>
      </div>
      
      <div className="bb-form-grid">
        <div>
          <span className="bb-label">X</span>
          <input
            type="number"
            value={localObject.x}
            onChange={e => handleUpdate('x', parseInt(e.target.value) || 0)}
          />
        </div>
        <div>
          <span className="bb-label">Y</span>
          <input
            type="number"
            value={localObject.y}
            onChange={e => handleUpdate('y', parseInt(e.target.value) || 0)}
          />
        </div>
        <div>
          <span className="bb-label">Width</span>
          <input
            type="number"
            value={localObject.width}
            onChange={e => handleUpdate('width', parseInt(e.target.value) || 100)}
          />
        </div>
        <div>
          <span className="bb-label">Height</span>
          <input
            type="number"
            value={localObject.height}
            onChange={e => handleUpdate('height', parseInt(e.target.value) || 20)}
          />
        </div>
      </div>
      
      {localObject.type === 'moving_platform' && (
        <div style={{ marginTop: '12px' }}>
          <span className="bb-label">Move Type</span>
          <select
            value={localObject.move_type}
            onChange={e => handleUpdate('move_type', e.target.value)}
          >
            <option value="horizontal">Horizontal</option>
            <option value="vertical">Vertical</option>
            <option value="none">None</option>
          </select>
        </div>
      )}
      
      {localObject.type === 'spring' && (
        <div style={{ marginTop: '12px' }}>
          <span className="bb-label">Spring Force</span>
          <input
            type="number"
            step="0.5"
            value={localObject.spring_force}
            onChange={e => handleUpdate('spring_force', parseFloat(e.target.value) || -18)}
          />
        </div>
      )}
      
      {localObject.type === 'coin' && (
        <div style={{ marginTop: '12px' }}>
          <span className="bb-label">Coin Value</span>
          <input
            type="number"
            value={localObject.coin_value}
            onChange={e => handleUpdate('coin_value', parseInt(e.target.value) || 10)}
          />
        </div>
      )}
      
      {localObject.type === 'goal' && (
        <div style={{ marginTop: '12px' }}>
          <span className="bb-label">Goal Text</span>
          <input
            value={localObject.goal_text}
            onChange={e => handleUpdate('goal_text', e.target.value)}
            placeholder="FINISH"
          />
        </div>
      )}
      
      <div style={{ marginTop: '16px', display: 'flex', gap: '8px' }}>
        <button
          onClick={() => onDelete(localObject.id)}
          className="bb-btn bb-btn-danger bb-btn-sm"
          style={{ flex: 1 }}
        >
          Delete Object
        </button>
      </div>
    </div>
  );
}

function LevelPreview({ level, objects, settings, onObjectSelect }) {
  const canvasRef = useRef(null);
  const animationFrameRef = useRef(null);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const scale = 0.5; // Scale down for preview
    
    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Draw background
      if (level.bg_color) {
        ctx.fillStyle = level.bg_color;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
      
      // Draw objects
      objects.forEach((obj, index) => {
        ctx.save();
        ctx.translate(obj.x, obj.y);
        
        // Set color based on type
        let color = obj.color || '#333';
        if (obj.type === 'spike') color = '#dc2626';
        else if (obj.type === 'spring') color = '#16a34a';
        else if (obj.type === 'coin') color = '#f59e0b';
        else if (obj.type === 'goal') color = '#3b82f6';
        else if (obj.type === 'death_zone') color = '#991b1b';
        
        ctx.fillStyle = color;
        ctx.fillRect(0, 0, obj.width, obj.height);
        
        // Draw object type icon
        ctx.fillStyle = '#fff';
        ctx.font = '12px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(obj.type.charAt(0).toUpperCase(), obj.width / 2, obj.height / 2);
        
        ctx.restore();
      });
      
      animationFrameRef.current = requestAnimationFrame(render);
    };
    
    render();
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [level, objects]);
  
  return (
    <div className="bb-canvas-container">
      <canvas
        ref={canvasRef}
        width={level.width || 3000}
        height={level.height || 600}
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  );
}