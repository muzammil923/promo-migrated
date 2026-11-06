import { useState, useEffect } from 'react'
import api from '../api'

const FONT_URL = `https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&family=Fraunces:opsz,wght@9..144,300;9..144,600&display=swap`

const AVATAR_PALETTE = [
  { bg:'var(--chip-primary-bg)', fg:'var(--chip-primary-fg)' }, { bg:'var(--chip-green-bg)', fg:'var(--chip-green-fg)' },
  { bg:'var(--chip-orange-bg)', fg:'var(--chip-orange-fg)' }, { bg:'var(--chip-rose-bg)', fg:'var(--chip-rose-fg)' },
  { bg:'var(--chip-cyan-bg)', fg:'var(--chip-cyan-fg)' }, { bg:'var(--chip-red-bg)', fg:'var(--chip-red-fg)' },
  { bg:'var(--chip-primary-bg)', fg:'var(--chip-primary-fg)' }, { bg:'var(--chip-amber-bg)', fg:'var(--chip-amber-fg)' },
]
const avatarColor = (name = '') => AVATAR_PALETTE[(name.charCodeAt(0) || 0) % AVATAR_PALETTE.length]
const initials = (name = '') => name.trim().split(/\s+/).map(w => w[0]).join('').slice(0, 2).toUpperCase()

const PERMISSIONS = [
  { key: 'can_create_client', label: 'Create Clients' },
  { key: 'can_create_game', label: 'Create Games' },
  { key: 'can_edit_game', label: 'Edit Games' },
  { key: 'can_manage_bo', label: 'Manage Business Owners' },
  { key: 'can_view_analytics', label: 'View Analytics' },
]

const CSS = `
@import url('${FONT_URL}');
.crm *,.crm *::before,.crm *::after{box-sizing:border-box;margin:0;padding:0}
.crm{font-family:'DM Sans',sans-serif;color:var(--text);background:var(--bg-secondary);min-height:100vh}
@keyframes crmFadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
@keyframes crmModalIn{from{opacity:0;transform:scale(0.96)translateY(6px)}to{opacity:1;transform:none}}
@keyframes crmToastIn{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none}}
@keyframes crmSpin{to{transform:rotate(360deg)}}
.crm-card{background:var(--surface);border-radius:16px;border:1.5px solid var(--border);padding:22px 22px 18px;transition:border-color .18s,box-shadow .18s,transform .18s;animation:crmFadeUp .3s ease both}
.crm-card:hover{border-color:var(--primary);box-shadow:0 6px 28px var(--primary-bg);transform:translateY(-2px)}
.crm-icon-btn{width:30px;height:30px;border-radius:8px;border:1px solid var(--border);background:var(--surface2);display:flex;align-items:center;justifyContent:center;cursor:pointer;color:var(--text);transition:background .13s}
.crm-icon-btn:hover{background:var(--border-light)}
.crm-input{width:100%;padding:10px 14px;border-radius:10px;border:1.5px solid var(--border);font-size:14px;font-family:'DM Sans',sans-serif;color:var(--text);background:var(--surface2);outline:none;transition:border-color .15s}
.crm-input:focus{border-color:var(--primary);background:var(--surface)}
.crm-label{display:block;font-size:10.5px;font-weight:700;color:var(--text3);text-transform:uppercase;letter-spacing:.09em;margin-bottom:6px}
.crm-field{margin-bottom:16px}
.crm-primary-btn{display:inline-flex;align-items:center;gap:8px;padding:10px 20px;border-radius:10px;border:none;background:var(--primary);color:#fff;font-size:13.5px;font-family:'DM Sans',sans-serif;font-weight:600;cursor:pointer;transition:background .14s}
.crm-primary-btn:hover{background:var(--primary-hover)}
.crm-primary-btn:disabled{opacity:.55;cursor:not-allowed}
.crm-ghost-btn{display:inline-flex;align-items:center;gap:8px;padding:10px 18px;border-radius:10px;border:1.5px solid var(--border);background:var(--surface);color:var(--text);font-size:13.5px;font-family:'DM Sans',sans-serif;font-weight:500;cursor:pointer;transition:background .13s}
.crm-ghost-btn:hover{background:var(--border-light)}
.crm-badge{padding:4px 10px;border-radius:100px;font-size:11px;font-weight:700;display:inline-block}
.crm-empty-state{text-align:center;padding:80px 0}
`

const Ico = {
  mail: () => <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><rect x="2" y="4" width="20" height="16" rx="2.5"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>,
  phone: () => <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13.5 19.79 19.79 0 0 1 1.61 4.9 2 2 0 0 1 3.59 2.72h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 10a16 16 0 0 0 6.09 6.09l.98-.98a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>,
  edit: () => <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  trash: () => <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>,
  close: () => <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12"/></svg>,
  plus: () => <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>,
  spin: () => <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" style={{animation:'crmSpin .75s linear infinite'}}><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>,
}

function Avatar({ name, size = 46 }) {
  const c = avatarColor(name)
  return (
    <div style={{width:size,height:size,borderRadius:10,flexShrink:0,background:c.bg,color:c.fg,
      display:'flex',alignItems:'center',justifyContent:'center',
      fontSize:size*.32,fontWeight:700,letterSpacing:'0.03em',fontFamily:"'DM Sans',sans-serif"}}>
      {initials(name)}
    </div>
  )
}

function Toast({ msg, type, onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 3200); return () => clearTimeout(t) }, [])
  const ok = type === 'success'
  return (
    <div style={{
      position:'fixed',bottom:28,right:28,zIndex:9999,
      background:ok?'#052E16':'#450A0A',
      color:'#fff',padding:'13px 20px 13px 16px',borderRadius:12,
      fontSize:13.5,fontFamily:"'DM Sans',sans-serif",fontWeight:500,
      display:'flex',alignItems:'center',gap:10,
      boxShadow:'0 8px 32px rgba(0,0,0,.24)',
      borderLeft:`3px solid ${ok?'var(--success)':'var(--error)'}`,
      animation:'crmToastIn .28s cubic-bezier(.34,1.56,.64,1)',maxWidth:380,
    }}>
      {ok ? '✓' : '✕'} {msg}
    </div>
  )
}

export default function CRMPage() {
  const [team, setTeam] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editMember, setEditMember] = useState(null)
  const [formFields, setFormFields] = useState({ name:'', email:'', phone:'', permissions:[] })
  const [submitting, setSubmitting] = useState(false)
  const [toast, setToast] = useState(null)
  const [search, setSearch] = useState('')

  const load = () => {
    setLoading(true)
    api.get('/internal-team/list').then(r => {
      setTeam(r.data.members || [])
    }).catch(() => {}).finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const showToast = (msg, type='success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  const set = k => e => setFormFields(f => ({...f, [k]: e.target.value}))

  const togglePerm = (key) => {
    setFormFields(f => ({
      ...f,
      permissions: f.permissions.includes(key)
        ? f.permissions.filter(p => p !== key)
        : [...f.permissions, key]
    }))
  }

  const handleCreate = async e => {
    e.preventDefault()
    if (!formFields.name || !formFields.email || !formFields.phone) return
    setSubmitting(true)
    try {
      if (editMember) {
        await api.put(`/internal-team/${editMember.id}`, {
          name: formFields.name,
          email: formFields.email,
          phone: formFields.phone,
          permissions: formFields.permissions,
        })
        showToast('Team member updated!')
      } else {
        await api.post('/internal-team/create', {
          name: formFields.name,
          email: formFields.email,
          phone: formFields.phone,
          permissions: formFields.permissions,
        })
        showToast('Team member created!')
      }
      showToast(editMember ? 'Member updated' : 'Member created')
      setShowForm(false)
      setEditMember(null)
      setFormFields({ name:'', email:'', phone:'', permissions:[] })
      load()
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed', 'error')
    }
    setSubmitting(false)
  }

  const handleEdit = (member) => {
    const perms = typeof member.permissions === 'string' ? JSON.parse(member.permissions || '[]') : (member.permissions || [])
    setFormFields({
      name: member.name,
      email: member.email,
      phone: member.phone,
      permissions: perms,
    })
    setEditMember(member)
    setShowForm(true)
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this team member?')) return
    try {
      await api.delete(`/internal-team/${id}`)
      showToast('Member deleted')
      load()
    } catch { showToast('Failed to delete', 'error') }
  }

  const handleTogglePerm = async (memberId, permKey) => {
    const member = team.find(m => m.id === memberId)
    if (!member) return
    const perms = typeof member.permissions === 'string' ? JSON.parse(member.permissions || '[]') : (member.permissions || [])
    const updated = perms.includes(permKey)
      ? perms.filter(p => p !== permKey)
      : [...perms, permKey]
    try {
      await api.put(`/internal-team/${memberId}/permissions`, { permissions: updated })
      showToast(updated.includes(permKey) ? 'Permission added' : 'Permission removed')
      load()
    } catch { showToast('Failed to update permission', 'error') }
  }

  const filtered = team.filter(m => !search || [m.name, m.email, m.phone].some(v => v?.toLowerCase().includes(search.toLowerCase())))

  return (
    <div className="crm">
      <style>{CSS}</style>
      <div style={{padding:'36px 40px',maxWidth:1200,margin:'0 auto'}}>

        {/* Header */}
        <div style={{display:'flex',alignItems:'flex-end',justifyContent:'space-between',marginBottom:32,flexWrap:'wrap',gap:16}}>
          <div>
            <p style={{fontSize:11,fontWeight:700,color:'var(--text3)',textTransform:'uppercase',letterSpacing:'.1em',marginBottom:8}}>Administration</p>
            <h1 style={{fontFamily:"'Fraunces',serif",fontWeight:600,fontSize:36,color:'var(--text)',letterSpacing:'-0.03em',lineHeight:1}}>
              Internal Team
            </h1>
            <p style={{fontSize:13.5,color:'var(--text3)',marginTop:8}}>
              {team.length} member{team.length!==1?'s':''} · Role-based access control
            </p>
          </div>
          <div style={{display:'flex',alignItems:'center',gap:12}}>
            <div style={{position:'relative'}}>
              <input className="crm-input" placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} style={{width:220,paddingLeft:36}} />
              <svg width="14" height="14" fill="none" stroke="var(--text3)" strokeWidth="2" viewBox="0 0 24 24" style={{position:'absolute',left:12,top:'50%',transform:'translateY(-50%)'}}>
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
            </div>
            <button className="crm-primary-btn" onClick={() => { setShowForm(true); setEditMember(null); setFormFields({name:'',email:'',phone:'',permissions:[]}) }}>
              <Ico.plus/> Add Member
            </button>
          </div>
        </div>

        {loading ? (
          <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:10,padding:'80px 0',color:'var(--text3)',fontSize:14}}>
            <Ico.spin/> Loading…
          </div>
        ) : filtered.length === 0 ? (
          <div className="crm-empty-state">
            <div style={{width:72,height:72,borderRadius:18,background:'var(--primary-bg)',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 20px',fontSize:28}}>👥</div>
            <h3 style={{fontFamily:"'Fraunces',serif",fontWeight:600,fontSize:20,color:'var(--text)',marginBottom:8}}>
              {search ? 'No matches' : 'No team members yet'}
            </h3>
            <p style={{color:'var(--text3)',fontSize:14,marginBottom:24}}>
              {search ? 'Try a different search term' : 'Add your first team member with role-based permissions.'}
            </p>
            {!search && <button className="crm-primary-btn" onClick={() => { setShowForm(true); setEditMember(null) }}><Ico.plus/> Add Member</button>}
          </div>
        ) : (
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))',gap:16}}>
            {filtered.map((member, i) => {
              const perms = typeof member.permissions === 'string' ? JSON.parse(member.permissions || '[]') : (member.permissions || [])
              return (
                <div key={member.id} className="crm-card" style={{animationDelay:`${i*40}ms`}}>
                  <div style={{display:'flex',alignItems:'flex-start',gap:13,marginBottom:14}}>
                    <Avatar name={member.name} />
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontWeight:700,fontSize:15,color:'var(--text)',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{member.name}</div>
                      <div style={{fontSize:12.5,color:'var(--text2)',marginTop:2}}>{member.email}</div>
                      <div style={{fontSize:12,color:'var(--text3)',marginTop:2}}>{member.phone}</div>
                    </div>
                    <div style={{display:'flex',gap:4,flexShrink:0}}>
                      <button className="crm-icon-btn" onClick={() => handleEdit(member)} title="Edit"><Ico.edit/></button>
                      <button className="crm-icon-btn" onClick={() => handleDelete(member.id)} title="Delete" style={{color:'var(--error)'}}><Ico.trash/></button>
                    </div>
                  </div>

                  {/* Permissions */}
                  <div style={{paddingTop:12,borderTop:'1px solid var(--border-light)'}}>
                    <div style={{fontSize:10,fontWeight:700,color:'var(--text3)',textTransform:'uppercase',letterSpacing:'.08em',marginBottom:8}}>Permissions</div>
                    <div style={{display:'flex',flexWrap:'wrap',gap:4}}>
                      {PERMISSIONS.map(p => {
                        const active = perms.includes(p.key)
                        return (
                          <button key={p.key} onClick={() => handleTogglePerm(member.id, p.key)} style={{
                            padding:'3px 8px',borderRadius:6,fontSize:10,fontWeight:600,cursor:'pointer',
                            border:`1px solid ${active ? 'var(--primary)' : 'var(--border)'}`,
                            background:active ? 'var(--primary-bg)' : 'var(--surface2)',
                            color:active ? 'var(--primary)' : 'var(--text3)',
                            fontFamily:'inherit',transition:'all .12s',
                          }}>
                            {active ? '✓ ' : ''}{p.label}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Create/Edit Modal */}
        {showForm && (
          <div style={{position:'fixed',inset:0,zIndex:600,display:'flex',alignItems:'center',justifyContent:'center',padding:20,background:'rgba(8,8,18,.48)',backdropFilter:'blur(5px)'}} onClick={() => { setShowForm(false); setEditMember(null) }}>
            <div style={{background:'var(--surface)',borderRadius:20,width:'100%',maxWidth:480,maxHeight:'90vh',overflow:'auto',padding:'32px 28px',boxShadow:'0 24px 64px rgba(0,0,0,.22)',animation:'crmModalIn .22s cubic-bezier(.22,1,.36,1)',fontFamily:"'DM Sans',sans-serif"}} onClick={e => e.stopPropagation()}>
              <h2 style={{fontFamily:"'Fraunces',serif",fontWeight:600,fontSize:20,color:'var(--text)',textAlign:'center',marginBottom:4}}>
                {editMember ? 'Edit Member' : 'Add Team Member'}
              </h2>
              <p style={{color:'var(--text3)',fontSize:13,textAlign:'center',marginBottom:24}}>
                {editMember ? 'Update member details and permissions' : 'Phone number is used as login password'}
              </p>

              <div className="crm-field">
                <label className="crm-label">Name <span style={{color:'#EF4444'}}>*</span></label>
                <input className="crm-input" value={formFields.name} onChange={set('name')} placeholder="Full name" autoFocus />
              </div>
              <div className="crm-field">
                <label className="crm-label">Email <span style={{color:'#EF4444'}}>*</span></label>
                <input className="crm-input" type="email" value={formFields.email} onChange={set('email')} placeholder="member@company.com" />
              </div>
              <div className="crm-field">
                <label className="crm-label">Phone <span style={{color:'#EF4444'}}>*</span></label>
                <input className="crm-input" type="tel" value={formFields.phone} onChange={set('phone')} placeholder="9876543210" />
              </div>

              <div className="crm-field">
                <label className="crm-label">Permissions</label>
                <div style={{display:'flex',flexDirection:'column',gap:8}}>
                  {PERMISSIONS.map(p => (
                    <label key={p.key} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'10px 14px',background:'#F9FAFA',borderRadius:10,cursor:'pointer',transition:'background .12s'}}
                      onMouseEnter={e => e.currentTarget.style.background='var(--border-light)'}
                      onMouseLeave={e => e.currentTarget.style.background='#F9FAFA'}>
                      <span style={{fontSize:13,fontWeight:500,color:'var(--text)'}}>{p.label}</span>
                      <button type="button" onClick={() => togglePerm(p.key)} style={{
                        width:42,height:24,borderRadius:12,border:'none',cursor:'pointer',position:'relative',
                        background:formFields.permissions.includes(p.key)?'var(--success)':'var(--border-light)',transition:'background .15s',flexShrink:0,
                      }}>
                        <span style={{position:'absolute',top:3,left:formFields.permissions.includes(p.key)?21:3,width:18,height:18,borderRadius:9,background:'var(--surface)',transition:'left .15s',boxShadow:'0 1px 3px rgba(0,0,0,.2)'}} />
                      </button>
                    </label>
                  ))}
                </div>
              </div>

              <div style={{display:'flex',gap:10,marginTop:8}}>
                <button type="button" className="crm-ghost-btn" onClick={() => { setShowForm(false); setEditMember(null) }} style={{flex:1,justifyContent:'center'}}>Cancel</button>
                <button className="crm-primary-btn" onClick={handleCreate} disabled={submitting || !formFields.name || !formFields.email || !formFields.phone} style={{flex:2,justifyContent:'center',padding:'12px 0'}}>
                  {submitting ? <><Ico.spin/> Saving…</> : (editMember ? 'Update Member' : 'Add Member')}
                </button>
              </div>
            </div>
          </div>
        )}

        {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
      </div>
    </div>
  )
}
