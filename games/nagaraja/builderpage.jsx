import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../../apps/frontend/src/api'

const COLOR_PRESETS = ['#1a1a2e','#ffffff','#000000','#ef4444','#22c55e','#3b82f6',
  '#f59e0b','#8b5cf6','#ec4899','#14b8a6','#f97316','#6366f1','#84cc16','#0ea5e9']

const inputStyle = { width:'100%', padding:'7px 10px', border:'1px solid #e2e6f0', borderRadius:8, fontSize:13, background:'#fff', color:'#1a1a2e' }
const labelStyle = { display:'block', fontSize:11.5, fontWeight:600, color:'#64748b', textTransform:'uppercase', letterSpacing:'.03em', marginBottom:4 }
const cardStyle = { background:'#fff', border:'1px solid #e6e9f2', borderRadius:12, padding:16, marginBottom:16, boxShadow:'0 1px 3px rgba(0,0,0,.04)' }

function ColorPicker({ value, onChange, label }) {
  const [show, setShow] = useState(false)
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
      {label && <span style={labelStyle}>{label}</span>}
      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
        <div onClick={() => setShow(s=>!s)} style={{ width:26, height:26, borderRadius:6, background:value||'#6366f1', border:'1px solid #e2e6f0', cursor:'pointer' }} />
        <input value={value||''} onChange={e=>onChange(e.target.value)} style={{ ...inputStyle, width:90 }} />
        {show && <input type="color" value={value||'#000000'} onChange={e=>onChange(e.target.value)} style={{ width:34, height:28, padding:0, border:'none', cursor:'pointer' }} />}
      </div>
      {show && <div style={{ display:'flex', gap:4, marginTop:2, flexWrap:'wrap' }}>
        {COLOR_PRESETS.map(c => <div key={c} onClick={()=>{onChange(c); setShow(false)}} style={{ width:18, height:18, background:c, borderRadius:4, border: value===c?'2px solid #6366f1':'1px solid #e2e6f0', cursor:'pointer' }} />)}
      </div>}
    </div>
  )
}

function SoundSelector({ label, value, onChange, sounds }) {
  return (
    <div>
      <span style={labelStyle}>{label}</span>
      <select value={value||''} onChange={e=>onChange(e.target.value)} style={inputStyle}>
        <option value="">— None —</option>
        {sounds.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
      </select>
    </div>
  )
}

function GiftEditor({ gifts, setGifts }) {
  const emojis = ['🔴','🟡','🟢','🔵','🟣','🟠','💎','⭐','🍎','🍇','🍊','🥝','🍓','💛','🍩','🍬','🧁','🎁','💠','🌟','❌','✅','🔥']
  const field = (i, key, v, style) => (
    <input style={{ ...inputStyle, ...(style||{}) }} value={v}
      onChange={e => { const g=[...gifts]; g[i]={ ...g[i], [key]: e.target.value }; setGifts(g) }} />
  )
  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
        <span style={{ fontSize:13, color:'#64748b' }}>Add as many gifts as you want — the snake will eat them all.</span>
        <button type="button" style={{ padding:'7px 14px', background:'#6366f1', color:'#fff', border:'none', borderRadius:8, fontSize:13, cursor:'pointer' }}
          onClick={() => setGifts([...gifts, { name:'New Gift', emoji:'🎁', color:'#f59e0b', points:1, size:1, spawnWeight:10 }])}>+ Add Gift</button>
      </div>
      {gifts.map((g, i) => (
        <div key={i} style={{ border:'1px solid #e6e9f2', borderRadius:10, padding:12, marginBottom:10, background:'#fafbfe' }}>
          <div style={{ display:'grid', gridTemplateColumns:'1.4fr 1fr 1fr 1fr 1fr', gap:10, alignItems:'end' }}>
            <div><span style={labelStyle}>Name</span>{field(i,'name',g.name)}</div>
            <div><span style={labelStyle}>Emoji</span>
              <select style={inputStyle} value={g.emoji||''} onChange={e=>{ const gg=[...gifts]; gg[i]={...gg[i], emoji:e.target.value}; setGifts(gg) }}>
                {emojis.map(e => <option key={e} value={e}>{e}</option>)}
              </select>
            </div>
            <div><ColorPicker label="Color" value={g.color||'#f59e0b'} onChange={v=>{ const gg=[...gifts]; gg[i]={...gg[i], color:v}; setGifts(gg) }} /></div>
            <div><span style={labelStyle}>Points / Size</span>
              <div style={{ display:'flex', gap:6 }}>
                <input type="number" min={1} style={{ ...inputStyle, width:'50%' }} value={g.points||1} onChange={e=>{ const gg=[...gifts]; gg[i]={...gg[i], points:parseInt(e.target.value)||1}; setGifts(gg) }} />
                <input type="number" min={1} max={4} style={{ ...inputStyle, width:'50%' }} value={g.size||1} onChange={e=>{ const gg=[...gifts]; gg[i]={...gg[i], size:parseInt(e.target.value)||1}; setGifts(gg) }} />
              </div>
              <div style={{ fontSize:10, color:'#94a3b8', marginTop:2 }}>pts · size</div>
            </div>
            <div><span style={labelStyle}>Spawn Weight</span><input type="number" min={1} style={inputStyle} value={g.spawnWeight||1} onChange={e=>{ const gg=[...gifts]; gg[i]={...gg[i], spawnWeight:parseInt(e.target.value)||1}; setGifts(gg) }} /></div>
          </div>
          <div style={{ display:'flex', justifyContent:'flex-end', marginTop:10 }}>
            <button type="button" style={{ padding:'5px 12px', background:'#fee2e2', color:'#b91c1c', border:'none', borderRadius:6, fontSize:12, cursor:'pointer' }}
              onClick={() => setGifts(gifts.filter((_,k)=>k!==i))}>Remove</button>
          </div>
        </div>
      ))}
      {gifts.length === 0 && <div style={{ textAlign:'center', color:'#94a3b8', fontSize:13, padding:20 }}>No gifts yet. Add your first gift above!</div>}
    </div>
  )
}

export default function NagarajaBuilderPage() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [game, setGame] = useState(null)
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState(null)
  const [tab, setTab] = useState('gameplay')
  const [settings, setSettings] = useState({})
  const [sounds, setSounds] = useState([])
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState(null)
  const [redirectUrl, setRedirectUrl] = useState('')
  const [slugInput, setSlugInput] = useState('')
  const [formFields, setFormFields] = useState([])

  const showToast = (msg, type='success') => setToast({ msg, type })
  useEffect(() => { if (toast) { const t=setTimeout(()=>setToast(null),3200); return()=>clearTimeout(t) } }, [toast])

  const gifts = Array.isArray(settings.gifts_json) ? settings.gifts_json : []
  const setGifts = (g) => setSettings({ ...settings, gifts_json: g })

  const loadData = useCallback(() => {
    setLoading(true); setFetchError(null)
    Promise.all([
      api.get(`/games/${id}`),
      api.get(`/nagaraja/${id}/settings`),
      api.get(`/sounds/games/${id}/sounds`)
    ]).then(([gRes, sRes, soundRes]) => {
      setGame(gRes.data.game)
      const s = sRes.data.settings || {}
      try { if (typeof s.gifts_json === 'string') s.gifts_json = JSON.parse(s.gifts_json) } catch (_) { s.gifts_json = [] }
      if (!Array.isArray(s.gifts_json)) s.gifts_json = []
      setSettings(s)
      setSounds(soundRes.data.sounds || [])
      setFormFields(gRes.data.game.formFields || [])
      setRedirectUrl(gRes.data.game.redirect_url || '')
      setSlugInput(gRes.data.game.slug || '')
    }).catch(err => setFetchError(err.response?.data?.message || err.message || 'Failed to load'))
      .finally(() => setLoading(false))
  }, [id])
  useEffect(() => { loadData() }, [loadData])

  const saveSettings = async () => {
    setSaving(true)
    try {
      const fd = new FormData()
      const textFields = ['world_width','world_height','speed','snake_color','ai_snake_count','ai_speed','gift_count','boost_enabled',
        'heading_1','heading_2','heading_3','description_text','intro_text','outro_text','submit_button_text','continue_button_text','start_button_text',
        'font_family','show_timer','time_limit_seconds','sound_eat_id','sound_gameover_id','terms_enabled','terms_text','terms_url','meta_description',
        'heading_1_color','heading_2_color','heading_3_color','description_color','bg_color','primary_color']
      for (const f of textFields) fd.append(f, settings[f] ?? '')
      fd.append('gifts_json', JSON.stringify(gifts))
      fd.append('bg_image_url', settings.bg_image_url || '')
      fd.append('game_logo_url', settings.game_logo_url || '')
      await api.put(`/nagaraja/${id}/settings`, fd)
      await api.put(`/games/${id}`, { redirect_url: redirectUrl, slug: slugInput.trim() || undefined })
      showToast('Settings saved')
    } catch (err) { showToast('Error: ' + (err.response?.data?.message || err.message), 'error') }
    setSaving(false)
  }

  const saveFormFields = async () => {
    setSaving(true)
    try { await api.put(`/games/${id}/form-fields`, { fields: formFields }); showToast('Form fields saved') }
    catch { showToast('Error saving form fields', 'error') }
    setSaving(false)
  }

  const gameLink = game ? `${window.location.origin}/play/${game.slug}/${game.client_slug}` : ''
  const TABS = [
    { id:'gameplay', label:'Gameplay & Gifts' },
    { id:'theme', label:'Theme' },
    { id:'form', label:'Player Form' },
    { id:'texts', label:'Texts' },
    { id:'audio', label:'Audio' },
    { id:'settings', label:'Settings' },
  ]

  if (loading) return <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'100vh', fontFamily:'Segoe UI,sans-serif' }}>Loading builder…</div>

  if (fetchError) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'100vh' }}>
      <div style={{ textAlign:'center' }}>
        <h2>Builder Failed to Load</h2>
        <p style={{ color:'#64748b' }}>{fetchError}</p>
        <button onClick={loadData} style={{ marginRight:8, padding:'8px 14px', background:'#6366f1', color:'#fff', border:'none', borderRadius:8, cursor:'pointer' }}>Retry</button>
        <button onClick={() => navigate('/dashboard/games')} style={{ padding:'8px 14px', background:'#e2e6f0', border:'none', borderRadius:8, cursor:'pointer' }}>Back</button>
      </div>
    </div>
  )

  return (
    <div style={{ minHeight:'100vh', background:'#f4f6fb', fontFamily:'Segoe UI,sans-serif' }}>
      {toast && <div style={{ position:'fixed', top:16, right:16, zIndex:1000, background:toast.type==='success'?'#16a34a':'#dc2626', color:'#fff', padding:'10px 16px', borderRadius:8 }}>{toast.msg}</div>}
      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', background:'#fff', borderBottom:'1px solid #e6e9f2', padding:'10px 24px' }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <button onClick={() => navigate('/dashboard/games')} style={{ padding:'6px 10px', background:'#f4f6fb', border:'1px solid #e6e9f2', borderRadius:8, cursor:'pointer' }}>←</button>
          <div>
            <div style={{ fontWeight:700, fontSize:14 }}>🐍 {game?.name || 'Nagaraja'} <span style={{ fontSize:10, color:'#94a3b8' }}>Builder</span></div>
          </div>
        </div>
        <div style={{ display:'flex', gap:4 }}>
          {TABS.map(t => <button key={t.id} onClick={()=>setTab(t.id)} style={{ padding:'6px 12px', background:tab===t.id?'#6366f1':'transparent', color:tab===t.id?'#fff':'#334155', border:'none', borderRadius:8, fontSize:12.5, cursor:'pointer' }}>{t.label}</button>)}
        </div>
        <div style={{ display:'flex', gap:6 }}>
          <button onClick={()=>{ navigator.clipboard.writeText(gameLink); showToast('Link copied!') }} style={{ padding:'6px 10px', background:'#f4f6fb', border:'1px solid #e6e9f2', borderRadius:8, cursor:'pointer' }}>🔗</button>
          <a href={gameLink} target="_blank" rel="noreferrer" style={{ padding:'6px 10px', background:'#f4f6fb', border:'1px solid #e6e9f2', borderRadius:8, cursor:'pointer', textDecoration:'none' }}>👁</a>
        </div>
      </div>

      <div style={{ maxWidth:1000, margin:'0 auto', padding:24 }}>
        {/* ════ GAMEPLAY ════ */}
        {tab === 'gameplay' && (
          <div>
            <div style={cardStyle}>
              <h3 style={{ margin:'0 0 14px', fontSize:16 }}>World & Difficulty</h3>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1fr', gap:12 }}>
                <div><span style={labelStyle}>World Width</span><input type="number" min={800} value={settings.world_width??1600} style={inputStyle} onChange={e=>setSettings({...settings,world_width:parseInt(e.target.value)||1600})} /></div>
                <div><span style={labelStyle}>World Height</span><input type="number" min={600} value={settings.world_height??1200} style={inputStyle} onChange={e=>setSettings({...settings,world_height:parseInt(e.target.value)||1200})} /></div>
                <div><span style={labelStyle}>Speed (1-10)</span><input type="number" min={1} max={10} value={settings.speed??5} style={inputStyle} onChange={e=>setSettings({...settings,speed:parseInt(e.target.value)||5})} /></div>
                <div><ColorPicker label="Snake Color" value={settings.snake_color||'#22c55e'} onChange={v=>setSettings({...settings,snake_color:v})} /></div>
              </div>
            </div>

            <div style={cardStyle}>
              <h3 style={{ margin:'0 0 14px', fontSize:16 }}>AI Snakes</h3>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:12 }}>
                <div><span style={labelStyle}>Number of AI Snakes</span><input type="number" min={0} max={30} value={settings.ai_snake_count??6} style={inputStyle} onChange={e=>setSettings({...settings,ai_snake_count:parseInt(e.target.value)||0})} /></div>
                <div><span style={labelStyle}>AI Speed (1-8)</span><input type="number" min={1} max={8} value={settings.ai_speed??3} style={inputStyle} onChange={e=>setSettings({...settings,ai_speed:parseInt(e.target.value)||3})} /></div>
                <div>
                  <span style={labelStyle}>Boost (hold to sprint, sheds)</span>
                  <label style={{ display:'flex', alignItems:'center', gap:8, marginTop:8 }}>
                    <input type="checkbox" style={{ width:16, height:16 }} checked={!!settings.boost_enabled} onChange={e=>setSettings({...settings,boost_enabled:e.target.checked?1:0})} />
                    <span style={{ fontSize:13 }}>Enable boost</span>
                  </label>
                </div>
              </div>
            </div>

            <div style={cardStyle}>
              <h3 style={{ margin:'0 0 4px', fontSize:16 }}>Gifts (edible items)</h3>
              <p style={{ margin:'0 0 12px', fontSize:12.5, color:'#64748b' }}>These are the items your Nagaraja snake eats to grow and score. Add as many as you want.</p>
              <div style={{ marginBottom:12 }}><div><span style={labelStyle}>Gift density on map</span><input type="number" min={5} max={200} value={settings.gift_count??40} style={{...inputStyle,width:100}} onChange={e=>setSettings({...settings,gift_count:parseInt(e.target.value)||40})} /></div></div>
              <GiftEditor gifts={gifts} setGifts={setGifts} />
            </div>

            <div style={{ display:'flex', justifyContent:'flex-end', marginTop:12 }}>
              <button onClick={saveSettings} disabled={saving} style={{ padding:'10px 28px', background:'#16a34a', color:'#fff', border:'none', borderRadius:8, fontSize:14, fontWeight:600, cursor:'pointer' }}>{saving?'⏳ Saving…':'💾 Save Gameplay Settings'}</button>
            </div>
          </div>
        )}

        {/* ════ THEME ════ */}
        {tab === 'theme' && (
          <div>
            <div style={cardStyle}>
              <h3 style={{ margin:'0 0 14px', fontSize:16 }}>Colors</h3>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:12 }}>
                <ColorPicker label="Background Color" value={settings.bg_color||'#0d0a1a'} onChange={v=>setSettings({...settings,bg_color:v})} />
                <ColorPicker label="Primary Color" value={settings.primary_color||'#8b5cf6'} onChange={v=>setSettings({...settings,primary_color:v})} />
              </div>
            </div>
            <div style={cardStyle}>
              <h3 style={{ margin:'0 0 14px', fontSize:16 }}>Headings & Description Colors</h3>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1fr', gap:12 }}>
                <ColorPicker label="Heading 1" value={settings.heading_1_color||'#1a1a2e'} onChange={v=>setSettings({...settings,heading_1_color:v})} />
                <ColorPicker label="Heading 2" value={settings.heading_2_color||'#666666'} onChange={v=>setSettings({...settings,heading_2_color:v})} />
                <ColorPicker label="Heading 3" value={settings.heading_3_color||'#777777'} onChange={v=>setSettings({...settings,heading_3_color:v})} />
                <ColorPicker label="Description" value={settings.description_color||'#888888'} onChange={v=>setSettings({...settings,description_color:v})} />
              </div>
            </div>
            <div style={{ display:'flex', justifyContent:'flex-end', marginTop:12 }}>
              <button onClick={saveSettings} disabled={saving} style={{ padding:'10px 28px', background:'#16a34a', color:'#fff', border:'none', borderRadius:8, cursor:'pointer' }}>{saving?'⏳…':'💾 Save'}</button>
            </div>
          </div>
        )}

        {/* ════ FORM ════ */}
        {tab === 'form' && (
          <div style={cardStyle}>
            <h3 style={{ margin:'0 0 4px', fontSize:16 }}>Player Form Fields</h3>
            <p style={{ margin:'0 0 14px', fontSize:12.5, color:'#64748b' }}>Optional questions to collect before playing.</p>
            {formFields.map((f, i) => (
              <div key={i} style={{ display:'grid', gridTemplateColumns:'2fr 1fr auto auto', gap:10, alignItems:'center', marginBottom:10 }}>
                <input style={inputStyle} value={f.field_label||''} placeholder="Field label" onChange={e=>{const x=[...formFields]; x[i]={...x[i], field_label:e.target.value}; setFormFields(x)}} />
                <select style={inputStyle} value={f.field_type||'text'} onChange={e=>{const x=[...formFields]; x[i]={...x[i], field_type:e.target.value}; setFormFields(x)}}>
                  <option value="text">Text</option><option value="email">Email</option><option value="number">Number</option><option value="phone">Phone</option>
                </select>
                <label style={{ display:'flex', alignItems:'center', gap:5, fontSize:12 }}><input type="checkbox" checked={!!f.is_required} onChange={e=>{const x=[...formFields]; x[i]={...x[i], is_required:e.target.checked?1:0}; setFormFields(x)}} />Req</label>
                <button onClick={()=>setFormFields(formFields.filter((_,k)=>k!==i))} style={{ padding:'5px 10px', background:'#fee2e2', color:'#b91c1c', border:'none', borderRadius:6, cursor:'pointer' }}>✕</button>
              </div>
            ))}
            <button onClick={()=>setFormFields([...formFields,{field_label:'New Field', field_type:'text', is_required:0}])} style={{ padding:'7px 14px', background:'#f4f6fb', border:'1px dashed #cbd5e1', borderRadius:8, cursor:'pointer', fontSize:13 }}>+ Add Field</button>
            <div style={{ display:'flex', justifyContent:'flex-end', marginTop:14 }}>
              <button onClick={saveFormFields} disabled={saving} style={{ padding:'10px 28px', background:'#16a34a', color:'#fff', border:'none', borderRadius:8, cursor:'pointer' }}>Save Form Fields</button>
            </div>
          </div>
        )}

        {/* ════ TEXTS ════ */}
        {tab === 'texts' && (
          <div style={cardStyle}>
            <h3 style={{ margin:'0 0 14px', fontSize:16 }}>Headings & Text</h3>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
              <div><span style={labelStyle}>Heading 1 (title)</span><input value={settings.heading_1||''} style={inputStyle} onChange={e=>setSettings({...settings,heading_1:e.target.value})} placeholder="NAGARAJA" /></div>
              <div><span style={labelStyle}>Heading 2 (subtitle)</span><input value={settings.heading_2||''} style={inputStyle} onChange={e=>setSettings({...settings,heading_2:e.target.value})} placeholder="Slither, eat gifts, survive!" /></div>
              <div><span style={labelStyle}>Heading 3</span><input value={settings.heading_3||''} style={inputStyle} onChange={e=>setSettings({...settings,heading_3:e.target.value})} /></div>
              <div><span style={labelStyle}>Description</span><input value={settings.description_text||''} style={inputStyle} onChange={e=>setSettings({...settings,description_text:e.target.value})} /></div>
              <div><span style={labelStyle}>Intro Text</span><textarea rows={2} value={settings.intro_text||''} style={inputStyle} onChange={e=>setSettings({...settings,intro_text:e.target.value})} /></div>
              <div><span style={labelStyle}>Start Button Text</span><input value={settings.start_button_text||''} style={inputStyle} onChange={e=>setSettings({...settings,start_button_text:e.target.value})} /></div>
              <div><span style={labelStyle}>Continue Button Text</span><input value={settings.continue_button_text||''} style={inputStyle} onChange={e=>setSettings({...settings,continue_button_text:e.target.value})} /></div>
              <div>
                <span style={labelStyle}>Timer</span>
                <label style={{ display:'flex', alignItems:'center', gap:8, fontSize:13, marginTop:6 }}><input type="checkbox" style={{width:15,height:15}} checked={!!settings.show_timer} onChange={e=>setSettings({...settings,show_timer:e.target.checked?1:0})} />Show survival timer</label>
              </div>
            </div>
            {!!settings.show_timer && <div style={{ marginTop:10 }}><span style={labelStyle}>Time Limit (seconds, 0 = none)</span><input type="number" min={0} value={settings.time_limit_seconds||0} style={{...inputStyle,width:160}} onChange={e=>setSettings({...settings,time_limit_seconds:parseInt(e.target.value)||0})} /></div>}
            <div style={{ display:'flex', justifyContent:'flex-end', marginTop:14 }}>
              <button onClick={saveSettings} disabled={saving} style={{ padding:'10px 28px', background:'#16a34a', color:'#fff', border:'none', borderRadius:8, cursor:'pointer' }}>{saving?'⏳…':'💾 Save'}</button>
            </div>
          </div>
        )}

        {/* ════ AUDIO ════ */}
        {tab === 'audio' && (
          <div style={cardStyle}>
            <h3 style={{ margin:'0 0 14px', fontSize:16 }}>Game Sounds</h3>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
              <SoundSelector label="Eat Gift" value={settings.sound_eat_id} onChange={v=>setSettings({...settings,sound_eat_id:v})} sounds={sounds} />
              <SoundSelector label="Game Over" value={settings.sound_gameover_id} onChange={v=>setSettings({...settings,sound_gameover_id:v})} sounds={sounds} />
            </div>
            <div style={{ display:'flex', justifyContent:'flex-end', marginTop:14 }}>
              <button onClick={saveSettings} disabled={saving} style={{ padding:'10px 28px', background:'#16a34a', color:'#fff', border:'none', borderRadius:8, cursor:'pointer' }}>{saving?'⏳…':'💾 Save'}</button>
            </div>
          </div>
        )}

        {/* ════ SETTINGS ════ */}
        {tab === 'settings' && (
          <div>
            <div style={cardStyle}>
              <h3 style={{ margin:'0 0 14px', fontSize:16 }}>Page & SEO</h3>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
                <div><span style={labelStyle}>Slug</span><input value={slugInput} style={inputStyle} onChange={e=>setSlugInput(e.target.value)} /></div>
                <div><span style={labelStyle}>Redirect URL</span><input value={redirectUrl||''} style={inputStyle} onChange={e=>setRedirectUrl(e.target.value)} /></div>
                <div style={{ gridColumn:'1 / -1' }}><span style={labelStyle}>Meta Description</span><textarea rows={2} value={settings.meta_description||''} style={inputStyle} onChange={e=>setSettings({...settings,meta_description:e.target.value})} /></div>
              </div>
            </div>
            <div style={cardStyle}>
              <h3 style={{ margin:'0 0 14px', fontSize:16 }}>Terms & Conditions</h3>
              <label style={{ display:'flex', alignItems:'center', gap:8, fontSize:13, marginBottom:10 }}><input type="checkbox" style={{width:15,height:15}} checked={!!settings.terms_enabled} onChange={e=>setSettings({...settings,terms_enabled:e.target.checked?1:0})} />Require agreement</label>
              {!!settings.terms_enabled && <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
                <div><span style={labelStyle}>Terms Text</span><input value={settings.terms_text||''} style={inputStyle} onChange={e=>setSettings({...settings,terms_text:e.target.value})} /></div>
                <div><span style={labelStyle}>Terms URL</span><input value={settings.terms_url||''} style={inputStyle} onChange={e=>setSettings({...settings,terms_url:e.target.value})} /></div>
              </div>}
            </div>
            <div style={{ display:'flex', justifyContent:'flex-end', marginTop:12 }}>
              <button onClick={saveSettings} disabled={saving} style={{ padding:'10px 28px', background:'#16a34a', color:'#fff', border:'none', borderRadius:8, cursor:'pointer' }}>{saving?'⏳…':'💾 Save'}</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
