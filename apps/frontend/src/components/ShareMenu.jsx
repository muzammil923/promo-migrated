import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { shareGame, isLoggedInPlayer, SHARE_MEDIUMS } from '../lib/share'

/*
 * ShareMenu — trigger icon + popover with WhatsApp / Copy / native share.
 * Every channel builds a UTM-tagged URL (see lib/share.js) so business owners
 * can attribute plays to whatsapp vs copy vs qr traffic.
 */

const CSS = `
.shm-wrap{position:relative;display:inline-flex}
.shm-btn{width:32px;height:32px;border-radius:50%;background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.14);color:rgba(255,255,255,0.75);display:flex;align-items:center;justify-content:center;cursor:pointer;transition:background .2s,color .2s,transform .2s;flex-shrink:0}
.shm-btn:hover{background:rgba(146,16,246,0.3);color:#fff;transform:translateY(-1px)}
.shm-btn.light{background:rgba(146,16,246,0.1);border-color:rgba(146,16,246,0.3);color:#7c3aed}
.shm-btn.light:hover{background:rgba(146,16,246,0.22);color:#5b0499}
.shm-pop{position:absolute;top:calc(100% + 8px);right:0;z-index:9600;width:236px;background:linear-gradient(160deg,#12082a,#0d0820);border:1px solid rgba(146,16,246,0.4);border-radius:14px;padding:12px;box-shadow:0 16px 48px rgba(0,0,0,0.55),0 0 24px rgba(146,16,246,0.15);animation:shmIn .18s cubic-bezier(.22,1,.36,1) both;font-family:'DM Sans',sans-serif;text-align:left}
@keyframes shmIn{from{opacity:0;transform:translateY(-6px) scale(.97)}to{opacity:1;transform:none}}
.shm-pop-title{font-size:11px;font-weight:700;letter-spacing:1.2px;text-transform:uppercase;color:rgba(255,255,255,0.5);margin:0 0 10px 2px}
.shm-opt{display:flex;align-items:center;gap:10px;width:100%;padding:9px 10px;margin-bottom:6px;border:none;border-radius:10px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.09);color:#fff;font-family:'DM Sans',sans-serif;font-size:13.5px;font-weight:600;cursor:pointer;transition:background .15s,border-color .15s;text-align:left}
.shm-opt:last-of-type{margin-bottom:0}
.shm-opt:hover{background:rgba(146,16,246,0.25);border-color:rgba(146,16,246,0.5)}
.shm-opt svg{width:17px;height:17px;flex-shrink:0}
.shm-opt.wa svg{color:#4ad066}
.shm-hint{margin-top:10px;padding-top:10px;border-top:1px solid rgba(255,255,255,0.09);font-size:11.5px;line-height:1.45;color:rgba(255,255,255,0.55)}
.shm-hint strong{color:#f5c842;font-weight:700}
.shm-copied{position:absolute;top:calc(100% + 8px);right:0;z-index:9601;padding:8px 14px;border-radius:10px;background:#1d1030;border:1px solid #35c9a5;color:#7ee787;font-family:'DM Sans',sans-serif;font-size:12.5px;font-weight:600;white-space:nowrap;animation:shmIn .18s both}
`

export default function ShareMenu({ game, light = false, label = 'Share game', wrapClass = '', portal = false }) {
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const [popPos, setPopPos] = useState(null)
  const wrapRef = useRef(null)
  const btnRef = useRef(null)
  const popRef = useRef(null)

  const placePop = () => {
    if (!portal || !btnRef.current) return
    const r = btnRef.current.getBoundingClientRect()
    const width = 236
    setPopPos({
      top: r.bottom + 8,
      left: Math.max(8, Math.min(r.right - width, window.innerWidth - width - 8)),
    })
  }

  useEffect(() => {
    if (!open) return
    placePop()
    // Reposition while open so page scrolling never strands the popover
    window.addEventListener('scroll', placePop, true)
    window.addEventListener('resize', placePop)
    return () => { window.removeEventListener('scroll', placePop, true); window.removeEventListener('resize', placePop) }
  }, [open])

  useEffect(() => {
    if (!open) return
    const onDoc = e => {
      if (wrapRef.current && !wrapRef.current.contains(e.target) &&
          (!popRef.current || !popRef.current.contains(e.target))) setOpen(false)
    }
    const onKey = e => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', onDoc)
    document.addEventListener('keydown', onKey)
    return () => { document.removeEventListener('mousedown', onDoc); document.removeEventListener('keydown', onKey) }
  }, [open])

  if (!game?.slug || !game?.client_slug) return null

  const handle = async (medium) => {
    const ok = await shareGame(game, medium)
    if (ok && medium !== 'native') {
      setCopied(true)
      setTimeout(() => { setCopied(false); setOpen(false) }, 1100)
    } else {
      setOpen(false)
    }
  }

  const popEl = open && !copied && (
    <div
      className="shm-pop" role="menu" aria-label={`Share ${game.name}`} ref={popRef}
      style={portal && popPos ? { position: 'fixed', top: popPos.top, left: popPos.left, right: 'auto' } : undefined}
    >
      <p className="shm-pop-title">Share & earn</p>
      <button className="shm-opt wa" onClick={() => handle(SHARE_MEDIUMS.whatsapp)}>
        <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2c-1.6 0-3.1-.4-4.4-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2zm4.6-6.1c-.3-.1-1.5-.7-1.7-.8s-.4-.1-.6.1-.7.8-.8 1-.3.2-.5.1a6.7 6.7 0 0 1-3.4-2.9c-.3-.4.3-.4.7-1.3a.5.5 0 0 0 0-.5c0-.1-.6-1.4-.8-1.9s-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 2.9 2.9 0 0 0-.9 2.2 5 5 0 0 0 1 2.7 11.4 11.4 0 0 0 4.4 3.9 5 5 0 0 0 3.1.7 2.7 2.7 0 0 0 1.8-1.3 2.2 2.2 0 0 0 .1-1.3c0-.1-.2-.2-.5-.3z"/></svg>
        WhatsApp
      </button>
      <button className="shm-opt" onClick={() => handle(SHARE_MEDIUMS.copy)}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
        Copy link
      </button>
      {typeof navigator.share === 'function' && (
        <button className="shm-opt" onClick={() => handle(SHARE_MEDIUMS.native)}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>
          More options…
        </button>
      )}
      {!isLoggedInPlayer() && (
        <p className="shm-hint">Log in to earn <strong>5 PC</strong> for every friend who plays through your link!</p>
      )}
    </div>
  )

  return (
    <>
      <style>{CSS}</style>
      <div className={`shm-wrap${wrapClass ? ` ${wrapClass}` : ''}`} ref={wrapRef}>
        <button type="button" ref={btnRef} className={`shm-btn${light ? ' light' : ''}`} aria-label={label} title={label} aria-expanded={open} onClick={() => setOpen(o => !o)}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
        </button>
        {portal ? createPortal(popEl, document.body) : popEl}
        {copied && (portal
          ? createPortal(<div className="shm-copied" style={{ position: 'fixed', top: (popPos?.top || 0), left: (popPos?.left || 0) }}>✓ Link copied!</div>, document.body)
          : <div className="shm-copied">✓ Link copied!</div>)}
      </div>
    </>
  )
}
