import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api'
import Toast from '../components/Toast'

const LIGHT = `
.gb-wrap{ background:#f5f6fb; min-height:100vh; font-family:'DM Sans',system-ui,sans-serif; color:#1a1a2e; padding:24px; }
.gb-card{ background:var(--surface); border:1px solid #e3e6f0; border-radius:12px; padding:18px; max-width:980px; margin:0 auto; }
.gb-grid{ display:grid; grid-template-columns:repeat(auto-fill,minmax(220px,1fr)); gap:16px; }
.gb-tpl{ border:1px solid #e3e6f0; border-radius:12px; padding:14px; background:var(--surface); cursor:pointer; }
.gb-tpl:hover{ border-color:#9210f6; }
.gb-btn{ border:1px solid #e3e6f0; background:var(--surface); color:#1a1a2e; border-radius:8px; padding:8px 14px; font-weight:600; cursor:pointer; font-size:13px; }
.gb-btn-primary{ background:#9210f6; color:#fff; border-color:#9210f6; }
`

export default function TemplatesPage() {
  const navigate = useNavigate()
  const [templates, setTemplates] = useState([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState(null)

  const showToast = (msg, type='success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  useEffect(() => {
    api.get('/templates').then(r => setTemplates(r.data.templates || [])).finally(() => setLoading(false))
  }, [])

  const remove = async (id) => {
    if (!confirm('Delete this template?')) return
    try {
      await api.delete(`/templates/${id}`)
      showToast('Template deleted')
      setTemplates(ts => ts.filter(t => t.id !== id))
    } catch { showToast('Failed to delete template', 'error') }
  }

  return (
    <div className="gb-wrap">
      <style>{LIGHT}</style>
      <div className="gb-card">
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:18 }}>
          <h2 style={{ margin:0 }}>Templates</h2>
          <button className="gb-btn gb-btn-primary" onClick={() => navigate('/dashboard/templates/new')}>+ New Template</button>
        </div>
        {loading ? <p>Loading…</p> : templates.length === 0 ? <p>No templates yet. Create one to reuse across games.</p> : (
          <div className="gb-grid">
            {templates.map(t => (
              <div key={t.id} className="gb-tpl" onClick={() => navigate(`/dashboard/templates/${t.id}`)}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <strong>{t.name}</strong>
                  {t.is_default ? <span style={{ fontSize:11, color:'#9210f6' }}>DEFAULT</span> : null}
                </div>
                <div style={{ marginTop:10, display:'flex', gap:8 }}>
                  <button className="gb-btn" onClick={e => { e.stopPropagation(); navigate(`/dashboard/templates/${t.id}`) }}>Edit</button>
                  <button className="gb-btn" onClick={e => { e.stopPropagation(); remove(t.id) }}>Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  )
}
