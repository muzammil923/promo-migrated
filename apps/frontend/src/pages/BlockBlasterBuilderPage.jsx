import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';

const LIGHT = `
.bb-build-wrap {
  --gb-bg: #f4f6fb; --gb-surface: #ffffff; --gb-surface2: #f0f2f8;
  --gb-border: #e2e6f0; --gb-primary: #6366f1; --gb-primary-d: #4f46e5;
  --gb-primary-g: rgba(99,102,241,0.15); --gb-success: #16a34a;
  --gb-text: #1e1e2e; --gb-text2: #64657a; --gb-shadow: 0 2px 12px rgba(0,0,0,0.08);
  --gb-radius: 12px; --gb-radius-sm: 8px;
  font-family: 'DM Sans', sans-serif; background: var(--gb-bg);
  color: var(--gb-text); min-height: 100vh; padding: 24px;
}
.bb-build-wrap *, .bb-build-wrap *::before, .bb-build-wrap *::after { box-sizing: border-box; }
.bb-build-wrap input, .bb-build-wrap select, .bb-build-wrap textarea {
  width: 100%; font-family: inherit; font-size: 14px; background: var(--gb-surface);
  border: 1.5px solid var(--gb-border); border-radius: 8px; color: var(--gb-text);
  padding: 10px 12px; outline: none; transition: border-color .18s;
}
.bb-build-wrap input:focus { border-color: var(--gb-primary); }
.bb-build-wrap label { font-size: 12px; font-weight: 700; color: var(--gb-text2); text-transform: uppercase; letter-spacing: .05em; display: block; margin-bottom: 4px; }
.bb-build-card { background: var(--gb-surface); border: 1.5px solid var(--gb-border); border-radius: var(--gb-radius); box-shadow: var(--gb-shadow); padding: 24px; margin-bottom: 16px; }
.bb-build-title { font-size: 22px; font-weight: 800; margin: 0 0 4px; }
.bb-build-sub { font-size: 13px; color: var(--gb-text2); margin: 0 0 20px; }
.bb-build-row { display: flex; gap: 12px; flex-wrap: wrap; margin-bottom: 16px; }
.bb-build-field { flex: 1; min-width: 200px; }
.bb-build-btn { display: inline-flex; align-items: center; gap: 6px; padding: 10px 20px; font-size: 14px; font-weight: 600; border-radius: var(--gb-radius-sm); border: none; cursor: pointer; font-family: inherit; transition: all .15s; }
.bb-build-btn-primary { background: var(--gb-primary); color: #fff; }
.bb-build-btn-primary:hover { background: var(--gb-primary-d); transform: translateY(-1px); }
.bb-build-btn-ghost { background: var(--gb-surface); color: var(--gb-text2); border: 1.5px solid var(--gb-border); margin-right: 8px; }
.bb-build-btn-ghost:hover { border-color: var(--gb-primary); color: var(--gb-primary); }
.bb-build-preview { background: #1a1a2e; border-radius: 12px; padding: 20px; margin-top: 16px; }
.bb-build-preview h3 { color: #ffd23f; margin: 0 0 8px; font-size: 16px; }
.bb-build-preview p { color: #a9a3d6; margin: 0; font-size: 13px; line-height: 1.6; }
`;

export default function BlockBlasterBuilderPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [game, setGame] = useState(null);
  const [form, setForm] = useState({
    name: '',
    description: '',
    redirect_url: '',
    is_active: true,
  });

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get(`/games/${id}`);
        const g = res.data.game || res.data;
        setGame(g);
        setForm({
          name: g.name || '',
          description: g.description || '',
          redirect_url: g.redirect_url || '',
          is_active: g.is_active !== false,
        });
      } catch (e) {
        setToast({ type: 'error', text: 'Failed to load game' });
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const updateField = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put(`/games/${id}`, {
        name: form.name,
        description: form.description,
        redirect_url: form.redirect_url,
        is_active: form.is_active ? 1 : 0,
      });
      setToast({ type: 'success', text: 'Game settings saved!' });
    } catch (e) {
      setToast({ type: 'error', text: 'Failed to save' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="bb-build-wrap"><p>Loading...</p></div>;

  return (
    <div className="bb-build-wrap">
      <style>{LIGHT}</style>
      {toast && <div className="bb-build-toast" style={{ background: toast.type === 'success' ? '#16a34a' : '#dc2626' }}>{toast.text}</div>}
      <div style={{ maxWidth: 640 }}>
        <div className="bb-build-card">
          <h1 className="bb-build-title">Block Blaster</h1>
          <p className="bb-build-sub">Configure your Block Blaster game settings.</p>

          <div className="bb-build-row">
            <div className="bb-build-field">
              <label>Game Name</label>
              <input value={form.name} onChange={(e) => updateField('name', e.target.value)} placeholder="Block Blaster" />
            </div>
          </div>

          <div className="bb-build-row">
            <div className="bb-build-field">
              <label>Description</label>
              <textarea rows={3} value={form.description} onChange={(e) => updateField('description', e.target.value)} placeholder="Drag and drop puzzle pieces..." />
            </div>
          </div>

          <div className="bb-build-row">
            <div className="bb-build-field">
              <label>Redirect URL (after game)</label>
              <input value={form.redirect_url} onChange={(e) => updateField('redirect_url', e.target.value)} placeholder="https://..." />
            </div>
          </div>

          <div className="bb-build-row">
            <div className="bb-build-field" style={{ flex: 'none' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <input type="checkbox" checked={form.is_active} onChange={(e) => updateField('is_active', e.target.checked)} style={{ width: 18, height: 18 }} />
                Active
              </label>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <button className="bb-build-btn bb-build-btn-ghost" onClick={() => navigate(-1)}>Back</button>
            <button className="bb-build-btn bb-build-btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save Settings'}</button>
          </div>
        </div>

        <div className="bb-build-card bb-build-preview">
          <h3>Game Preview</h3>
          <p>Drag pieces from the tray onto the 8x8 board. Fill complete rows or columns to clear them and score points. Game ends when no remaining pieces can be placed.</p>
        </div>
      </div>
    </div>
  );
}
