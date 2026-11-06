import { useState, useEffect, createContext, useContext } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import api from '../api'
import GameModal from '../components/GameModal'
import PlayerNavbar from '../components/PlayerNavbar'
import { DASHBOARD_STYLES } from './PlayerDashboardStyles'
import { ErrorUI } from '../components/DashboardSharedComponents'

const PlayerContext = createContext(null)
export function usePlayer() { return useContext(PlayerContext) }

function getToken() {
  return localStorage.getItem('playerToken') || sessionStorage.getItem('playerToken')
}

export default function PlayerLayout() {
  const navigate = useNavigate()
  const [player, setPlayer] = useState(null)
  const [txs, setTxs] = useState([])
  const [games, setGames] = useState({ promogames: [], branded: [] })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeGame, setActiveGame] = useState(null)

  useEffect(() => {
    const styleEl = document.createElement('style')
    styleEl.innerHTML = DASHBOARD_STYLES
    document.head.appendChild(styleEl)

    const stored = localStorage.getItem('playerUser') || sessionStorage.getItem('playerUser')
    if (!stored) { navigate('/login'); return }

    try {
      const initialPlayer = JSON.parse(stored)
      setPlayer(initialPlayer)
      if (initialPlayer) loadData()
    } catch (e) {
      console.error('Failed to parse stored user:', e)
      navigate('/login')
    }

    return () => { document.head.removeChild(styleEl) }
  }, [])

  const loadData = async () => {
    setError(null)
    setLoading(true)
    try {
      const meRes = await api.get('/pauth/me')
      setPlayer(meRes.data.player)

      const txRes = await api.get('/pauth/transactions')
      setTxs(txRes.data.transactions || [])

      const gamesRes = await api.get('/play/dashboard-games')
      setGames(gamesRes.data.games || { promogames: [], branded: [] })
    } catch (err) {
      const status = err.response?.status
      const errorMsg = err.response?.data?.message || err.message || 'Unknown error occurred'
      if (status === 401 || status === 403) return
      setError(`Error ${status || ''}: ${errorMsg}`)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('playerToken')
    localStorage.removeItem('playerUser')
    sessionStorage.removeItem('playerToken')
    sessionStorage.removeItem('playerUser')
    navigate('/login')
  }

  const handleAvatarChange = (avatarId) => {
    const updated = { ...player, avatar_id: avatarId }
    setPlayer(updated)
    const storage = localStorage.getItem('playerUser') ? localStorage : sessionStorage
    storage.setItem('playerUser', JSON.stringify(updated))
    window.dispatchEvent(new Event('player-updated'))
  }

  const handleCloseGame = () => {
    setActiveGame(null)
    loadData()
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#0f0720', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 20 }}>
      <div className="animate-pulse-glow" style={{ fontSize: 56 }}>💎</div>
      <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--neon-purple)', textTransform: 'uppercase', letterSpacing: 2 }}>Loading Engine...</div>
    </div>
  )

  if (error) return <ErrorUI message={error} onRetry={loadData} />
  if (!player) return null

  const ctx = {
    player, txs, games, loadData, handleLogout, handleAvatarChange,
    activeGame, setActiveGame, handleCloseGame,
  }

  return (
    <PlayerContext.Provider value={ctx}>
      <div style={{ minHeight: '100vh', paddingTop: 110, position: 'relative' }}>
        <div style={{ position: 'fixed', inset: 0, background: 'radial-gradient(circle at 50% -20%, #2e1065, #0f0720)', zIndex: -1 }} />
        <div style={{ position: 'fixed', top: '5%', right: '-10%', width: '70%', height: '70%', background: 'radial-gradient(circle, rgba(124, 58, 237, 0.1), transparent 70%)', zIndex: -1 }} className="animate-pulse-glow" />
        <div style={{ position: 'fixed', bottom: '10%', left: '-10%', width: '60%', height: '60%', background: 'radial-gradient(circle, rgba(168, 85, 247, 0.08), transparent 70%)', zIndex: -1 }} className="animate-pulse-glow" />
        <div style={{ position: 'fixed', inset: 0, opacity: 0.1, pointerEvents: 'none', zIndex: -1, background: 'linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

        <PlayerNavbar />

        {/* Profile-completion nudge for instant-signup accounts */}
        {player?.profile_complete === 0 && !player?.nudge_dismissed && (
          <div style={{
            maxWidth: 1100, margin: '0 auto 8px', padding: '12px 18px',
            display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap',
            background: 'linear-gradient(90deg, rgba(146,16,246,0.16), rgba(97,4,151,0.10))',
            border: '1px solid rgba(146,16,246,0.35)', borderRadius: 14,
            fontFamily: "'DM Sans', sans-serif",
          }}>
            <span style={{ fontSize: 18 }}>🪪</span>
            <span style={{ flex: 1, minWidth: 200, fontSize: 13.5, color: 'rgba(255,255,255,0.85)' }}>
              Finish setting up your profile — pick a username so friends can find you and you can earn referral coins.
            </span>
            <button
              onClick={() => navigate('/player/profile')}
              style={{ padding: '8px 18px', borderRadius: 100, border: 'none', cursor: 'pointer',
                background: 'linear-gradient(135deg,#9210f6,#610497)', color: '#fff',
                fontSize: 12.5, fontWeight: 700 }}
            >Complete profile</button>
            <button onClick={() => setPlayer(p => ({ ...p, nudge_dismissed: true }))} aria-label="Dismiss"
              style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.45)', fontSize: 15, cursor: 'pointer', padding: 4 }}>✕</button>
          </div>
        )}

        <Outlet />

        {activeGame && (
          <GameModal
            game={activeGame}
            allGames={[...(games.branded || []), ...(games.promogames || [])]}
            onClose={handleCloseGame}
            onSwitch={setActiveGame}
            isLoggedIn={!!getToken()}
          />
        )}
      </div>
    </PlayerContext.Provider>
  )
}
