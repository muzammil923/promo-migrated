import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../apps/frontend/src/api';

const CSS = `
.ttm-build-wrap{--gb-bg:#f4f6fb;--gb-surface:#fff;--gb-border:#e2e6f0;--gb-primary:#6366f1;--gb-primary-d:#4f46e5;--gb-text:#1e1e2e;--gb-text2:#64657a;--gb-radius:12px;font-family:'DM Sans',sans-serif;background:var(--gb-bg);color:var(--gb-text);min-height:100vh;padding:24px}
.ttm-build-wrap *{box-sizing:border-box}
.ttm-build-wrap input{width:100%;font-family:inherit;font-size:14px;background:var(--gb-surface);border:1.5px solid var(--gb-border);border-radius:8px;color:var(--gb-text);padding:10px 12px;outline:none}
.ttm-build-wrap input:focus{border-color:var(--gb-primary)}
.ttm-build-wrap label{font-size:12px;font-weight:700;color:var(--gb-text2);text-transform:uppercase;letter-spacing:.05em;display:block;margin-bottom:4px}
.ttm-card{background:var(--gb-surface);border:1.5px solid var(--gb-border);border-radius:var(--gb-radius);padding:24px;margin-bottom:16px}
.ttm-card h1{font-size:22px;font-weight:800;margin:0 0 4px}
.ttm-card p{font-size:13px;color:var(--gb-text2);margin:0 0 20px}
.ttm-row{display:flex;gap:12px;flex-wrap:wrap;margin-bottom:16px}
.ttm-field{flex:1;min-width:200px}
.ttm-btn{display:inline-flex;align-items:center;gap:6px;padding:10px 20px;font-size:14px;font-weight:600;border-radius:8px;border:none;cursor:pointer;font-family:inherit;transition:all .15s}
.ttm-btn-primary{background:var(--gb-primary);color:#fff}
.ttm-btn-primary:hover{background:var(--gb-primary-d);transform:translateY(-1px)}
.ttm-btn-ghost{background:var(--gb-surface);color:var(--gb-text2);border:1.5px solid var(--gb-border);margin-right:8px}
.ttm-btn-ghost:hover{border-color:var(--gb-primary);color:var(--gb-primary)}
`;

export default function TicTacToeMultiplayerBuilderPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [form, setForm] = useState({ name: '', description: '', redirect_url: '', is_active: true });

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get(`/games/${id}`);
        const g = res.data.game || res.data;
        setForm({ name: g.name || '', description: g.description || '', redirect_url: g.redirect_url || '', is_active: g.is_active !== false });
      } catch (e) { setToast({ type: 'error', text: 'Failed to load game' }); }
      finally { setLoading(false); }
    })();
  }, [id]);

  const updateField = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put(`/games/${id}`, { name: form.name, description: form.description, redirect_url: form.redirect_url, is_active: form.is_active ? 1 : 0 });
      setToast({ type: 'success', text: 'Saved!' });
    } catch (e) { setToast({ type: 'error', text: 'Failed to save' }); }
    finally { setSaving(false); }
  };

  if (loading) return <div className="ttm-build-wrap"><p>Loading...</p></div>;

  return (
    <div className="ttm-build-wrap">
      <style>{CSS}</style>
      {toast && <div style={{ position:'fixed',bottom:24,right:24,zIndex:9999,padding:'12px 18px',borderRadius:10,color:'#fff',fontWeight:600,fontSize:13,background:toast.type==='success'?'#16a34a':'#dc2626' }}>{toast.text}</div>}
      <div style={{ maxWidth:640 }}>
        <div className="ttm-card">
          <h1>Tic-Tac-Toe Multiplayer</h1>
          <p>Configure your multiplayer Tic-Tac-Toe game settings.</p>
          <div className="ttm-row"><div className="ttm-field"><label>Game Name</label><input value={form.name} onChange={e => updateField('name', e.target.value)} placeholder="Tic-Tac-Toe" /></div></div>
          <div className="ttm-row"><div className="ttm-field"><label>Description</label><input value={form.description} onChange={e => updateField('description', e.target.value)} placeholder="Play Tic-Tac-Toe online or offline" /></div></div>
          <div className="ttm-row"><div className="ttm-field"><label>Redirect URL</label><input value={form.redirect_url} onChange={e => updateField('redirect_url', e.target.value)} placeholder="https://..." /></div></div>
          <div className="ttm-row"><div className="ttm-field" style={{ flex:'none' }}><label style={{ display:'flex',alignItems:'center',gap:8,cursor:'pointer' }}><input type="checkbox" checked={form.is_active} onChange={e => updateField('is_active', e.target.checked)} style={{ width:18,height:18 }} />Active</label></div></div>
          <div style={{ display:'flex',gap:8,marginTop:8 }}>
            <button className="ttm-btn ttm-btn-ghost" onClick={() => navigate(-1)}>Back</button>
            <button className="ttm-btn ttm-btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save Settings'}</button>
          </div>
        </div>
      </div>
    </div>
  );
}
