import { useState, useEffect, useCallback, useMemo } from 'react'
import api from '../api'

const ICONS = {
  pass: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>,
  fail: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>,
  warn: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2.5"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
}

function StatusCard({ title, tests, expanded, onToggle }) {
  const passCount = tests.filter(t => t.status === 'pass').length
  const failCount = tests.filter(t => t.status === 'fail').length
  const warnCount = tests.filter(t => t.status === 'warn').length
  const total = tests.length

  return (
    <div className="st-card">
      <button className="st-card-header" onClick={onToggle}>
        <div className="st-card-title-row">
          <span className="st-card-title">{title}</span>
          <div className="st-card-badges">
            <span className="st-badge st-badge-pass">{passCount}/{total} OK</span>
            {failCount > 0 && <span className="st-badge st-badge-fail">{failCount} Failed</span>}
            {warnCount > 0 && <span className="st-badge st-badge-warn">{warnCount} Warnings</span>}
          </div>
        </div>
        <span className={`st-chevron ${expanded ? 'st-expanded' : ''}`}>▼</span>
      </button>
      {expanded && (
        <div className="st-card-body">
          {tests.map((test, i) => (
            <div key={i} className={`st-test-row st-test-${test.status}`}>
              <div className="st-test-icon">{ICONS[test.status] || ICONS.warn}</div>
              <div className="st-test-info">
                <span className="st-test-name">{test.name}</span>
                <span className="st-test-msg">{test.message}</span>
              </div>
              <div className="st-test-expected" title={test.expected}>{test.expected}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function StatusPage() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [expanded, setExpanded] = useState({})
  const [lastRun, setLastRun] = useState(null)
  const [autoRefresh, setAutoRefresh] = useState(true)

  const fetchStatus = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const { data: res } = await api.get('/system/status', {
        timeout: 60000,
        headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' }
      })
      setData(res)
      setLastRun(new Date().toLocaleTimeString())
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to fetch system status')
    }
    setLoading(false)
  }, [])

  useEffect(() => { fetchStatus() }, [fetchStatus])

  useEffect(() => {
    if (!autoRefresh || loading) return
    const interval = setInterval(fetchStatus, 30000)
    return () => clearInterval(interval)
  }, [autoRefresh, fetchStatus, loading])

  const toggleCategory = (key) => {
    setExpanded(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const categoryEntries = useMemo(() => {
    if (!data?.categories) return []
    return Object.entries(data.categories)
  }, [data])

  const healthColor = data?.health === 'healthy' ? '#16a34a' :
    data?.health === 'degraded' ? '#d97706' : '#dc2626'

  return (
    <div className="st-page">
      <style>{`
        .st-page {
          padding: 32px;
          font-family: 'DM Sans', 'Inter', sans-serif;
          color: var(--text);
          max-width: 1200px;
          margin: 0 auto;
          /* Opaque background like the other admin pages — without it the dark
             body left by player-facing pages shows through. The extra
             box-shadow paints it full-bleed past the 1200px column. */
          background: var(--bg-secondary);
          min-height: 100vh;
          /* Box-shadow only, no clip-path — it would clip the fixed loading
             overlay. Shadows never create scrollbars. */
          box-shadow: 0 0 0 100vmax var(--bg-secondary);
        }
        .st-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 28px;
          flex-wrap: wrap;
          gap: 16px;
        }
        .st-header-left h1 {
          font-size: 24px;
          font-weight: 800;
          margin: 0 0 4px;
        }
        .st-header-left p {
          color: var(--text2);
          margin: 0;
          font-size: 14px;
        }
        .st-header-right {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .st-health-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 8px 18px;
          border-radius: 100px;
          font-weight: 700;
          font-size: 14px;
          background: ${healthColor}18;
          color: ${healthColor};
          border: 1.5px solid ${healthColor}40;
        }
        .st-health-dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: ${healthColor};
          animation: st-pulse 1.5s infinite;
        }
        @keyframes st-pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(0.9); }
        }
        .st-btn {
          padding: 8px 18px;
          border-radius: 8px;
          border: 1.5px solid var(--border);
          background: var(--surface);
          font-weight: 600;
          font-size: 13px;
          cursor: pointer;
          font-family: inherit;
          transition: all .12s;
          color: var(--text);
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }
        .st-btn:hover { border-color: #6366f1; color: #6366f1; }
        .st-btn:disabled { opacity: .5; cursor: not-allowed; }
        .st-btn-primary {
          background: #6366f1;
          border-color: #6366f1;
          color: #fff;
        }
        .st-btn-primary:hover { background: #4f46e5; color: #fff; }
        .st-summary {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
          gap: 12px;
          margin-bottom: 24px;
        }
        .st-summary-item {
          background: var(--surface);
          border: 1.5px solid var(--border);
          border-radius: 12px;
          padding: 16px 20px;
          text-align: center;
        }
        .st-summary-value {
          font-size: 28px;
          font-weight: 800;
          line-height: 1.2;
        }
        .st-summary-label {
          font-size: 12px;
          color: var(--text3);
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: .04em;
          margin-top: 2px;
        }
        .st-summary-value.pass { color: #16a34a; }
        .st-summary-value.fail { color: #dc2626; }
        .st-summary-value.warn { color: #d97706; }
        .st-summary-value.total { color: #6366f1; }
        .st-card {
          background: var(--surface);
          border: 1.5px solid var(--border);
          border-radius: 12px;
          margin-bottom: 10px;
          overflow: hidden;
        }
        .st-card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          width: 100%;
          padding: 14px 20px;
          background: none;
          border: none;
          cursor: pointer;
          font-family: inherit;
          transition: background .1s;
        }
        .st-card-header:hover { background: var(--surface2); }
        .st-card-title-row {
          display: flex;
          align-items: center;
          gap: 16px;
          flex-wrap: wrap;
        }
        .st-card-title {
          font-size: 15px;
          font-weight: 700;
          color: var(--text);
        }
        .st-card-badges { display: flex; gap: 6px; flex-wrap: wrap; }
        .st-badge {
          font-size: 11px;
          font-weight: 700;
          padding: 3px 10px;
          border-radius: 100px;
          letter-spacing: .02em;
        }
        .st-badge-pass { background: #dcfce7; color: #15803d; }
        .st-badge-fail { background: #fee2e2; color: #dc2626; }
        .st-badge-warn { background: #fef3c7; color: #b45309; }
        .st-chevron {
          font-size: 11px;
          color: var(--text3);
          transition: transform .2s;
        }
        .st-chevron.st-expanded { transform: rotate(180deg); }
        .st-card-body { border-top: 1px solid var(--surface2); }
        .st-test-row {
          display: grid;
          grid-template-columns: 28px 1fr 200px;
          gap: 10px;
          align-items: center;
          padding: 10px 20px;
          font-size: 13px;
          border-bottom: 1px solid var(--surface2);
        }
        .st-test-row:last-child { border-bottom: none; }
        /* Translucent status tints instead of hard-coded near-whites
           (#fafff7 etc.) — those turned expanded rows white in dark mode. */
        .st-test-pass { background: rgba(22, 163, 74, .07); }
        .st-test-fail { background: rgba(220, 38, 38, .07); }
        .st-test-warn { background: rgba(217, 119, 6, .09); }
        .st-test-icon {
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .st-test-info {
          display: flex;
          flex-direction: column;
          gap: 1px;
          min-width: 0;
        }
        .st-test-name {
          font-weight: 600;
          color: var(--text);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .st-test-msg {
          font-size: 12px;
          color: var(--text2);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .st-test-expected {
          font-size: 11px;
          color: var(--text3);
          text-align: right;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .st-loading {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 80px;
          color: var(--text2);
        }
        .st-loading-overlay {
          position: fixed;
          inset: 0;
          /* Dark scrim like the other app overlays — the previous white haze
             flashed a bright sheet over dark mode. */
          background: rgba(0, 0, 0, 0.3);
          display: flex;
          align-items: flex-start;
          justify-content: center;
          z-index: 999;
          padding-top: 120px;
          backdrop-filter: blur(2px);
        }
        .st-loading-inner {
          display: flex;
          align-items: center;
          gap: 12px;
          background: var(--surface);
          padding: 16px 28px;
          border-radius: 12px;
          box-shadow: 0 8px 32px rgba(0,0,0,0.12);
          font-weight: 600;
          color: var(--text);
          font-size: 15px;
        }
        .st-spin {
          width: 28px;
          height: 28px;
          border: 3px solid var(--border);
          border-top-color: #6366f1;
          border-radius: 50%;
          animation: st-spin .6s linear infinite;
          margin-right: 12px;
        }
        @keyframes st-spin { to { transform: rotate(360deg); } }
        .st-error {
          background: #fee2e2;
          color: #dc2626;
          padding: 16px 20px;
          border-radius: 10px;
          font-weight: 600;
        }
        .st-timestamp {
          font-size: 12px;
          color: var(--text3);
          margin-top: 16px;
          text-align: center;
        }
        .st-toggle-label {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 13px;
          color: var(--text2);
          cursor: pointer;
          user-select: none;
        }
      `}</style>

      <div className="st-header">
        <div className="st-header-left">
          <h1>System Status</h1>
          <p>Comprehensive health check for all components, endpoints, and configurations</p>
        </div>
        <div className="st-header-right">
          <label className="st-toggle-label">
            <input type="checkbox" checked={autoRefresh} onChange={e => setAutoRefresh(e.target.checked)}
              style={{ accentColor: '#6366f1' }} />
            Auto-refresh
          </label>
          <button className="st-btn" onClick={fetchStatus} disabled={loading}>
            {loading ? 'Running...' : '⟳ Run Tests'}
          </button>
          {data && (
            <div className="st-health-badge">
              <div className="st-health-dot" />
              {data.health.toUpperCase()}
            </div>
          )}
        </div>
      </div>

      {loading && !data && (
        <div className="st-loading">
          <div className="st-spin" />
          Running comprehensive system checks...
        </div>
      )}

      {loading && data && (
        <div className="st-loading-overlay">
          <div className="st-loading-inner">
            <div className="st-spin" />
            Re-running tests...
          </div>
        </div>
      )}

      {error && <div className="st-error">Error: {error}</div>}

      {data && (
        <>
          <div className="st-summary">
            <div className="st-summary-item">
              <div className="st-summary-value total">{data.summary.total}</div>
              <div className="st-summary-label">Total Tests</div>
            </div>
            <div className="st-summary-item">
              <div className="st-summary-value pass">{data.summary.passed}</div>
              <div className="st-summary-label">Passed</div>
            </div>
            <div className="st-summary-item">
              <div className="st-summary-value fail">{data.summary.failed}</div>
              <div className="st-summary-label">Failed</div>
            </div>
            <div className="st-summary-item">
              <div className="st-summary-value warn">{data.summary.warnings}</div>
              <div className="st-summary-label">Warnings</div>
            </div>
          </div>

          {categoryEntries.map(([key, cat]) => (
            <StatusCard
              key={key}
              title={key}
              tests={cat.tests}
              expanded={expanded[key]}
              onToggle={() => toggleCategory(key)}
            />
          ))}

          <div className="st-timestamp">
            Last checked: {lastRun} • Auto-refreshes every 30s
          </div>
        </>
      )}
    </div>
  )
}
