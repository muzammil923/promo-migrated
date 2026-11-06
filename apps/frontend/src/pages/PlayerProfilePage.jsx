import { useState, useEffect } from 'react'
import { usePlayer } from './PlayerLayout'
import { AvatarDisplay, AvatarGrid } from '../components/AvatarData'
import api from '../api'

const MODAL_STYLES = `
  @keyframes modal-in {
    from { opacity: 0; transform: scale(0.9) translateY(20px); }
    to { opacity: 1; transform: scale(1) translateY(0); }
  }
  @keyframes modal-backdrop {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  .modal-backdrop {
    position: fixed; inset: 0; z-index: 3000;
    background: rgba(0,0,0,0.7); backdrop-filter: blur(8px);
    display: flex; align-items: center; justify-content: center;
    padding: 20px;
    animation: modal-backdrop 0.2s ease both;
  }
  .modal-card {
    background: rgba(15, 7, 32, 0.95);
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 24px;
    width: 100%; max-width: 380px;
    overflow: hidden;
    animation: modal-in 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) both;
  }
  .modal-header {
    display: flex; justify-content: space-between; align-items: center;
    padding: 18px 20px;
    border-bottom: 1px solid rgba(255,255,255,0.06);
  }
  .modal-title { font-size: 16px; font-weight: 800; color: #fff; }
  .modal-close {
    width: 32px; height: 32px; border-radius: 50%;
    background: rgba(255,255,255,0.06); border: none;
    color: rgba(255,255,255,0.5); font-size: 16px;
    cursor: pointer; display: flex; align-items: center; justify-content: center;
    transition: all 0.2s;
  }
  .modal-close:hover { background: rgba(255,255,255,0.12); color: #fff; }
  .modal-body { padding: 20px; }
`;

function Modal({ open, onClose, title, children }) {
  if (!open) return null
  return (
    <>
      <style>{MODAL_STYLES}</style>
      <div className="modal-backdrop" onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
        <div className="modal-card">
          <div className="modal-header">
            <span className="modal-title">{title}</span>
            <button className="modal-close" onClick={onClose}>✕</button>
          </div>
          <div className="modal-body">{children}</div>
        </div>
      </div>
    </>
  )
}

export default function PlayerProfilePage() {
  const { player, handleLogout, handleAvatarChange, loadData } = usePlayer()
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedAvatar, setSelectedAvatar] = useState(player.avatar_id)
  const [username, setUsername] = useState(player.username || '')
  const [usernameMsg, setUsernameMsg] = useState({ text: '', type: '' })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (showEditModal) {
      setSelectedAvatar(player.avatar_id)
      setUsername(player.username || '')
      setUsernameMsg({ text: '', type: '' })
    }
  }, [showEditModal, player.avatar_id, player.username])

  const canChangeUsername = !player.username_changed_at || (() => {
    const last = new Date(player.username_changed_at)
    const now = new Date()
    return (now - last) / (1000 * 60 * 60 * 24) >= 30
  })()

  const daysUntilChange = player.username_changed_at ? (() => {
    const last = new Date(player.username_changed_at)
    const now = new Date()
    const days = Math.ceil(30 - (now - last) / (1000 * 60 * 60 * 24))
    return days > 0 ? days : 0
  })() : 0

  const onAvatarSelect = async (avatarId) => {
    setSelectedAvatar(avatarId)
    handleAvatarChange(avatarId)
    setShowEditModal(false)
  }

  const handleUsernameSave = async () => {
    if (!username.trim() || username.trim() === player.username) return
    setSaving(true)
    setUsernameMsg({ text: '', type: '' })
    try {
      const res = await api.put('/pauth/update-username', { username: username.trim() })
      if (res.data.success) {
        setUsernameMsg({ text: 'Username updated!', type: 'success' })
        loadData()
        setTimeout(() => setShowEditModal(false), 800)
      }
    } catch (err) {
      setUsernameMsg({ text: err.response?.data?.message || 'Failed to update', type: 'error' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fade-in" style={{ padding: '0 20px' }}>
      <div className="glass-card" style={{ padding: 32, textAlign: 'center', marginBottom: 24, cursor: 'pointer' }} onClick={() => setShowEditModal(true)}>
        <div style={{ position: 'relative', width: 80, height: 80, margin: '0 auto 16px' }}>
          <AvatarDisplay avatarId={player.avatar_id} size={80} style={{ border: '4px solid rgba(255,255,255,0.1)' }} />
          <div style={{
            position: 'absolute', bottom: -2, right: -2,
            width: 28, height: 28, borderRadius: '50%',
            background: 'linear-gradient(135deg, #2ecfb8, #1aaa96)',
            border: '2px solid #0d1f2d',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 12, color: '#0d1f2d', fontWeight: 800,
          }}>✎</div>
        </div>
        <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800 }}>{player.name}</h2>
        {player.username && (
          <div style={{ fontSize: 14, color: 'var(--neon-purple)', fontWeight: 700, marginTop: 2 }}>@{player.username}</div>
        )}

        <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
          <div style={{ flex: 1, padding: 12, background: 'rgba(255,255,255,0.03)', borderRadius: 16 }}>
            <div style={{ fontSize: 18, fontWeight: 800 }}>{player.pc_balance}</div>
            <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', fontWeight: 700 }}>Available PC</div>
          </div>
          <div style={{ flex: 1, padding: 12, background: 'rgba(255,255,255,0.03)', borderRadius: 16 }}>
            <div style={{ fontSize: 18, fontWeight: 800 }}>#42</div>
            <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', fontWeight: 700 }}>Global Rank</div>
          </div>
        </div>
      </div>

      <button className="btn-premium btn-desktop-auto" style={{ width: '100%', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(255, 255, 255, 0.2)', color: '#ef4444' }} onClick={handleLogout}>
        Logout Account
      </button>

      {/* Combined Edit Modal */}
      <Modal open={showEditModal} onClose={() => setShowEditModal(false)} title="Edit Profile">
        {/* Avatar Selection */}
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <div style={{ position: 'relative', width: 90, height: 90, margin: '0 auto 12px' }}>
            <AvatarDisplay avatarId={selectedAvatar} size={90} style={{ border: '3px solid rgba(255,255,255,0.1)' }} />
          </div>
          <AvatarGrid selected={selectedAvatar} onSelect={onAvatarSelect} size={70} />
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '0 0 20px' }} />

        {/* Username Section */}
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.6)', marginBottom: 8 }}>Username</div>
          {canChangeUsername ? (
            <>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)', fontWeight: 700, fontSize: 16, fontFamily: "'Outfit', sans-serif" }}>@</span>
                <input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder={player.username || 'choose_username'}
                  maxLength={20}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleUsernameSave() }}
                  style={{
                    width: '100%',
                    padding: '12px 16px 12px 34px',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 12,
                    color: '#fff',
                    fontSize: 15,
                    fontWeight: 700,
                    fontFamily: "'Outfit', sans-serif",
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
              <div style={{ marginTop: 6, fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>
                3-20 characters. Letters, numbers, underscores.
              </div>
              {usernameMsg.text && (
                <div style={{ marginTop: 6, fontSize: 12, fontWeight: 600, color: usernameMsg.type === 'success' ? '#22c55e' : '#ef4444' }}>
                  {usernameMsg.text}
                </div>
              )}
              {username.trim() && username.trim() !== player.username && (
                <button
                  onClick={handleUsernameSave}
                  disabled={saving}
                  style={{
                    width: '100%',
                    padding: '12px',
                    marginTop: 12,
                    background: 'linear-gradient(135deg, #7c3aed, #a855f7)',
                    border: 'none',
                    borderRadius: 12,
                    color: '#fff',
                    fontSize: 14,
                    fontWeight: 700,
                    cursor: 'pointer',
                    fontFamily: "'Outfit', sans-serif",
                  }}
                >
                  {saving ? 'Saving...' : 'Save Username'}
                </button>
              )}
            </>
          ) : (
            <div style={{
              padding: '12px 16px',
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: 12,
              fontSize: 15,
              fontWeight: 700,
              color: player.username ? '#fff' : 'rgba(255,255,255,0.3)',
            }}>
              {player.username ? `@${player.username}` : 'No username set'}
            </div>
          )}
          {!canChangeUsername && (
            <div style={{ marginTop: 8, fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>
              Username change available in {daysUntilChange} day{daysUntilChange !== 1 ? 's' : ''}
            </div>
          )}
        </div>
      </Modal>
    </div>
  )
}
