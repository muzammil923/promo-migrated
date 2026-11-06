import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../api'
import { ANIM_OPTIONS } from '../components/animations'

const LIGHT = `
:root{ --gb-bg:#f5f6fb; --gb-card:var(--surface); --gb-border:#e3e6f0; --gb-text:#1a1a2e; --gb-text2:#6b7280; --gb-primary:#9210f6; --gb-radius:12px; }
.gb-wrap{ background:var(--gb-bg); min-height:100vh; font-family:'DM Sans',system-ui,sans-serif; color:var(--gb-text); }
.gb-card{ background:var(--gb-card); border:1px solid var(--gb-border); border-radius:var(--gb-radius); padding:18px; }
.gb-label{ font-size:12px; font-weight:600; color:var(--gb-text2); }
.gb-btn{ border:1px solid var(--gb-border); background:var(--surface); color:var(--gb-text); border-radius:8px; padding:8px 14px; font-weight:600; cursor:pointer; font-size:13px; }
.gb-btn-primary{ background:var(--gb-primary); color:#fff; border-color:var(--gb-primary); }
.gb-btn-ghost{ background:transparent; }
.gb-row{ display:flex; gap:16px; flex-wrap:wrap; }
.gb-field{ display:flex; flex-direction:column; gap:6px; min-width:180px; }
.gb-input, .gb-select{ border:1px solid var(--gb-border); border-radius:8px; padding:8px 10px; font-size:13px; background:var(--surface); color:var(--gb-text); }
.gb-section-title{ font-size:13px; font-weight:700; margin-bottom:10px; color:var(--gb-text); }
`

function ColorField({ label, value, onChange }) {
  return (
    <div className="gb-field">
      <span className="gb-label">{label}</span>
      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
        <input type="color" value={value || '#000000'} onChange={e => onChange(e.target.value)} style={{ width:38, height:34, border:'1px solid var(--gb-border)', borderRadius:8, background:'var(--surface)', padding:2, cursor:'pointer' }} />
        <input className="gb-input" value={value || ''} onChange={e => onChange(e.target.value)} style={{ flex:1 }} />
      </div>
    </div>
  )
}

function SelectField({ label, value, options, onChange }) {
  return (
    <div className="gb-field">
      <span className="gb-label">{label}</span>
      <select className="gb-select" value={value || ''} onChange={e => onChange(e.target.value)}>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  )
}

const LANGS = [
  { value:'en', label:'English' }, { value:'ja', label:'Japanese' }, { value:'zh', label:'Chinese' },
  { value:'es', label:'Spanish' }, { value:'fr', label:'French' }, { value:'de', label:'German' }, { value:'hi', label:'Hindi' },
]

export default function TemplateBuilderPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = !!id
  const [loading, setLoading] = useState(isEdit)
  const [saving, setSaving] = useState(false)
  const [name, setName] = useState('')
  const [isDefault, setIsDefault] = useState(false)
  const [preview, setPreview] = useState('')
  const [cfg, setCfg] = useState({
    primary_color: '#9210f6',
    bg_color: '#f4f4ff',
    font_family: 'DM Sans',
    option_text_color: '#ffffff',
    option_color: '#1a1a2e',
    border_color: 'transparent',
    enable_mascot: 0,
    enable_speech: 0,
    speech_language: 'en',
    speech_rate: 1,
    speech_pitch: 1,
    // animation variants (named)
    anim_question_in: 'floatIn',
    anim_question_out: 'fadeIn',
    anim_video_in: 'zoomIn',
    anim_video_out: 'zoomOut',
    anim_overlay_in: 'flyFromBottom',
    anim_overlay_out: 'flyToTop',
    idle_overlay_time: 3,
    start_button_text: 'Start',
    next_button_text: 'Next →',
  })

  useEffect(() => {
    if (!isEdit) return
    setLoading(true)
    api.get(`/templates/${id}`).then(r => {
      const t = r.data.template
      setName(t.name); setIsDefault(!!t.is_default); setPreview(t.preview_image_url || '')
      if (t.config_json) {
        try { setCfg({ ...cfg, ...(typeof t.config_json === 'string' ? JSON.parse(t.config_json) : t.config_json) }) } catch {}
      }
    }).finally(() => setLoading(false))
  }, [id])

  const set = (k, v) => setCfg(c => ({ ...c, [k]: v }))

  const save = async () => {
    if (!name.trim()) return alert('Template name required')
    setSaving(true)
    try {
      const payload = { name, is_default: isDefault, config_json: cfg, preview_image_url: preview || null }
      if (isEdit) await api.put(`/templates/${id}`, payload)
      else { const r = await api.post('/templates', payload); navigate(`/dashboard/templates/${r.data.id}`, { replace: true }) }
      alert('Template saved')
    } catch (e) { alert('Save failed: ' + (e.response?.data?.message || e.message)) }
    finally { setSaving(false) }
  }

  if (loading) return <div className="gb-wrap" style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'100vh' }}><style>{LIGHT}</style>Loading…</div>

  return (
    <div className="gb-wrap" style={{ padding:24 }}>
      <style>{LIGHT}</style>
      <div className="gb-card" style={{ maxWidth:980, margin:'0 auto' }}>
        <div className="gb-row" style={{ justifyContent:'space-between', alignItems:'center', marginBottom:18 }}>
          <h2 style={{ margin:0 }}>{isEdit ? 'Edit Template' : 'New Template'}</h2>
          <div style={{ display:'flex', gap:8 }}>
            <button className="gb-btn gb-btn-ghost" onClick={() => navigate('/dashboard/templates')}>← Back</button>
            <button className="gb-btn gb-btn-primary" onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save Template'}</button>
          </div>
        </div>

        <div className="gb-field" style={{ marginBottom:18, minWidth:'100%' }}>
          <span className="gb-label">Template Name</span>
          <input className="gb-input" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Brand X — Playful" />
        </div>
        <label className="gb-row" style={{ alignItems:'center', marginBottom:18 }}>
          <input type="checkbox" checked={isDefault} onChange={e => setIsDefault(e.target.checked)} />
          <span className="gb-label" style={{ marginBottom:0 }}>Set as default template for this client</span>
        </label>

        <div className="gb-card" style={{ marginBottom:16, borderStyle:'dashed' }}>
          <div className="gb-section-title">🎨 Colors & Font</div>
          <div className="gb-row">
            <ColorField label="Primary Color" value={cfg.primary_color} onChange={v => set('primary_color', v)} />
            <ColorField label="Page BG Color" value={cfg.bg_color} onChange={v => set('bg_color', v)} />
            <ColorField label="Option Text Color" value={cfg.option_text_color} onChange={v => set('option_text_color', v)} />
            <ColorField label="Option BG Color" value={cfg.option_color} onChange={v => set('option_color', v)} />
            <ColorField label="Option Border Color" value={cfg.border_color} onChange={v => set('border_color', v)} />
          </div>
          <div className="gb-row" style={{ marginTop:12 }}>
            <SelectField label="Font Family" value={cfg.font_family} onChange={v => set('font_family', v)} options={['DM Sans','Poppins','Inter','Roboto','Montserrat','Open Sans'].map(f => ({ value:f, label:f }))} />
          </div>
        </div>

        <div className="gb-card" style={{ marginBottom:16, borderStyle:'dashed' }}>
          <div className="gb-section-title">🎬 Animations (named variants)</div>
          <div className="gb-row">
            <SelectField label="Question In" value={cfg.anim_question_in} onChange={v => set('anim_question_in', v)} options={ANIM_OPTIONS} />
            <SelectField label="Question Out" value={cfg.anim_question_out} onChange={v => set('anim_question_out', v)} options={ANIM_OPTIONS} />
            <SelectField label="Video In" value={cfg.anim_video_in} onChange={v => set('anim_video_in', v)} options={ANIM_OPTIONS} />
            <SelectField label="Video Out" value={cfg.anim_video_out} onChange={v => set('anim_video_out', v)} options={ANIM_OPTIONS} />
            <SelectField label="Overlay In" value={cfg.anim_overlay_in} onChange={v => set('anim_overlay_in', v)} options={ANIM_OPTIONS} />
            <SelectField label="Overlay Out" value={cfg.anim_overlay_out} onChange={v => set('anim_overlay_out', v)} options={ANIM_OPTIONS} />
          </div>
          <div className="gb-row" style={{ marginTop:12 }}>
            <div className="gb-field">
              <span className="gb-label">Overlay Idle Time (sec)</span>
              <input className="gb-input" type="number" min="0" step="0.5" value={cfg.idle_overlay_time} onChange={e => set('idle_overlay_time', parseFloat(e.target.value) || 0)} />
            </div>
          </div>
        </div>

        <div className="gb-card" style={{ marginBottom:16, borderStyle:'dashed' }}>
          <div className="gb-section-title">🗣️ Mascot & Voice (TTS)</div>
          <div className="gb-row" style={{ alignItems:'center' }}>
            <label className="gb-row" style={{ alignItems:'center' }}><input type="checkbox" checked={!!cfg.enable_mascot} onChange={e => set('enable_mascot', e.target.checked ? 1 : 0)} /><span className="gb-label" style={{ marginBottom:0 }}>Show Mascot</span></label>
            <label className="gb-row" style={{ alignItems:'center' }}><input type="checkbox" checked={!!cfg.enable_speech} onChange={e => set('enable_speech', e.target.checked ? 1 : 0)} /><span className="gb-label" style={{ marginBottom:0 }}>Read Aloud (TTS)</span></label>
          </div>
          <div className="gb-row" style={{ marginTop:12 }}>
            <SelectField label="Speech Language" value={cfg.speech_language} onChange={v => set('speech_language', v)} options={LANGS} />
            <div className="gb-field"><span className="gb-label">Rate ({cfg.speech_rate})</span><input type="range" min="0.5" max="2" step="0.1" value={cfg.speech_rate} onChange={e => set('speech_rate', parseFloat(e.target.value))} /></div>
            <div className="gb-field"><span className="gb-label">Pitch ({cfg.speech_pitch})</span><input type="range" min="0" max="2" step="0.1" value={cfg.speech_pitch} onChange={e => set('speech_pitch', parseFloat(e.target.value))} /></div>
          </div>
        </div>

        <div className="gb-card" style={{ borderStyle:'dashed' }}>
          <div className="gb-section-title">🔤 Button Labels</div>
          <div className="gb-row">
            <div className="gb-field"><span className="gb-label">Start Button Text</span><input className="gb-input" value={cfg.start_button_text||''} onChange={e => set('start_button_text', e.target.value)} /></div>
            <div className="gb-field"><span className="gb-label">Next Button Text</span><input className="gb-input" value={cfg.next_button_text||''} onChange={e => set('next_button_text', e.target.value)} /></div>
          </div>
        </div>
      </div>
    </div>
  )
}
