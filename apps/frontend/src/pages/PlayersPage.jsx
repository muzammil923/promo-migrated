import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api'
import { useAuth } from '../context/AuthContext'
import { AvatarDisplay } from '../components/AvatarData'
import './PlayersPage.css'

function Toast({ message, type, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 4000)
    return () => clearTimeout(t)
  }, [onClose])
  return (
    <div className={`pp-toast pp-toast--${type}`}>
      <span>{message}</span>
      <button onClick={onClose}>×</button>
    </div>
  )
}

function SkeletonCard() {
  return (
    <div className="pp-skeleton-card">
      <div className="pp-skel-line pp-skel-w60" />
      <div className="pp-skel-line pp-skel-w40" />
      <div className="pp-skel-line pp-skel-w80" />
      <div className="pp-skel-line pp-skel-w30" />
    </div>
  )
}

function SkeletonTable() {
  return (
    <div className="pp-skeleton-table">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="pp-skel-row">
          <div className="pp-skel-avatar" />
          <div className="pp-skel-line pp-skel-w15" />
          <div className="pp-skel-line pp-skel-w25" />
          <div className="pp-skel-line pp-skel-w20" />
          <div className="pp-skel-line pp-skel-w10" />
          <div className="pp-skel-line pp-skel-w10" />
          <div className="pp-skel-line pp-skel-w10" />
        </div>
      ))}
    </div>
  )
}

export default function PlayersPage() {
  const navigate = useNavigate()
  const { user } = useAuth()

  const [players, setPlayers] = useState([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({ total: 0, new_month: 0, total_pc: 0, avg_pc: 0 })

  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState('created_at')
  const [sortDir, setSortDir] = useState('desc')
  const [viewMode, setViewMode] = useState('table')

  const [drawerPlayer, setDrawerPlayer] = useState(null)
  const [transactions, setTransactions] = useState([])
  const [txLoading, setTxLoading] = useState(false)

  const [showEditModal, setShowEditModal] = useState(false)
  const [editForm, setEditForm] = useState({ name: '', email: '', whatsapp: '', city: '', pincode: '', dob: '' })

  const [showPCModal, setShowPCModal] = useState(false)
  const [pcAmount, setPcAmount] = useState('')
  const [pcNote, setPcNote] = useState('')

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const [showExportConfirm, setShowExportConfirm] = useState(false)

  const [toasts, setToasts] = useState([])
  const addToast = useCallback((message, type = 'info') => {
    setToasts(prev => [...prev, { id: Date.now(), message, type }])
  }, [])
  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  useEffect(() => {
    if (!user || user.role !== 'admin') navigate('/dashboard')
  }, [user, navigate])

  useEffect(() => {
    ;(async () => {
      try {
        setLoading(true)
        const { data } = await api.get('/players-admin')
        if (data.success) {
          setPlayers(data.players)
          setStats(data.stats)
        }
      } catch {
        addToast('Failed to load players', 'error')
      } finally {
        setLoading(false)
      }
    })()
  }, [addToast])

  useEffect(() => {
    if (!drawerPlayer) return
    ;(async () => {
      setTxLoading(true)
      try {
        const { data } = await api.get(`/players-admin/${drawerPlayer.id}/transactions`)
        if (data.success) setTransactions(data.transactions)
      } catch {
        addToast('Failed to load transactions', 'error')
      } finally {
        setTxLoading(false)
      }
    })()
  }, [drawerPlayer, addToast])

  // ESC to close drawer
  useEffect(() => {
    if (!drawerPlayer) return
    const handler = (e) => { if (e.key === 'Escape') setDrawerPlayer(null) }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [drawerPlayer])

  const toggleSort = (col) => {
    if (sortBy === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortBy(col); setSortDir(col === 'name' || col === 'email' ? 'asc' : 'desc') }
  }

  const filtered = useMemo(() => {
    let list = [...players]
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase()
      list = list.filter(p =>
        (p.name || '').toLowerCase().includes(q) ||
        (p.username || '').toLowerCase().includes(q) ||
        (p.email || '').toLowerCase().includes(q) ||
        (p.whatsapp || '').includes(searchQuery.trim())
      )
    }
    list.sort((a, b) => {
      if (sortBy === 'created_at' || sortBy === 'dob') {
        const da = a[sortBy] ? new Date(a[sortBy]).getTime() : 0
        const db2 = b[sortBy] ? new Date(b[sortBy]).getTime() : 0
        return sortDir === 'asc' ? da - db2 : db2 - da
      }
      if (sortBy === 'pc_balance') {
        return sortDir === 'asc' ? (a.pc_balance || 0) - (b.pc_balance || 0) : (b.pc_balance || 0) - (a.pc_balance || 0)
      }
      const va = (a[sortBy] || '').toString().toLowerCase()
      const vb = (b[sortBy] || '').toString().toLowerCase()
      return sortDir === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va)
    })
    return list
  }, [players, searchQuery, sortBy, sortDir])

  const doExport = () => {
    const headers = ['Name','Username','Email','WhatsApp','City','Pincode','PC Balance','DOB','Registered']
    const rows = filtered.map(p => [
      p.name, p.username, p.email, p.whatsapp, p.city, p.pincode,
      p.pc_balance, p.dob || '', p.created_at ? new Date(p.created_at).toLocaleDateString('en-IN') : ''
    ])
    const csv = [headers, ...rows].map(r => r.map(c => `"${String(c ?? '').replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `players-${new Date().toISOString().slice(0,10)}.csv`; a.click()
    URL.revokeObjectURL(url)
    setShowExportConfirm(false)
    addToast(`Exported ${filtered.length} players`, 'success')
  }

  const openEditModal = (p) => {
    setEditForm({ name: p.name || '', email: p.email || '', whatsapp: p.whatsapp || '', city: p.city || '', pincode: p.pincode || '', dob: p.dob ? p.dob.slice(0,10) : '' })
    setShowEditModal(true)
  }

  const saveEdit = async (e) => {
    e.preventDefault()
    try {
      const { data } = await api.put(`/players-admin/${drawerPlayer.id}`, editForm)
      if (data.success) {
        setPlayers(prev => prev.map(p => p.id === drawerPlayer.id ? { ...p, ...editForm } : p))
        setDrawerPlayer(prev => ({ ...prev, ...editForm }))
        setShowEditModal(false)
        addToast('Player updated', 'success')
      }
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to update player', 'error')
    }
  }

  const savePC = async (e) => {
    e.preventDefault()
    const num = Number(pcAmount)
    if (!num) { addToast('Enter an amount', 'error'); return }
    try {
      const { data } = await api.post(`/players-admin/${drawerPlayer.id}/adjust-pc`, { amount: num, note: pcNote })
      if (data.success) {
        setPlayers(prev => prev.map(p => p.id === drawerPlayer.id ? { ...p, pc_balance: data.pc_balance } : p))
        setDrawerPlayer(prev => ({ ...prev, pc_balance: data.pc_balance }))
        setShowPCModal(false)
        setPcAmount(''); setPcNote('')
        addToast(num > 0 ? `Added ${num} PC` : `Deducted ${Math.abs(num)} PC`, 'success')
      }
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to adjust PC', 'error')
    }
  }

  const confirmDelete = async () => {
    try {
      const { data } = await api.delete(`/players-admin/${drawerPlayer.id}`)
      if (data.success) {
        setPlayers(prev => prev.filter(p => p.id !== drawerPlayer.id))
        setDrawerPlayer(null)
        setShowDeleteConfirm(false)
        addToast('Player deleted', 'success')
      }
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to delete player', 'error')
    }
  }

  const SortIcon = ({ col }) => {
    if (sortBy !== col) return <span className="pp-sort-icon">⇅</span>
    return <span className="pp-sort-icon pp-sort-active">{sortDir === 'asc' ? '↑' : '↓'}</span>
  }

  const formatDate = (d) => {
    if (!d) return '—'
    return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
  }

  return (
    <div className="pp-page">
      {/* ── Toasts ── */}
      <div className="pp-toast-container">
        {toasts.map(t => <Toast key={t.id} {...t} onClose={() => removeToast(t.id)} />)}
      </div>

      {/* ── Header ── */}
      <div className="pp-header">
        <div>
          <h1 className="pp-title">Promo Players</h1>
          <p className="pp-subtitle">Manage registered promo-code players and their PC balances</p>
        </div>
        <div className="pp-header-actions">
          <button
            className="pp-btn pp-btn-outline"
            onClick={() => setShowExportConfirm(true)}
            disabled={loading || !filtered.length}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
            Export CSV
          </button>
        </div>
      </div>

      {/* ── Stats ── */}
      <div className="pp-stats">
        <div className="pp-stat-card">
          <div className="pp-stat-icon pp-stat-blue">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4-4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>
          </div>
          <div className="pp-stat-body">
            <span className="pp-stat-value">{stats.total}</span>
            <span className="pp-stat-label">Total Players</span>
          </div>
        </div>
        <div className="pp-stat-card">
          <div className="pp-stat-icon pp-stat-green">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 00-8 0v2"/><circle cx="10" cy="7" r="4"/><path d="M22 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>
          </div>
          <div className="pp-stat-body">
            <span className="pp-stat-value">{stats.new_month}</span>
            <span className="pp-stat-label">New (30 days)</span>
          </div>
        </div>
        <div className="pp-stat-card">
          <div className="pp-stat-icon pp-stat-purple">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
          </div>
          <div className="pp-stat-body">
            <span className="pp-stat-value">{Number(stats.total_pc || 0).toLocaleString()}</span>
            <span className="pp-stat-label">Total PC Issued</span>
          </div>
        </div>
        <div className="pp-stat-card">
          <div className="pp-stat-icon pp-stat-amber">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
          </div>
          <div className="pp-stat-body">
            <span className="pp-stat-value">{Number(stats.avg_pc || 0).toLocaleString()}</span>
            <span className="pp-stat-label">Avg PC / Player</span>
          </div>
        </div>
      </div>

      {/* ── Search / View bar ── */}
      <div className="pp-controls">
        <div className="pp-search-wrap">
          <svg className="pp-search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
          <input
            type="text"
            className="pp-search"
            placeholder="Search by name, username, email or WhatsApp…"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button className="pp-search-clear" onClick={() => setSearchQuery('')} title="Clear search">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          )}
        </div>
        <div className="pp-view-toggle">
          <button
            className={`pp-view-btn ${viewMode === 'table' ? 'active' : ''}`}
            onClick={() => setViewMode('table')}
            title="Table view"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
          </button>
          <button
            className={`pp-view-btn ${viewMode === 'cards' ? 'active' : ''}`}
            onClick={() => setViewMode('cards')}
            title="Card view"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>
          </button>
        </div>
      </div>

      {/* ── Content ── */}
      {loading ? (
        viewMode === 'table' ? <SkeletonTable /> : (
          <div className="pp-cards-grid">
            {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        )
      ) : !players.length ? (
        <div className="pp-empty">
          <div className="pp-empty-icon">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4-4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>
          </div>
          <h2 className="pp-empty-title">No Players Yet</h2>
          <p className="pp-empty-desc">Players will appear here once they register via promo games.</p>
        </div>
      ) : !filtered.length ? (
        <div className="pp-empty">
          <div className="pp-empty-icon">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/><line x1="8" y1="11" x2="14" y2="11"/></svg>
          </div>
          <h2 className="pp-empty-title">No Players Found</h2>
          <p className="pp-empty-desc">Try adjusting your search query.</p>
        </div>
      ) : viewMode === 'table' ? (
        <div className="pp-table-wrap">
          <table className="pp-table">
            <thead>
              <tr>
                <th>Player</th>
                <th onClick={() => toggleSort('username')}>Username <SortIcon col="username" /></th>
                <th onClick={() => toggleSort('email')}>Email <SortIcon col="email" /></th>
                <th onClick={() => toggleSort('whatsapp')}>WhatsApp <SortIcon col="whatsapp" /></th>
                <th>City</th>
                <th onClick={() => toggleSort('pc_balance')}>PC Balance <SortIcon col="pc_balance" /></th>
                <th onClick={() => toggleSort('created_at')}>Joined <SortIcon col="created_at" /></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(p => (
                <tr key={p.id} className="pp-row" onClick={() => setDrawerPlayer(p)}>
                  <td>
                    <div className="pp-cell-player">
                      <AvatarDisplay avatarId={p.avatar_id} size={36} />
                      <div className="pp-cell-info">
                        <span className="pp-cell-name">{p.name || '—'}</span>
                      </div>
                    </div>
                  </td>
                  <td className="pp-cell-username">{p.username || '—'}</td>
                  <td className="pp-cell-email">{p.email || '—'}</td>
                  <td className="pp-cell-wa">{p.whatsapp || '—'}</td>
                  <td>{p.city || '—'}</td>
                  <td>
                    <span className={`pp-badge ${p.pc_balance > 0 ? 'pp-badge--green' : ''}`}>{p.pc_balance ?? 0}</span>
                  </td>
                  <td className="pp-cell-date">{formatDate(p.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="pp-cards-grid">
          {filtered.map(p => (
            <div key={p.id} className="pp-card" onClick={() => setDrawerPlayer(p)}>
              <div className="pp-card-top">
                <AvatarDisplay avatarId={p.avatar_id} size={48} />
                <div className="pp-card-info">
                  <h3 className="pp-card-name">{p.name || 'Unnamed'}</h3>
                  {p.username && <span className="pp-card-username">@{p.username}</span>}
                </div>
                <span className={`pp-badge pp-badge--right ${p.pc_balance > 0 ? 'pp-badge--green' : ''}`}>
                  {p.pc_balance ?? 0} PC
                </span>
              </div>
              <div className="pp-card-details">
                <span className="pp-card-detail">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/></svg>
                  {p.whatsapp || '—'}
                </span>
                <span className="pp-card-detail">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
                  {p.city || '—'}
                </span>
                <span className="pp-card-detail">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                  {formatDate(p.created_at)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Player Detail Drawer ── */}
      {drawerPlayer && (
        <div className="pp-overlay" onClick={() => setDrawerPlayer(null)}>
          <div className="pp-drawer" onClick={e => e.stopPropagation()}>
            <div className="pp-drawer-header">
              <div className="pp-drawer-title-row">
                <AvatarDisplay avatarId={drawerPlayer.avatar_id} size={48} />
                <div>
                  <h2 className="pp-drawer-name">{drawerPlayer.name || 'Unnamed'}</h2>
                  {drawerPlayer.username && <span className="pp-drawer-username">@{drawerPlayer.username}</span>}
                </div>
              </div>
              <button className="pp-drawer-close" onClick={() => setDrawerPlayer(null)}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>

            <div className="pp-drawer-stats">
              <div className="pp-drawer-stat">
                <span className="pp-drawer-stat-value">{drawerPlayer.pc_balance ?? 0}</span>
                <span className="pp-drawer-stat-label">PC Balance</span>
              </div>
              <div className="pp-drawer-stat">
                <span className="pp-drawer-stat-value">{formatDate(drawerPlayer.created_at)}</span>
                <span className="pp-drawer-stat-label">Joined</span>
              </div>
              {drawerPlayer.dob && (
                <div className="pp-drawer-stat">
                  <span className="pp-drawer-stat-value">{formatDate(drawerPlayer.dob)}</span>
                  <span className="pp-drawer-stat-label">Date of Birth</span>
                </div>
              )}
            </div>

            <div className="pp-drawer-details">
              <div className="pp-drawer-detail"><span className="pp-drawer-detail-label">Email</span><span>{drawerPlayer.email || '—'}</span></div>
              <div className="pp-drawer-detail"><span className="pp-drawer-detail-label">WhatsApp</span><span>{drawerPlayer.whatsapp || '—'}</span></div>
              <div className="pp-drawer-detail"><span className="pp-drawer-detail-label">City</span><span>{drawerPlayer.city || '—'}</span></div>
              <div className="pp-drawer-detail"><span className="pp-drawer-detail-label">Pincode</span><span>{drawerPlayer.pincode || '—'}</span></div>
            </div>

            <div className="pp-drawer-actions">
              <button className="pp-btn pp-btn-primary" onClick={() => openEditModal(drawerPlayer)}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                Edit
              </button>
              <button className="pp-btn pp-btn-green" onClick={() => { setPcAmount(''); setPcNote(''); setShowPCModal(true) }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
                Add / Deduct PC
              </button>
              <button className="pp-btn pp-btn-red" onClick={() => setShowDeleteConfirm(true)}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
                Delete
              </button>
            </div>

            <div className="pp-drawer-section">
              <h3 className="pp-drawer-section-title">Transaction History</h3>
              {txLoading ? (
                <div className="pp-tx-loading">Loading…</div>
              ) : !transactions.length ? (
                <div className="pp-tx-empty">No transactions yet.</div>
              ) : (
                <div className="pp-tx-list">
                  {transactions.map(tx => (
                    <div key={tx.id} className="pp-tx-row">
                      <div className={`pp-tx-icon ${tx.type === 'bonus' || tx.type === 'redeem' ? 'pp-tx-green' : 'pp-tx-red'}`}>
                        {tx.type === 'bonus' || tx.type === 'redeem'
                          ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/></svg>
                          : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="5" y1="12" x2="19" y2="12"/></svg>}
                      </div>
                      <div className="pp-tx-body">
                        <span className="pp-tx-type">{tx.type}</span>
                        <span className="pp-tx-note">{tx.note || '—'}</span>
                      </div>
                      <div className="pp-tx-right">
                        <span className={`pp-tx-amount ${tx.points > 0 ? 'pp-tx-pos' : 'pp-tx-neg'}`}>
                          {tx.points > 0 ? '+' : ''}{tx.points} PC
                        </span>
                        <span className="pp-tx-date">{formatDate(tx.created_at)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Edit Modal ── */}
      {showEditModal && (
        <div className="pp-overlay" onClick={() => setShowEditModal(false)}>
          <div className="pp-modal" onClick={e => e.stopPropagation()}>
            <h2 className="pp-modal-title">Edit Player</h2>
            <form onSubmit={saveEdit}>
              <div className="pp-form-group"><label>Full Name *</label><input required value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} /></div>
              <div className="pp-form-group"><label>Email</label><input type="email" value={editForm.email} onChange={e => setEditForm({ ...editForm, email: e.target.value })} /></div>
              <div className="pp-form-group"><label>WhatsApp</label><input value={editForm.whatsapp} onChange={e => setEditForm({ ...editForm, whatsapp: e.target.value })} /></div>
              <div className="pp-form-row">
                <div className="pp-form-group"><label>City</label><input value={editForm.city} onChange={e => setEditForm({ ...editForm, city: e.target.value })} /></div>
                <div className="pp-form-group"><label>Pincode</label><input value={editForm.pincode} onChange={e => setEditForm({ ...editForm, pincode: e.target.value })} /></div>
              </div>
              <div className="pp-form-group"><label>Date of Birth</label><input type="date" value={editForm.dob} onChange={e => setEditForm({ ...editForm, dob: e.target.value })} /></div>
              <div className="pp-modal-actions">
                <button type="button" className="pp-btn pp-btn-outline" onClick={() => setShowEditModal(false)}>Cancel</button>
                <button type="submit" className="pp-btn pp-btn-primary">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Add / Deduct PC Modal ── */}
      {showPCModal && (
        <div className="pp-overlay" onClick={() => setShowPCModal(false)}>
          <div className="pp-modal pp-modal--sm" onClick={e => e.stopPropagation()}>
            <h2 className="pp-modal-title">Add / Deduct PC</h2>
            <form onSubmit={savePC}>
              <div className="pp-form-group">
                <label>Amount (use negative to deduct)</label>
                <input type="number" required value={pcAmount} onChange={e => setPcAmount(e.target.value)} placeholder="e.g. 50 or -20" />
              </div>
              <div className="pp-form-group"><label>Note (optional)</label><input value={pcNote} onChange={e => setPcNote(e.target.value)} placeholder="Reason for adjustment" /></div>
              <div className="pp-modal-actions">
                <button type="button" className="pp-btn pp-btn-outline" onClick={() => setShowPCModal(false)}>Cancel</button>
                <button type="submit" className="pp-btn pp-btn-green">Confirm</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Delete Confirmation ── */}
      {showDeleteConfirm && (
        <div className="pp-overlay" onClick={() => setShowDeleteConfirm(false)}>
          <div className="pp-modal pp-modal--sm" onClick={e => e.stopPropagation()}>
            <div className="pp-delete-icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
            </div>
            <h2 className="pp-modal-title">Delete Player?</h2>
            <p className="pp-delete-text">This will permanently remove <strong>{drawerPlayer?.name}</strong> and all their transaction history. This cannot be undone.</p>
            <div className="pp-modal-actions">
              <button className="pp-btn pp-btn-outline" onClick={() => setShowDeleteConfirm(false)}>Cancel</button>
              <button className="pp-btn pp-btn-red" onClick={confirmDelete}>Yes, Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Export Confirmation ── */}
      {showExportConfirm && (
        <div className="pp-overlay" onClick={() => setShowExportConfirm(false)}>
          <div className="pp-modal pp-modal--sm" onClick={e => e.stopPropagation()}>
            <div className="pp-delete-icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
            </div>
            <h2 className="pp-modal-title">Export Players?</h2>
            <p className="pp-delete-text">This will download a CSV of <strong>{filtered.length}</strong> player{filtered.length !== 1 ? 's' : ''}.</p>
            <div className="pp-modal-actions">
              <button className="pp-btn pp-btn-outline" onClick={() => setShowExportConfirm(false)}>Cancel</button>
              <button className="pp-btn pp-btn-primary" onClick={doExport}>Export</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
