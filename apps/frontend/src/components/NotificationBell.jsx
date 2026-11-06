import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api'

const timeAgo = date => {
  const diff = Date.now() - new Date(date).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  return `${days}d ago`
}

const TYPE_STYLES = {
  info:    { color:'var(--chip-primary-fg)', bg:'var(--chip-primary-bg)' },
  success: { color:'var(--chip-green-fg)', bg:'var(--chip-green-bg)' },
  warning: { color:'var(--chip-amber-fg)', bg:'var(--chip-amber-bg)' },
  error:   { color:'var(--chip-red-fg)', bg:'var(--chip-red-bg)' },
}

export default function NotificationBell({ apiBase = '/notifications' }) {
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [notifs, setNotifs] = useState([])
  const [unread, setUnread] = useState(0)
  const ref = useRef()

  const fetchNotifs = () => {
    api.get(apiBase).then(({data}) => {
      if (data.success) {
        setNotifs(data.notifications || [])
        setUnread(data.unreadCount || 0)
      }
    }).catch(() => {})
  }

  useEffect(() => {
    fetchNotifs()
    const t = setInterval(fetchNotifs, 30000)
    return () => clearInterval(t)
  }, [apiBase])

  useEffect(() => {
    const fn = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', fn)
    return () => document.removeEventListener('mousedown', fn)
  }, [])

  const handleMarkAllRead = async () => {
    await api.put(`${apiBase}/read-all`)
    setUnread(0)
    setNotifs(prev => prev.map(n => ({ ...n, read_at: n.read_at || new Date().toISOString() })))
  }

  const handleClick = async n => {
    if (!n.read_at) {
      await api.put(`${apiBase}/${n.id}/read`)
      setUnread(prev => Math.max(0, prev - 1))
      setNotifs(prev => prev.map(x => x.id === n.id ? { ...x, read_at: new Date().toISOString() } : x))
    }
    setOpen(false)
    if (n.link) navigate(n.link)
  }

  return (
    <div ref={ref} style={{ position:'relative' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          position:'relative',width:36,height:36,borderRadius:10,
          border:'1.5px solid var(--border)',background:'var(--surface)',
          display:'flex',alignItems:'center',justifyContent:'center',
          cursor:'pointer',color:'var(--text2)',fontSize:16,flexShrink:0,
        }}
        title="Notifications"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
        </svg>
        {unread > 0 && (
          <span style={{
            position:'absolute',top:-4,right:-4,minWidth:18,height:18,
            borderRadius:9,background:'var(--error)',color:'var(--surface)',
            fontSize:10,fontWeight:700,display:'flex',alignItems:'center',
            justifyContent:'center',padding:'0 4px',lineHeight:1,
            boxShadow:'0 2px 6px rgba(220,38,38,.35)',
          }}>
            {unread > 99 ? '99+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div style={{
          position:'absolute',top:'calc(100% + 8px)',right:0,width:380,
          background:'var(--surface)',borderRadius:14,border:'1px solid var(--border)',
          boxShadow:'0 12px 48px rgba(0,0,0,.12)',zIndex:999,
          maxHeight:480,display:'flex',flexDirection:'column',
          animation:'nav-fade-down .18s ease both',
        }}>
          <div style={{
            display:'flex',alignItems:'center',justifyContent:'space-between',
            padding:'14px 18px 10px',borderBottom:'1px solid var(--border-light)',flexShrink:0,
          }}>
            <span style={{fontSize:13,fontWeight:700,color:'var(--text)'}}>Notifications</span>
            {unread > 0 && (
              <button
                onClick={handleMarkAllRead}
                style={{fontSize:11,fontWeight:600,color:'var(--primary)',background:'none',border:'none',cursor:'pointer',fontFamily:'DM Sans'}}
              >
                Mark all read
              </button>
            )}
          </div>

          <div style={{overflow:'auto',flex:1}}>
            {notifs.length === 0 ? (
              <div style={{padding:'32px 18px',textAlign:'center',color:'var(--text3)',fontSize:13}}>
                No notifications yet
              </div>
            ) : (
              notifs.map(n => {
                const ts = TYPE_STYLES[n.type] || TYPE_STYLES.info
                return (
                  <button
                    key={n.id}
                    onClick={() => handleClick(n)}
                    style={{
                      display:'flex',gap:12,width:'100%',padding:'13px 18px',textAlign:'left',
                      background:'transparent',border:'none',borderBottom:'1px solid var(--border-light)',
                      cursor:'pointer',fontFamily:'DM Sans',transition:'background .1s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background='var(--surface2)'}
                    onMouseLeave={e => e.currentTarget.style.background='transparent'}
                  >
                    <div style={{
                      width:28,height:28,borderRadius:7,background:ts.bg,
                      display:'flex',alignItems:'center',justifyContent:'center',
                      fontSize:12,flexShrink:0,marginTop:1,
                    }}>
                      {n.type === 'success' ? '✓' : n.type === 'error' ? '✕' : n.type === 'warning' ? '⚠' : 'ℹ'}
                    </div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{display:'flex',alignItems:'center',gap:6}}>
                        <span style={{fontSize:12.5,fontWeight:700,color:'var(--text)',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>
                          {n.title}
                        </span>
                        {!n.read_at && (
                          <span style={{width:6,height:6,borderRadius:'50%',background:'var(--primary)',flexShrink:0}} />
                        )}
                      </div>
                      <div style={{fontSize:12,color:'var(--text2)',marginTop:1,lineHeight:1.4}}>{n.message}</div>
                      <div style={{fontSize:10.5,color:'var(--text3)',marginTop:4}}>{timeAgo(n.created_at)}</div>
                    </div>
                  </button>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}
