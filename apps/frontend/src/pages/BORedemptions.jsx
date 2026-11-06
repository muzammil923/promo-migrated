import { useState, useEffect, useCallback, useMemo } from 'react'
import api from '../api'
import { statusColor, statusLabel, canAct } from './boUtils'
import LogoLoader from '../components/LogoLoader'
import {
  Search, AlertTriangle, Phone, Mail, MapPin, Gamepad2,
  ChevronDown, ClipboardList, X, Bell, Filter, ChevronLeft,
  ChevronRight, Gift, CheckCircle2, Clock, Users, XCircle, Eye
} from 'lucide-react'

const parsePlayerData = (raw) => {
  try { return typeof raw === 'string' ? JSON.parse(raw) : (raw || {}) }
  catch { return {} }
}

const REDEMPTION_CSS = `
@keyframes fadeIn { from{opacity:0} to{opacity:1} }
@keyframes boCardIn { from{opacity:0;transform:translateY(16px) scale(0.98)} to{opacity:1;transform:none} }
@keyframes boShimmer { 0%{background-position:-200% 0} 100%{background-position:200% 0} }

/* Stat cards */
.redemption-stat {
  background:#fff; border:1px solid #f0eef5; border-radius:20px;
  padding:24px; display:flex; align-items:flex-start; gap:16px;
  transition:all 0.25s cubic-bezier(.4,0,.2,1);
  animation:boCardIn .4s cubic-bezier(.4,0,.2,1) both;
  position:relative; overflow:hidden;
}
.redemption-stat::after {
  content:''; position:absolute; top:0; left:0; bottom:0; width:4px;
  border-radius:0 4px 4px 0;
}
.redemption-stat:nth-child(1)::after { background:linear-gradient(180deg,#f59e0b,#f97316); }
.redemption-stat:nth-child(2)::after { background:linear-gradient(180deg,#10b981,#059669); }
.redemption-stat:nth-child(3)::after { background:linear-gradient(180deg,#3b82f6,#2563eb); }
.redemption-stat:nth-child(4)::after { background:linear-gradient(180deg,#8F2CFF,#6E11D8); }
.redemption-stat:nth-child(1) { animation-delay:0s; }
.redemption-stat:nth-child(2) { animation-delay:.05s; }
.redemption-stat:nth-child(3) { animation-delay:.1s; }
.redemption-stat:nth-child(4) { animation-delay:.15s; }
.redemption-stat:hover { transform:translateY(-2px); box-shadow:0 8px 24px rgba(0,0,0,0.06); }
.redemption-stat-icon {
  width:48px; height:48px; border-radius:14px; display:flex; align-items:center; justify-content:center;
  flex-shrink:0;
}
.redemption-stat-value { font-size:32px; font-weight:800; letter-spacing:-1px; line-height:1; }
.redemption-stat-label { font-size:13px; font-weight:600; color:#64748b; margin-top:2px; }
.redemption-stat-sub { font-size:12px; color:#94a3b8; margin-top:4px; font-weight:500; }

/* Search & filters */
.redemption-search-bar {
  background:#fff; border:1.5px solid #f0eef5; border-radius:16px;
  display:flex; align-items:center; gap:12px; padding:8px 8px 8px 20px;
  transition:all 0.2s; box-shadow:0 2px 8px rgba(0,0,0,0.03);
}
.redemption-search-bar:focus-within { border-color:#8F2CFF; box-shadow:0 0 0 4px rgba(143,44,255,0.08); }
.redemption-search-input {
  flex:1; border:none; outline:none; font-size:14px; font-weight:500;
  color:#1e1b4b; font-family:inherit; background:transparent; min-width:0;
}
.redemption-search-input::placeholder { color:#94a3b8; }
.redemption-filter-btn {
  display:flex; align-items:center; gap:6px; padding:10px 16px;
  border-radius:12px; border:1px solid #f0eef5; background:#fff;
  font-size:13px; font-weight:600; color:#64748b; cursor:pointer;
  font-family:inherit; transition:all 0.2s; white-space:nowrap;
}
.redemption-filter-btn:hover { border-color:#e0d9f5; color:#8F2CFF; }
.redemption-filter-btn.active { background:#f8f7ff; border-color:#8F2CFF; color:#8F2CFF; }
.redemption-dropdown {
  position:relative; display:inline-flex;
}
.redemption-dropdown-menu {
  position:absolute; top:calc(100% + 6px); left:0; background:#fff;
  border:1px solid #f0eef5; border-radius:14px; padding:6px;
  min-width:180px; box-shadow:0 12px 40px rgba(0,0,0,0.1);
  animation:fadeIn .15s ease; z-index:50;
}
.redemption-dropdown-item {
  display:flex; align-items:center; gap:8px; width:100%; padding:10px 14px;
  border:none; background:none; color:#374151; font-size:13px; font-weight:600;
  text-align:left; cursor:pointer; border-radius:10px; font-family:inherit;
  transition:all 0.15s;
}
.redemption-dropdown-item:hover { background:#f8f7ff; color:#8F2CFF; }

/* Chips */
.redemption-chips { display:flex; flex-wrap:wrap; gap:8px; margin-top:16px; }
.redemption-chip {
  display:inline-flex; align-items:center; gap:6px; padding:8px 16px;
  border-radius:100px; font-size:13px; font-weight:600; cursor:pointer;
  border:1.5px solid transparent; transition:all 0.2s; user-select:none;
}
.redemption-chip:hover { transform:translateY(-1px); }
.redemption-chip.active { box-shadow:0 2px 8px rgba(0,0,0,0.08); }
.redemption-chip-count {
  font-size:11px; padding:1px 7px; border-radius:100px; font-weight:700;
}

/* Cards grid */
.redemption-card {
  background:#fff; border:1px solid #f0eef5; border-radius:20px;
  padding:0; overflow:hidden; transition:all 0.3s cubic-bezier(.4,0,.2,1);
  animation:boCardIn .4s cubic-bezier(.4,0,.2,1) both;
  display:flex; flex-direction:column;
}
.redemption-card:hover {
  transform:translateY(-4px); box-shadow:0 12px 32px rgba(143,44,255,0.1),0 4px 12px rgba(0,0,0,0.04);
  border-color:#e0d9f5;
}
.redemption-card-header {
  padding:20px 20px 0; display:flex; align-items:flex-start; gap:14px;
}
.redemption-card-avatar {
  width:48px; height:48px; border-radius:14px; flex-shrink:0;
  display:flex; align-items:center; justify-content:center;
  font-size:16px; font-weight:800; color:#fff;
  background:linear-gradient(135deg,#8F2CFF,#6E11D8);
}
.redemption-card-name { font-size:15px; font-weight:700; color:#1e1b4b; line-height:1.3; }
.redemption-card-badge {
  display:inline-flex; align-items:center; gap:5px; padding:4px 12px;
  border-radius:100px; font-size:11px; font-weight:700; white-space:nowrap;
  flex-shrink:0; margin-left:auto;
}
.redemption-card-body { padding:14px 20px; flex:1; }
.redemption-card-info {
  display:flex; flex-direction:column; gap:6px; font-size:12px; color:#64748b;
}
.redemption-card-info-row { display:flex; align-items:center; gap:8px; }
.redemption-card-info-row svg { color:#c4b5fd; flex-shrink:0; }
.redemption-card-info-row span { overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.redemption-card-gift {
  width:44px; height:44px; border-radius:12px; flex-shrink:0;
  background:linear-gradient(135deg,#f5f3ff,#ede9fe);
  display:flex; align-items:center; justify-content:center;
  margin-left:auto; align-self:center;
}
.redemption-card-footer {
  padding:14px 20px; border-top:1px solid #f8f7ff;
  display:flex; align-items:center; justify-content:space-between;
}
.redemption-card-date { font-size:11px; color:#94a3b8; font-weight:500; display:flex; align-items:center; gap:5px; }
.redemption-card-action {
  font-size:13px; font-weight:600; color:#8F2CFF; cursor:pointer;
  display:flex; align-items:center; gap:4px; background:none; border:none;
  font-family:inherit; transition:all 0.2s; padding:0;
}
.redemption-card-action:hover { gap:8px; color:#6E11D8; }

/* Pagination */
.redemption-pagination {
  display:flex; align-items:center; justify-content:center; gap:6px; margin-top:28px;
}
.redemption-page-btn {
  width:40px; height:40px; border-radius:12px; border:1px solid #f0eef5;
  background:#fff; color:#64748b; font-size:13px; font-weight:600;
  cursor:pointer; font-family:inherit; display:flex; align-items:center;
  justify-content:center; transition:all 0.2s;
}
.redemption-page-btn:hover { border-color:#e0d9f5; color:#8F2CFF; }
.redemption-page-btn.active {
  background:linear-gradient(135deg,#8F2CFF,#6E11D8); color:#fff;
  border-color:transparent; box-shadow:0 4px 12px rgba(143,44,255,0.3);
}
.redemption-page-btn:disabled { opacity:0.4; cursor:not-allowed; }
.redemption-per-page {
  display:flex; align-items:center; gap:8px; font-size:13px; color:#64748b; font-weight:500;
}
.redemption-per-page select {
  padding:8px 12px; border-radius:10px; border:1px solid #f0eef5;
  font-size:13px; font-weight:600; color:#1e1b4b; font-family:inherit;
  background:#fff; cursor:pointer; outline:none;
}

/* Toast */
.bo-toast {
  position:fixed; top:80px; right:24px; z-index:9999;
  background:#ffffff; border:1px solid #f0eef5;
  border-radius:16px; padding:18px 22px; max-width:360px; width:calc(100% - 48px);
  box-shadow:0 12px 40px rgba(143,44,255,0.12);
  animation:fadeIn .25s cubic-bezier(.4,0,.2,1);
}
.bo-toast.success{border-left:4px solid #10b981}
.bo-toast.error{border-left:4px solid #ef4444}

/* Modal */
.bo-modal-overlay{position:fixed;inset:0;background:rgba(17,24,39,0.4);backdrop-filter:blur(6px);z-index:9998;display:flex;align-items:center;justify-content:center;animation:fadeIn .15s ease}
.bo-modal{background:#fff;border-radius:24px;padding:32px;max-width:440px;width:calc(100% - 32px);box-shadow:0 24px 64px rgba(0,0,0,0.15);animation:boCardIn .3s cubic-bezier(.4,0,.2,1)}

/* Responsive */
@media(max-width:1200px){.redemption-grid{grid-template-columns:repeat(2,1fr) !important}}
@media(max-width:768px){.redemption-grid{grid-template-columns:1fr !important}}
@media(max-width:640px){
  .redemption-stats-grid{grid-template-columns:repeat(2,1fr) !important}
  .redemption-search-bar{flex-wrap:wrap}
  .redemption-card-header{flex-wrap:wrap}
}
@media(max-width:400px){.redemption-stats-grid{grid-template-columns:1fr !important}}
`

const ITEMS_PER_PAGE_OPTIONS = [6, 10, 15, 25]

export default function BORedemptions() {
  const [redemptions, setRedemptions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [sortBy, setSortBy] = useState('newest')
  const [showStatusDrop, setShowStatusDrop] = useState(false)
  const [showSortDrop, setShowSortDrop] = useState(false)
  const [perPage, setPerPage] = useState(10)
  const [page, setPage] = useState(1)
  const [expandedId, setExpandedId] = useState(null)

  const [toast, setToast] = useState(null)
  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }, [])

  const [verifyModal, setVerifyModal] = useState(null)
  const [acceptCode, setAcceptCode] = useState('')
  const [acceptError, setAcceptError] = useState('')
  const [acceptSubmitting, setAcceptSubmitting] = useState(false)
  const [rejectModal, setRejectModal] = useState(null)
  const [rejectReason, setRejectReason] = useState('')

  // The BOLayout shell already polls /business/notifications at 5s and owns
  // that endpoint. This page should not call it directly — that would require no
  // real BO login to keep hitting the API, and would duplicate the shell's polls.
  const fetchRedemptions = () => {
    /* Shell-driven: the shell provides redemptions via props; this is a no-op here. */
  }

  // Stats
  const stats = useMemo(() => {
    const now = new Date()
    const pad = n => String(n).padStart(2, '0')
    const localDate = d => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`
    const todayStr = localDate(now)
    return {
      pending: redemptions.filter(r => ['pending','code_revealed','code_entered'].includes(r.status)).length,
      completed: redemptions.filter(r => ['completed','player_confirmed'].includes(r.status)).length,
      today: redemptions.filter(r => r.created_at && localDate(new Date(r.created_at)) === todayStr).length,
      total: redemptions.length,
    }
  }, [redemptions])

  // Filter & sort
  const filtered = useMemo(() => {
    let list = [...redemptions]
    const q = search.toLowerCase().trim()
    if (q) {
      list = list.filter(r =>
        r.player_name?.toLowerCase().includes(q) ||
        r.player_email?.toLowerCase().includes(q)
      )
    }
    if (statusFilter !== 'all') {
      if (statusFilter === 'with_code') list = list.filter(r => r.has_code)
      else if (statusFilter === 'without_code') list = list.filter(r => !r.has_code)
      else list = list.filter(r => r.status === statusFilter)
    }
    if (sortBy === 'newest') list.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    else if (sortBy === 'oldest') list.sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
    else if (sortBy === 'name') list.sort((a, b) => (a.player_name || '').localeCompare(b.player_name || ''))
    return list
  }, [redemptions, search, statusFilter, sortBy])

  const totalPages = Math.ceil(filtered.length / perPage)
  const paged = filtered.slice((page - 1) * perPage, page * perPage)

  useEffect(() => { setPage(1) }, [search, statusFilter, sortBy, perPage])

  const chipCounts = useMemo(() => ({
    all: redemptions.length,
    pending: redemptions.filter(r => r.status === 'pending').length,
    completed: redemptions.filter(r => r.status === 'completed' || r.status === 'player_confirmed').length,
    code_revealed: redemptions.filter(r => r.status === 'code_revealed').length,
    rejected: redemptions.filter(r => r.status === 'rejected').length,
    with_code: redemptions.filter(r => r.has_code).length,
    without_code: redemptions.filter(r => !r.has_code).length,
  }), [redemptions])

  const chips = [
    { key:'all', label:'All', color:'#8F2CFF', bg:'#f5f3ff', count: chipCounts.all },
    { key:'pending', label:'Pending', color:'#f59e0b', bg:'#fffbeb', count: chipCounts.pending },
    { key:'completed', label:'Completed', color:'#10b981', bg:'#ecfdf5', count: chipCounts.completed },
    { key:'code_revealed', label:'Ready', color:'#3b82f6', bg:'#eff6ff', count: chipCounts.code_revealed },
    { key:'rejected', label:'Failed', color:'#ef4444', bg:'#fef2f2', count: chipCounts.rejected },
    { key:'with_code', label:'With Code', color:'#8F2CFF', bg:'#f5f3ff', count: chipCounts.with_code },
    { key:'without_code', label:'Without Code', color:'#64748b', bg:'#f8fafc', count: chipCounts.without_code },
  ]

  const statusBadgeStyle = (status) => {
    const map = {
      pending: { bg:'#fffbeb', color:'#d97706', icon: Clock },
      code_revealed: { bg:'#eff6ff', color:'#2563eb', icon: CheckCircle2 },
      code_entered: { bg:'#f5f3ff', color:'#8F2CFF', icon: CheckCircle2 },
      player_confirmed: { bg:'#ecfdf5', color:'#059669', icon: CheckCircle2 },
      completed: { bg:'#ecfdf5', color:'#059669', icon: CheckCircle2 },
      rejected: { bg:'#fef2f2', color:'#dc2626', icon: XCircle },
    }
    return map[status] || { bg:'#f8fafc', color:'#64748b', icon: Clock }
  }

  const formatDate = (d) => {
    if (!d) return ''
    const dt = new Date(d)
    const day = dt.getDate()
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
    const month = months[dt.getMonth()]
    const year = dt.getFullYear()
    const time = dt.toLocaleTimeString('en-US', { hour:'2-digit', minute:'2-digit', hour12: true })
    return `${day} ${month} ${year} · ${time}`
  }

  const getInitials = (name) => {
    if (!name) return '?'
    const parts = name.trim().split(/\s+/)
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
    return parts[0].substring(0, 2).toUpperCase()
  }

  const handleAccept = async (redemption) => {
    setVerifyModal(redemption)
    setAcceptCode('')
    setAcceptError('')
  }

  const submitVerify = async () => {
    if (!verifyModal) return
    setAcceptSubmitting(true)
    setAcceptError('')
    try {
      const payload = { redemption_id: verifyModal.id }
      if (acceptCode.length === 6) payload.code = acceptCode
      const { data } = await api.post('/business/accept-with-code', payload)
      if (data.success) {
        setVerifyModal(null)
        setAcceptCode('')
        showToast(acceptCode.length === 6 ? 'Code verified & accepted' : 'Redemption accepted')
        fetchRedemptions()
      }
    } catch (err) {
      setAcceptError(err.response?.data?.message || 'Failed to accept')
    } finally {
      setAcceptSubmitting(false)
    }
  }

  const openRejectModal = (redemption) => {
    setRejectModal(redemption)
    setRejectReason('')
  }

  const handleReject = async () => {
    if (!rejectModal) return
    try {
      const { data } = await api.post('/business/reject-redemption', {
        redemption_id: rejectModal.id, reason: rejectReason || null,
      })
      if (data.success) {
        setRejectModal(null)
        setRejectReason('')
        showToast('Redemption rejected')
        fetchRedemptions()
      }
    } catch {
      showToast('Failed to reject', 'error')
    }
  }

  if (loading) return (
    <div style={{ textAlign:'center', padding:80, fontFamily:'Inter, sans-serif' }}>
      <div style={{ display:'flex', justifyContent:'center', marginBottom:12 }}><LogoLoader size={40} /></div>
      <div style={{ color:'#94a3b8', fontSize:14, fontWeight:500 }}>Loading redemptions...</div>
    </div>
  )

  if (error) return (
    <div style={{ textAlign:'center', padding:80, fontFamily:'Inter, sans-serif' }}>
      <AlertTriangle size={36} style={{ color:'#ef4444', marginBottom:12 }} />
      <div style={{ color:'#ef4444', fontSize:15, fontWeight:600, marginBottom:16 }}>{error}</div>
      <button onClick={() => { setLoading(true); setError(''); fetchRedemptions() }}
        style={{
          padding:'10px 24px', borderRadius:12, border:'none',
          background:'linear-gradient(135deg,#8F2CFF,#6E11D8)',
          color:'#fff', fontWeight:600, fontSize:13, cursor:'pointer', fontFamily:'inherit',
          boxShadow:'0 4px 12px rgba(143,44,255,0.3)',
        }}>Retry</button>
    </div>
  )

  return (
    <div style={{ fontFamily:'Inter, sans-serif', color:'#1e1b4b' }}>
      <style>{REDEMPTION_CSS}</style>

      {/* Toast */}
      {toast && (
        <div className={`bo-toast ${toast.type}`}>
          <div style={{ fontWeight:700, fontSize:14, color: toast.type === 'error' ? '#ef4444' : '#1e1b4b' }}>
            {toast.message}
          </div>
        </div>
      )}

      {/* Accept Modal */}
      {verifyModal && (
        <div className="bo-modal-overlay" onClick={() => setVerifyModal(null)}>
          <div className="bo-modal" onClick={e => e.stopPropagation()}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:20 }}>
              <div>
                <h3 style={{ fontSize:18, fontWeight:800, color:'#1e1b4b', margin:0 }}>Accept Redemption</h3>
                <p style={{ fontSize:13, color:'#94a3b8', margin:'4px 0 0' }}>
                  For <strong style={{ color:'#8F2CFF' }}>{verifyModal.player_name}</strong>
                </p>
              </div>
              <button onClick={() => setVerifyModal(null)} style={{
                width:32, height:32, borderRadius:10, border:'1px solid #f0eef5',
                background:'#fff', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center',
                color:'#94a3b8', transition:'all 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor='#e0d9f5'; e.currentTarget.style.color='#1e1b4b' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor='#f0eef5'; e.currentTarget.style.color='#94a3b8' }}>
                <X size={16} />
              </button>
            </div>
            <label style={{ display:'block', fontSize:12, fontWeight:600, color:'#64748b', marginBottom:8 }}>
              6-digit code (optional)
            </label>
            <input
              style={{
                width:'100%', padding:'14px', fontSize:24, fontWeight:700, letterSpacing:10, textAlign:'center',
                background:'#f8f7ff', border:'2px solid #f0eef5', borderRadius:14,
                color:'#8F2CFF', outline:'none', fontFamily:'inherit', boxSizing:'border-box',
                transition:'border-color 0.2s',
              }}
              type="text" maxLength={6} value={acceptCode}
              onChange={e => setAcceptCode(e.target.value.replace(/\D/g,''))}
              onKeyDown={e => e.key === 'Enter' && submitVerify()}
              placeholder="000000" autoComplete="off"
              onFocus={e => e.target.style.borderColor = '#8F2CFF'}
              onBlur={e => e.target.style.borderColor = '#f0eef5'}
              autoFocus aria-label="6-digit verification code" />
            <p style={{ margin:'8px 0 0', fontSize:11, color:'#94a3b8' }}>
              Leave blank to accept without code verification.
            </p>
            {acceptError && (
              <div style={{ marginTop:10, padding:'10px 14px', borderRadius:12, fontSize:12, fontWeight:600, color:'#ef4444', background:'#fef2f2', border:'1px solid #fecaca' }}>{acceptError}</div>
            )}
            <div style={{ display:'flex', gap:10, marginTop:20, justifyContent:'flex-end' }}>
              <button onClick={() => setVerifyModal(null)}
                style={{
                  padding:'10px 24px', borderRadius:12, border:'1px solid #f0eef5',
                  background:'#fff', color:'#64748b', fontWeight:600, fontSize:13,
                  cursor:'pointer', fontFamily:'inherit', transition:'all 0.15s',
                }}
                onMouseEnter={e => { e.target.style.background='#f8f7ff'; e.target.style.color='#1e1b4b' }}
                onMouseLeave={e => { e.target.style.background='#fff'; e.target.style.color='#64748b' }}>
                Cancel
              </button>
              <button onClick={submitVerify} disabled={acceptSubmitting}
                style={{
                  padding:'10px 28px', borderRadius:12, border:'none',
                  background: acceptSubmitting ? '#c4b5fd' : 'linear-gradient(135deg,#8F2CFF,#6E11D8)',
                  color:'#fff', fontWeight:700, fontSize:13, cursor:'pointer', fontFamily:'inherit',
                  boxShadow:'0 4px 12px rgba(143,44,255,0.3)', transition:'all 0.2s',
                }}>
                {acceptSubmitting ? 'Accepting...' : 'Accept'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {rejectModal && (
        <div className="bo-modal-overlay" onClick={() => setRejectModal(null)}>
          <div className="bo-modal" onClick={e => e.stopPropagation()}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:20 }}>
              <div>
                <h3 style={{ fontSize:18, fontWeight:800, color:'#1e1b4b', margin:0 }}>Reject Redemption</h3>
                <p style={{ fontSize:13, color:'#94a3b8', margin:'4px 0 0' }}>
                  For <strong style={{ color:'#8F2CFF' }}>{rejectModal.player_name}</strong>
                </p>
              </div>
              <button onClick={() => setRejectModal(null)} style={{
                width:32, height:32, borderRadius:10, border:'1px solid #f0eef5',
                background:'#fff', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center',
                color:'#94a3b8', transition:'all 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor='#e0d9f5'; e.currentTarget.style.color='#1e1b4b' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor='#f0eef5'; e.currentTarget.style.color='#94a3b8' }}>
                <X size={16} />
              </button>
            </div>
            <textarea
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              placeholder="Reason (optional)"
              rows={3}
              style={{
                width:'100%', padding:'12px 14px', fontSize:13, fontFamily:'inherit',
                border:'1.5px solid #f0eef5', borderRadius:12, resize:'vertical',
                outline:'none', boxSizing:'border-box', color:'#1e1b4b', background:'#f8f7ff',
                transition:'border-color 0.2s',
              }}
              onFocus={e => e.target.style.borderColor = '#8F2CFF'}
              onBlur={e => e.target.style.borderColor = '#f0eef5'}
            />
            <div style={{ display:'flex', gap:10, marginTop:20, justifyContent:'flex-end' }}>
              <button onClick={() => setRejectModal(null)}
                style={{
                  padding:'10px 24px', borderRadius:12, border:'1px solid #f0eef5',
                  background:'#fff', color:'#64748b', fontWeight:600, fontSize:13,
                  cursor:'pointer', fontFamily:'inherit',
                }}>Cancel</button>
              <button onClick={handleReject}
                style={{
                  padding:'10px 28px', borderRadius:12, border:'none',
                  background:'linear-gradient(135deg,#ef4444,#dc2626)',
                  color:'#fff', fontWeight:700, fontSize:13, cursor:'pointer', fontFamily:'inherit',
                  boxShadow:'0 4px 12px rgba(239,68,68,0.3)',
                }}>Reject</button>
            </div>
          </div>
        </div>
      )}

      {/* Page Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:32, flexWrap:'wrap', gap:16 }}>
        <div>
          <h1 style={{ fontSize:28, fontWeight:800, margin:0, letterSpacing:'-0.5px' }}>Redemptions</h1>
          <p style={{ color:'#94a3b8', fontSize:14, margin:'6px 0 0', fontWeight:500 }}>
            Manage participant rewards and redemption requests.
          </p>
        </div>
        <button style={{
          display:'flex', alignItems:'center', gap:8, padding:'10px 20px', borderRadius:12,
          border:'1.5px solid #f0eef5', background:'#fff', color:'#64748b',
          fontWeight:600, fontSize:13, cursor:'pointer', fontFamily:'inherit', transition:'all 0.2s',
          position:'relative',
        }}
        onMouseEnter={e => { e.currentTarget.style.borderColor='#8F2CFF'; e.currentTarget.style.color='#8F2CFF' }}
        onMouseLeave={e => { e.currentTarget.style.borderColor='#f0eef5'; e.currentTarget.style.color='#64748b' }}>
          <Bell size={16} /> Notifications
          {stats.pending > 0 && (
            <span style={{
              position:'absolute', top:-6, right:-6, width:20, height:20, borderRadius:'50%',
              background:'linear-gradient(135deg,#ef4444,#dc2626)', color:'#fff',
              fontSize:10, fontWeight:800, display:'flex', alignItems:'center', justifyContent:'center',
              border:'2px solid #fff',
            }}>{stats.pending}</span>
          )}
        </button>
      </div>

      {/* Search & Filters */}
      <div style={{ display:'flex', gap:12, marginBottom:0, flexWrap:'wrap', alignItems:'center' }}>
        <div className="redemption-search-bar" style={{ flex:1, minWidth:280 }}>
          <Search size={18} style={{ color:'#94a3b8', flexShrink:0 }} />
          <input
            className="redemption-search-input"
            type="text" value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by participant name or email..."
            autoComplete="off" aria-label="Search participants" />
          {search && (
            <button onClick={() => setSearch('')} style={{
              width:28, height:28, borderRadius:8, border:'none', background:'#f0eef5',
              cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center',
              color:'#94a3b8', transition:'all 0.15s', flexShrink:0,
            }}
            onMouseEnter={e => e.currentTarget.style.background = '#e0d9f5'}
            onMouseLeave={e => e.currentTarget.style.background = '#f0eef5'}>
              <X size={14} />
            </button>
          )}
        </div>

        <div className="redemption-filter-btn" style={{ position:'relative' }}>
          <Filter size={15} /> Filter
        </div>

        <div className="redemption-dropdown">
          <button className={`redemption-filter-btn ${statusFilter !== 'all' ? 'active' : ''}`}
            onClick={() => { setShowStatusDrop(s => !s); setShowSortDrop(false) }}>
            {statusFilter === 'all' ? 'All Status' : chips.find(c => c.key === statusFilter)?.label || statusFilter}
            <ChevronDown size={14} />
          </button>
          {showStatusDrop && (
            <div className="redemption-dropdown-menu" style={{ left:'auto', right:0 }}>
              {[{ key:'all', label:'All Status' }, ...chips.filter(c => c.key !== 'all')].map(c => (
                <button key={c.key} className="redemption-dropdown-item"
                  onClick={() => { setStatusFilter(c.key); setShowStatusDrop(false) }}>
                  <span style={{ width:8, height:8, borderRadius:'50%', background:c.color, flexShrink:0 }} />
                  {c.label}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="redemption-dropdown">
          <button className="redemption-filter-btn"
            onClick={() => { setShowSortDrop(s => !s); setShowStatusDrop(false) }}>
            {sortBy === 'newest' ? 'Newest First' : sortBy === 'oldest' ? 'Oldest First' : 'Name A-Z'}
            <ChevronDown size={14} />
          </button>
          {showSortDrop && (
            <div className="redemption-dropdown-menu">
              {[{ key:'newest', label:'Newest First' }, { key:'oldest', label:'Oldest First' }, { key:'name', label:'Name A-Z' }].map(s => (
                <button key={s.key} className="redemption-dropdown-item"
                  onClick={() => { setSortBy(s.key); setShowSortDrop(false) }}>
                  {s.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Chips */}
      <div className="redemption-chips">
        {chips.map(c => (
          <button key={c.key}
            className={`redemption-chip ${statusFilter === c.key ? 'active' : ''}`}
            style={{
              background: statusFilter === c.key ? c.bg : '#fff',
              borderColor: statusFilter === c.key ? c.color : '#f0eef5',
              color: statusFilter === c.key ? c.color : '#64748b',
            }}
            onClick={() => setStatusFilter(c.key)}>
            {c.label}
            <span className="redemption-chip-count" style={{
              background: statusFilter === c.key ? c.color + '18' : '#f0eef5',
              color: statusFilter === c.key ? c.color : '#94a3b8',
            }}>{c.count}</span>
          </button>
        ))}
      </div>

      {/* Cards Grid */}
      {paged.length === 0 ? (
        <div style={{ textAlign:'center', padding:'60px 20px' }}>
          <div style={{
            width:80, height:80, borderRadius:20, margin:'0 auto 16px',
            background:'linear-gradient(135deg,#f5f3ff,#ede9fe)',
            display:'flex', alignItems:'center', justifyContent:'center',
          }}>
            <ClipboardList size={36} style={{ color:'#c4b5fd' }} />
          </div>
          <div style={{ color:'#64748b', fontSize:15, fontWeight:600 }}>
            {search ? 'No participants match your search.' : 'No redemptions yet.'}
          </div>
        </div>
      ) : (
        <>
          <div className="redemption-grid" style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:16, marginTop:20, alignItems:'stretch' }}>
            {paged.map((n, idx) => {
              const badge = statusBadgeStyle(n.status)
              const BadgeIcon = badge.icon
              return (
                <div key={n.id} className="redemption-card" style={{ animationDelay:`${idx * 0.03}s` }}>
                  <div className="redemption-card-header">
                    <div className="redemption-card-avatar">
                      {getInitials(n.player_name)}
                    </div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div className="redemption-card-name">{n.player_name}</div>
                    </div>
                    <span className="redemption-card-badge" style={{ background:badge.bg, color:badge.color }}>
                      <BadgeIcon size={12} />
                      {statusLabel(n.status)}
                    </span>
                  </div>

                  <div className="redemption-card-body">
                    <div style={{ display:'flex', gap:12, alignItems:'flex-start' }}>
                      <div className="redemption-card-info" style={{ flex:1, minWidth:0 }}>
                        {(() => {
                          const pd = parsePlayerData(n.player_data)
                          const phone = n.player_phone || pd.phone || pd['Phone Number'] || pd['phone number'] || pd['Phone'] || pd['mobile'] || ''
                          const email = n.player_email || pd.email || pd['Email'] || pd['Email Address'] || pd['email address'] || ''
                          const city = pd.city || pd.City || pd.location || ''
                          return (
                            <>
                              {email && <div className="redemption-card-info-row"><Mail size={13} /><span>{email}</span></div>}
                              {phone && <div className="redemption-card-info-row"><Phone size={13} /><span>{phone}</span></div>}
                              {(n.location_name || city) && <div className="redemption-card-info-row"><MapPin size={13} /><span>{n.location_name || city}</span></div>}
                            </>
                          )
                        })()}
                      </div>
                      <div className="redemption-card-gift">
                        <Gift size={20} style={{ color:'#8F2CFF' }} />
                      </div>
                    </div>
                  </div>

                  <div className="redemption-card-footer">
                    <div className="redemption-card-date">
                      <Clock size={12} /> {formatDate(n.created_at)}
                    </div>
                    {canAct(n.status) && (
                      <div style={{ display:'flex', gap:8 }}>
                        <button onClick={() => handleAccept(n)} style={{
                          padding:'10px 22px', borderRadius:10, border:'none',
                          background:'linear-gradient(135deg,#10b981,#059669)',
                          color:'#fff', fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:'inherit',
                          transition:'all 0.2s', boxShadow:'0 2px 8px rgba(16,185,129,0.3)',
                        }}>Accept</button>
                        <button onClick={() => openRejectModal(n)} style={{
                          padding:'10px 22px', borderRadius:10, border:'2px solid #fecaca',
                          background:'#fff', color:'#ef4444', fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:'inherit',
                          transition:'all 0.2s',
                        }}>Reject</button>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Pagination */}
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:28, flexWrap:'wrap', gap:12 }}>
            <div className="redemption-per-page">
              <select value={perPage} onChange={e => setPerPage(Number(e.target.value))}>
                {ITEMS_PER_PAGE_OPTIONS.map(n => <option key={n} value={n}>{n} per page</option>)}
              </select>
              <span style={{ color:'#94a3b8' }}>
                Showing {((page-1)*perPage)+1}–{Math.min(page*perPage, filtered.length)} of {filtered.length}
              </span>
            </div>
            <div className="redemption-pagination">
              <button className="redemption-page-btn" disabled={page <= 1} onClick={() => setPage(p => p-1)}>
                <ChevronLeft size={16} />
              </button>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                let pageNum
                if (totalPages <= 5) pageNum = i + 1
                else if (page <= 3) pageNum = i + 1
                else if (page >= totalPages - 2) pageNum = totalPages - 4 + i
                else pageNum = page - 2 + i
                return (
                  <button key={pageNum}
                    className={`redemption-page-btn ${page === pageNum ? 'active' : ''}`}
                    onClick={() => setPage(pageNum)}>
                    {pageNum}
                  </button>
                )
              })}
              <button className="redemption-page-btn" disabled={page >= totalPages} onClick={() => setPage(p => p+1)}>
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
