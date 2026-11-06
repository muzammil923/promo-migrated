import { useState, useEffect, useCallback } from 'react'
import api from '../api'

const STATE_META = {
  played_not_redeemed:  { label: 'Played · Not Redeemed', color: '#64748b', bg: '#f1f5f9' },
  accepted_with_code:   { label: 'Accepted · 6-digit code', color: '#059669', bg: '#dcfce7' },
  accepted_without_code:{ label: 'Accepted · no code',      color: '#b45309', bg: '#fef3c7' },
}

const csvCell = (v) => {
  const s = v == null ? '' : String(v)
  return `"${s.replace(/"/g, '""')}"`
}

export default function BOLogsPage() {
  const [bos, setBos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')

  const [activeBo, setActiveBo] = useState(null)
  const [entries, setEntries] = useState([])
  const [entriesLoading, setEntriesLoading] = useState(false)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  const loadBos = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const { data } = await api.get('/internal-team/bo-logs')
      setBos(data.business_owners || [])
    } catch (e) {
      setError(e.response?.data?.message || e.message || 'Failed to load business owners')
    }
    setLoading(false)
  }, [])

  useEffect(() => { loadBos() }, [loadBos])

  const openBo = async (bo) => {
    setActiveBo(bo)
    setEntriesLoading(true)
    setEntries([])
    try {
      const params = new URLSearchParams()
      if (startDate) params.set('start_date', startDate)
      if (endDate) params.set('end_date', endDate)
      const { data } = await api.get(`/internal-team/bo-logs/${bo.id}/entries?${params}`)
      setEntries(data.entries || [])
    } catch (e) { console.error(e) }
    setEntriesLoading(false)
  }

  const reloadEntries = () => { if (activeBo) openBo(activeBo) }

  const filtered = bos.filter(b => b.business_name.toLowerCase().includes(search.toLowerCase()))

  const exportCSV = (bo, rows) => {
    const formKeys = []
    rows.forEach(r => Object.keys(r.player_data || {}).forEach(k => { if (!formKeys.includes(k)) formKeys.push(k) }))
    const headers = [
      'Session ID', 'Game', 'Player Name', 'Player Email', 'Player Phone', 'Played At',
      'Completed', 'Score',
      ...formKeys,
      'Redemption', '6-Digit Code', 'Code Value', 'Accepted At', 'Accepted By', 'Table #', 'Reject Reason'
    ]
    const lines = [headers.map(csvCell).join(',')]
    rows.forEach(r => {
      const m = STATE_META[r.redemption_state] || STATE_META.played_not_redeemed
      const cells = [
        r.session_id, r.game_name, r.player_name, r.player_email, r.player_phone,
        r.played_at, r.completed ? 'Yes' : 'No', r.score,
        ...formKeys.map(k => r.player_data?.[k] ?? ''),
        m.label, r.code_present ? 'Yes' : 'No', r.code || '',
        r.accepted_at || '', r.accepted_by_name || '', r.table_number || '', r.reject_reason || ''
      ]
      lines.push(cells.map(csvCell).join(','))
    })
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `BO_Logs_${bo.business_name.replace(/[^a-z0-9]/gi, '_')}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="bol-page">
      <style>{`
        .bol-page { --indigo:#6366f1; --violet:#8b5cf6; --ink:#0f172a; --muted:#94a3b8;
          font-family:'DM Sans',system-ui,sans-serif; padding:32px; max-width:1240px; margin:0 auto; color:var(--ink);
          /* Opaque background like the other admin pages (see PlayersPage.css). */
          background: var(--bg-secondary); min-height:100vh;
          box-shadow:0 0 0 100vmax var(--bg-secondary); }
        .bol-head { display:flex; justify-content:space-between; align-items:flex-end; gap:16px; flex-wrap:wrap; margin-bottom:24px; }
        .bol-title { font-family:'Fraunces',serif; font-size:30px; font-weight:700; margin:0; letter-spacing:-.01em; }
        .bol-sub { color:var(--muted); font-size:14px; margin:6px 0 0; }
        .bol-search { position:relative; }
        .bol-search input { padding:11px 14px 11px 38px; border-radius:12px; border:1.5px solid #e2e8f0; font-size:13px;
          font-family:inherit; width:260px; background:var(--surface); outline:none; transition:border-color .15s, box-shadow .15s; }
        .bol-search input:focus { border-color:var(--primary); box-shadow:0 0 0 4px rgba(99,102,241,.12); }
        .bol-search svg { position:absolute; left:12px; top:50%; transform:translateY(-50%); color:var(--muted); }
        .bol-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:18px; }
        @media (max-width: 900px) { .bol-grid { grid-template-columns:repeat(2,1fr); } }
        @media (max-width: 600px) { .bol-grid { grid-template-columns:1fr; } }
        .bol-card--brand { border-color:#e9d5ff; }
        .bol-card--brand::before { background:linear-gradient(90deg,#7c3aed,#6366f1); opacity:1; }
        .bol-avatar--brand { background:linear-gradient(135deg,#7c3aed,#6366f1); }
        .bol-avatar--loc { background:linear-gradient(135deg,#0ea5e9,#6366f1); }
        .bol-card--loc { padding:16px; }
        .bol-card { text-align:left; background:var(--surface); border:1px solid #eef0f5; border-radius:18px; padding:20px;
          cursor:pointer; font-family:inherit; position:relative; overflow:hidden; transition:transform .15s, box-shadow .15s, border-color .15s; }
        .bol-card::before { content:''; position:absolute; inset:0 0 auto 0; height:4px;
          background:linear-gradient(90deg,var(--primary),var(--accent)); opacity:0; transition:opacity .15s; }
        .bol-card:hover { transform:translateY(-3px); box-shadow:0 16px 40px rgba(15,23,42,.10); border-color:#e2e8f0; }
        .bol-card:hover::before { opacity:1; }
        .bol-card-top { display:flex; align-items:center; gap:14px; }
        .bol-avatar { width:46px; height:46px; border-radius:13px; flex-shrink:0;
          background:linear-gradient(135deg,var(--primary),var(--accent)); color:#fff; display:flex; align-items:center;
          justify-content:center; font-weight:800; font-size:17px; box-shadow:0 6px 16px rgba(99,102,241,.35); }
        .bol-name { font-weight:700; font-size:16px; color:var(--ink); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        .bol-mail { font-size:12px; color:var(--muted); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        .bol-stats { display:grid; grid-template-columns:repeat(4,1fr); gap:8px; margin-top:18px; }
        .bol-stat { background:#f8fafc; border:1px solid #f1f5f9; border-radius:12px; padding:10px 6px; text-align:center; }
        .bol-stat-v { font-size:20px; font-weight:800; line-height:1; }
        .bol-stat-l { font-size:9.5px; font-weight:700; text-transform:uppercase; letter-spacing:.04em; color:var(--muted); margin-top:5px; }
        .bol-foot { margin-top:16px; font-size:12px; color:var(--muted); display:flex; align-items:center; gap:6px; }
        .bol-foot .arrow { transition:transform .15s; }
        .bol-card:hover .bol-foot .arrow { transform:translateX(3px); }
        .bol-empty, .bol-loading { text-align:center; padding:64px 0; color:var(--muted); font-size:14px; }
        .bol-err { background:#fee2e2; color:#dc2626; padding:14px 18px; border-radius:12px; font-weight:600; }

        .bol-modal-bg { position:fixed; inset:0; background:rgba(15,23,42,.55); backdrop-filter:blur(4px);
          display:flex; align-items:flex-start; justify-content:center; padding:48px 16px; z-index:1000; overflow-y:auto; }
        .bol-modal { background:var(--surface); border-radius:20px; width:100%; max-width:1080px; box-shadow:0 30px 80px rgba(0,0,0,.3);
          overflow:hidden; animation:bolpop .18s ease; }
        @keyframes bolpop { from { transform:translateY(12px) scale(.98); opacity:0; } to { transform:none; opacity:1; } }
        .bol-modal-head { padding:22px 26px; background:linear-gradient(135deg,#6366f1,#8b5cf6); color:#fff;
          display:flex; justify-content:space-between; align-items:flex-start; gap:16px; flex-wrap:wrap; }
        .bol-modal-head h2 { margin:0; font-family:'Fraunces',serif; font-size:22px; }
        .bol-modal-head p { margin:4px 0 0; font-size:13px; opacity:.85; }
        .bol-modal-actions { display:flex; gap:10px; align-items:center; }
        .bol-btn { padding:9px 16px; border-radius:10px; font-size:12.5px; font-weight:700; cursor:pointer; font-family:inherit; border:none; transition:filter .15s, background .15s; }
        .bol-btn-primary { background:var(--surface); color:#5b21b6; }
        .bol-btn-primary:hover { filter:brightness(.96); }
        .bol-btn-ghost { background:rgba(255,255,255,.18); color:#fff; }
        .bol-btn-ghost:hover { background:rgba(255,255,255,.28); }
        .bol-filters { display:flex; gap:12px; padding:18px 26px; flex-wrap:wrap; align-items:flex-end; border-bottom:1px solid #f1f5f9; }
        .bol-field label { display:block; font-size:10px; font-weight:700; color:var(--muted); text-transform:uppercase; margin-bottom:5px; letter-spacing:.04em; }
        .bol-field input { padding:8px 12px; border-radius:9px; border:1.5px solid #e2e8f0; font-size:12.5px; font-family:inherit; outline:none; }
        .bol-field input:focus { border-color:var(--primary); }
        .bol-apply { padding:9px 18px; border-radius:9px; border:none; background:var(--primary); color:#fff; font-size:12.5px; font-weight:700; cursor:pointer; font-family:inherit; }
        .bol-table-wrap { max-height:520px; overflow:auto; }
        .bol-table { width:100%; border-collapse:collapse; font-size:12.5px; }
        .bol-table thead th { position:sticky; top:0; background:#f8fafc; color:#475569; font-weight:700; text-align:left;
          padding:12px 14px; font-size:11px; text-transform:uppercase; letter-spacing:.03em; border-bottom:1px solid #e8edf3; white-space:nowrap; z-index:1; }
        .bol-table tbody td { padding:12px 14px; border-bottom:1px solid #f5f7fa; color:#334155; vertical-align:top; }
        .bol-table tbody tr:hover { background:#fafaff; }
        .bol-pname { font-weight:700; color:var(--ink); }
        .bol-pmeta { font-size:11px; color:var(--muted); margin-top:2px; }
        .bol-badge { display:inline-block; padding:3px 9px; border-radius:999px; font-size:10.5px; font-weight:700; white-space:nowrap; }
        .bol-foot-note { padding:12px 26px; font-size:11px; color:var(--muted); border-top:1px solid #f1f5f9; }
      `}</style>

      <div className="bol-head">
        <div>
          <h1 className="bol-title">Business Owner Logs</h1>
          <p className="bol-sub">Track every offer — when it was accepted, with or without the 6-digit code. Players who only played also appear.</p>
        </div>
        <div className="bol-search">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search business owner…" />
        </div>
      </div>

      {loading ? (
        <div className="bol-loading">Loading business owners…</div>
      ) : error ? (
        <div className="bol-err">{error}</div>
      ) : filtered.length === 0 ? (
        <div className="bol-empty">No business owners found</div>
      ) : (
        <div className="bol-grid">
          {filtered.map(bo => (
            <button key={bo.id} className={`bol-card ${bo.kind === 'brand' ? 'bol-card--brand' : 'bol-card--loc'}`} onClick={() => openBo(bo)}>
              <div className="bol-card-top">
                <div className={`bol-avatar ${bo.kind === 'brand' ? 'bol-avatar--brand' : 'bol-avatar--loc'}`}>{bo.business_name.slice(0, 2).toUpperCase()}</div>
                <div style={{ minWidth: 0 }}>
                  <div className="bol-name">{bo.business_name}</div>
                  <div className="bol-mail">{bo.email}{bo.phone ? ` · ${bo.phone}` : ''}</div>
                </div>
              </div>
              <div className="bol-stats">
                <div className="bol-stat"><div className="bol-stat-v" style={{ color: '#4f46e5' }}>{bo.total_plays}</div><div className="bol-stat-l">Plays</div></div>
                <div className="bol-stat"><div className="bol-stat-v" style={{ color: '#059669' }}>{bo.total_redemptions}</div><div className="bol-stat-l">Redeemed</div></div>
                <div className="bol-stat"><div className="bol-stat-v" style={{ color: '#0ea5e9' }}>{bo.with_code}</div><div className="bol-stat-l">With Code</div></div>
                <div className="bol-stat"><div className="bol-stat-v" style={{ color: '#d97706' }}>{bo.without_code}</div><div className="bol-stat-l">No Code</div></div>
              </div>
              <div className="bol-foot">
                <span>{bo.total_games} game{bo.total_games === 1 ? '' : 's'} linked</span>
                <span className="arrow" style={{ marginLeft: 'auto' }}>View logs →</span>
              </div>
            </button>
          ))}
        </div>
      )}

      {activeBo && (
        <div className="bol-modal-bg" onClick={() => setActiveBo(null)}>
          <div className="bol-modal" onClick={e => e.stopPropagation()}>
            <div className="bol-modal-head">
              <div>
                <h2>{activeBo.business_name}</h2>
                <p>Offer activity &amp; game responses</p>
              </div>
              <div className="bol-modal-actions">
                <button className="bol-btn bol-btn-primary" onClick={() => exportCSV(activeBo, entries)} disabled={!entries.length} style={{ opacity: entries.length ? 1 : .5 }}>
                  ⬇ Download CSV
                </button>
                <button className="bol-btn bol-btn-ghost" onClick={() => setActiveBo(null)}>Close</button>
              </div>
            </div>

            <div className="bol-filters">
              <div className="bol-field">
                <label>Start Date</label>
                <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
              </div>
              <div className="bol-field">
                <label>End Date</label>
                <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
              </div>
              <button className="bol-apply" onClick={reloadEntries}>Apply</button>
            </div>

            {entriesLoading ? (
              <div className="bol-loading">Loading logs…</div>
            ) : entries.length === 0 ? (
              <div className="bol-empty">No activity found</div>
            ) : (
              <div className="bol-table-wrap">
                <table className="bol-table">
                  <thead>
                    <tr>
                      <th>Player</th><th>Game</th><th>Played At</th><th>Score</th>
                      <th>Redemption</th><th>6-Digit Code</th><th>Accepted At</th><th>Accepted By</th><th>Table #</th>
                    </tr>
                  </thead>
                  <tbody>
                    {entries.map(r => {
                      const m = STATE_META[r.redemption_state] || STATE_META.played_not_redeemed
                      return (
                        <tr key={r.session_id}>
                          <td>
                            <div className="bol-pname">{r.player_name || '—'}</div>
                            <div className="bol-pmeta">{r.player_email || r.player_phone || 'Guest'}</div>
                          </td>
                          <td>{r.game_name}</td>
                          <td style={{ whiteSpace: 'nowrap' }}>{r.played_at ? new Date(r.played_at).toLocaleString() : '—'}</td>
                          <td>{r.score}{r.total_scoreable ? ` / ${r.total_scoreable}` : ''}</td>
                          <td><span className="bol-badge" style={{ background: m.bg, color: m.color }}>{m.label}</span></td>
                          <td>{r.redemption_id ? (r.code_present ? `Yes (${r.code})` : 'No') : '—'}</td>
                          <td style={{ whiteSpace: 'nowrap' }}>{r.accepted_at ? new Date(r.accepted_at).toLocaleString() : '—'}</td>
                          <td>{r.accepted_by_name || '—'}</td>
                          <td>{r.table_number || '—'}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
            <div className="bol-foot-note">
              Showing {entries.length} entr{entries.length === 1 ? 'y' : 'ies'} · players who played but never redeemed are shown as “Played · Not Redeemed”
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
