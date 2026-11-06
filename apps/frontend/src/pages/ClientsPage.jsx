import { useState, useEffect, useRef, Children } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api'

const FONT_URL = `https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&family=Fraunces:opsz,wght@9..144,300;9..144,600&display=swap`

const AVATAR_PALETTE = [
  { bg: 'var(--chip-primary-bg)', fg: 'var(--chip-primary-fg)' }, { bg: 'var(--chip-green-bg)', fg: 'var(--chip-green-fg)' },
  { bg: 'var(--chip-orange-bg)', fg: 'var(--chip-orange-fg)' }, { bg: 'var(--chip-rose-bg)', fg: 'var(--chip-rose-fg)' },
  { bg: 'var(--chip-cyan-bg)', fg: 'var(--chip-cyan-fg)' }, { bg: 'var(--chip-red-bg)', fg: 'var(--chip-red-fg)' },
]
const avatarColor = (name = '') => AVATAR_PALETTE[name.charCodeAt(0) % AVATAR_PALETTE.length]
const initials = (name = '') => name.trim().split(/\s+/).map(w => w[0]).join('').slice(0, 2).toUpperCase()

const CSS = `
@import url('${FONT_URL}');
.cp *,.cp *::before,.cp *::after{box-sizing:border-box;margin:0;padding:0}
.cp{font-family:'DM Sans',sans-serif;color:var(--text);background:var(--bg-secondary);min-height:100vh}
@keyframes cpFadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
@keyframes cpSlideIn{from{opacity:0;transform:translateX(28px)}to{opacity:1;transform:none}}
@keyframes cpModalIn{from{opacity:0;transform:scale(0.96)translateY(6px)}to{opacity:1;transform:none}}
@keyframes cpToastIn{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none}}
@keyframes cpSpin{to{transform:rotate(360deg)}}
.cp-card{width:100%;background:var(--surface);border-radius:16px;border:1.5px solid var(--border);padding:22px 22px 18px;cursor:pointer;transition:border-color .18s,box-shadow .18s,transform .18s;animation:cpFadeUp .3s ease both}
.cp-card:hover{border-color:var(--primary);box-shadow:0 6px 28px var(--primary-bg);transform:translateY(-2px)}
.cp-card:hover .cp-actions{opacity:1}
.cp-actions{opacity:0;transition:opacity .15s;display:flex;gap:5px}
.cp-icon-btn{width:30px;height:30px;border-radius:8px;border:1px solid var(--border);background:var(--surface2);display:flex;align-items:center;justify-content:center;cursor:pointer;color:var(--text);transition:background .13s,border-color .13s}
.cp-icon-btn:hover{background:var(--border-light);border-color:var(--border-light)}
.cp-icon-btn.del{border-color:var(--error-border);background:var(--error-bg);color:var(--error)}
.cp-icon-btn.del:hover{background:var(--error-border)}
.cp-input{width:100%;padding:10px 14px;border-radius:10px;border:1.5px solid var(--border);font-size:14px;font-family:'DM Sans',sans-serif;color:var(--text);background:var(--surface2);outline:none;transition:border-color .15s,background .15s}
.cp-input:focus{border-color:var(--primary);background:var(--surface)}
.cp-label{display:block;font-size:10.5px;font-weight:700;color:var(--text3);text-transform:uppercase;letter-spacing:.09em;margin-bottom:6px}
.cp-field{margin-bottom:16px}
.cp-primary-btn{display:inline-flex;align-items:center;gap:8px;padding:10px 20px;border-radius:10px;border:none;background:var(--primary);color:#fff;font-size:13.5px;font-family:'DM Sans',sans-serif;font-weight:600;cursor:pointer;letter-spacing:.01em;transition:background .14s,transform .1s}
.cp-primary-btn:hover{background:var(--primary-hover)}
.cp-primary-btn:active{transform:scale(.98)}
.cp-primary-btn:disabled{opacity:.55;cursor:not-allowed}
.cp-ghost-btn{display:inline-flex;align-items:center;gap:8px;padding:10px 18px;border-radius:10px;border:1.5px solid var(--border);background:var(--surface);color:var(--text);font-size:13.5px;font-family:'DM Sans',sans-serif;font-weight:500;cursor:pointer;transition:background .13s}
.cp-ghost-btn:hover{background:var(--surface2)}
.cp-sm-btn{display:inline-flex;align-items:center;gap:4px;padding:4px 8px;border-radius:6px;border:none;font-size:10px;font-weight:600;font-family:'DM Sans',sans-serif;cursor:pointer;transition:background .13s}
.cp-sm-btn.primary{background:var(--primary-bg);color:var(--primary)}
.cp-sm-btn.primary:hover{background:var(--primary-light)}
.cp-sm-btn.danger{background:var(--error-bg);color:var(--error)}
.cp-sm-btn.danger:hover{background:var(--error-border)}
.cp-add-btn{display:inline-flex;align-items:center;gap:5px;padding:5px 10px;border-radius:7px;border:1px solid var(--primary-light);background:var(--primary-bg);font-size:10px;font-weight:600;cursor:pointer;color:var(--primary);font-family:'DM Sans',sans-serif;transition:background .13s}
.cp-add-btn:hover{background:var(--primary-light)}
`

const Ico = {
  mail: () => <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><rect x="2" y="4" width="20" height="16" rx="2.5"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>,
  phone: () => <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13.5 19.79 19.79 0 0 1 1.61 4.9 2 2 0 0 1 3.59 2.72h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 10a16 16 0 0 0 6.09 6.09l.98-.98a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>,
  edit: () => <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  trash: () => <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>,
  arrow: () => <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M5 12h14M12 5l7 7-7 7"/></svg>,
  close: () => <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12"/></svg>,
  search: () => <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>,
  plus: () => <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>,
  game: () => <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="2" y="6" width="20" height="12" rx="4"/><path d="M6 12h4M8 10v4M15 12h.01M18 12h.01"/></svg>,
  spin: () => <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" style={{animation:'cpSpin .75s linear infinite'}}><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>,
}

function Toast({ msg, type, onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 3200); return () => clearTimeout(t) }, [])
  const ok = type === 'success'
  return (
    <div style={{
      position:'fixed',bottom:28,right:28,zIndex:9999,
      background: ok ? '#052E16' : '#450A0A',
      color:'#fff',padding:'13px 20px 13px 16px',borderRadius:12,
      fontSize:13.5,fontFamily:"'DM Sans',sans-serif",fontWeight:500,
      display:'flex',alignItems:'center',gap:10,
      boxShadow:'0 8px 32px rgba(0,0,0,.24)',
      borderLeft:`3px solid ${ok ? 'var(--success)' : 'var(--error)'}`,
      animation:'cpToastIn .28s cubic-bezier(.34,1.56,.64,1)',maxWidth:380,
    }}>
      {ok ? '✓' : '✕'} {msg}
    </div>
  )
}

function Avatar({ name, logo, size = 46 }) {
  const c = avatarColor(name)
  const [failed, setFailed] = useState(false)
  if (logo && !failed) return <img src={logo} alt="" onError={() => setFailed(true)} style={{width:size,height:size,borderRadius:10,objectFit:'cover',flexShrink:0}} />
  return (
    <div style={{width:size,height:size,borderRadius:10,flexShrink:0,background:c.bg,color:c.fg,
      display:'flex',alignItems:'center',justifyContent:'center',
      fontSize:size*.32,fontWeight:700,letterSpacing:'0.03em',fontFamily:"'DM Sans',sans-serif"}}>
      {initials(name)}
    </div>
  )
}

function ClientCard({ client, onClick, onEdit, onDelete, delay }) {
  return (
    <div className="cp-card" style={{animationDelay:`${delay}ms`}} onClick={() => onClick(client)}>
      {client.logo_url && (
        <div style={{margin:-22,marginBottom:14,borderRadius:'16px 16px 0 0',overflow:'hidden',background:'var(--surface2)',textAlign:'center'}}>
          <img src={client.logo_url} alt={client.company_name}
            style={{width:'100%',maxHeight:140,objectFit:'contain',background:'var(--surface2)',display:'block'}}
            onError={e => { e.target.style.display='none' }} />
        </div>
      )}
      <div style={{display:'flex',alignItems:'flex-start',gap:13}}>
        <Avatar name={client.company_name} logo={client.logo_url} />
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontWeight:700,fontSize:15,color:'var(--text)',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis',letterSpacing:'-0.015em'}}>
            {client.company_name}
          </div>
          {client.contact_name && <div style={{fontSize:12.5,color:'var(--text2)',marginTop:3}}>{client.contact_name}</div>}
        </div>
        <div className="cp-actions" onClick={e => e.stopPropagation()}>
          <button className="cp-icon-btn" title="Edit" onClick={() => onEdit(client)}><Ico.edit/></button>
          <button className="cp-icon-btn del" title="Delete" onClick={() => onDelete(client.id)}><Ico.trash/></button>
        </div>
      </div>
      <div style={{display:'flex',flexDirection:'column',gap:5,marginBottom:16,marginTop:14}}>
        {client.email && <div style={{display:'flex',alignItems:'center',gap:7,color:'var(--text2)',fontSize:12.5}}><span style={{color:'var(--text3)'}}><Ico.mail/></span><span style={{overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{client.email}</span></div>}
        {client.phone && <div style={{display:'flex',alignItems:'center',gap:7,color:'var(--text2)',fontSize:12.5}}><span style={{color:'var(--text3)'}}><Ico.phone/></span>{client.phone}</div>}
      </div>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',paddingTop:14,borderTop:'1px solid var(--border-light)'}}>
        <span style={{display:'inline-flex',alignItems:'center',gap:5,background:'var(--primary-bg)',color:'var(--primary)',fontSize:11.5,fontWeight:600,padding:'4px 10px',borderRadius:100}}>
          <Ico.game/> {client.game_count||0} {client.game_count===1?'game':'games'}
        </span>
        <span style={{fontSize:12,color:'var(--text3)',display:'flex',alignItems:'center',gap:4}}>View <Ico.arrow/></span>
      </div>
    </div>
  )
}

function DetailPanel({ client, onClose, onEdit }) {
  const navigate = useNavigate()
  const [games, setGames] = useState([])
  const [loadingGames, setLoadingGames] = useState(false)
  const [branches, setBranches] = useState([])
  const [loadingBranches, setLoadingBranches] = useState(false)
  const [selectedBranch, setSelectedBranch] = useState(null)
  const [branchGames, setBranchGames] = useState([])
  const [loadingBranchGames, setLoadingBranchGames] = useState(false)
  const [showBranchForm, setShowBranchForm] = useState(false)
  const [editBranch, setEditBranch] = useState(null)
  const [branchForm, setBranchForm] = useState({ name: '', email: '', phone: '', pincode: '' })
  const [submitting, setSubmitting] = useState(false)
  const [showEditClient, setShowEditClient] = useState(false)

  const navigateBuilder = (game) => {
    const builders = {crossword:'crossword',spin:'spin',memory:'memory',jigsaw:'jigsaw',wordsearch:'wordsearch',pouring:'pouring',typer:'typer',screw:'screw',tower:'tower',math:'math',maze:'maze','2048':'2048',snake:'snake',nagaraja:'nagaraja',catch:'catch',reaction:'reaction',simon:'simon',flappy:'flappy',bounce:'bounce',space:'space',connect4:'connect4',bejeweled:'bejeweled',tetris:'tetris',stack:'stack',bowling:'bowling',sudoku:'sudoku',minesweeper:'minesweeper',wordscramble:'wordscramble',rps:'rps',whackamole:'whackamole',hanoi:'hanoi',breakout:'breakout',bubbleshooter:'bubbleshooter',carlaunch:'carlaunch',arrowescape:'arrowescape',frustration:'frustration',stressbuster:'frustration',soundify:'soundify',tictactoe:'tictactoe',snakeandladder:'snakeandladder',ludo:'ludo',Carrom:'Carrom',carrom:'Carrom',chess:'chess',blockblaster:'blockblaster',candyblast:'candyblast',tictactoemultiplayer:'tictactoemultiplayer',classicmaze:'classicmaze',stickmaze:'stickmaze',spotregistration:'spotreg'}
    const slug = builders[game.category]
    navigate(`/dashboard/games/${game.id}${slug ? '/' + slug + '-builder' : '/builder'}`)
  }

  const loadGames = () => {
    setLoadingGames(true)
    api.get(`/clients/${client.id}/games`).then(({data}) => {
      setGames(data.games||[])
    }).catch(() => {}).finally(() => setLoadingGames(false))
  }

  useEffect(() => {
    loadGames()
  }, [client.id])

  const loadBranches = () => {
    setLoadingBranches(true)
    api.get(`/clients/${client.id}/branches`).then(({data}) => {
      setBranches(data.branches || [])
    }).catch(() => {}).finally(() => setLoadingBranches(false))
  }

  useEffect(() => { loadBranches() }, [client.id])

  // Reload games when branch selected so counts are fresh (user may have created games in builder)
  useEffect(() => { loadGames() }, [selectedBranch?.id])

  // When a branch is selected, load its games
  useEffect(() => {
    if (!selectedBranch) { setBranchGames([]); return }
    setLoadingBranchGames(true)
    api.get('/games').then(({data}) => {
      const allGames = data.games || []
      // Match by business_owner_id FK (primary); fallback to location_name only for legacy games without FK
      setBranchGames(allGames.filter(g =>
        g.business_owner_id === selectedBranch.id ||
        (!g.business_owner_id && g.location_name && g.location_name.toLowerCase() === selectedBranch.business_name.toLowerCase())
      ))
    }).catch(() => {}).finally(() => setLoadingBranchGames(false))
  }, [selectedBranch])

  const resetBranchForm = () => {
    setBranchForm({ name: '', email: '', phone: '', pincode: '' })
    setEditBranch(null)
    setShowBranchForm(false)
  }

  const handleCreateBranch = async () => {
    if (!branchForm.name.trim() || !branchForm.email.trim() || !branchForm.phone.trim()) return
    setSubmitting(true)
    try {
      await api.post(`/clients/${client.id}/branches`, {
        branch_name: branchForm.name.trim(),
        email: branchForm.email.trim(),
        phone: branchForm.phone.trim(),
        pincode: branchForm.pincode.trim() || null,
      })
      resetBranchForm()
      loadBranches()
      loadGames()
    } catch (err) { alert(err.response?.data?.message || 'Failed') }
    setSubmitting(false)
  }

  const handleUpdateBranch = async () => {
    if (!branchForm.phone.trim()) return
    setSubmitting(true)
    try {
      await api.put(`/clients/${client.id}/branches/${editBranch.id}`, {
        phone: branchForm.phone.trim(),
        pincode: branchForm.pincode.trim() || null,
      })
      resetBranchForm()
      loadBranches()
    } catch (err) { alert(err.response?.data?.message || 'Failed') }
    setSubmitting(false)
  }

  const handleDeleteBranch = async (branchId) => {
    if (!confirm('Delete this branch?')) return
    try { await api.delete(`/clients/${client.id}/branches/${branchId}`); loadBranches(); loadGames(); if (selectedBranch?.id === branchId) setSelectedBranch(null) } catch {}
  }

  const handleToggleBranch = async (branchId, current) => {
    try { await api.put(`/clients/${client.id}/branches/${branchId}`, { is_active: current ? 0 : 1 }); loadBranches() } catch {}
  }

  const startEditBranch = (b) => {
    setEditBranch(b)
    setBranchForm({ name: b.business_name, email: b.email, phone: b.phone || '', pincode: b.pincode || '' })
    setShowBranchForm(true)
  }

  // Split games: template (no parent_game_id) vs location instances (parent_game_id set)
  const templateGames = games.filter(g => !g.parent_game_id)
  const locationGames = games.filter(g => g.parent_game_id)

  // Per-branch game counts (for display in branch list)
  const branchGameCounts = {}
  branches.forEach(b => {
    branchGameCounts[b.id] = games.filter(g =>
      g.business_owner_id === b.id ||
      (!g.business_owner_id && g.location_name && g.location_name.toLowerCase() === b.business_name.toLowerCase())
    ).length
  })

  return (
    <><div style={{position:'fixed',inset:0,zIndex:600,display:'flex',alignItems:'center',justifyContent:'center',padding:16,background:'rgba(8,8,18,.48)',backdropFilter:'blur(5px)'}} onClick={onClose}>
      <div style={{background:'var(--surface)',borderRadius:20,width:'100%',maxWidth:1100,maxHeight:'92vh',overflow:'hidden',display:'flex',flexDirection:'column',boxShadow:'0 24px 64px rgba(0,0,0,.22)',fontFamily:"'DM Sans',sans-serif"}} onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={{padding:'18px 24px',borderBottom:'1px solid var(--border-light)',display:'flex',justifyContent:'space-between',alignItems:'center',flexShrink:0}}>
          <div style={{display:'flex',gap:12,alignItems:'center'}}>
            <Avatar name={client.company_name} logo={client.logo_url} size={40} />
            <div>
              <h2 style={{fontFamily:"'Fraunces',serif",fontWeight:600,fontSize:20,color:'var(--text)'}}>{client.company_name}</h2>
              <div style={{fontSize:12,color:'var(--text3)'}}>{client.email} · {games.length} games · {branches.length} branches</div>
            </div>
          </div>
          <div style={{display:'flex',gap:8,alignItems:'center'}}>
            <button className="cp-ghost-btn" onClick={() => onEdit(client)} style={{padding:'7px 14px',fontSize:12}}>
              <Ico.edit/> Edit
            </button>
            <button className="cp-icon-btn" onClick={onClose}><Ico.close/></button>
          </div>
        </div>

        {/* 5-Column Body */}
        <div style={{display:'flex',flex:1,overflow:'hidden'}}>

          {/* Col 1: Client Info */}
          <div style={{width:240,borderRight:'1px solid var(--border-light)',padding:'16px',overflow:'auto',flexShrink:0}}>
            <div style={{fontSize:10,fontWeight:700,color:'var(--text3)',textTransform:'uppercase',letterSpacing:'.08em',marginBottom:10}}>Client Details</div>
            {[{icon:<Ico.mail/>,label:'Email',val:client.email},{icon:<Ico.phone/>,label:'Phone',val:client.phone},{icon:null,label:'Address',val:client.address},{icon:null,label:'Notes',val:client.notes}]
              .filter(r=>r.val).map((row,i) => (
              <div key={i} style={{padding:'8px 0',borderBottom:'1px solid var(--border-light)'}}>
                <div style={{fontSize:9,fontWeight:700,color:'var(--text3)',textTransform:'uppercase',letterSpacing:'.06em',marginBottom:2}}>{row.label}</div>
                <div style={{fontSize:12,color:'var(--text)',wordBreak:'break-word'}}>{row.val}</div>
              </div>
            ))}
            <div style={{marginTop:14,padding:'10px',background:'var(--chip-primary-bg)',borderRadius:8,textAlign:'center'}}>
              <div style={{fontSize:20,fontWeight:700,color:'var(--chip-primary-fg)'}}>{games.length}</div>
              <div style={{fontSize:9,fontWeight:700,color:'var(--chip-primary-fg)',textTransform:'uppercase'}}>Games</div>
            </div>
            <div style={{marginTop:8,padding:'10px',background:'var(--chip-green-bg)',borderRadius:8,textAlign:'center'}}>
              <div style={{fontSize:20,fontWeight:700,color:'var(--chip-green-fg)'}}>{branches.length}</div>
              <div style={{fontSize:9,fontWeight:700,color:'var(--chip-green-fg)',textTransform:'uppercase'}}>Branches</div>
            </div>
            <button className="cp-ghost-btn" onClick={() => onEdit(client)} style={{width:'100%',justifyContent:'center',marginTop:12,padding:'8px 0',fontSize:12}}>
              <Ico.edit/> Edit Client
            </button>
          </div>

          {/* Col 2: Branches */}
          <div style={{width:260,borderRight:'1px solid var(--border-light)',display:'flex',flexDirection:'column',flexShrink:0}}>
            <div style={{padding:'12px 16px',borderBottom:'1px solid var(--border-light)',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <div style={{fontSize:10,fontWeight:700,color:'var(--text3)',textTransform:'uppercase',letterSpacing:'.08em'}}>Branches</div>
              <button className="cp-add-btn" onClick={() => { setEditBranch(null); setBranchForm({name:'',email:'',phone:'',pincode:''}); setShowBranchForm(true) }}>+ Add</button>
            </div>
            <div style={{flex:1,overflow:'auto',padding:8}}>
              {loadingBranches ? (
                Array.from({length:3}).map((_,i) => <div key={i} style={{height:48,background:'var(--border-light)',borderRadius:8,marginBottom:6}} />)
              ) : branches.length === 0 ? (
                <div style={{fontSize:11,color:'var(--text3)',padding:'20px 0',textAlign:'center'}}>No branches yet</div>
              ) : (
                branches.map(b => (
                  <div key={b.id} onClick={() => setSelectedBranch(selectedBranch?.id === b.id ? null : b)}
                    style={{padding:'10px 12px',borderRadius:8,marginBottom:4,cursor:'pointer',border:selectedBranch?.id===b.id?'2px solid var(--primary)':'1.5px solid var(--border-light)',background:selectedBranch?.id===b.id?'var(--primary-bg)':'var(--surface)',transition:'all .15s'}}>
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                      <div style={{fontWeight:700,fontSize:12,color:'var(--text)'}}>{b.business_name}</div>
                      <div style={{display:'flex',alignItems:'center',gap:6}}>
                        <span style={{fontSize:9,fontWeight:700,padding:'1px 7px',borderRadius:100,background:'var(--primary-bg)',color:'var(--primary)'}}>{branchGameCounts[b.id]||0}</span>
                        <span style={{fontSize:9,fontWeight:700,padding:'2px 6px',borderRadius:4,background:b.is_active?'var(--chip-green-bg)':'var(--border-light)',color:b.is_active?'var(--chip-green-fg)':'var(--text3)',cursor:'pointer'}}
                          onClick={e => { e.stopPropagation(); handleToggleBranch(b.id, b.is_active) }}>
                          {b.is_active ? 'On' : 'Off'}
                        </span>
                      </div>
                    </div>
                    <div style={{fontSize:10,color:'var(--text3)',marginTop:2}}>
                      {b.email}{b.pincode && <span> · {b.pincode}</span>}
                    </div>
                    <div style={{display:'flex',gap:4,marginTop:6}}>
                      <button className="cp-sm-btn primary" onClick={e => { e.stopPropagation(); startEditBranch(b) }}>Edit</button>
                      <button className="cp-sm-btn danger" onClick={e => { e.stopPropagation(); handleDeleteBranch(b.id) }}>Delete</button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Col 3: Branch Games (selected branch) */}
          <div style={{width:280,borderRight:'1px solid var(--border-light)',display:'flex',flexDirection:'column',flexShrink:0}}>
            <div style={{padding:'12px 16px',borderBottom:'1px solid var(--border-light)'}}>
              <div style={{fontSize:10,fontWeight:700,color:'var(--text3)',textTransform:'uppercase',letterSpacing:'.08em'}}>
                {selectedBranch ? `${selectedBranch.business_name} Location Games` : 'Select a Branch'}
              </div>
            </div>
            <div style={{flex:1,overflow:'auto',padding:8}}>
              {!selectedBranch ? (
                <div style={{fontSize:11,color:'var(--text3)',padding:'30px 16px',textAlign:'center'}}>
                  Click a branch on the left to see its games
                </div>
              ) : loadingBranchGames ? (
                Array.from({length:3}).map((_,i) => <div key={i} style={{height:40,background:'var(--border-light)',borderRadius:8,marginBottom:6}} />)
              ) : branchGames.length === 0 ? (
                <div style={{fontSize:11,color:'var(--text3)',padding:'20px 0',textAlign:'center'}}>
                  No location games for this branch yet.<br/>
                  <span style={{fontSize:10}}>Create from game builder Locations tab</span>
                </div>
              ) : (
                branchGames.map(g => (
                  <div key={g.id} style={{padding:'8px 10px',borderRadius:8,marginBottom:4,border:'1px solid var(--border-light)',background:'var(--surface2)',cursor:'pointer',transition:'all .12s'}}
                    onClick={() => navigateBuilder(g)}
                    onMouseEnter={e => {e.currentTarget.style.borderColor='var(--primary)';e.currentTarget.style.background='var(--primary-bg)'}}
                    onMouseLeave={e => {e.currentTarget.style.borderColor='var(--border-light)';e.currentTarget.style.background='var(--surface2)'}}>
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                      <div style={{fontWeight:700,fontSize:11,color:'var(--text)'}}>{g.name}</div>
                      <span style={{fontSize:9,fontWeight:700,padding:'1px 5px',borderRadius:4,background:g.is_active?'var(--chip-green-bg)':'var(--border-light)',color:g.is_active?'var(--chip-green-fg)':'var(--text3)'}}>
                        {g.is_active ? 'Live' : 'Draft'}
                      </span>
                    </div>
                    {g.location_name && <div style={{fontSize:10,color:'var(--text2)',marginTop:1}}>📍 {g.location_name}</div>}
                    <div style={{fontSize:9,color:'var(--text3)',marginTop:2}}>{g.question_count||0} questions · {g.play_count||0} plays</div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Col 4: Game Templates (brand-level games only) */}
          <div style={{flex:1,display:'flex',flexDirection:'column',minWidth:0,borderRight:'1px solid var(--border-light)'}}>
            <div style={{padding:'12px 16px',borderBottom:'1px solid var(--border-light)',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <div style={{fontSize:10,fontWeight:700,color:'var(--text3)',textTransform:'uppercase',letterSpacing:'.08em'}}>Master Games ({templateGames.length})</div>
            </div>
            <div style={{flex:1,overflow:'auto',padding:8}}>
              {templateGames.map(g => (
                <div key={g.id} style={{padding:'8px 10px',borderRadius:8,marginBottom:4,border:'1.5px solid var(--border)',background:'var(--surface2)',cursor:'pointer',transition:'all .12s'}}
                  onClick={() => navigateBuilder(g)}
                  onMouseEnter={e => {e.currentTarget.style.borderColor='var(--primary)';e.currentTarget.style.background='var(--primary-bg)'}}
                  onMouseLeave={e => {e.currentTarget.style.borderColor='var(--border)';e.currentTarget.style.background='var(--surface2)'}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                    <div style={{fontWeight:700,fontSize:11,color:'var(--text)',display:'flex',alignItems:'center',gap:4}}>{g.name}</div>
                    <span style={{fontSize:9,fontWeight:700,padding:'1px 5px',borderRadius:4,background:g.is_active?'var(--chip-green-bg)':'var(--border-light)',color:g.is_active?'var(--chip-green-fg)':'var(--text3)'}}>
                      {g.is_active ? 'Live' : 'Draft'}
                    </span>
                  </div>
                  <div style={{fontSize:10,color:'var(--text2)',textTransform:'capitalize',marginTop:1}}>{g.category}</div>
                  <div style={{fontSize:9,color:'var(--text3)',marginTop:2}}>{g.question_count||0} questions · {g.play_count||0} plays</div>
                </div>
              ))}
              {templateGames.length === 0 && (
                <div style={{fontSize:11,color:'var(--text3)',padding:'30px 16px',textAlign:'center'}}>No template games yet</div>
              )}
            </div>
          </div>

          {/* Col 5: All Games (includes branch-level games) */}
          <div style={{flex:1,display:'flex',flexDirection:'column',minWidth:0}}>
            <div style={{padding:'12px 16px',borderBottom:'1px solid var(--border-light)',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <div style={{fontSize:10,fontWeight:700,color:'var(--text3)',textTransform:'uppercase',letterSpacing:'.08em'}}>All Games ({games.length})</div>
            </div>
            <div style={{flex:1,overflow:'auto',padding:8}}>
              {games.map(g => (
                <div key={g.id} style={{padding:'8px 10px',borderRadius:8,marginBottom:4,border:'1.5px solid var(--border)',background:'var(--surface)',cursor:'pointer',transition:'all .12s'}}
                  onClick={() => navigateBuilder(g)}
                  onMouseEnter={e => {e.currentTarget.style.borderColor='var(--primary)';e.currentTarget.style.background='var(--primary-bg)'}}
                  onMouseLeave={e => {e.currentTarget.style.borderColor='var(--border)';e.currentTarget.style.background='var(--surface)'}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                    <div style={{fontWeight:700,fontSize:11,color:'var(--text)',display:'flex',alignItems:'center',gap:4}}>{g.name}</div>
                    <span style={{fontSize:9,fontWeight:700,padding:'1px 5px',borderRadius:4,background:g.is_active?'var(--chip-green-bg)':'var(--border-light)',color:g.is_active?'var(--chip-green-fg)':'var(--text3)'}}>
                      {g.is_active ? 'Live' : 'Draft'}
                    </span>
                  </div>
                  <div style={{fontSize:10,color:'var(--text2)',textTransform:'capitalize',marginTop:1}}>
                    {g.parent_game_id ? '📍 Branch' : '📦 Template'} · {g.category}
                  </div>
                  <div style={{fontSize:9,color:'var(--text3)',marginTop:2}}>{g.question_count||0} questions · {g.play_count||0} plays</div>
                </div>
              ))}
              {games.length === 0 && (
                <div style={{fontSize:11,color:'var(--text3)',padding:'30px 16px',textAlign:'center'}}>No games yet</div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
      {showBranchForm && (
        <div style={{position:'fixed',inset:0,zIndex:700,display:'flex',alignItems:'center',justifyContent:'center',padding:20,background:'rgba(8,8,18,.48)',backdropFilter:'blur(5px)'}} onClick={resetBranchForm}>
          <div style={{background:'var(--surface)',borderRadius:20,width:'100%',maxWidth:480,maxHeight:'92vh',overflow:'auto',padding:'30px 28px',boxShadow:'0 24px 64px rgba(0,0,0,.22)',fontFamily:"'DM Sans',sans-serif",animation:'cpModalIn .22s cubic-bezier(.22,1,.36,1)'}} onClick={e => e.stopPropagation()}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:22}}>
              <h2 style={{fontFamily:"'Fraunces',serif",fontWeight:600,fontSize:20,color:'var(--text)'}}>{editBranch ? 'Edit Branch' : 'New Branch'}</h2>
              <button className="cp-icon-btn" onClick={resetBranchForm}><Ico.close/></button>
            </div>
            {!editBranch && (
              <div className="cp-field">
                <label className="cp-label">Branch Name <span style={{color:'#EF4444'}}>*</span></label>
                <input className="cp-input" placeholder="e.g. Downtown Office" value={branchForm.name}
                  onChange={e => setBranchForm({...branchForm, name: e.target.value})} />
              </div>
            )}
            {!editBranch && (
              <div className="cp-field">
                <label className="cp-label">Email <span style={{color:'#EF4444'}}>*</span></label>
                <input className="cp-input" type="email" placeholder="branch@example.com" value={branchForm.email}
                  onChange={e => setBranchForm({...branchForm, email: e.target.value})} />
              </div>
            )}
            <div className="cp-field">
              <label className="cp-label">Phone (password)</label>
              <input className="cp-input" type="tel" placeholder="Phone or access code" value={branchForm.phone}
                onChange={e => setBranchForm({...branchForm, phone: e.target.value})} />
            </div>
            <div className="cp-field" style={{marginBottom:24}}>
              <label className="cp-label">Pincode</label>
              <input className="cp-input" placeholder="Optional pincode" value={branchForm.pincode}
                onChange={e => setBranchForm({...branchForm, pincode: e.target.value})} />
            </div>
            <div style={{display:'flex',gap:10}}>
              <button type="button" className="cp-ghost-btn" onClick={resetBranchForm} style={{flex:1,justifyContent:'center'}}>Cancel</button>
              <button className="cp-primary-btn" onClick={editBranch ? handleUpdateBranch : handleCreateBranch} disabled={submitting} style={{flex:2,justifyContent:'center',padding:'12px 0',fontSize:14}}>
                {submitting ? <><Ico.spin/> Saving…</> : (editBranch ? 'Save Changes' : 'Add Branch')}
              </button>
            </div>
          </div>
        </div>
      )}
  </>
)
}

function FormModal({ editClient, onClose, onSaved, onError }) {
  const blank = {company_name:'',contact_name:'',email:'',phone:'',address:'',notes:'',logo_url:''}
  const [form, setForm] = useState(editClient ? {
    company_name:editClient.company_name,contact_name:editClient.contact_name||'',
    email:editClient.email||'',phone:editClient.phone||'',
    address:editClient.address||'',notes:editClient.notes||'',
    logo_url:editClient.logo_url||''
  } : blank)
  const [logoFile, setLogoFile] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const set = k => e => setForm(f => ({...f,[k]:e.target.value}))

  const handleSubmit = async e => {
    e.preventDefault(); setSubmitting(true)
    try {
      if (logoFile) {
        const fd = new FormData()
        Object.entries(form).forEach(([k,v]) => fd.append(k, v))
        fd.append('logo', logoFile)
        if (editClient) { await api.put(`/clients/${editClient.id}`, fd); onSaved('Client updated') }
        else { await api.post('/clients', fd); onSaved('Client added') }
      } else {
        if (editClient) { await api.put(`/clients/${editClient.id}`, form); onSaved('Client updated') }
        else { await api.post('/clients', form); onSaved('Client added') }
      }
      onClose()
    } catch(err) { onError(err.response?.data?.message||'Something went wrong') }
    finally { setSubmitting(false) }
  }

  const logoPreview = logoFile ? URL.createObjectURL(logoFile) : form.logo_url

  return (
    <div style={{position:'fixed',inset:0,zIndex:600,display:'flex',alignItems:'center',justifyContent:'center',padding:20,background:'rgba(8,8,18,.48)',backdropFilter:'blur(5px)'}}>
      <div style={{background:'var(--surface)',borderRadius:20,width:'100%',maxWidth:520,maxHeight:'92vh',overflow:'auto',padding:'34px 30px',boxShadow:'0 24px 64px rgba(0,0,0,.22)',animation:'cpModalIn .22s cubic-bezier(.22,1,.36,1)',fontFamily:"'DM Sans',sans-serif"}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:28}}>
          <div>
            <h2 style={{fontFamily:"'Fraunces',serif",fontWeight:600,fontSize:22,color:'var(--text)',letterSpacing:'-0.02em'}}>
              {editClient ? 'Edit Client' : 'New Client'}
            </h2>
            <p style={{color:'var(--text3)',fontSize:13,marginTop:5}}>{editClient ? 'Update the client record below.' : 'Fill in the details to add a new client.'}</p>
          </div>
          <button className="cp-icon-btn" onClick={onClose}><Ico.close/></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div style={{marginBottom:20,border:'1.5px dashed var(--border)',borderRadius:12,padding:16,textAlign:'center'}}>
            <label className="cp-label" style={{marginBottom:8}}>Logo</label>
            {logoPreview ? (
              <div style={{marginBottom:10}}>
                <img src={logoPreview} alt="Logo preview" style={{maxWidth:120,maxHeight:80,borderRadius:8,objectFit:'contain'}} />
              </div>
            ) : (
              <div style={{width:72,height:72,borderRadius:12,background:'var(--border-light)',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 8px',color:'var(--text3)',fontSize:10}}>No logo</div>
            )}
            <div style={{display:'flex',gap:8,justifyContent:'center'}}>
              <label className="cp-primary-btn" style={{fontSize:11,padding:'6px 14px',cursor:'pointer'}}>
                Upload File
                <input type="file" accept="image/*" style={{display:'none'}} onChange={e => { const f = e.target.files[0]; if (f) setLogoFile(f); e.target.value='' }} />
              </label>
              <span style={{color:'var(--text3)',fontSize:11,alignSelf:'center'}}>or</span>
              <input className="cp-input" style={{width:180,fontSize:11}} placeholder="Paste logo URL…" value={form.logo_url} onChange={e => { setLogoFile(null); setForm(f => ({...f, logo_url: e.target.value})) }} />
            </div>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0 16px'}}>
            <div className="cp-field">
              <label className="cp-label">Company Name <span style={{color:'#EF4444'}}>*</span></label>
              <input className="cp-input" value={form.company_name} onChange={set('company_name')} required />
            </div>
            <div className="cp-field">
              <label className="cp-label">Contact Name</label>
              <input className="cp-input" value={form.contact_name} onChange={set('contact_name')} />
            </div>
            <div className="cp-field">
              <label className="cp-label">Email</label>
              <input className="cp-input" type="email" value={form.email} onChange={set('email')} />
            </div>
            <div className="cp-field">
              <label className="cp-label">Phone</label>
              <input className="cp-input" value={form.phone} onChange={set('phone')} />
            </div>
          </div>
          <div className="cp-field">
            <label className="cp-label">Address</label>
            <textarea className="cp-input" rows={2} value={form.address} onChange={set('address')} style={{resize:'vertical'}} />
          </div>
          <div className="cp-field" style={{marginBottom:26}}>
            <label className="cp-label">Notes</label>
            <textarea className="cp-input" rows={2} value={form.notes} onChange={set('notes')} style={{resize:'vertical'}} />
          </div>
          <div style={{display:'flex',gap:10}}>
            <button type="button" className="cp-ghost-btn" onClick={onClose} style={{flex:1,justifyContent:'center'}}>Cancel</button>
            <button type="submit" className="cp-primary-btn" disabled={submitting} style={{flex:2,justifyContent:'center',padding:'12px 0',borderRadius:10,fontSize:14}}>
              {submitting ? <><Ico.spin/> Saving…</> : (editClient ? 'Save Changes' : 'Add Client')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function MasonryGrid({ children, gap = 16, minColWidth = 290 }) {
  const ref = useRef()
  const [cols, setCols] = useState(3)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const ro = new ResizeObserver(() => {
      const w = el.offsetWidth
      setCols(Math.max(1, Math.floor((w + gap) / (minColWidth + gap))))
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [gap, minColWidth])

  const items = Children.toArray(children)
  const columns = Array.from({ length: cols }, () => [])
  items.forEach((item, i) => { columns[i % cols].push(item) })

  return (
    <div ref={ref} style={{ display:'flex', gap, alignItems:'flex-start' }}>
      {columns.map((col, ci) => (
        <div key={ci} style={{ flex:1, minWidth:0, display:'flex', flexDirection:'column', gap }}>
          {col}
        </div>
      ))}
    </div>
  )
}

export default function ClientsPage() {
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editClient, setEditClient] = useState(null)
  const [selected, setSelected] = useState(null)
  const [toast, setToast] = useState(null)
  const [search, setSearch] = useState('')

  const load = () => api.get('/clients').then(r => setClients(r.data.clients||[])).finally(() => setLoading(false))
  useEffect(() => { load() }, [])

  const openAdd = () => { setEditClient(null); setShowForm(true) }
  const openEdit = c => { setEditClient(c); setSelected(null); setShowForm(true) }
  const handleDelete = async id => {
    if (!confirm('Delete this client and all their games?')) return
    try { await api.delete(`/clients/${id}`); setToast({msg:'Client deleted',type:'success'}); setSelected(null); load() }
    catch { setToast({msg:'Delete failed',type:'error'}) }
  }

  const filtered = clients.filter(c => !search || [c.company_name,c.contact_name,c.email].some(v=>v?.toLowerCase().includes(search.toLowerCase())))

  return (
    <div className="cp">
      <style>{CSS}</style>
      <div style={{padding:'36px 40px',maxWidth:1120,margin:'0 auto'}}>

        <div style={{display:'flex',alignItems:'flex-end',justifyContent:'space-between',marginBottom:32,flexWrap:'wrap',gap:16}}>
          <div>
            <p style={{fontSize:11,fontWeight:700,color:'var(--text3)',textTransform:'uppercase',letterSpacing:'.1em',marginBottom:8}}>Management</p>
            <h1 style={{fontFamily:"'Fraunces',serif",fontWeight:600,fontSize:36,color:'var(--text)',letterSpacing:'-0.03em',lineHeight:1}}>
              Clients
            </h1>
            <p style={{fontSize:13.5,color:'var(--text3)',marginTop:8}}>
              {clients.length} client{clients.length!==1?'s':''} in your workspace
            </p>
          </div>
          <div style={{display:'flex',alignItems:'center',gap:12}}>
            {clients.length > 0 && (
              <div style={{position:'relative',minWidth:220}}>
                <span style={{position:'absolute',left:13,top:'50%',transform:'translateY(-50%)',color:'var(--text3)'}}><Ico.search/></span>
                <input className="cp-input" style={{paddingLeft:40}} placeholder="Search by name or email…" value={search} onChange={e=>setSearch(e.target.value)} />
              </div>
            )}
            <button className="cp-primary-btn" onClick={openAdd}><Ico.plus/> Add Client</button>
          </div>
        </div>

        {loading ? (
          <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:10,padding:'80px 0',color:'var(--text3)',fontSize:14}}>
            <Ico.spin/> Loading clients…
          </div>
        ) : clients.length === 0 ? (
          <div style={{textAlign:'center',padding:'80px 0'}}>
            <div style={{width:72,height:72,borderRadius:18,background:'var(--chip-primary-bg)',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 20px'}}>
              <svg width="30" height="30" fill="none" stroke="var(--primary)" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
            </div>
            <h3 style={{fontFamily:"'Fraunces',serif",fontWeight:600,fontSize:20,color:'var(--text)',marginBottom:8}}>No clients yet</h3>
            <p style={{color:'var(--text3)',fontSize:14,marginBottom:24}}>Add your first client to get started.</p>
            <button className="cp-primary-btn" onClick={openAdd}><Ico.plus/> Add Client</button>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{textAlign:'center',padding:'60px 0',color:'var(--text3)',fontSize:14}}>
            No results for "<strong style={{color:'var(--text)'}}>{search}</strong>"
          </div>
        ) : (
          <MasonryGrid gap={16} minColWidth={290}>
            {filtered.map((c,i) => <ClientCard key={c.id} client={c} onClick={setSelected} onEdit={openEdit} onDelete={handleDelete} delay={i*45} />)}
          </MasonryGrid>
        )}
      </div>

      {selected && <DetailPanel client={selected} onClose={() => setSelected(null)} onEdit={openEdit} />}
      {showForm && <FormModal editClient={editClient} onClose={() => setShowForm(false)} onSaved={msg=>{setToast({msg,type:'success'});load()}} onError={msg=>setToast({msg,type:'error'})} />}
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  )
}