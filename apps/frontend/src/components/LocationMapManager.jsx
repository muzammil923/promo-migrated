import { useState, useEffect, useMemo } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import api from '../api'

// ── Purple pin icon ──
const purpleIcon = L.divIcon({
  className: 'loc-pin',
  html: `<div style="background:#7c3aed;width:22px;height:22px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:3px solid var(--surface);box-shadow:0 2px 6px rgba(0,0,0,.4);"></div>`,
  iconSize: [22, 22],
  iconAnchor: [11, 22],
  popupAnchor: [0, -22],
})

const KARNATAKA_CENTER = [12.9716, 77.5946]

// Helper to fly map to a coordinate when a card is clicked
function FlyTo({ pos }) {
  const map = useMap()
  useEffect(() => { if (pos) map.flyTo(pos, 13, { duration: 0.8 }) }, [pos, map])
  return null
}

export default function LocationMapManager({ gameId, clientId }) {
  const [branches, setBranches] = useState([])
  const [locations, setLocations] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [selBranch, setSelBranch] = useState('')
  const [reward, setReward] = useState('')
  const [saving, setSaving] = useState(false)
  const [flyTo, setFlyTo] = useState(null)
  const [toast, setToast] = useState(null)
  const [showBranchForm, setShowBranchForm] = useState(false)
  const [branchForm, setBranchForm] = useState({ name: '', email: '', phone: '', pincode: '' })
  const [branchSaving, setBranchSaving] = useState(false)

  const flash = (msg, type = 'ok') => { setToast({ msg, type }); setTimeout(() => setToast(null), 2500) }

  const loadBranches = async () => {
    try { const { data } = await api.get(`/clients/${clientId}/branches`); setBranches(data.branches || []) } catch {}
  }
  const createBranch = async () => {
    if (!branchForm.name || !branchForm.email || !branchForm.phone) {
      flash('Name, email and phone are required', 'err'); return
    }
    setBranchSaving(true)
    try {
      const { data } = await api.post(`/clients/${clientId}/branches`, {
        branch_name: branchForm.name,
        email: branchForm.email,
        phone: branchForm.phone,
        pincode: branchForm.pincode,
      })
      flash('Branch created 🏢')
      setBranchForm({ name: '', email: '', phone: '', pincode: '' })
      setShowBranchForm(false)
      await loadBranches()
      if (data?.id) setSelBranch(String(data.id))
    } catch (err) {
      flash(err.response?.data?.message || 'Failed to create branch', 'err')
    }
    setBranchSaving(false)
  }
  const loadLocations = async () => {
    setLoading(true)
    try {
      const { data } = await api.get(`/business/games/${gameId}/locations`)
      setLocations(data.locations || [])
    } catch {}
    setLoading(false)
  }
  useEffect(() => { if (gameId) loadLocations() }, [gameId])
  useEffect(() => { if (clientId) loadBranches() }, [clientId])

  // Only branches not yet assigned a location game
  const assignedNames = useMemo(
    () => new Set(locations.map(l => (l.branch_name || l.location_name || '').trim()).filter(Boolean)),
    [locations]
  )
  const availableBranches = branches.filter(b => !assignedNames.has((b.business_name || '').trim()))

  // Pins: plot every location. If coords are missing for any reason, fall back
  // to a deterministic Karnataka position so the pin still appears (marked unverified).
  const pins = locations.map(l => {
    const lat = l.latitude != null ? parseFloat(l.latitude) : null
    const lng = l.longitude != null ? parseFloat(l.longitude) : null
    const hasCoords = lat != null && lng != null && !isNaN(lat) && !isNaN(lng)
    if (hasCoords) return { ...l, pos: [lat, lng], approximated: !!l.approximated }
    let h = 0
    const s = String(l.location_name || l.id || '')
    for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 100000
    const latOff = ((h % 9000) / 10000) - 0.45
    const lngOff = (((h >> 4) % 9000) / 10000) - 0.45
    return { ...l, pos: [KARNATAKA_CENTER[0] + latOff, KARNATAKA_CENTER[1] + lngOff], approximated: true }
  })

  const handleCreate = async () => {
    if (!selBranch) return
    const branch = branches.find(b => String(b.id) === String(selBranch))
    if (!branch) return
    setSaving(true)
    try {
      const { data } = await api.post(`/games/${gameId}/duplicate`, {
        location_name: branch.business_name,
        business_owner_id: branch.id,
      })
      if (data.game?.id) {
        try {
          await api.post('/business/games/link', {
            business_owner_id: branch.id,
            game_id: data.game.id,
            location_name: branch.business_name,
            reward_text: reward.trim(),
          })
        } catch {}
      }
      setSelBranch(''); setReward(''); setShowAdd(false)
      flash('Location game created 📍')
      loadLocations()
    } catch (err) {
      flash(err.response?.data?.message || 'Failed to create location', 'err')
    }
    setSaving(false)
  }

  const handleDelete = async (loc) => {
    const childId = loc.game_id || loc.id
    if (!confirm('Delete this location game? This cannot be undone.')) return
    try {
      // loc may be a business_owner_games row (id) — try both identifiers
      await api.delete(`/games/${gameId}/locations/${childId}`).catch(() => {})
      flash('Location deleted')
      loadLocations()
    } catch {}
  }

  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 0, overflow: 'hidden', borderRadius: 'inherit' }}>
      {/* z-index 0: the tab content area is the map */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
        <MapContainer center={KARNATAKA_CENTER} zoom={9} style={{ height: '100%', width: '100%' }} scrollWheelZoom>
        <TileLayer
          attribution='&copy; OpenStreetMap'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FlyTo pos={flyTo} />
        {pins.map((l) => (
          <Marker key={l.id} position={l.pos} icon={purpleIcon}>
            <Popup>
              <div style={{ fontWeight: 700, fontSize: 13 }}>{l.branch_name || l.location_name}</div>
              <div style={{ fontSize: 12, color: 'var(--gb-text2)' }}>📍 {l.pincode || '—'}</div>
              {l.reward_text ? <div style={{ fontSize: 12, marginTop: 2 }}>🎁 {l.reward_text}</div> : null}
              {l.approximated && <div style={{ fontSize: 11, marginTop: 2, color: 'var(--gb-warn, #b45309)' }}>⚠ Approximate location</div>}
            </Popup>
          </Marker>
        ))}
      </MapContainer>
      </div>{/* /z-index 0 map layer */}

      {/* ── Floating Location Manager card (z-index 2) ── */}
      <div style={{ position: 'absolute', top: 16, right: 16, width: 290, maxHeight: 'calc(100% - 32px)', overflow: 'auto', zIndex: 2,
        background: 'var(--gb-surface)', color: 'var(--gb-text)', borderRadius: 14, border: '1px solid var(--gb-border)', boxShadow: '0 6px 24px rgba(0,0,0,0.12)', padding: 14, fontFamily: 'inherit' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--gb-text)' }}>📍 Location Manager</div>
          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--gb-primary)', background: 'color-mix(in srgb, var(--gb-primary) 14%, transparent)', padding: '2px 8px', borderRadius: 6 }}>{locations.length}</span>
        </div>
        <p style={{ fontSize: 11, color: 'var(--gb-text3)', margin: '0 0 10px', lineHeight: 1.5 }}>
          Each location is a purple pin. Click a pin or a card to focus it.
        </p>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 16, color: 'var(--gb-text3)', fontSize: 12 }}>Loading…</div>
        ) : locations.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 16, color: 'var(--gb-text2)', fontSize: 12 }}>
            <div style={{ fontSize: 26, marginBottom: 6 }}>🗺️</div>No locations yet. Add one below.
          </div>
        ) : (
          locations.map((l) => (
            <div key={l.id} onMouseEnter={() => setFlyTo(l.pos)} 
              style={{ border: '1.5px solid var(--gb-border)', borderRadius: 10, padding: 10, marginBottom: 8, cursor: 'pointer', transition: 'border-color .15s' }}
              onClick={() => setFlyTo(l.pos)}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 12.5, color: 'var(--gb-text)' }}>{l.branch_name || l.location_name}</div>
                  <div style={{ fontSize: 11, color: 'var(--gb-text3)', marginTop: 1 }}>📍 {l.pincode || '—'}</div>
                  {l.reward_text ? <div style={{ fontSize: 11, color: 'var(--gb-primary)', marginTop: 1 }}>🎁 {l.reward_text}</div> : null}
                  <div style={{ fontSize: 11, marginTop: 2, display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                    {(() => {
                      const active = l.is_active !== undefined ? l.is_active : true
                      return active ? <span style={{ background:'color-mix(in srgb, #10b981 16%, transparent)', color:'#059669', padding:'1px 6px', borderRadius:5, fontSize:10, fontWeight:700 }}>Active</span>
                                     : <span style={{ background:'color-mix(in srgb, #ef4444 16%, transparent)', color:'#dc2626', padding:'1px 6px', borderRadius:5, fontSize:10, fontWeight:700 }}>Inactive</span>
                    })()}
                    {l.approximated && <span style={{ background:'color-mix(in srgb, #f59e0b 16%, transparent)', color:'#b45309', padding:'1px 6px', borderRadius:5, fontSize:10, fontWeight:700 }}>Approx</span>}
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <button onClick={(e) => { e.stopPropagation(); if (l.game_id) window.open(`/dashboard/games/${l.game_id}/builder`, '_blank') }}
                    style={{ padding: '3px 8px', borderRadius: 6, border: '1px solid var(--gb-border)', background: 'var(--gb-surface)', cursor: 'pointer', fontSize: 10, fontWeight: 600, color: 'var(--gb-primary)', fontFamily: 'inherit' }}>Edit</button>
                  <button onClick={(e) => { e.stopPropagation(); handleDelete(l) }}
                    style={{ padding: '3px 8px', borderRadius: 6, border: '1px solid color-mix(in srgb, #ef4444 30%, transparent)', background: 'color-mix(in srgb, #ef4444 10%, transparent)', cursor: 'pointer', fontSize: 10, fontWeight: 600, color: '#dc2626', fontFamily: 'inherit' }}>✕</button>
                </div>
              </div>
              {l.slug && <div style={{ fontSize: 10, color: 'var(--gb-text3)', marginTop: 4, wordBreak: 'break-all' }}>/play/{l.slug}</div>}
            </div>
          ))
        )}
      </div>

      {/* ── Floating Add Location card (z-index 2) ── */}
      <div style={{ position: 'absolute', bottom: 16, left: 16, width: 290, background: 'var(--gb-surface)', color: 'var(--gb-text)', borderRadius: 14, zIndex: 2,
        border: '1px solid var(--gb-border)', boxShadow: '0 6px 24px rgba(0,0,0,0.12)', padding: 14, fontFamily: 'inherit' }}>
        {!showAdd ? (
          <button onClick={() => setShowAdd(true)}
            style={{ width: '100%', padding: '11px', borderRadius: 10, border: '2px dashed color-mix(in srgb, var(--gb-primary) 45%, transparent)', background: 'color-mix(in srgb, var(--gb-primary) 8%, transparent)', cursor: 'pointer', fontSize: 12.5, fontWeight: 700, color: 'var(--gb-primary)', fontFamily: 'inherit' }}>
            + Add Location Game
          </button>
        ) : showBranchForm ? (
          <div>
            <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--gb-text)', marginBottom: 2 }}>New Branch</div>
            <div style={{ fontSize: 10.5, color: 'var(--gb-text3)', marginBottom: 8 }}>Creates the branch & drops its location pin.</div>
            <input value={branchForm.name} onChange={(e) => setBranchForm({ ...branchForm, name: e.target.value })} placeholder="Branch name *"
              style={{ width: '100%', padding: '7px 9px', fontSize: 12, border: '1.5px solid var(--gb-border)', borderRadius: 6, marginBottom: 6, fontFamily: 'inherit', outline: 'none', background: 'var(--gb-surface)', color: 'var(--gb-text)' }} />
            <input value={branchForm.email} onChange={(e) => setBranchForm({ ...branchForm, email: e.target.value })} placeholder="Email *"
              style={{ width: '100%', padding: '7px 9px', fontSize: 12, border: '1.5px solid var(--gb-border)', borderRadius: 6, marginBottom: 6, fontFamily: 'inherit', outline: 'none', background: 'var(--gb-surface)', color: 'var(--gb-text)' }} />
            <input value={branchForm.phone} onChange={(e) => setBranchForm({ ...branchForm, phone: e.target.value })} placeholder="Phone (login) *"
              style={{ width: '100%', padding: '7px 9px', fontSize: 12, border: '1.5px solid var(--gb-border)', borderRadius: 6, marginBottom: 6, fontFamily: 'inherit', outline: 'none', background: 'var(--gb-surface)', color: 'var(--gb-text)' }} />
            <input value={branchForm.pincode} onChange={(e) => setBranchForm({ ...branchForm, pincode: e.target.value })} placeholder="Pincode (for map accuracy)"
              style={{ width: '100%', padding: '7px 9px', fontSize: 12, border: '1.5px solid var(--gb-border)', borderRadius: 6, marginBottom: 8, fontFamily: 'inherit', outline: 'none', background: 'var(--gb-surface)', color: 'var(--gb-text)' }} />
            <div style={{ display: 'flex', gap: 6 }}>
              <button onClick={createBranch} disabled={branchSaving}
                style={{ flex: 1, padding: '9px', borderRadius: 8, border: 'none', background: 'var(--gb-primary)', color: '#fff', fontWeight: 700, fontSize: 12, cursor: branchSaving ? 'not-allowed' : 'pointer', opacity: branchSaving ? 0.5 : 1, fontFamily: 'inherit' }}>
                {branchSaving ? 'Creating…' : 'Create Branch'}
              </button>
              <button onClick={() => { setShowBranchForm(false); setBranchForm({ name: '', email: '', phone: '', pincode: '' }) }}
                style={{ flex: 1, padding: '9px', borderRadius: 8, border: '1.5px solid var(--gb-border)', background: 'var(--gb-surface)', color: 'var(--gb-text)', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>Back</button>
            </div>
          </div>
        ) : (
          <div>
            <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--gb-text)', marginBottom: 8 }}>New Location</div>
            <select value={selBranch} onChange={(e) => setSelBranch(e.target.value)}
              style={{ width: '100%', padding: '8px 10px', fontSize: 12, border: '1.5px solid var(--gb-border)', borderRadius: 6, marginBottom: 8, fontFamily: 'inherit', outline: 'none', background: 'var(--gb-surface)', color: 'var(--gb-text)' }}>
              <option value="">— Choose a branch —</option>
              {availableBranches.map((b) => (
                <option key={b.id} value={b.id}>{(b.business_name || '') + (b.pincode ? ` (${b.pincode})` : '')}</option>
              ))}
            </select>
            {availableBranches.length === 0 && branches.length > 0 && <div style={{ fontSize: 11, color: 'var(--gb-text3)', marginBottom: 8 }}>All branches already added.</div>}
            {branches.length === 0 && (
              <button onClick={() => setShowBranchForm(true)}
                style={{ width: '100%', padding: '9px', borderRadius: 8, border: '1.5px solid var(--gb-border)', background: 'color-mix(in srgb, var(--gb-primary) 8%, transparent)', color: 'var(--gb-primary)', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', marginBottom: 8 }}>
                + Create branch here
              </button>
            )}
            <input value={reward} onChange={(e) => setReward(e.target.value)} placeholder="Reward text (e.g. Free Coffee)"
              style={{ width: '100%', padding: '8px 10px', fontSize: 12, border: '1.5px solid var(--gb-border)', borderRadius: 6, marginBottom: 8, fontFamily: 'inherit', outline: 'none', background: 'var(--gb-surface)', color: 'var(--gb-text)' }} />
            <div style={{ display: 'flex', gap: 6 }}>
              <button onClick={handleCreate} disabled={saving || !selBranch}
                style={{ flex: 1, padding: '9px', borderRadius: 8, border: 'none', background: 'var(--gb-primary)', color: '#fff', fontWeight: 700, fontSize: 12, cursor: saving || !selBranch ? 'not-allowed' : 'pointer', opacity: saving || !selBranch ? 0.5 : 1, fontFamily: 'inherit' }}>
                {saving ? 'Creating…' : 'Create & Drop Pin'}
              </button>
              <button onClick={() => { setShowAdd(false); setSelBranch(''); setReward(''); setShowBranchForm(false) }}
                style={{ flex: 1, padding: '9px', borderRadius: 8, border: '1.5px solid var(--gb-border)', background: 'var(--gb-surface)', color: 'var(--gb-text)', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
            </div>
          </div>
        )}
      </div>

      {/* legend (z-index 2) */}
      <div style={{ position: 'absolute', bottom: 16, right: 16, zIndex: 2, background: 'color-mix(in srgb, var(--gb-surface) 92%, transparent)', borderRadius: 10, padding: '8px 12px', fontSize: 11, color: 'var(--gb-text2)', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', fontFamily: 'inherit' }}>
        <span style={{ display: 'inline-block', width: 12, height: 12, background: 'var(--gb-primary)', borderRadius: '50% 50% 50% 0', transform: 'rotate(-45deg)', marginRight: 6, verticalAlign: 'middle' }} />
        Assigned location
      </div>

      {toast && (
        <div style={{ position: 'absolute', top: 16, left: 16, zIndex: 3, background: toast.type === 'err' ? '#fef2f2' : '#f0fdf4', color: toast.type === 'err' ? '#dc2626' : '#059669', padding: '8px 14px', borderRadius: 10, fontSize: 12, fontWeight: 600, boxShadow: '0 2px 8px rgba(0,0,0,0.12)', fontFamily: 'inherit' }}>
          {toast.msg}
        </div>
      )}
    </div>
  )
}
