import { usePlayer } from './PlayerLayout'
import { RedesignGameCard } from '../components/DashboardSharedComponents'

export default function PlayerGamesPage() {
  const { games, setActiveGame, player } = usePlayer()
  const username = player?.username

  return (
    <div className="fade-in" style={{ padding: '0 20px' }}>
      <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 4 }}>Play & Earn</h2>
      <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14, marginBottom: 24, fontWeight: 500 }}>Choose a challenge and stack those coins</p>

      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <div style={{ width: 4, height: 16, background: 'var(--neon-purple)', borderRadius: 4 }} />
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800 }}>Branded Challenges</h3>
        </div>
        {games.branded.length === 0 ? (
          <div className="glass-card" style={{ padding: 24, textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>Coming soon...</div>
        ) : (
          <div className="game-card-grid">
            {games.branded.map((g, i) => <RedesignGameCard key={g.id} game={g} onPlay={setActiveGame} pcAmount={50} index={i} username={username} />)}
          </div>
        )}
      </div>

      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <div style={{ width: 4, height: 16, background: 'var(--neon-purple)', borderRadius: 4 }} />
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800 }}>Quick Games</h3>
        </div>
        <div className="game-card-grid">
          {games.promogames.map((g, i) => <RedesignGameCard key={g.id} game={g} onPlay={setActiveGame} pcAmount={10} index={i} username={username} />)}
        </div>
      </div>
    </div>
  )
}
