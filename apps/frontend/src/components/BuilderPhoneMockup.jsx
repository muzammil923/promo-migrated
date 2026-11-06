import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api'

const CSS = `
.location-panel { padding: 12px; }
.location-card {
  background: #f8f9fb; border: 1.5px solid #e2e6f0;
  border-radius: 10px; padding: 12px; margin-bottom: 8px;
  transition: border-color .15s;
}
.location-card:hover { border-color: #cdd3e0; }
.reward-input {
  width: 100%; padding: 8px 10px; font-size: 12px;
  border: 1.5px solid #e2e6f0; border-radius: 6px;
  font-family: inherit; outline: none; transition: border-color .15s;
}
.reward-input:focus { border-color: #6366f1; }
.loc-btn {
  width: 100%; padding: 10px; border: 2px dashed #cdd3e0;
  border-radius: 10px; background: none; cursor: pointer;
  font-size: 12px; font-weight: 600; color: #64657a;
  font-family: inherit; transition: all .15s;
}
.loc-btn:hover { border-color: #6366f1; color: #6366f1; }
.loc-badge {
  display: inline-flex; align-items: center; gap: 4px;
  padding: 2px 8px; border-radius: 6px; font-size: 10px; font-weight: 700;
}
`

export default function BuilderPhoneMockup({ gameId, clientId, children, businessTab, onBusinessTabChange }) {
  const navigate = useNavigate()
  const [locations, setLocations] = useState([])
  const [loading, setLoading] = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newLoc, setNewLoc] = useState({ branch_id: '', reward: '' })
  const [saving, setSaving] = useState(false)
  const [branches, setBranches] = useState([])
  const assignedBranchNames = new Set(locations.map(l => l.location_name).filter(Boolean))

  useEffect(() => { if (gameId) loadLocations() }, [gameId])
  useEffect(() => { if (clientId) loadBranches() }, [clientId])

  const loadBranches = async () => {
    try {
      const { data } = await api.get(`/clients/${clientId}/branches`)
      setBranches(data.branches || [])
    } catch {}
  }

  const loadLocations = async () => {
    setLoading(true)
    try {
      const { data } = await api.get(`/games/${gameId}/locations`)
      setLocations(data.locations || [])
    } catch {}
    setLoading(false)
  }

  const handleCreate = async () => {
    if (!newLoc.branch_id) return
    // Check if this branch already has a location instance
    const branch = branches.find(b => b.id === parseInt(newLoc.branch_id))
    if (!branch) return
    if (assignedBranchNames.has(branch.business_name)) {
      alert('This branch already has a location game for this template.')
      return
    }
    setSaving(true)
    try {
      // Create the location game
      const { data } = await api.post(`/games/${gameId}/duplicate`, {
        location_name: branch.business_name,
        business_owner_id: branch.id,
      })
      // Link the BO to the game
      if (data.game?.id) {
        try {
          await api.post('/business/games/link', {
            business_owner_id: branch.id,
            game_id: data.game.id,
            location_name: branch.business_name,
            reward_text: newLoc.reward.trim(),
          })
        } catch {}
      }
      setNewLoc({ branch_id: '', reward: '' })
      setShowAddForm(false)
      loadLocations()
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create location game')
    }
    setSaving(false)
  }

  const handleDelete = async (childId) => {
    if (!confirm('Delete this location game? This cannot be undone.')) return
    try {
      await api.delete(`/games/${gameId}/locations/${childId}`)
      loadLocations()
    } catch {}
  }

  return (
    <>
      <style>{CSS}</style>
      <div style={{
        position: 'sticky', top: 80, width: 340, flexShrink: 0, marginRight: 20,
        background: '#fff', borderRadius: 16, border: '1.5px solid #e2e6f0',
        boxShadow: '0 2px 12px rgba(0,0,0,0.08)', overflow: 'hidden',
      }}>
        {/* Tab bar */}
        <div style={{ display: 'flex', borderBottom: '2px solid #e2e6f0' }}>
          <button
            style={{
              flex: 1, padding: '10px 8px', fontSize: 12, fontWeight: 700,
              border: 'none', background: businessTab === 'preview' ? '#fff' : '#f8f9fb',
              cursor: 'pointer', color: businessTab === 'preview' ? '#6366f1' : '#64657a',
              borderBottom: `2px solid ${businessTab === 'preview' ? '#6366f1' : 'transparent'}`,
              marginBottom: -2, fontFamily: 'inherit',
            }}
            onClick={() => onBusinessTabChange?.('preview')}
          >
            📱 Preview
          </button>
          <button
            style={{
              flex: 1, padding: '10px 8px', fontSize: 12, fontWeight: 700,
              border: 'none', background: businessTab === 'locations' ? '#fff' : '#f8f9fb',
              cursor: 'pointer', color: businessTab === 'locations' ? '#6366f1' : '#64657a',
              borderBottom: `2px solid ${businessTab === 'locations' ? '#6366f1' : 'transparent'}`,
              marginBottom: -2, fontFamily: 'inherit',
            }}
            onClick={() => onBusinessTabChange?.('locations')}
          >
            📍 Locations ({locations.length})
          </button>

        </div>

        {/* Preview content */}
        {businessTab === 'preview' && (
          <div style={{ padding: 12, maxHeight: 500, overflow: 'auto' }}>
            {children}
          </div>
        )}

        {/* Locations content */}
        {businessTab === 'locations' && (
          <div className="location-panel" style={{ maxHeight: 500, overflow: 'auto' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#64657a', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Location Games
            </div>
            <p style={{ fontSize: 11, color: '#9899ae', marginBottom: 12, lineHeight: 1.5 }}>
              Each location gets its own game copy with independent questions, images, and settings.
            </p>
            {branches.length > 0 && (
              <div style={{ fontSize: 10, color: '#9899ae', marginBottom: 10 }}>
                {assignedBranchNames.size} / {branches.length} branches have this game
              </div>
            )}

            {loading ? (
              <div style={{ textAlign: 'center', padding: 20, color: '#9899ae', fontSize: 12 }}>Loading...</div>
            ) : locations.length === 0 && !showAddForm ? (
              <div style={{ textAlign: 'center', padding: 20 }}>
                <div style={{ fontSize: 28, marginBottom: 8 }}>📍</div>
                <div style={{ fontSize: 12, color: '#64657a', marginBottom: 12 }}>No location games yet</div>
                <button className="loc-btn" onClick={() => setShowAddForm(true)}>
                  + Create First Location
                </button>
              </div>
            ) : (
              <>
                {locations.map(loc => (
                  <div key={loc.id} className="location-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, fontSize: 12, color: '#1e1e2e' }}>{loc.name}</div>
                        <div style={{ fontSize: 11, color: '#9899ae', marginTop: 1 }}>📍 {loc.location_name}</div>
                        <div style={{ fontSize: 11, color: '#9899ae', marginTop: 2 }}>
                          {loc.question_count} questions · {loc.is_active ? (
                            <span className="loc-badge" style={{ background: '#f0fdf4', color: '#059669' }}>Active</span>
                          ) : (
                            <span className="loc-badge" style={{ background: '#fef2f2', color: '#dc2626' }}>Inactive</span>
                          )}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button
                          onClick={() => navigate(`/dashboard/games/${loc.id}/builder`)}
                          style={{
                            padding: '4px 8px', borderRadius: 6, border: '1px solid #e2e6f0',
                            background: '#fff', cursor: 'pointer', fontSize: 10, fontWeight: 600,
                            color: '#6366f1', fontFamily: 'inherit',
                          }}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(loc.id)}
                          style={{
                            padding: '4px 8px', borderRadius: 6, border: '1px solid #fecaca',
                            background: '#fef2f2', cursor: 'pointer', fontSize: 10, fontWeight: 600,
                            color: '#dc2626', fontFamily: 'inherit',
                          }}
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                    {loc.slug && (
                      <div style={{ fontSize: 10, color: '#9899ae', wordBreak: 'break-all' }}>
                        /play/{loc.slug}
                      </div>
                    )}
                  </div>
                ))}

                {showAddForm ? (
                  <div className="location-card" style={{ borderStyle: 'dashed', borderColor: '#6366f1' }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#64657a', marginBottom: 6 }}>Select Branch</div>
                    <select
                      className="reward-input"
                      value={newLoc.branch_id}
                      onChange={e => setNewLoc({ ...newLoc, branch_id: e.target.value })}
                      style={{ marginBottom: 8, appearance: 'auto' }}
                    >
                      <option value="">— Choose a branch —</option>
                      {branches.map(b => {
                        const taken = assignedBranchNames.has(b.business_name)
                        return (
                          <option key={b.id} value={b.id} disabled={taken}>
                            {b.business_name}{taken ? ' (Already added)' : ''}
                          </option>
                        )
                      })}
                    </select>
                    {branches.length > 0 && branches.every(b => assignedBranchNames.has(b.business_name)) && (
                      <div style={{ fontSize: 11, color: '#9899ae', marginBottom: 8, textAlign: 'center' }}>
                        All branches have been added.
                      </div>
                    )}
                    <input
                      className="reward-input"
                      placeholder="Reward text (e.g. Free Coffee)"
                      value={newLoc.reward}
                      onChange={e => setNewLoc({ ...newLoc, reward: e.target.value })}
                      style={{ marginBottom: 8 }}
                    />
                    {branches.length === 0 && (
                      <div style={{ fontSize: 11, color: '#dc2626', marginBottom: 8 }}>
                        No branches found. Create branches in CRM first.
                      </div>
                    )}
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button
                        className="loc-btn"
                        onClick={handleCreate}
                        disabled={saving || !newLoc.branch_id}
                        style={{
                          flex: 1, borderStyle: 'solid', background: '#6366f1', color: '#fff',
                          opacity: saving || !newLoc.branch_id ? 0.5 : 1,
                        }}
                      >
                        {saving ? 'Creating...' : 'Create Location Game'}
                      </button>
                      <button
                        className="loc-btn"
                        onClick={() => { setShowAddForm(false); setNewLoc({ branch_id: '', reward: '' }) }}
                        style={{ flex: 1 }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <button className="loc-btn" onClick={() => setShowAddForm(true)}>
                    + Add Location Game
                  </button>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </>
  )
}
