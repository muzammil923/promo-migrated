import { useState, useRef, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../../apps/frontend/src/api'
import { Toast, ColorPicker, ImageUpload, SoundSelector } from '../../apps/frontend/src/components/SharedBuilderComponents'
import { useUploadErrors, uploadErrorMessage } from '../../apps/frontend/src/lib/builderUpload'
import PhoneFrame from '../../apps/frontend/src/components/PhoneFrame'
import FormPreview from '../../apps/frontend/src/components/FormPreview'
import ThankYouPreview from '../../apps/frontend/src/components/ThankYouPreview'

function normalizePath(value) {
  try {
    if (!value) return "";
    if (typeof value === "string") return value.replace(/\\/g, "/");
    if (typeof value?.path === "string") return value.path.replace(/\\/g, "/");
    console.warn("[normalizePath] unexpected type:", typeof value, value);
  } catch (e) {
    console.error("[normalizePath] error:", e.message, "value:", value, "type:", typeof value);
  }
  return "";
}

/* ─────────────────────────────────────────────
   LIGHT THEME TOKENS (shared with Quiz Builder)
───────────────────────────────────────────── */
const LIGHT = `
.gb-wrap {
  font-family: 'DM Sans', sans-serif;
  background: var(--gb-bg);
  color: var(--gb-text);
  min-height: 100vh;
}
.gb-wrap *, .gb-wrap *::before, .gb-wrap *::after { box-sizing: border-box; }
.gb-wrap input:not([type=checkbox]):not([type=file]):not([type=color]):not([type=range]),
.gb-wrap select, .gb-wrap textarea {
  width: 100%; font-family: inherit; font-size: 14px;
  background: var(--gb-surface); border: none;
  border-bottom: 1.5px solid var(--gb-border);
  border-radius: 8px; color: var(--gb-text);
  padding: 10px 12px 8px; outline: none; transition: border-color .18s;
}
.gb-wrap input:not([type=checkbox]):not([type=file]):not([type=color]):not([type=range]):focus,
.gb-wrap select:focus, .gb-wrap textarea:focus {
  border-bottom-color: #22c55e; border-bottom-width: 2px;
}
.gb-wrap select option { background: #fff; color: #1e1e2e; }
.gb-btn {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 8px 16px; font-size: 13px; font-weight: 600;
  border-radius: var(--gb-radius-sm); border: none; cursor: pointer;
  transition: all .15s; white-space: nowrap; font-family: inherit;
}
.gb-btn:disabled { opacity: .5; cursor: not-allowed; }
.gb-btn-primary { background: var(--gb-primary); color: #fff; }
.gb-btn-primary:not(:disabled):hover { background: var(--gb-primary-d); transform: translateY(-1px); box-shadow: 0 4px 12px var(--gb-primary-g); }
.gb-btn-ghost { background: var(--gb-surface); color: var(--gb-text2); border: 1.5px solid var(--gb-border); }
.gb-btn-ghost:not(:disabled):hover { border-color: var(--gb-primary); color: var(--gb-primary); }
.gb-btn-danger { background: #fee2e2; color: var(--gb-danger); border: 1.5px solid #fecaca; }
.gb-btn-danger:not(:disabled):hover { background: #fecaca; }
.gb-btn-success { background: #dcfce7; color: var(--gb-success); border: 1.5px solid #bbf7d0; }
.gb-btn-success:not(:disabled):hover { background: #bbf7d0; }
.gb-btn-sm { padding: 5px 10px; font-size: 12px; }
.gb-btn-icon { padding: 6px; border-radius: 6px; }
.gb-card {
  background: var(--gb-surface); border: 1.5px solid var(--gb-border);
  border-radius: var(--gb-radius); box-shadow: var(--gb-shadow);
}
.gb-label {
  font-size: 11px; font-weight: 700; letter-spacing: .06em;
  text-transform: uppercase; color: var(--gb-text2); margin-bottom: 4px; display: block;
}
.gb-section {
  background: var(--gb-surface2); border: 1px solid var(--gb-border);
  border-radius: var(--gb-radius); padding: 16px; margin-bottom: 14px;
}
.gb-section-title {
  font-size: 12px; font-weight: 700; letter-spacing: .05em;
  text-transform: uppercase; color: var(--gb-primary);
  margin-bottom: 12px; display: flex; align-items: center; gap: 6px;
}
.gb-tabs {
  display: flex; border-bottom: 2px solid var(--gb-border);
  margin-bottom: 24px; gap: 0; overflow-x: auto;
}
.gb-tab {
  padding: 10px 18px; font-size: 13px; font-weight: 600;
  border: none; background: none; cursor: pointer;
  color: var(--gb-text2); border-bottom: 2px solid transparent;
  margin-bottom: -2px; transition: color .15s; white-space: nowrap;
  font-family: inherit;
}
.gb-tab.active { color: #9210f6; border-bottom-color: #9210f6; }
.gb-tab:hover:not(.active) { color: var(--gb-text); }
@keyframes gb-slide-in { from { opacity:0; transform:translateX(20px) } to { opacity:1; transform:none } }
.gb-toast {
  position: fixed; bottom: 24px; right: 24px; z-index: 9999;
  padding: 12px 18px; border-radius: 10px; color: #fff; font-weight: 600;
  font-size: 13px; box-shadow: 0 8px 24px rgba(0,0,0,.15);
  animation: gb-slide-in .22s ease; font-family: 'DM Sans',sans-serif; max-width: 320px;
}
.gb-swatch {
  width: 28px; height: 28px; border-radius: 6px;
  border: 2px solid var(--gb-border); cursor: pointer; flex-shrink: 0;
}
.gb-thumb {
  height: 44px; width: auto; border-radius: 6px;
  border: 1px solid var(--gb-border); object-fit: contain; background: #f9f9f9;
}
.gb-empty { text-align: center; padding: 56px 20px; color: var(--gb-text2); }
.gb-empty-icon { font-size: 44px; margin-bottom: 12px; }
.gb-row { display: flex; gap: 12px; flex-wrap: wrap; align-items: flex-start; }
.gb-col { flex: 1; min-width: 140px; }
.gb-fg { display: flex; flex-direction: column; gap: 4px; flex: 1; min-width: 120px; }
.gb-cpop {
  position: absolute; top: calc(100% + 6px); left: 0; z-index: 300;
  background: var(--gb-surface); border: 1.5px solid var(--gb-border);
  border-radius: 10px; padding: 12px; box-shadow: var(--gb-shadow-md);
  display: grid; grid-template-columns: repeat(7,1fr); gap: 5px; width: 220px;
}
`

const SEGMENT_COLORS = ['#7C6FF7','#EC4899','#F59E0B','#10B981','#3B82F6','#EF4444','#8B5CF6','#14B8A6','#F97316','#6366F1','#84CC16','#06B6D4']

const FONT_CATEGORIES = [
  { name:'Handwriting', fonts:['Caveat','Patrick Hand','Indie Flower','Shadows Into Light','Gloria Hallelujah','Permanent Marker','Kalam','Satisfy','Reenie Beanie','Homemade Apple','Sacramento','Alex Brush'] },
  { name:'Professional', fonts:['Inter','Work Sans','Source Sans 3','Lato','Open Sans','Roboto','Nunito','DM Sans','Poppins','Rubik','Exo 2','Cabin'] },
  { name:'Luxury', fonts:['Playfair Display','Cormorant Garamond','Libre Baskerville','Cinzel','Forum','Cormorant','Bodoni Moda','Tangerine','Great Vibes','Parisienne','Bellefair','Marcellus'] },
  { name:'Modern Casual', fonts:['Montserrat','Syne','Raleway','Quicksand','Josefin Sans','Space Grotesk','Plus Jakarta Sans','Outfit','Sora','Manrope','Lexend','Figtree'] },
]

/* ── Wheel Preview ── */
function WheelPreview({ segments, settings, size = 180, heading }) {
  const gapColor = settings?.wheel_bg_color || '#fff', cx = size/2, cy = size/2, r = size/2 - 8
  const total = segments.reduce((s, seg) => s + (parseInt(seg.weight)||1), 0)
  let startAngle = -Math.PI/2
  const slices = segments.map(seg => {
    const w = parseInt(seg.weight)||1, sweep = (w/total)*2*Math.PI, endAngle = startAngle+sweep, mid = startAngle+sweep/2
    const x1=cx+r*Math.cos(startAngle), y1=cy+r*Math.sin(startAngle), x2=cx+r*Math.cos(endAngle), y2=cy+r*Math.sin(endAngle)
    const d = `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${sweep>Math.PI?1:0} 1 ${x2} ${y2} Z`
    const tx=cx+(r*0.65)*Math.cos(mid), ty=cy+(r*0.65)*Math.sin(mid), angle=(mid*180)/Math.PI
    startAngle = endAngle
    return { d,tx,ty,angle,color:seg.bg_color||'#7C6FF7',textColor:seg.text_color||'#fff',label:seg.label }
  })
  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:16 }}>
      {heading && <div style={{ fontFamily:'Inter, sans-serif', fontSize:28, fontWeight:700, color:'#111827', textAlign:'center', lineHeight:1.2 }}>{heading}</div>}
      <div style={{ position:'relative', padding:20, borderRadius:24, background:'#FFFFFF', boxShadow:'0 10px 40px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.03)', display:'flex', alignItems:'center', justifyContent:'center' }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ display:'block', filter:'drop-shadow(0 4px 12px rgba(0,0,0,0.12))' }}>
          {segments.length===0 ? <circle cx={cx} cy={cy} r={r} fill="#E5E7EB" /> : slices.map((s,i)=>(
            <g key={i}><path d={s.d} fill={s.color} stroke={gapColor} strokeWidth="2" />
              <text x={s.tx} y={s.ty} textAnchor="middle" dominantBaseline="middle" fill={s.textColor} fontSize={Math.max(7,Math.min(11,size/22))} fontWeight="700" transform={`rotate(${s.angle+90+90},${s.tx},${s.ty})`} style={{ pointerEvents:'none', fontFamily:'Inter, sans-serif' }}>{s.label.length>10 ? s.label.slice(0,9)+'…' : s.label}</text>
            </g>
          ))}
          <circle cx={cx} cy={cy} r={size*0.1} fill={settings?.center_color||'#1F2937'} stroke={gapColor} strokeWidth="3" />
          {settings?.center_image_url ? <image href={settings.center_image_url} x={cx-size*0.06} y={cy-size*0.06} width={size*0.12} height={size*0.12} style={{ clipPath:`circle(${size*0.06}px at ${cx}px ${cy}px)`, pointerEvents:'none' }} /> : <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle" fill="#fff" fontSize={size*0.06} fontWeight="800" style={{ fontFamily:'Inter, sans-serif' }}>{settings?.center_label||'SPIN'}</text>}
          <polygon points={`${cx},${8} ${cx-10},${28} ${cx+10},${28}`} fill={settings?.pointer_color||'#EF4444'} stroke="#fff" strokeWidth="2" />
        </svg>
      </div>
    </div>
  )
}

/* ── Segment Card ── */
function SegmentCard({ seg, index, onEdit, onDelete, onMoveUp, onMoveDown, isFirst, isLast }) {
  return (
    <div className="gb-card" style={{ display:'flex', alignItems:'center', gap:10, padding:'12px 14px', marginBottom:10, transition:'box-shadow .15s' }}>
      <div style={{ width:32, height:32, borderRadius:8, background:seg.bg_color||'#7C6FF7', flexShrink:0, border:'2px solid var(--gb-border)' }} />
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontWeight:700, fontSize:14, color:'var(--gb-text)' }}>{seg.label}</div>
        <div style={{ fontSize:12, color:'var(--gb-text2)', marginTop:2 }}>
          {seg.segment_type==='prize'?'🎁 Prize':seg.segment_type==='try_again'?'🔄 Try Again':'😔 No Prize'} · Weight: {seg.weight}{seg.coupon_code && ` · Code: ${seg.coupon_code}`}
        </div>
      </div>
      <div style={{ display:'flex', gap:4, flexShrink:0 }}>
        <button className="gb-btn gb-btn-ghost gb-btn-sm" onClick={()=>onMoveUp(index)} disabled={isFirst}>↑</button>
        <button className="gb-btn gb-btn-ghost gb-btn-sm" onClick={()=>onMoveDown(index)} disabled={isLast}>↓</button>
        <button className="gb-btn gb-btn-ghost gb-btn-sm" onClick={()=>onEdit(seg)}>✏️</button>
        <button className="gb-btn gb-btn-danger gb-btn-sm" onClick={()=>onDelete(seg.id)}>🗑️</button>
      </div>
    </div>
  )
}

/* ── Segment Modal ── */
function SegmentModal({ seg, sounds, onSave, onClose }) {
  const [form, setForm] = useState(seg || { label:'', bg_color:SEGMENT_COLORS[0], text_color:'#FFFFFF', weight:100, segment_type:'prize', prize_description:'', coupon_code:'', sound_id:'' })
  const [couponFile, setCouponFile] = useState(null), [overlayFile, setOverlayFile] = useState(null), [saving, setSaving] = useState(false)
  const set = (k,v) => setForm(f => ({...f,[k]:v}))
  const handleSave = async () => {
    if (!form.label.trim()) return alert('Label is required')
    setSaving(true)
    const fd = new FormData()
    Object.entries(form).forEach(([k,v]) => { if(v!==undefined&&v!==null) fd.append(k,v) })
    if(couponFile) fd.append('coupon_image',couponFile); if(overlayFile) fd.append('overlay_image',overlayFile)
    await onSave(fd, seg?.id); setSaving(false)
  }
  const inpStyle = { width:'100%', padding:'10px 14px', fontSize:14, fontFamily:'Inter, sans-serif', border:'1.5px solid rgba(255,255,255,0.45)', borderRadius:10, outline:'none', background:'rgba(255,255,255,0.4)', backdropFilter:'blur(6px)', WebkitBackdropFilter:'blur(6px)', color:'#111827', transition:'border-color .2s, box-shadow .2s', boxSizing:'border-box' }
  const lblStyle = { display:'block', fontSize:11, fontWeight:700, color:'#6B7280', marginBottom:6, textTransform:'uppercase', letterSpacing:'0.06em', fontFamily:'Inter, sans-serif' }
  const sectionStyle = { background:'rgba(255,255,255,0.55)', backdropFilter:'blur(12px)', WebkitBackdropFilter:'blur(12px)', border:'1px solid rgba(255,255,255,0.6)', borderRadius:14, padding:'18px 20px', marginBottom:12 }
  const sectionTitle = { fontSize:11, fontWeight:800, color:'#6366F1', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:14, fontFamily:'Inter, sans-serif' }
  return (
    <div style={{ position:'fixed', inset:0, background:'#FFFFFF', zIndex:2000, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }} onClick={onClose}>
      <div onClick={e=>e.stopPropagation()} style={{ background:'rgba(255,255,255,0.72)', backdropFilter:'blur(20px)', WebkitBackdropFilter:'blur(20px)', borderRadius:20, width:'100%', maxWidth:520, maxHeight:'92vh', display:'flex', flexDirection:'column', boxShadow:'0 25px 80px rgba(0,0,0,0.12), 0 0 0 1px rgba(255,255,255,0.6)', fontFamily:'Inter, sans-serif' }}>
        {/* Header */}
        <div style={{ padding:'20px 24px 0', display:'flex', justifyContent:'space-between', alignItems:'center', flexShrink:0 }}>
          <div>
            <h3 style={{ margin:0, fontSize:18, fontWeight:800, color:'#111827', fontFamily:'Inter, sans-serif' }}>{seg ? 'Edit Segment' : 'New Segment'}</h3>
            <p style={{ margin:'3px 0 0', fontSize:12, color:'#9CA3AF', fontFamily:'Inter, sans-serif' }}>{seg ? 'Update the segment details below' : 'Configure a new wheel segment'}</p>
          </div>
          <button onClick={onClose} style={{ width:32, height:32, borderRadius:8, border:'1px solid rgba(255,255,255,0.5)', background:'rgba(255,255,255,0.4)', backdropFilter:'blur(6px)', WebkitBackdropFilter:'blur(6px)', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, color:'#9CA3AF', transition:'all .15s', fontFamily:'Inter, sans-serif' }} onMouseEnter={e=>{e.currentTarget.style.background='#FEE2E2';e.currentTarget.style.color='#EF4444';e.currentTarget.style.borderColor='#FECACA'}} onMouseLeave={e=>{e.currentTarget.style.background='rgba(255,255,255,0.4)';e.currentTarget.style.color='#9CA3AF';e.currentTarget.style.borderColor='rgba(255,255,255,0.5)'}}>✕</button>
        </div>

        {/* Scrollable body */}
        <div style={{ flex:1, overflowY:'auto', padding:'20px 24px', display:'flex', flexDirection:'column', gap:0 }}>
          {/* Images */}
          <div style={sectionStyle}>
            <div style={sectionTitle}>📷 Images</div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
              <div>
                <label style={lblStyle}>Coupon Image</label>
                <label style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:6, padding:couponFile||seg?.coupon_image_url ? '8px' : '16px 8px', border:'2px dashed rgba(255,255,255,0.5)', borderRadius:12, cursor:'pointer', background:couponFile||seg?.coupon_image_url ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.25)', backdropFilter:'blur(6px)', WebkitBackdropFilter:'blur(6px)', transition:'all .2s', position:'relative' }} onMouseEnter={e=>e.currentTarget.style.borderColor='#6366F1'} onMouseLeave={e=>e.currentTarget.style.borderColor='rgba(255,255,255,0.5)'}>
                  {couponFile || seg?.coupon_image_url ? (
                    <>
                      <img src={couponFile ? URL.createObjectURL(couponFile) : normalizePath(seg.coupon_image_url)} alt="" style={{ width:'100%', maxHeight:80, objectFit:'contain', borderRadius:8 }} />
                      <span style={{ fontSize:10, color:'#6B7280', fontFamily:'Inter, sans-serif' }}>{couponFile ? 'New file selected' : 'Current image'}</span>
                    </>
                  ) : (
                    <>
                      <div style={{ width:32, height:32, borderRadius:8, background:'rgba(255,255,255,0.4)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:16 }}>🖼️</div>
                      <span style={{ fontSize:11, color:'#6B7280', fontFamily:'Inter, sans-serif' }}>Click to upload</span>
                    </>
                  )}
                  <input type="file" accept="image/*" onChange={e=>setCouponFile(e.target.files[0])} style={{ position:'absolute', inset:0, opacity:0, cursor:'pointer' }} />
                </label>
              </div>
              <div>
                <label style={lblStyle}>Overlay Image</label>
                <label style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:6, padding:overlayFile||seg?.overlay_image_url ? '8px' : '16px 8px', border:'2px dashed rgba(255,255,255,0.5)', borderRadius:12, cursor:'pointer', background:overlayFile||seg?.overlay_image_url ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.25)', backdropFilter:'blur(6px)', WebkitBackdropFilter:'blur(6px)', transition:'all .2s', position:'relative' }} onMouseEnter={e=>e.currentTarget.style.borderColor='#6366F1'} onMouseLeave={e=>e.currentTarget.style.borderColor='rgba(255,255,255,0.5)'}>
                  {overlayFile || seg?.overlay_image_url ? (
                    <>
                      <img src={overlayFile ? URL.createObjectURL(overlayFile) : normalizePath(seg.overlay_image_url)} alt="" style={{ width:'100%', maxHeight:80, objectFit:'contain', borderRadius:8 }} />
                      <span style={{ fontSize:10, color:'#6B7280', fontFamily:'Inter, sans-serif' }}>{overlayFile ? 'New file selected' : 'Current image'}</span>
                    </>
                  ) : (
                    <>
                      <div style={{ width:32, height:32, borderRadius:8, background:'rgba(255,255,255,0.4)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:16 }}>🎨</div>
                      <span style={{ fontSize:11, color:'#6B7280', fontFamily:'Inter, sans-serif' }}>Click to upload</span>
                    </>
                  )}
                  <input type="file" accept="image/*" onChange={e=>setOverlayFile(e.target.files[0])} style={{ position:'absolute', inset:0, opacity:0, cursor:'pointer' }} />
                </label>
              </div>
            </div>
          </div>

          {/* Segment Details */}
          <div style={sectionStyle}>
            <div style={sectionTitle}>📝 Segment Details</div>
            <div style={{ marginBottom:14 }}>
              <label style={lblStyle}>Label *</label>
              <input value={form.label} onChange={e=>set('label',e.target.value)} placeholder="e.g. 10% OFF" maxLength={50} style={inpStyle} onFocus={e=>{e.currentTarget.style.borderColor='#6366F1';e.currentTarget.style.boxShadow='0 0 0 3px rgba(99,102,241,0.15)'}} onBlur={e=>{e.currentTarget.style.borderColor='rgba(255,255,255,0.45)';e.currentTarget.style.boxShadow='none'}} />
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr auto', gap:14, alignItems:'start' }}>
              <div>
                <label style={lblStyle}>Segment Color</label>
                <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginBottom:8 }}>
                  {SEGMENT_COLORS.map(c => (
                    <div key={c} onClick={() => set('bg_color', c)} style={{ width:28, height:28, borderRadius:8, background:c, cursor:'pointer', border: form.bg_color===c ? '3px solid #111827' : '3px solid transparent', transition:'all .15s', boxShadow: form.bg_color===c ? '0 0 0 2px #fff, 0 0 0 4px #111827' : 'none' }} />
                  ))}
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <input type="color" value={form.bg_color||'#7C6FF7'} onChange={e=>set('bg_color',e.target.value)} style={{ width:36, height:36, border:'2px solid rgba(255,255,255,0.45)', cursor:'pointer', borderRadius:8, padding:0 }} />
                  <span style={{ fontSize:12, color:'#6B7280', fontFamily:'Inter, sans-serif' }}>Custom</span>
                </div>
              </div>
              <div>
                <label style={lblStyle}>Text Color</label>
                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <input type="color" value={form.text_color||'#FFFFFF'} onChange={e=>set('text_color',e.target.value)} style={{ width:36, height:36, border:'2px solid rgba(255,255,255,0.45)', cursor:'pointer', borderRadius:8, padding:0 }} />
                  <span style={{ fontSize:12, color:'#6B7280', fontFamily:'Inter, sans-serif' }}>{form.text_color||'#FFFFFF'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Prize Settings */}
          <div style={sectionStyle}>
            <div style={sectionTitle}>🏆 Prize Settings</div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
              <div>
                <label style={lblStyle}>Type</label>
                <div style={{ position:'relative' }}>
                  <select value={form.segment_type} onChange={e=>set('segment_type',e.target.value)} style={{ ...inpStyle, appearance:'none', paddingRight:32, cursor:'pointer' }}>
                    <option value="prize">🎁 Prize</option>
                    <option value="try_again">🔄 Try Again</option>
                    <option value="no_prize">😔 No Prize</option>
                  </select>
                  <div style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', pointerEvents:'none', fontSize:10, color:'#6B7280' }}>▼</div>
                </div>
              </div>
              <div>
                <label style={lblStyle}>Weight</label>
                <input type="number" min="1" max="9999" value={form.weight} onChange={e=>set('weight',e.target.value)} style={inpStyle} onFocus={e=>{e.currentTarget.style.borderColor='#6366F1';e.currentTarget.style.boxShadow='0 0 0 3px rgba(99,102,241,0.15)'}} onBlur={e=>{e.currentTarget.style.borderColor='rgba(255,255,255,0.45)';e.currentTarget.style.boxShadow='none'}} />
                <span style={{ fontSize:11, color:'#6B7280', marginTop:3, display:'block', fontFamily:'Inter, sans-serif' }}>Higher = more likely</span>
              </div>
            </div>
            {form.segment_type === 'prize' && (
              <div style={{ marginTop:14, display:'flex', flexDirection:'column', gap:14 }}>
                <div>
                  <label style={lblStyle}>Win Message</label>
                  <input value={form.win_message||''} onChange={e=>set('win_message',e.target.value)} placeholder="e.g. Congratulations! You won!" style={inpStyle} onFocus={e=>{e.currentTarget.style.borderColor='#6366F1';e.currentTarget.style.boxShadow='0 0 0 3px rgba(99,102,241,0.15)'}} onBlur={e=>{e.currentTarget.style.borderColor='rgba(255,255,255,0.45)';e.currentTarget.style.boxShadow='none'}} />
                </div>
                <div>
                  <label style={lblStyle}>Prize Description</label>
                  <textarea rows={2} value={form.prize_description||''} onChange={e=>set('prize_description',e.target.value)} placeholder="e.g. Get 10% off your next order" style={{ ...inpStyle, resize:'vertical' }} onFocus={e=>{e.currentTarget.style.borderColor='#6366F1';e.currentTarget.style.boxShadow='0 0 0 3px rgba(99,102,241,0.15)'}} onBlur={e=>{e.currentTarget.style.borderColor='rgba(255,255,255,0.45)';e.currentTarget.style.boxShadow='none'}} />
                </div>
                <div>
                  <label style={lblStyle}>Coupon Code</label>
                  <input value={form.coupon_code||''} onChange={e=>set('coupon_code',e.target.value)} placeholder="e.g. SPIN10OFF" style={inpStyle} onFocus={e=>{e.currentTarget.style.borderColor='#6366F1';e.currentTarget.style.boxShadow='0 0 0 3px rgba(99,102,241,0.15)'}} onBlur={e=>{e.currentTarget.style.borderColor='rgba(255,255,255,0.45)';e.currentTarget.style.boxShadow='none'}} />
                </div>
              </div>
            )}
            {form.segment_type !== 'prize' && (
              <div style={{ marginTop:14 }}>
                <label style={lblStyle}>Custom Message</label>
                <textarea rows={2} value={form.lose_message||''} onChange={e=>set('lose_message',e.target.value)} placeholder="e.g. Oops! The wheel wasn't in your favor this time. Better luck on your next spin! 🍀" style={{ ...inpStyle, resize:'vertical' }} onFocus={e=>{e.currentTarget.style.borderColor='#6366F1';e.currentTarget.style.boxShadow='0 0 0 3px rgba(99,102,241,0.15)'}} onBlur={e=>{e.currentTarget.style.borderColor='rgba(255,255,255,0.45)';e.currentTarget.style.boxShadow='none'}} />
                <span style={{ fontSize:11, color:'#6B7280', marginTop:3, display:'block', fontFamily:'Inter, sans-serif' }}>Shown when player lands on this segment. Leave blank for default.</span>
              </div>
            )}
          </div>

          {/* Sound Settings */}
          <div style={sectionStyle}>
            <div style={sectionTitle}>🔊 Sound Settings</div>
            <SoundSelector label="Sound on Land" value={form.sound_id} onChange={v=>set('sound_id',v)} sounds={sounds} />
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding:'16px 24px', borderTop:'1px solid rgba(255,255,255,0.4)', display:'flex', justifyContent:'flex-end', gap:10, flexShrink:0 }}>
          <button onClick={onClose} style={{ padding:'10px 20px', fontSize:13, fontWeight:600, color:'#6B7280', background:'rgba(255,255,255,0.35)', backdropFilter:'blur(6px)', WebkitBackdropFilter:'blur(6px)', border:'1.5px solid rgba(255,255,255,0.45)', borderRadius:10, cursor:'pointer', fontFamily:'Inter, sans-serif', transition:'all .15s' }} onMouseEnter={e=>{e.currentTarget.style.background='rgba(255,255,255,0.55)';e.currentTarget.style.borderColor='rgba(255,255,255,0.6)'}} onMouseLeave={e=>{e.currentTarget.style.background='rgba(255,255,255,0.35)';e.currentTarget.style.borderColor='rgba(255,255,255,0.45)'}}>Cancel</button>
          <button onClick={handleSave} disabled={saving} style={{ padding:'10px 24px', fontSize:13, fontWeight:700, color:'#fff', background: saving ? '#A5B4FC' : 'linear-gradient(135deg, #6366F1, #8B5CF6)', border:'none', borderRadius:10, cursor: saving ? 'not-allowed' : 'pointer', fontFamily:'Inter, sans-serif', boxShadow: saving ? 'none' : '0 4px 14px rgba(99,102,241,0.35)', transition:'all .2s', letterSpacing:'0.01em' }} onMouseEnter={e=>{if(!saving){e.currentTarget.style.boxShadow='0 6px 20px rgba(99,102,241,0.45)';e.currentTarget.style.transform='translateY(-1px)'}}} onMouseLeave={e=>{if(!saving){e.currentTarget.style.boxShadow='0 4px 14px rgba(99,102,241,0.35)';e.currentTarget.style.transform='translateY(0)'}}}>
            {saving ? 'Saving…' : seg ? '✓ Update Segment' : '+ Add Segment'}
          </button>
        </div>
      </div>
    </div>
  )
}

const TABS = [
  { id:'display',    label:'🎨 Display' },
  { id:'segments',   label:'🎡 Segments' },
  { id:'thankyou',   label:'🙏 Thank You' },
  { id:'email',      label:'📧 Email' },
  { id:'sounds',     label:'🔊 Audio' },
  { id:'settings',   label:'⚙️ Settings' },
]

const TAB_FIELDS = {
  display:  ['bg_image_url', 'game_logo_url', 'center_image_url'],
  thankyou: ['thankyou_bg_image_url', 'submit_confirm_gif_url'],
}

/* ═══════════════════════════════════════════
   MAIN PAGE
═══════════════════════════════════════════ */
export default function SpinBuilderTab() {
  const { id: gameId } = useParams(), navigate = useNavigate()
  const [tab, setTab] = useState('display')
  const upload = useUploadErrors()
  const [settings, setSettings] = useState(null), [segments, setSegments] = useState([]), [sounds, setSounds] = useState([])
  const [loading, setLoading] = useState(true), [saving, setSaving] = useState(false)
  const [modal, setModal] = useState(null), [toast, setToast] = useState(null)
  const showToast = (msg, type='success') => setToast({ msg, type })
  const [emailTemplate, setEmailTemplate] = useState({ sender_name:'', sender_email:'', subject:'', header_color:'#6366f1', header_text:'', body_html:'', footer_text:'', is_enabled:1 })
  const [sForm, setSForm] = useState({ heading_1:'',heading_1_color:'#1a1a2e',heading_2:'',heading_2_color:'#1a1a2e',description_text:'',description_color:'#666666',spin_mode:'once',win_message:'',lose_message:'',wheel_bg_color:'#FFFFFF',pointer_color:'#EF4444',center_color:'#1F2937',center_label:'SPIN',center_image_url:'',bg_color:'#F8F8FF',primary_color:'#7C6FF7',font_family:'DM Sans',sound_spin_id:'',sound_win_id:'',sound_lose_id:'',meta_description:'',outro_text:'',outro_text_color:'#1a1a2e',thankyou_subtitle:'',thankyou_subtitle_color:'#444444',submit_button_text:'',submit_button_text_color:'#ffffff',submit_button_bg_color:'',submit_confirm_gif_url:'',redirect_url:'',redirect_delay:'',redirect_open_new_tab:0,continue_button_text:'',continue_button_text_color:'#ffffff',continue_button_bg_color:'',terms_enabled:0,terms_text:'',terms_url:'',start_button_text:'',start_button_text_color:'#ffffff',start_button_bg_color:'',send_email:0 })
  const [bgFile,setBgFile]=useState(null),[tyFile,setTyFile]=useState(null),[logoFile,setLogoFile]=useState(null),[centerFile,setCenterFile]=useState(null),[submitGifFile,setSubmitGifFile]=useState(null)
  const [sUrls,setSUrls]=useState({bg:null,ty:null,logo:null,center:null,submitGif:null})
  const [editingName, setEditingName] = useState(false), [nameInput, setNameInput] = useState('')
  const [game, setGame] = useState(null)
  const [formFields, setFormFields] = useState([])
  const [redirectUrl, setRedirectUrl] = useState('')
  const [selectedSegmentId, setSelectedSegmentId] = useState(null)

  const bgImgRef = useRef()
  const tyBgImgRef = useRef()
  const gameLogoRef = useRef()
  const centerImgRef = useRef()
  const soundUploadRef = useRef()
  const [soundUploading, setSoundUploading] = useState(false)

  useEffect(()=>{setSaving(false)},[gameId])

  useEffect(()=>{
    Promise.all([api.get(`/spin/${gameId}/settings`),api.get(`/spin/games/${gameId}/segments`),api.get(`/sounds/games/${gameId}/sounds`),api.get(`/games/${gameId}`)])
    .then(([sRes,segRes,sndRes,gRes])=>{
      const s=sRes.data.settings
      if(s){setSForm({heading_1:s.heading_1||'',heading_1_color:s.heading_1_color||'#1a1a2e',heading_2:s.heading_2||'',heading_2_color:s.heading_2_color||'#1a1a2e',description_text:s.description_text||'',description_color:s.description_color||'#666666',spin_mode:s.spin_mode||'once',win_message:s.win_message||'',lose_message:s.lose_message||'',wheel_bg_color:s.wheel_bg_color||'#FFFFFF',pointer_color:s.pointer_color||'#EF4444',center_color:s.center_color||'#1F2937',center_label:s.center_label||'SPIN',center_image_url:s.center_image_url||'',bg_color:s.bg_color||'#F8F8FF',primary_color:s.primary_color||'#7C6FF7',font_family:s.font_family||'DM Sans',sound_spin_id:s.sound_spin_id||'',sound_win_id:s.sound_win_id||'',sound_lose_id:s.sound_lose_id||'',meta_description:s.meta_description||'',outro_text:s.outro_text||'',outro_text_color:s.outro_text_color||'#1a1a2e',thankyou_subtitle:s.thankyou_subtitle||'',thankyou_subtitle_color:s.thankyou_subtitle_color||'#444444',submit_button_text:s.submit_button_text||'',submit_button_text_color:s.submit_button_text_color||'#ffffff',submit_button_bg_color:s.submit_button_bg_color||'',submit_confirm_gif_url:s.submit_confirm_gif_url||'',redirect_url:s.redirect_url||'',redirect_delay:s.redirect_delay||'',redirect_open_new_tab:s.redirect_open_new_tab||0,continue_button_text:s.continue_button_text||'',continue_button_text_color:s.continue_button_text_color||'#ffffff',continue_button_bg_color:s.continue_button_bg_color||'',terms_enabled:s.terms_enabled||0,terms_text:s.terms_text||'',terms_url:s.terms_url||'',start_button_text:s.start_button_text||'',start_button_text_color:s.start_button_text_color||'#ffffff',start_button_bg_color:s.start_button_bg_color||''});setSUrls({bg:normalizePath(s.bg_image_url),ty:normalizePath(s.thankyou_bg_image_url),logo:normalizePath(s.game_logo_url),center:normalizePath(s.center_image_url),submitGif:normalizePath(s.submit_confirm_gif_url)});setSettings(s);setRedirectUrl(s.redirect_url||'')}
      setSegments(segRes.data.segments||[]);setSounds(sndRes.data.sounds||[])
      const g=gRes.data.game;setGame(g)
      setFormFields(g?.formFields||[])
      const et=g?.emailTemplate;if(et)setEmailTemplate({sender_name:et.sender_name||'',sender_email:et.sender_email||'',subject:et.subject||'',header_color:et.header_color||'#6366f1',header_text:et.header_text||'',body_html:et.body_html||'',footer_text:et.footer_text||'',is_enabled:et.is_enabled?1:0})
    }).catch(console.error).finally(()=>setLoading(false))
  },[gameId])

  useEffect(() => {
    const font = sForm.font_family
    if (!font || font === 'DM Sans') return
    const id = 'gf-' + font.replace(/\s/g, '-')
    if (document.getElementById(id)) return
    const link = document.createElement('link')
    link.id = id; link.rel = 'stylesheet'
    link.href = 'https://fonts.googleapis.com/css2?family=' + encodeURIComponent(font) + ':wght@400;600;700;800&display=swap'
    document.head.appendChild(link)
  }, [sForm.font_family])

  useEffect(() => {
    const families = FONT_CATEGORIES.flatMap(c => c.fonts)
      .filter(f => f !== 'DM Sans')
      .map(f => encodeURIComponent(f) + ':wght@400;600;700')
      .join('&family=')
    if (!families) return
    const id = 'gf-all-fonts'
    if (document.getElementById(id)) return
    const link = document.createElement('link')
    link.id = id; link.rel = 'stylesheet'
    link.href = 'https://fonts.googleapis.com/css2?family=' + families + '&display=swap'
    document.head.appendChild(link)
  }, [])

  const setS=(k,v)=>setSForm(f=>({...f,[k]:v}))

  const saveSettings=async()=>{setSaving(true);try{const hasFiles=centerFile||bgFile||tyFile||logoFile||submitGifFile;let res;const sv=v=>v===undefined||v===null?null:(typeof v==='string'&&v.trim()===''?null:v);if(hasFiles){const fd=new FormData();const ik=['center_image_url'];Object.entries(sForm).forEach(([k,v])=>{const safe=sv(v);if(safe!==undefined&&safe!==null&&!ik.includes(k))fd.append(k,String(safe))});fd.append('redirect_url',sv(redirectUrl)||'');if(!centerFile)fd.append('center_image_url',normalizePath(sUrls.center)||'');if(!bgFile)fd.append('bg_image_url',normalizePath(sUrls.bg)||'');if(!tyFile)fd.append('thankyou_bg_image_url',normalizePath(sUrls.ty)||'');if(!logoFile)fd.append('game_logo_url',normalizePath(sUrls.logo)||'');if(!submitGifFile)fd.append('submit_confirm_gif_url',normalizePath(sUrls.submitGif)||'');if(centerFile)fd.append('center_image',centerFile);if(bgFile)fd.append('bg_image',bgFile);if(tyFile)fd.append('thankyou_bg_image',tyFile);if(logoFile)fd.append('game_logo',logoFile);if(submitGifFile)fd.append('submit_confirm_gif',submitGifFile);res=await api.put(`/spin/${gameId}/settings`,fd)}else{const body={};Object.entries(sForm).forEach(([k,v])=>{const safe=sv(v);if(safe!==undefined&&safe!==null)body[k]=safe});body.center_image_url=normalizePath(sUrls.center)||null;body.bg_image_url=normalizePath(sUrls.bg)||null;body.thankyou_bg_image_url=normalizePath(sUrls.ty)||null;body.game_logo_url=normalizePath(sUrls.logo)||null;body.submit_confirm_gif_url=normalizePath(sUrls.submitGif)||null;body.redirect_url=sv(redirectUrl)||null;res=await api.put(`/spin/${gameId}/settings`,body)}setSettings(res.data.settings);const s=res.data.settings;setSUrls({bg:normalizePath(s.bg_image_url),ty:normalizePath(s.thankyou_bg_image_url),logo:normalizePath(s.game_logo_url),center:normalizePath(s.center_image_url),submitGif:normalizePath(s.submit_confirm_gif_url)});console.log('[DEBUG SAVE] Center Button Image:', s.center_image_url);console.log('[DEBUG SAVE] Game Logo:', s.game_logo_url);console.log('[DEBUG SAVE] Background Image:', s.bg_image_url);console.log('[DEBUG SAVE] Thank You BG:', s.thankyou_bg_image_url);console.log('[DEBUG SAVE] Loaded Config:', s);setCenterFile(null);setBgFile(null);setTyFile(null);setLogoFile(null);setSubmitGifFile(null);showToast('Settings saved ✅')}catch(err){const m=uploadErrorMessage(err);if(err?.response?.status===413){if(bgFile)upload.setFieldError('bg_image_url',m);if(logoFile)upload.setFieldError('game_logo_url',m);if(centerFile)upload.setFieldError('center_image_url',m);if(tyFile)upload.setFieldError('thankyou_bg_image_url',m);if(submitGifFile)upload.setFieldError('submit_confirm_gif_url',m);if(!bgFile&&!logoFile&&!centerFile&&!tyFile&&!submitGifFile)upload.setFieldError('bg_image_url',m)}else{upload.setFieldError('bg_image_url',m)}showToast(err.response?.data?.message||'Failed to save','error')}finally{setSaving(false)}}

  const saveEmailTemplate=async()=>{setSaving(true);try{await api.put(`/games/${gameId}/email-template`,emailTemplate);showToast('Email template saved ✅')}catch(err){showToast(err.response?.data?.message||'Failed to save email','error')}finally{setSaving(false)}}

  const addFormField    = ()          => setFormFields([...formFields, { field_label:'New Field', field_type:'text', is_required:0, field_options:[] }])
  const removeFormField = i           => { const f=[...formFields]; f.splice(i,1); setFormFields(f) }
  const updateFormField = (i,key,val) => { const f=[...formFields]; f[i]={ ...f[i],[key]:val }; setFormFields(f) }
  const saveFormFields  = async () => {
    setSaving(true)
    try { await api.put(`/games/${gameId}/form-fields`, { fields: formFields }); showToast('Form fields saved ✅') }
    catch { showToast('Error saving form fields', 'error') }
    setSaving(false)
  }

  const uploadSound = async e => {
    const file = e.target.files[0]; if (!file) return
    const allowed = ['audio/mpeg','audio/mp3','audio/wav','audio/ogg','audio/x-wav','audio/wave']
    if (!allowed.includes(file.type) && !file.name.match(/\.(mp3|wav|ogg)$/i)) {
      showToast('Only MP3, WAV, OGG allowed', 'error'); e.target.value=''; return
    }
    const fd = new FormData()
    fd.append('file', file)
    fd.append('name', file.name.replace(/\.[^.]+$/,''))
    fd.append('sound_type', 'custom')
    setSoundUploading(true)
    try {
      const res = await api.post(`/sounds/games/${gameId}/sounds`, fd)
      setSounds(prev => [res.data.sound, ...prev])
      showToast('Sound uploaded ✅')
    } catch (err) { showToast('Error: '+(err.response?.data?.message||err.message), 'error') }
    setSoundUploading(false); e.target.value=''
  }

  const deleteSound = async s => {
    try { await api.delete(`/sounds/sounds/${s.id}`); setSounds(prev => prev.filter(x => x.id!==s.id)); showToast('Sound deleted') }
    catch { showToast('Error', 'error') }
  }

  const handleSegmentSave=async(fd,segId)=>{try{if(segId){const res=await api.put(`/spin/segments/${segId}`,fd);setSegments(prev=>prev.map(s=>s.id===segId?res.data.segment:s))}else{fd.append('segment_order',segments.length);const res=await api.post(`/spin/games/${gameId}/segments`,fd);setSegments(prev=>[...prev,res.data.segment])}setModal(null);showToast(segId?'Segment updated ✅':'Segment added ✅')}catch(err){showToast(err.response?.data?.message||'Failed','error')}}

  const deleteSegment=async(id)=>{if(!confirm('Delete this segment?'))return;try{await api.delete(`/spin/segments/${id}`);setSegments(prev=>prev.filter(s=>s.id!==id));showToast('Segment deleted')}catch(err){showToast('Error deleting segment','error')}}

  const moveSegment=async(idx,dir)=>{const arr=[...segments],swap=dir==='up'?idx-1:idx+1;if(swap<0||swap>=arr.length)return;[arr[idx],arr[swap]]=[arr[swap],arr[idx]];try{await api.post(`/spin/games/${gameId}/segments/reorder`,{order:arr.map((s,i)=>({id:s.id,segment_order:i}))});setSegments(arr.map((s,i)=>({...s,segment_order:i})))}catch(err){showToast('Error reordering','error')}}

  const saveGameName = async () => {
    if (!nameInput.trim()) return
    try {
      await api.put(`/games/${gameId}`, { name: nameInput.trim() })
      setGame(prev => ({ ...prev, name: nameInput.trim() }))
      showToast('Game name saved ✅')
    } catch { showToast('Error saving name', 'error') }
    setEditingName(false)
  }

  const gameLink=`${window.location.origin}/play/spin/${gameId}`

  if(loading) return (
    <div className="gb-wrap" style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'100vh' }}>
      <style>{LIGHT}</style>
      <div style={{ textAlign:'center', color:'var(--gb-text2)' }}>
        <div style={{ width:40,height:40,borderRadius:'50%',border:'3px solid #e2e6f0',borderTopColor:'#6366f1',animation:'spin .8s linear infinite',margin:'0 auto 16px' }} />
        Loading spin builder…
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    </div>
  )

  const sFormAny = sForm

  return (
    <div className="gb-wrap">
      <style>{LIGHT}</style>

      {/* ─── Header (3-col grid — identical to Quiz Builder) ─── */}
      <div style={{
        display:'grid', gridTemplateColumns:'1fr auto 1fr',
        background:'var(--gb-surface)', borderBottom:'1.5px solid var(--gb-border)',
        padding:'10px 28px', gap:'4px 20px', alignItems:'center',
        position:'sticky', top:'62px', zIndex:50, boxShadow:'0 1px 8px rgba(0,0,0,.06)'
      }}>
        <div style={{ display:'flex', gap:6, alignItems:'flex-start', justifySelf:'start' }}>
          <button className="gb-btn gb-btn-ghost gb-btn-sm" onClick={()=>navigate('/dashboard/games')} style={{ padding:'6px 8px', fontSize:16, lineHeight:1, marginTop:1 }} title="Back to games">←</button>
          <div>
            {editingName ? (
              <div style={{ display:'flex', gap:4, alignItems:'center' }}>
                <input value={nameInput} onChange={e=>setNameInput(e.target.value)}
                  onKeyDown={e=>{if(e.key==='Enter')saveGameName();if(e.key==='Escape')setEditingName(false)}}
                  onBlur={saveGameName} autoFocus
                  style={{ width:180, fontSize:14, fontWeight:700, padding:'3px 6px' }} />
                <button className="gb-btn gb-btn-ghost gb-btn-sm" onClick={()=>setEditingName(false)} style={{ padding:'2px 6px' }}>✕</button>
              </div>
            ) : (
              <div style={{ fontWeight:700, fontSize:14, color:'var(--gb-text)', cursor:'pointer', lineHeight:1.3 }}
                onClick={()=>{setNameInput(game?.name||gameId);setEditingName(true)}} title="Click to edit">
                {game?.name||'🎡 Spin Wheel'} <span style={{ fontSize:10, color:'var(--gb-text3)', fontWeight:400 }}>✎</span>
              </div>
            )}
            <div style={{ fontSize:9.5, fontWeight:600, color:'var(--gb-text3)', letterSpacing:'.04em', textTransform:'uppercase', marginTop:1 }}>Builder</div>
          </div>
        </div>
        <div className="gb-tabs" style={{ marginBottom:0, borderBottom:'none', justifySelf:'center' }}>
          {TABS.map(t=>{const hasErr=upload.tabHasError(t.id,TAB_FIELDS[t.id]||[]);return <button key={t.id} className={`gb-tab${tab===t.id?' active':''}`} onClick={()=>setTab(t.id)} style={{ padding:'6px 14px', fontSize:12.5 }}>{t.label}{hasErr && <span className="gb-tab-err-dot" />}</button>})}
        </div>
        <div style={{ display:'flex', gap:6, alignItems:'center', justifySelf:'end' }}>
          <button className="gb-btn gb-btn-ghost gb-btn-sm" style={{ padding:'6px 8px', fontSize:16, lineHeight:1 }} onClick={()=>{navigator.clipboard.writeText(gameLink);showToast('Link copied!')}} title="Copy link">🔗</button>
          <a href={gameLink} target="_blank" rel="noreferrer" className="gb-btn gb-btn-ghost gb-btn-sm" style={{ padding:'6px 8px', fontSize:16, lineHeight:1, textDecoration:'none' }} title="Preview">👁</a>
        </div>
      </div>

      {/* ─── Content (2-col grid — identical to Quiz Builder) ─── */}
      <div style={{ maxWidth:1200, margin:'0 auto', padding:'24px 0 24px 20px', display:'grid', gridTemplateColumns:'1fr 320px', gap:24, alignItems:'start' }}>

        {/* ─── LEFT COL ─── */}
        <div>

          {/* ════ DISPLAY TAB ════ */}
          {tab==='display' && (<div>
            <div className="gb-card" style={{ marginBottom:16, padding:16 }}>
              <div className="gb-section-title">🖼️ Visuals</div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
                <div className={upload.hasError('game_logo_url')?'gb-img-error':''} style={{ display:'flex', flexDirection:'column', alignItems:'center' }}>
                  <span className="gb-label" style={{ marginBottom:8, display:'block', textAlign:'center' }}>Game Logo</span>
                  <ImageUpload label="" url={logoFile?URL.createObjectURL(logoFile):normalizePath(sUrls.logo)} onFile={f=>{upload.clearFieldError('game_logo_url');setLogoFile(f)}} onClear={()=>{setLogoFile(null);setSUrls(u=>({...u,logo:null}));upload.clearFieldError('game_logo_url')}} />
                </div>
                <div className={upload.hasError('bg_image_url')?'gb-img-error':''} style={{ display:'flex', flexDirection:'column', alignItems:'center' }}>
                  <span className="gb-label" style={{ marginBottom:8, display:'block', textAlign:'center' }}>Background Image</span>
                  <ImageUpload label="" url={bgFile?URL.createObjectURL(bgFile):normalizePath(sUrls.bg)} onFile={f=>{upload.clearFieldError('bg_image_url');setBgFile(f);setSUrls(u=>({...u,bg:URL.createObjectURL(f)}))}} onClear={()=>{setBgFile(null);setSUrls(u=>({...u,bg:null}));upload.clearFieldError('bg_image_url')}} />
                </div>
              </div>
            </div>

            <div className="gb-card" style={{ marginBottom:16, padding:16 }}>
              <div className="gb-section-title">📝 Game Text</div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr auto', gap:'8px 16px', alignItems:'end' }}>
                <div className="gb-fg" style={{ marginBottom:0 }}><span className="gb-label">Heading 1</span><input value={sForm.heading_1} onChange={e=>setS('heading_1',e.target.value)} placeholder="Spin & Win!" /></div>
                <ColorPicker value={sForm.heading_1_color||'#1a1a2e'} onChange={v=>setS('heading_1_color',v)} noPresets label="Color" />
                <div className="gb-fg" style={{ marginBottom:0 }}><span className="gb-label">Heading 2</span><input value={sForm.heading_2} onChange={e=>setS('heading_2',e.target.value)} placeholder="Try your luck" /></div>
                <ColorPicker value={sForm.heading_2_color||'#1a1a2e'} onChange={v=>setS('heading_2_color',v)} noPresets label="Color" />
                <div className="gb-fg" style={{ marginBottom:0 }}><span className="gb-label">Description</span><textarea rows={2} value={sForm.description_text} onChange={e=>setS('description_text',e.target.value)} placeholder="Spin the wheel and win exciting prizes…" style={{ resize:'vertical' }} /></div>
                <ColorPicker value={sForm.description_color||'#666666'} onChange={v=>setS('description_color',v)} noPresets label="Color" />
              </div>
            </div>

            <div className="gb-card" style={{ marginBottom:16, padding:16 }}>
              <div className="gb-section-title">📝 Player Registration Form</div>
              <p style={{ color:'var(--gb-text2)', marginBottom:16, fontSize:13 }}>These fields appear on the player registration screen before the spin starts.</p>
              {formFields.map((f,i) => (
                <div key={i} className="gb-card" style={{ marginBottom:10, padding:'12px 16px' }}>
                  <div style={{ display:'flex', gap:10, flexWrap:'wrap', alignItems:'flex-end' }}>
                    <div className="gb-fg" style={{ flex:2, minWidth:130 }}>
                      <span className="gb-label">Label</span>
                      <input value={f.field_label} onChange={e => updateFormField(i,'field_label',e.target.value)} />
                    </div>
                    <div className="gb-fg" style={{ flex:1, minWidth:110 }}>
                      <span className="gb-label">Type</span>
                      <select value={f.field_type} onChange={e => updateFormField(i,'field_type',e.target.value)}>
                        <option value="text">Text</option>
                        <option value="email">Email</option>
                        <option value="phone">Phone</option>
                        <option value="number">Number</option>
                        <option value="textarea">Textarea</option>
                        <option value="select">Dropdown</option>
                      </select>
                    </div>
                    <label style={{ display:'flex', alignItems:'center', gap:6, fontSize:13, cursor:'pointer', paddingBottom:2, whiteSpace:'nowrap' }}>
                      <input type="checkbox" checked={!!f.is_required} onChange={e => updateFormField(i,'is_required',e.target.checked?1:0)} style={{ width:16, height:16 }} />
                      Required
                    </label>
                    <button className="gb-btn gb-btn-danger gb-btn-sm" onClick={() => removeFormField(i)}>✕</button>
                  </div>
                </div>
              ))}
              <div style={{ display:'flex', gap:10, marginTop:16, justifyContent:'center' }}>
                <button className="gb-btn gb-btn-ghost" onClick={addFormField}>+ Add Field</button>
                <button className="gb-btn gb-btn-primary" onClick={saveFormFields} disabled={saving}>{saving ? 'Saving…' : '💾 Save Form'}</button>
              </div>
            </div>

            <div className="gb-card" style={{ marginBottom:16, padding:16 }}>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>
                <div>
                  <div className="gb-section-title">📜 Terms & Conditions</div>
                  <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:12 }}>
                    <input type="checkbox" id="spinTermsEnabled" checked={!!sForm.terms_enabled}
                      onChange={e=>setS('terms_enabled',e.target.checked?1:0)} style={{ width:16, height:16 }} />
                    <label htmlFor="spinTermsEnabled" style={{ fontWeight:600, cursor:'pointer', fontSize:13 }}>Require acceptance</label>
                  </div>
                  <div className="gb-fg" style={{ marginBottom:10 }}>
                    <span className="gb-label">Label Text</span>
                    <input value={sForm.terms_text} onChange={e=>setS('terms_text',e.target.value)} placeholder="Terms & Conditions" />
                  </div>
                  <div className="gb-fg" style={{ marginBottom:0 }}>
                    <span className="gb-label">URL (optional)</span>
                    <input value={sForm.terms_url} onChange={e=>setS('terms_url',e.target.value)} placeholder="https://yoursite.com/terms" />
                  </div>
                </div>
                <div>
                  <div className="gb-section-title">🚀 Start Button</div>
                  <div className="gb-fg" style={{ marginBottom:10 }}>
                    <input value={sForm.start_button_text} onChange={e=>setS('start_button_text',e.target.value)} placeholder="SPIN!" />
                  </div>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                    <ColorPicker value={sForm.start_button_text_color||'#ffffff'} onChange={v=>setS('start_button_text_color',v)} noPresets label="Text Color" />
                    <ColorPicker value={sForm.start_button_bg_color||''} onChange={v=>setS('start_button_bg_color',v)} noPresets label="Background Color" />
                  </div>
                </div>
              </div>
            </div>

            <div style={{ display:'flex', justifyContent:'flex-end' }}>
              <button className="gb-btn gb-btn-primary" onClick={saveSettings} disabled={saving} style={{ padding:'10px 28px' }}>{saving?'⏳ Saving…':'💾 Save Settings'}</button>
            </div>
          </div>)}

          {/* ════ SEGMENTS TAB ════ */}
          {tab==='segments' && (<div style={{ display:'grid', gridTemplateColumns:'30% 70%', gap:24, alignItems:'start' }}>
            {/* 30% Sidebar */}
            <div>
              <div className="gb-card" style={{ padding:20, marginBottom:20 }}>
                <div className="gb-section-title">🎨 Wheel Colors</div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
                  <ColorPicker value={sForm.wheel_bg_color} onChange={v=>setS('wheel_bg_color',v)} label="Wheel BG" />
                  <ColorPicker value={sForm.pointer_color} onChange={v=>setS('pointer_color',v)} label="Pointer" />
                  <ColorPicker value={sForm.center_color} onChange={v=>setS('center_color',v)} label="Center" />
                  <ColorPicker value={sForm.primary_color} onChange={v=>setS('primary_color',v)} label="Accent" />
                </div>
                <div className="gb-fg" style={{ marginTop:16 }}><span className="gb-label">Center Label</span><input value={sForm.center_label} onChange={e=>setS('center_label',e.target.value)} maxLength={8} /></div>
              </div>

              <div className="gb-card" style={{ padding:20 }}>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
                  <div className="gb-section-title" style={{ marginBottom:0 }}>🎡 Segments</div>
                  <span style={{ fontSize:12, color:'var(--gb-text2)', fontWeight:600 }}>{segments.length}</span>
                </div>
                {segments.length===0 ? (
                  <p style={{ color:'var(--gb-text3)', fontSize:13 }}>No segments yet.</p>
                ) : (
                  <div style={{ display:'flex', flexDirection:'column', gap:6, minWidth:0 }}>
                    {segments.map((seg,i) => {
                      const isSelected = selectedSegmentId === seg.id
                      const typeIcon = seg.segment_type==='prize'?'🎁':seg.segment_type==='try_again'?'🔄':'😔'
                      return (
                        <div key={seg.id}
                          onClick={()=>setSelectedSegmentId(seg.id)}
                          style={{
                            width:'100%', boxSizing:'border-box',
                            padding:'10px 12px', borderRadius:8, cursor:'pointer', fontSize:13,
                            background: isSelected ? '#eef0ff' : '#fff',
                            border:`1.5px solid ${isSelected ? 'var(--gb-primary)' : 'var(--gb-border)'}`,
                            transition:'all .12s', position:'relative',
                          }}>
                          <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:4, minWidth:0 }}>
                            <div style={{ width:10, height:10, borderRadius:'50%', background:seg.bg_color||'#7C6FF7', flexShrink:0, border:'1px solid var(--gb-border)' }} />
                            <span style={{ fontWeight:700, color:'var(--gb-primary)', fontSize:12, flexShrink:0 }}>#{i+1}</span>
                            <span style={{ minWidth:0, color:'var(--gb-text)', fontSize:12, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{seg.label||'Untitled'}</span>
                          </div>
                          <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                            <span style={{ fontSize:11, color:'var(--gb-text3)' }}>{typeIcon} {seg.segment_type==='prize'?'Prize':seg.segment_type==='try_again'?'Retry':'No Prize'}</span>
                            <span style={{ fontSize:10, color:'var(--gb-text3)' }}>· W:{seg.weight||100}</span>
                            <button onClick={e=>{e.stopPropagation();deleteSegment(seg.id);if(selectedSegmentId===seg.id){const r=segments.filter(s=>s.id!==seg.id);setSelectedSegmentId(r.length?r[0].id:null)}}}
                              style={{ marginLeft:'auto', background:'none', border:'none', cursor:'pointer', padding:'2px 4px', fontSize:12, lineHeight:1, color:'var(--gb-danger)' }} title="Delete">🗑</button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
                <button className="gb-btn gb-btn-primary gb-btn-sm" onClick={async()=>{try{const fd=new FormData();fd.append('label','New Segment');fd.append('bg_color',SEGMENT_COLORS[segments.length%SEGMENT_COLORS.length]);fd.append('text_color','#FFFFFF');fd.append('weight',100);fd.append('segment_type','prize');fd.append('segment_order',segments.length);const res=await api.post(`/spin/games/${gameId}/segments`,fd);setSegments(prev=>[...prev,res.data.segment]);setSelectedSegmentId(res.data.segment.id);showToast('Segment added ✅')}catch(err){showToast(err.response?.data?.message||'Failed','error')}}} style={{ width:'100%', marginTop:14, justifyContent:'center' }}>+ Add Segment</button>
              </div>
            </div>

            {/* 70% — Selected Segment Editor */}
            <div style={{ minWidth:0 }}>
              {(() => {
                const selSeg = segments.find(s => s.id === selectedSegmentId)
                if (!selSeg) return (
                  <div className="gb-empty">
                    <div className="gb-empty-icon">🎡</div>
                    <h3 style={{ color:'var(--gb-text)', marginBottom:8 }}>Select a segment</h3>
                    <p>Click a segment from the sidebar to edit it here.</p>
                  </div>
                )
                return (
                  <div className="gb-q-row" style={{ overflow:'visible' }}>
                    <div className="gb-q-header" style={{ cursor:'default', padding:'12px 16px' }}>
                      <div style={{ display:'flex', flexDirection:'column', gap:2 }} onClick={e=>e.stopPropagation()}>
                        <button className="gb-btn gb-btn-ghost gb-btn-icon gb-btn-sm" disabled={segments.indexOf(selSeg)===0}
                          onClick={()=>moveSegment(segments.indexOf(selSeg),'up')} title="Move up" style={{ padding:'3px 6px', lineHeight:1 }}>▲</button>
                        <button className="gb-btn gb-btn-ghost gb-btn-icon gb-btn-sm" disabled={segments.indexOf(selSeg)===segments.length-1}
                          onClick={()=>moveSegment(segments.indexOf(selSeg),'down')} title="Move down" style={{ padding:'3px 6px', lineHeight:1 }}>▼</button>
                      </div>
                      <span style={{ fontSize:12, fontWeight:800, color:'var(--gb-primary)', minWidth:28 }}>#{segments.indexOf(selSeg)+1}</span>
                      <div style={{ width:10, height:10, borderRadius:'50%', background:selSeg.bg_color||'#7C6FF7', flexShrink:0, border:'1px solid var(--gb-border)' }} />
                      <span style={{ flex:1, fontSize:13, fontWeight:600, color:'var(--gb-text)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{selSeg.label||'Untitled segment'}</span>
                      <button className="gb-btn gb-btn-danger gb-btn-sm gb-btn-icon" onClick={()=>{deleteSegment(selSeg.id);setSelectedSegmentId(null)}}>🗑</button>
                    </div>
                    <div className="gb-q-body" style={{ padding:16 }}>
                      {/* Images */}
                      <div className="gb-section" style={{ marginBottom:16 }}>
                        <div className="gb-section-title">📸 Images</div>
                        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
                          <div>
                            <span className="gb-label" style={{ marginBottom:6, display:'block' }}>Coupon Image</span>
                            <ImageUpload label="" url={selSeg.coupon_image_url||''} onFile={async f=>{const fd=new FormData();fd.append('coupon_image',f);const res=await api.put(`/spin/segments/${selSeg.id}`,fd);setSegments(prev=>prev.map(s=>s.id===selSeg.id?res.data.segment:s))}} onClear={async()=>{const res=await api.put(`/spin/segments/${selSeg.id}`,{coupon_image_url:''});setSegments(prev=>prev.map(s=>s.id===selSeg.id?res.data.segment:s))}} />
                          </div>
                          <div>
                            <span className="gb-label" style={{ marginBottom:6, display:'block' }}>Overlay Image</span>
                            <ImageUpload label="" url={selSeg.overlay_image_url||''} onFile={async f=>{const fd=new FormData();fd.append('overlay_image',f);const res=await api.put(`/spin/segments/${selSeg.id}`,fd);setSegments(prev=>prev.map(s=>s.id===selSeg.id?res.data.segment:s))}} onClear={async()=>{const res=await api.put(`/spin/segments/${selSeg.id}`,{overlay_image_url:''});setSegments(prev=>prev.map(s=>s.id===selSeg.id?res.data.segment:s))}} />
                          </div>
                        </div>
                      </div>

                      {/* Segment Details */}
                      <div className="gb-section" style={{ marginBottom:16 }}>
                        <div className="gb-section-title">📝 Segment Details</div>
                        <div className="gb-fg" style={{ marginBottom:12 }}><span className="gb-label">Label</span><input value={selSeg.label||''} onChange={e=>{const v=e.target.value;setSegments(prev=>prev.map(s=>s.id===selSeg.id?{...s,label:v}:s));setSelectedSegmentId(selSeg.id)}} placeholder="e.g. 10% OFF" /></div>
                        <div style={{ display:'grid', gridTemplateColumns:'1fr auto', gap:'10px 16px', alignItems:'end' }}>
                          <div>
                            <span className="gb-label">Segment Color</span>
                            <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginBottom:8 }}>
                              {SEGMENT_COLORS.map(c=><div key={c} onClick={()=>setSegments(prev=>prev.map(s=>s.id===selSeg.id?{...s,bg_color:c}:s))} style={{ width:26, height:26, borderRadius:6, background:c, cursor:'pointer', border:`2px solid ${selSeg.bg_color===c?'#1e1e2e':'transparent'}` }} />)}
                            </div>
                            <input type="color" value={selSeg.bg_color||'#7C6FF7'} onChange={e=>setSegments(prev=>prev.map(s=>s.id===selSeg.id?{...s,bg_color:e.target.value}:s))} style={{ width:36, height:28, border:'none', cursor:'pointer', borderRadius:4 }} />
                          </div>
                          <div>
                            <ColorPicker value={selSeg.text_color||'#FFFFFF'} onChange={v=>setSegments(prev=>prev.map(s=>s.id===selSeg.id?{...s,text_color:v}:s))} noPresets label="Text Color" />
                          </div>
                        </div>
                      </div>

                      {/* Prize Settings */}
                      <div className="gb-section" style={{ marginBottom:16 }}>
                        <div className="gb-section-title">🎁 Prize Settings</div>
                        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:12 }}>
                          <div className="gb-fg"><span className="gb-label">Type</span><select value={selSeg.segment_type||'prize'} onChange={e=>setSegments(prev=>prev.map(s=>s.id===selSeg.id?{...s,segment_type:e.target.value}:s))}><option value="prize">🎁 Prize</option><option value="try_again">🔄 Try Again</option><option value="no_prize">😔 No Prize</option></select></div>
                          <div className="gb-fg"><span className="gb-label">Weight</span><input type="number" min="1" max="9999" value={selSeg.weight||100} onChange={e=>setSegments(prev=>prev.map(s=>s.id===selSeg.id?{...s,weight:e.target.value}:s))} /><div style={{ fontSize:11, color:'var(--gb-text3)', marginTop:2 }}>Higher = more likely</div></div>
                        </div>
                        {selSeg.segment_type==='prize' && <>
                          <div className="gb-fg" style={{ marginBottom:12 }}><span className="gb-label">Win Message</span><input value={selSeg.win_message||''} onChange={e=>setSegments(prev=>prev.map(s=>s.id===selSeg.id?{...s,win_message:e.target.value}:s))} placeholder="e.g. Congratulations! You won!" /></div>
                          <div className="gb-fg" style={{ marginBottom:12 }}><span className="gb-label">Prize Description</span><textarea rows={2} value={selSeg.prize_description||''} onChange={e=>setSegments(prev=>prev.map(s=>s.id===selSeg.id?{...s,prize_description:e.target.value}:s))} placeholder="e.g. Get 10% off" style={{ resize:'vertical' }} /></div>
                          <div className="gb-fg"><span className="gb-label">Coupon Code</span><input value={selSeg.coupon_code||''} onChange={e=>setSegments(prev=>prev.map(s=>s.id===selSeg.id?{...s,coupon_code:e.target.value}:s))} placeholder="e.g. SPIN10OFF" /></div>
                        </>}
                        {selSeg.segment_type!=='prize' && (
                          <div className="gb-fg" style={{ marginTop:12 }}><span className="gb-label">Custom Message</span><textarea rows={2} value={selSeg.lose_message||''} onChange={e=>setSegments(prev=>prev.map(s=>s.id===selSeg.id?{...s,lose_message:e.target.value}:s))} placeholder="e.g. Oops! The wheel wasn't in your favor this time. Better luck on your next spin! 🍀" style={{ resize:'vertical' }} /><div style={{ fontSize:11, color:'var(--gb-text3)', marginTop:2 }}>Shown when player lands on this segment. Leave blank for default.</div></div>
                        )}
                      </div>

                      {/* Sound */}
                      <div className="gb-section" style={{ marginBottom:16 }}>
                        <div className="gb-section-title">🔊 Sound Settings</div>
                        <SoundSelector label="Sound On Land" value={selSeg.sound_id||''} onChange={v=>setSegments(prev=>prev.map(s=>s.id===selSeg.id?{...s,sound_id:v}:s))} sounds={sounds} />
                      </div>

                      <div style={{ display:'flex', justifyContent:'flex-end', paddingTop:4 }}>
                        <button className="gb-btn gb-btn-primary" onClick={async()=>{try{const fd=new FormData();Object.entries(selSeg).forEach(([k,v])=>{if(v!==undefined&&v!==null&&!['_imageFile','_bgImageFile'].includes(k))fd.append(k,v)});const res=await api.put(`/spin/segments/${selSeg.id}`,fd);setSegments(prev=>prev.map(s=>s.id===selSeg.id?res.data.segment:s));showToast('Segment saved ✅')}catch(err){showToast(err.response?.data?.message||'Failed','error')}}} style={{ padding:'10px 28px' }}>💾 Save Segment</button>
                      </div>
                    </div>
                  </div>
                )
              })()}
            </div>
          </div>)}

          {/* ════ THANK YOU TAB ════ */}
          {tab==='thankyou' && (<div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:16 }}>
              <div className="gb-card" style={{ padding:16, margin:0 }}>
                <div className="gb-section-title">📸 Thankyou Page Background</div>
                <div className={upload.hasError('thankyou_bg_image_url')?'gb-img-error':''} style={{ display:'flex', flexDirection:'column', alignItems:'center' }}>
                  <ImageUpload label="" url={tyFile?URL.createObjectURL(tyFile):normalizePath(sUrls.ty)} onFile={f=>{upload.clearFieldError('thankyou_bg_image_url');setTyFile(f)}} onClear={()=>{setTyFile(null);setSUrls(u=>({...u,ty:null}));upload.clearFieldError('thankyou_bg_image_url')}} />
                </div>
              </div>
              <div className="gb-card" style={{ padding:16, margin:0 }}>
                <div className="gb-section-title">📝 Thankyou Message</div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr auto', gap:'8px 12px', alignItems:'end' }}>
                  <div className="gb-fg" style={{ marginBottom:0 }}><span className="gb-label">Heading Text</span><textarea rows={2} value={sForm.outro_text} onChange={e=>setS('outro_text',e.target.value)} placeholder="Yay! You completed the game!" style={{ resize:'vertical' }} /></div>
                  <ColorPicker value={sForm.outro_text_color||'#1a1a2e'} onChange={v=>setS('outro_text_color',v)} noPresets />
                  <div className="gb-fg" style={{ marginBottom:0 }}><span className="gb-label">Subtitle Text</span><textarea rows={2} value={sForm.thankyou_subtitle} onChange={e=>setS('thankyou_subtitle',e.target.value)} placeholder="✅ Thank you for completing!" style={{ resize:'vertical' }} /></div>
                  <ColorPicker value={sForm.thankyou_subtitle_color||'#444444'} onChange={v=>setS('thankyou_subtitle_color',v)} noPresets />
                </div>
              </div>
            </div>

            <div className="gb-card" style={{ marginBottom:16, padding:16 }}>
              <div className="gb-section-title">🚀 Submit Button</div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr auto auto', gap:'8px 16px', alignItems:'end' }}>
                <div className="gb-fg" style={{ marginBottom:0 }}><input value={sForm.submit_button_text} onChange={e=>setS('submit_button_text',e.target.value)} placeholder="Submit & Explore" /></div>
                <ColorPicker value={sForm.submit_button_text_color||'#ffffff'} onChange={v=>setS('submit_button_text_color',v)} noPresets label="Text" />
                <ColorPicker value={sForm.submit_button_bg_color||''} onChange={v=>setS('submit_button_bg_color',v)} noPresets label="Background" />
              </div>
            </div>

            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:16 }}>
              <div className="gb-card" style={{ padding:16, margin:0 }}>
                <div className="gb-section-title">🎉 Submit Confirmation GIF</div>
                <div className={upload.hasError('submit_confirm_gif_url')?'gb-img-error':''} style={{ display:'flex', flexDirection:'column', alignItems:'center' }}>
                  <ImageUpload label="" url={submitGifFile?URL.createObjectURL(submitGifFile):normalizePath(sUrls.submitGif)} onFile={f=>{upload.clearFieldError('submit_confirm_gif_url');setSubmitGifFile(f)}} onClear={()=>{setSubmitGifFile(null);setSUrls(u=>({...u,submitGif:null}));upload.clearFieldError('submit_confirm_gif_url')}} accept="image/gif,image/png,image/jpeg,image/webp" />
                </div>
              </div>
              <div className="gb-card" style={{ padding:16, margin:0 }}>
                <div className="gb-section-title">🔗 Post-Game Redirect</div>
                <p style={{ color:'var(--gb-text2)', fontSize:12, marginBottom:12 }}>Where should players be sent after completing? Leave blank to show default.</p>
                <div className="gb-fg" style={{ marginBottom:0 }}><span className="gb-label">Redirect URL</span><input value={redirectUrl} onChange={e=>setRedirectUrl(e.target.value)} placeholder="https://yourwebsite.com/thankyou" type="url" /></div>
                {redirectUrl && <div style={{ marginTop:8, background:'#f0fdf4', border:'1px solid #bbf7d0', borderRadius:8, padding:'8px 12px', fontSize:12, color:'#15803d', wordBreak:'break-all' }}>✅ {redirectUrl}</div>}
                {redirectUrl && (
                  <div style={{ display:'grid', gridTemplateColumns:'1fr auto', gap:12, marginTop:12, alignItems:'end' }}>
                    <div className="gb-fg" style={{ marginBottom:0 }}>
                      <span className="gb-label">Auto-Redirect Delay (seconds)</span>
                      <input type="number" min="0" max="60" value={sForm.redirect_delay||''} onChange={e=>setS('redirect_delay',e.target.value?parseInt(e.target.value):'')} placeholder="0 = no auto-redirect" />
                    </div>
                    <div style={{ display:'flex', alignItems:'center', gap:6, paddingBottom:2 }}>
                      <input type="checkbox" id="redirectNewTab" checked={!!sForm.redirect_open_new_tab} onChange={e=>setS('redirect_open_new_tab',e.target.checked?1:0)} style={{ width:16, height:16 }} />
                      <label htmlFor="redirectNewTab" style={{ fontSize:12, color:'var(--gb-text2)', cursor:'pointer', whiteSpace:'nowrap' }}>Open in new tab</label>
                    </div>
                  </div>
                )}
                <div style={{ borderTop:'1px solid var(--gb-border)', paddingTop:16, marginTop:16 }}>
                  <div className="gb-section-title">⏩ Continue Now Button</div>
                  <div className="gb-fg" style={{ marginBottom:10 }}><input value={sForm.continue_button_text} onChange={e=>setS('continue_button_text',e.target.value)} placeholder="Continue Now →" /></div>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                    <ColorPicker value={sForm.continue_button_text_color||'#ffffff'} onChange={v=>setS('continue_button_text_color',v)} noPresets label="Text Color" />
                    <ColorPicker value={sForm.continue_button_bg_color||''} onChange={v=>setS('continue_button_bg_color',v)} noPresets label="Background Color" />
                  </div>
                </div>
              </div>
            </div>

            <div style={{ display:'flex', justifyContent:'flex-end' }}>
              <button className="gb-btn gb-btn-primary" onClick={saveSettings} disabled={saving} style={{ padding:'10px 28px' }}>{saving?'⏳ Saving…':'💾 Save Thankyou Settings'}</button>
            </div>
          </div>)}

          {/* ════ EMAIL TAB ════ */}
          {tab==='email' && (<div>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
              <p style={{ color:'var(--gb-text2)', fontSize:13 }}>Configure the congratulations email sent to players after a spin.</p>
              <label style={{ display:'flex', alignItems:'center', gap:8, fontSize:13, cursor:'pointer' }}>
                <input type="checkbox" checked={!!emailTemplate.is_enabled} onChange={e=>setEmailTemplate({...emailTemplate,is_enabled:e.target.checked?1:0})} style={{ width:16, height:16 }} />
                Enable email
              </label>
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:16, padding:'8px 12px', background:'#f0fdf4', border:'1px solid #bbf7d0', borderRadius:8 }}>
              <input type="checkbox" checked={!!sForm.send_email}
                onChange={e=>setS('send_email', e.target.checked?1:0)}
                style={{ width:16, height:16 }} />
              <span style={{ fontWeight:600, color:'#166534' }}>Send email on game completion</span>
              <span style={{ color:'#166534', fontSize:12, marginLeft:'auto' }}>Requires template below to be enabled</span>
            </div>
            <div className="gb-section" style={{ marginBottom:16, background:'#fffbeb', borderColor:'#fde68a' }}>
              💡 Use <code>{'{{name}}'}</code>, <code>{'{{coupon_code}}'}</code>, <code>{'{{prize}}'}</code> as placeholders.
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:16 }}>
              <div className="gb-fg"><span className="gb-label">Sender Name</span><input value={emailTemplate.sender_name||''} onChange={e=>setEmailTemplate({...emailTemplate,sender_name:e.target.value})} placeholder="PromoGames" /></div>
              <div className="gb-fg"><span className="gb-label">Sender Email</span><input value={emailTemplate.sender_email||''} onChange={e=>setEmailTemplate({...emailTemplate,sender_email:e.target.value})} placeholder="noreply@yourdomain.com" /></div>
            </div>
            <div className="gb-fg" style={{ marginBottom:14 }}><span className="gb-label">Subject</span><input value={emailTemplate.subject||''} onChange={e=>setEmailTemplate({...emailTemplate,subject:e.target.value})} placeholder="🎉 You won a prize, {{name}}!" /></div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr auto', gap:16, alignItems:'flex-end', marginBottom:14 }}>
              <div className="gb-fg"><span className="gb-label">Header Text</span><input value={emailTemplate.header_text||''} onChange={e=>setEmailTemplate({...emailTemplate,header_text:e.target.value})} placeholder="🎉 Congratulations!" /></div>
              <ColorPicker value={emailTemplate.header_color||'#6366f1'} onChange={v=>setEmailTemplate({...emailTemplate,header_color:v})} label="Header Color" />
            </div>
            <div className="gb-fg" style={{ marginBottom:14 }}><span className="gb-label">Email Body (HTML)</span><textarea rows={5} value={emailTemplate.body_html||''} onChange={e=>setEmailTemplate({...emailTemplate,body_html:e.target.value})} placeholder="<p>Thank you, {{name}}! Your prize: {{coupon_code}}</p>" style={{ resize:'vertical', fontFamily:'monospace', fontSize:13 }} /></div>
            <div className="gb-fg" style={{ marginBottom:20 }}><span className="gb-label">Footer Text</span><input value={emailTemplate.footer_text||''} onChange={e=>setEmailTemplate({...emailTemplate,footer_text:e.target.value})} placeholder="© 2024 PromoGames" /></div>
            <div style={{ display:'flex', justifyContent:'flex-end' }}>
              <button className="gb-btn gb-btn-primary" onClick={saveEmailTemplate} disabled={saving}>{saving?'⏳ Saving…':'💾 Save Email Template'}</button>
            </div>
          </div>)}

          {/* ════ SOUNDS TAB ════ */}
          {tab==='sounds' && (<div>
            <div className="gb-card" style={{ marginBottom:16, padding:16 }}>
              <div className="gb-section-title">🔊 Sound Assignments</div>
              <p style={{ color:'var(--gb-text2)', fontSize:12, marginBottom:14 }}>Assign sounds to game events. Upload sounds below first, then select them here.</p>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))', gap:12 }}>
                <SoundSelector label="🎡 Spin Sound" value={sForm.sound_spin_id} onChange={v=>setS('sound_spin_id',v)} sounds={sounds} />
                <SoundSelector label="🏆 Win Sound" value={sForm.sound_win_id} onChange={v=>setS('sound_win_id',v)} sounds={sounds} />
                <SoundSelector label="😔 Lose Sound" value={sForm.sound_lose_id} onChange={v=>setS('sound_lose_id',v)} sounds={sounds} />
              </div>
              <div style={{ display:'flex', justifyContent:'center', marginTop:14 }}>
                <button className="gb-btn gb-btn-primary gb-btn-sm" onClick={saveSettings} disabled={saving}>{saving?'Saving…':'💾 Save Sound Assignments'}</button>
              </div>
            </div>

            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
              <div>
                <h3 style={{ color:'var(--gb-text)', fontFamily:'inherit', marginBottom:4 }}>🔊 Sound Library</h3>
                <p style={{ color:'var(--gb-text2)', fontSize:13 }}>Upload MP3, WAV or OGG files.</p>
              </div>
              <div>
                <input type="file" ref={soundUploadRef} accept="audio/mpeg,audio/mp3,audio/wav,audio/ogg,audio/x-wav,audio/wave" onChange={uploadSound} style={{ display:'none' }} />
                <button className="gb-btn gb-btn-primary" onClick={() => soundUploadRef.current.click()} disabled={soundUploading}>{soundUploading?'⏳ Uploading…':'+ Upload Sound'}</button>
              </div>
            </div>

            {sounds.length===0 ? (
              <div className="gb-empty" style={{ border:'2px dashed var(--gb-border)', borderRadius:'var(--gb-radius)', background:'var(--gb-surface)' }}>
                <div className="gb-empty-icon">🔊</div>
                <h3 style={{ color:'var(--gb-text)', marginBottom:8 }}>No sounds yet</h3>
                <p>Upload MP3, WAV, or OGG files</p>
                <button className="gb-btn gb-btn-primary" style={{ marginTop:16 }} onClick={() => soundUploadRef.current.click()}>+ Upload Sound</button>
              </div>
            ) : (
              <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                {sounds.map(s => (
                  <div key={s.id} className="gb-card" style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 16px' }}>
                    <span style={{ fontSize:20 }}>🎵</span>
                    <div style={{ flex:1 }}>
                      <div style={{ fontWeight:700, fontSize:14, color:'var(--gb-text)' }}>{s.name}</div>
                      <div style={{ color:'var(--gb-text3)', fontSize:11, marginTop:2 }}>{s.file_name}</div>
                    </div>
                    <audio controls src={s.url} style={{ height:32 }} />
                    <button className="gb-btn gb-btn-danger gb-btn-sm gb-btn-icon" onClick={() => deleteSound(s)}>🗑</button>
                  </div>
                ))}
              </div>
            )}
          </div>)}

          {/* ════ SETTINGS TAB ════ */}
          {tab==='settings' && (<div>
            <div className="gb-card" style={{ marginBottom:16, padding:16 }}>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>
                <div>
                  <div className="gb-section-title">🔗 Game URL</div>
                  <p style={{ color:'var(--gb-text2)', fontSize:12, marginBottom:8 }}>Public URL: <code style={{ fontSize:11 }}>{gameLink}</code></p>
                </div>
                <div>
                  <div className="gb-section-title">🎨 Theme Colors</div>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                    <ColorPicker value={sForm.bg_color} onChange={v=>setS('bg_color',v)} label="Background" />
                    <ColorPicker value={sForm.primary_color} onChange={v=>setS('primary_color',v)} label="Primary Accent" />
                  </div>
                </div>
              </div>
            </div>

            <div className="gb-card" style={{ marginBottom:16, padding:16 }}>
              <div className="gb-section-title">🔤 Font Family</div>
              <div style={{ display:'grid', gap:12 }}>
                {FONT_CATEGORIES.map((cat, ci) => (
                  <div key={cat.name} style={ci < FONT_CATEGORIES.length - 1 ? {paddingBottom:12, borderBottom:'1px solid var(--gb-border)'} : {}}>
                    <div style={{ fontSize:11, fontWeight:700, letterSpacing:'.05em', textTransform:'uppercase', color:'var(--gb-text3)', marginBottom:6 }}>{cat.name}</div>
                    <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:6 }}>
                      {cat.fonts.map(font => (
                        <div key={font} onClick={()=>setS('font_family',font)}
                          style={{ padding:'6px 8px', borderRadius:6, cursor:'pointer', fontSize:12,
                            border:`1.5px solid ${sForm.font_family===font ? 'var(--gb-primary)' : 'var(--gb-border)'}`,
                            background: sForm.font_family===font ? '#eef0ff' : '#fff',
                            transition:'all .12s', fontFamily:`'${font}',sans-serif` }}>
                          <div style={{ fontWeight:700, lineHeight:1.3 }}>{font}</div>
                          <div style={{ color:'#888', fontWeight:400, lineHeight:1.2, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>The quick brown fox</div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="gb-card" style={{ marginBottom:16, padding:16 }}>
              <div className="gb-section-title">📲 Social Share Preview</div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20, alignItems:'start' }}>
                <div>
                  <p style={{ color:'var(--gb-text2)', fontSize:12, marginBottom:10 }}>Text shown when the game link is shared on social media.</p>
                  <div className="gb-fg" style={{ marginBottom:0 }}>
                    <span className="gb-label">Share Description</span>
                    <input value={sForm.meta_description||''} onChange={e=>setS('meta_description',e.target.value)} placeholder="Spin the wheel and win exciting rewards!" maxLength={200} />
                    <span style={{ fontSize:11, color:'var(--gb-text3)', marginTop:2 }}>{(sForm.meta_description||'').length}/200</span>
                  </div>
                </div>
                <div style={{ border:'1px solid var(--gb-border)', borderRadius:10, overflow:'hidden', background:'#fff', boxShadow:'0 2px 12px rgba(0,0,0,0.06)' }}>
                  <div style={{ height:120, background:normalizePath(sUrls.bg)?`center/cover url(${normalizePath(sUrls.bg)})`:(sForm.primary_color||'#7C6FF7'), display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontSize:32, fontWeight:800 }}>🎡</div>
                  <div style={{ padding:'12px 14px' }}>
                    <div style={{ fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:'.04em', color:'#888', marginBottom:3 }}>{window.location.hostname}</div>
                    <div style={{ fontSize:13, fontWeight:700, color:'#1a1a2e', marginBottom:4, lineHeight:1.3 }}>{sForm.heading_1 || 'Spin to Win'}</div>
                    <div style={{ fontSize:12, color:'#555', lineHeight:1.4 }}>{sForm.meta_description||'Spin the wheel and win exciting rewards!'}</div>
                  </div>
                </div>
              </div>
            </div>

            <div style={{ display:'flex', justifyContent:'flex-end' }}>
              <button className="gb-btn gb-btn-primary" onClick={saveSettings} disabled={saving} style={{ padding:'10px 28px' }}>{saving?'⏳ Saving…':'💾 Save All Settings'}</button>
            </div>
          </div>)}

        </div>{/* ─ end left col ─ */}

        {/* ─── RIGHT COL — Phone Mockup ─── */}
        <PhoneFrame settings={{ bg_image_url: bgFile ? URL.createObjectURL(bgFile) : normalizePath(sUrls.bg), bg_color: sForm.bg_color, font_family: sForm.font_family }}>

          {/* Display + Form preview */}
          {tab==='display' && <FormPreview settings={{...sForm, bg_image_url: bgFile ? URL.createObjectURL(bgFile) : normalizePath(sUrls.bg), game_logo_url: logoFile ? URL.createObjectURL(logoFile) : normalizePath(sUrls.logo)}} formFields={formFields} defaultButtonText={sForm.spin_mode === 'once' ? '🎡 SPIN ONCE' : '🎡 SPIN!'} />}

          {/* Segments preview */}
          {tab==='segments' && (<div style={{
            flex:1, display:'flex', flexDirection:'column',
            background:bgFile ? `url(${URL.createObjectURL(bgFile)}) center/cover` : normalizePath(sUrls.bg) ? `url(${normalizePath(sUrls.bg)}) center/cover` : (sForm.bg_color||'#F8F8FF'),
            padding:'clamp(16px,4vw,20px) 12px', overflow:'auto',
          }}>
            <div style={{
              width:'100%', maxWidth:280, margin:'auto',
              background:(bgFile || normalizePath(sUrls.bg)) ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.93)',
              backdropFilter:'blur(28px)', WebkitBackdropFilter:'blur(28px)',
              borderRadius:22, padding:'20px 16px', boxSizing:'border-box',
              boxShadow: (bgFile || normalizePath(sUrls.bg)) ? '0 8px 40px rgba(0,0,0,0.28), inset 0 1px 0 rgba(255,255,255,0.4)' : '0 8px 40px rgba(0,0,0,0.12)',
              border: (bgFile || normalizePath(sUrls.bg)) ? '1px solid rgba(255,255,255,0.35)' : '1px solid rgba(255,255,255,0.85)',
            }}>
              <WheelPreview segments={segments} settings={{...sForm,center_image_url:centerFile?URL.createObjectURL(centerFile):normalizePath(sUrls.center)}} size={170} heading={sForm.heading_1 || ''} />
              <div style={{ marginTop:12, fontSize:10, fontWeight:700, color:'var(--gb-text3)', textTransform:'uppercase', letterSpacing:'.05em', marginBottom:6 }}>Segments ({segments.length})</div>
              <div style={{ display:'flex', flexWrap:'wrap', gap:4 }}>
                {segments.slice(0,6).map((seg,i)=><div key={i} style={{ fontSize:9, padding:'2px 8px', borderRadius:10, background:seg.bg_color||'#7C6FF7', color:'#fff', fontWeight:600, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', maxWidth:80 }}>{seg.label}</div>)}
                {segments.length>6 && <span style={{ fontSize:9, color:'var(--gb-text3)' }}>+{segments.length-6}</span>}
              </div>
              <div style={{ marginTop:12, width:'100%', textAlign:'center', background:`linear-gradient(135deg,${sForm.primary_color||'#7C6FF7'},${sForm.primary_color||'#7C6FF7'}cc)`, color:'#fff', borderRadius:24, padding:'12px 0', fontSize:14, fontWeight:700, boxShadow:`0 4px 14px ${sForm.primary_color||'#7C6FF7'}44` }}>{sForm.spin_mode==='once'?'🎡 SPIN ONCE':'🎡 SPIN!'}</div>
            </div>
          </div>)}

          {/* Thank You preview */}
          {tab==='thankyou' && <ThankYouPreview settings={{...sForm, thanyou_bg_image_url: tyFile ? URL.createObjectURL(tyFile) : normalizePath(sUrls.ty), submit_button_bg_color: sForm.submit_button_bg_color, submit_button_text_color: sForm.submit_button_text_color, submit_button_text: sForm.submit_button_text, continue_button_text: sForm.continue_button_text, continue_button_bg_color: sForm.continue_button_bg_color, continue_button_text_color: sForm.continue_button_text_color}} />}

          {/* Email preview */}
          {tab==='email' && (() => {
            const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <style>
    body { margin:0; padding:0; background:#f4f4f6; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif; }
    .wrap { max-width:600px; margin:0 auto; background:#fff; }
    .header { background:${emailTemplate.header_color||'#6366f1'}; padding:24px 20px; text-align:center; }
    .header h1 { color:#fff; margin:0; font-size:20px; font-weight:700; }
    .body { padding:24px 20px; color:#333; font-size:14px; line-height:1.6; }
    .footer { padding:16px 20px; text-align:center; font-size:11px; color:#999; border-top:1px solid #eee; }
  </style>
</head>
<body>
  <div class="wrap">
    <div class="header"><h1>${emailTemplate.header_text||'🎉 Congratulations!'}</h1></div>
    <div class="body">${emailTemplate.body_html||'<p>Thank you for spinning the wheel!</p>'}</div>
    <div class="footer">${emailTemplate.footer_text||''}</div>
  </div>
</body>
</html>`.trim()
            return (
              <iframe title="Email Preview" srcDoc={html} style={{ flex:1, width:'100%', border:'none', background:'#f4f4f6' }} sandbox="allow-same-origin" />
            )
          })()}

          {/* Sounds preview */}
          {tab==='sounds' && (<div style={{
            flex:1, display:'flex', flexDirection:'column',
            background:normalizePath(sUrls.bg) ? `url(${normalizePath(sUrls.bg)}) center/cover` : (sForm.bg_color||'#F8F8FF'),
            padding:'clamp(16px,4vw,20px) 12px', overflow:'auto',
          }}>
            <div style={{
              width:'100%', maxWidth:280, margin:'auto', textAlign:'center',
              background: normalizePath(sUrls.bg) ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.93)',
              backdropFilter:'blur(28px)', WebkitBackdropFilter:'blur(28px)',
              borderRadius:22, padding:'20px 16px', boxSizing:'border-box',
              boxShadow: normalizePath(sUrls.bg) ? '0 8px 40px rgba(0,0,0,0.28), inset 0 1px 0 rgba(255,255,255,0.4)' : '0 8px 40px rgba(0,0,0,0.12)',
              border: normalizePath(sUrls.bg) ? '1px solid rgba(255,255,255,0.35)' : '1px solid rgba(255,255,255,0.85)',
            }}>
              <div style={{ fontSize:11, fontWeight:700, color:'var(--gb-text2)', marginBottom:6 }}>🔊 Sounds</div>
              <div style={{ fontSize:11, color:'var(--gb-text2)' }}>{sForm.sound_spin_id?'✅ Spin':'⬜ Spin'} · {sForm.sound_win_id?'✅ Win':'⬜ Win'} · {sForm.sound_lose_id?'✅ Lose':'⬜ Lose'}</div>
            </div>
          </div>)}

          {/* Settings preview */}
          {tab==='settings' && (<div style={{
            flex:1, display:'flex', flexDirection:'column',
            background:normalizePath(sUrls.bg) ? `url(${normalizePath(sUrls.bg)}) center/cover` : (sForm.bg_color||'#F8F8FF'),
            padding:'clamp(16px,4vw,20px) 12px', overflow:'auto',
          }}>
            <div style={{
              width:'100%', maxWidth:280, margin:'auto',
              background: normalizePath(sUrls.bg) ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.93)',
              backdropFilter:'blur(28px)', WebkitBackdropFilter:'blur(28px)',
              borderRadius:22, padding:'20px 16px', boxSizing:'border-box',
              boxShadow: normalizePath(sUrls.bg) ? '0 8px 40px rgba(0,0,0,0.28), inset 0 1px 0 rgba(255,255,255,0.4)' : '0 8px 40px rgba(0,0,0,0.12)',
              border: normalizePath(sUrls.bg) ? '1px solid rgba(255,255,255,0.35)' : '1px solid rgba(255,255,255,0.85)',
            }}>
              {normalizePath(sUrls.logo) && <div style={{ textAlign:'center', marginBottom:14 }}><img src={normalizePath(sUrls.logo)} alt="" style={{ maxWidth:'100%', maxHeight:80, objectFit:'contain', borderRadius:8 }} /></div>}
              <WheelPreview segments={segments} settings={{...sForm,center_image_url:centerFile?URL.createObjectURL(centerFile):normalizePath(sUrls.center)}} size={170} heading={sForm.heading_1 || ''} />
              {sForm.heading_2 && <div style={{ fontSize:13, fontWeight:600, textAlign:'center', marginTop:8, marginBottom:2, color:'var(--gb-text2)', lineHeight:1.3 }}>{sForm.heading_2}</div>}
              {sForm.heading_2 && <div style={{ fontSize:13, fontWeight:600, textAlign:'center', marginBottom:4, color:'var(--gb-text2)', lineHeight:1.3 }}>{sForm.heading_2}</div>}
              <div style={{ marginTop:12, width:'100%', textAlign:'center', background:`linear-gradient(135deg,${sForm.primary_color||'#7C6FF7'},${sForm.primary_color||'#7C6FF7'}cc)`, color:'#fff', borderRadius:24, padding:'12px 0', fontSize:14, fontWeight:700, boxShadow:`0 4px 14px ${sForm.primary_color||'#7C6FF7'}44` }}>{sForm.spin_mode==='once'?'🎡 SPIN ONCE':'🎡 SPIN!'}</div>
            </div>
          </div>)}

        </PhoneFrame>{/* ─ end right col ─ */}

      </div>{/* ─ end two-col ─ */}

      {modal && modal !== 'add' && <SegmentModal seg={modal} sounds={sounds} onSave={handleSegmentSave} onClose={()=>setModal(null)} />}
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={()=>setToast(null)} />}
    </div>
  )
}
