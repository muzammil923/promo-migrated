export function ErrorUI({ message, onRetry }) {
  return (
    <div style={{ minHeight: '100vh', background: '#0f0720', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 24, padding: 40, textAlign: 'center' }}>
      <div style={{ fontSize: 64 }}>⚠️</div>
      <div style={{ maxWidth: 300 }}>
        <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 8 }}>Data Loading Failed</div>
        <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', lineHeight: 1.5 }}>{message}</div>
      </div>
      <button className="btn-premium" onClick={onRetry} style={{ minWidth: 160 }}>
        🔄 Try Again
      </button>
    </div>
  )
}

export function WalletHero({ balance, city, onPlayMore }) {
  const ppMax = 2000;
  const ppPct = Math.min((balance / ppMax) * 100, 100);
  const radius = 60;
  const circ = 2 * Math.PI * radius;
  const dash = (ppPct / 100) * circ;

  return (
    <div className="glass-card" style={{ margin: '0 20px 24px', padding: '28px 24px', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: -30, right: -20, fontSize: 100, opacity: 0.05 }} className="animate-float">💎</div>
      <div style={{ position: 'absolute', bottom: -40, left: -20, width: 120, height: 120, background: 'rgba(168, 85, 247, 0.1)', filter: 'blur(40px)', borderRadius: '50%' }} />

      <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <svg width={130} height={130} style={{ transform: 'rotate(-90deg)' }}>
            <circle cx={65} cy={65} r={radius} fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth={8} />
            <circle cx={65} cy={65} r={radius} fill="none" stroke="url(#wallet-grad)" strokeWidth={8} strokeLinecap="round" strokeDasharray={`${dash} ${circ - dash}`} style={{ transition: 'stroke-dasharray 1.5s cubic-bezier(0.4, 0, 0.2, 1)' }} />
            <defs>
              <linearGradient id="wallet-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#7c3aed" /><stop offset="100%" stopColor="#a855f7" />
              </linearGradient>
            </defs>
          </svg>
          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', textAlign: 'center' }}>
            <div style={{ fontSize: 24, fontWeight: 800 }}>{balance}</div>
            <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: 1.5, fontWeight: 700 }}>PC</div>
          </div>
        </div>

        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--neon-purple)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>Balance</div>
          <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 2 }}>Promo Coins</div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', display: 'flex', alignItems: 'center', gap: 4 }}>
            <span>📍</span> {city || 'Bangalore'}
          </div>

          <div style={{ marginTop: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, marginBottom: 6, fontWeight: 600 }}>
              <span style={{ color: 'rgba(255,255,255,0.6)' }}>Level 5 Explorer</span>
              <span className="neon-text">{Math.round(ppPct)}% to LVL 6</span>
            </div>
            <div style={{ height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 10, overflow: 'hidden' }}>
              <div style={{ width: `${ppPct}%`, height: '100%', background: 'linear-gradient(90deg, #7c3aed, #a855f7)', borderRadius: 10, boxShadow: '0 0 12px rgba(168, 85, 247, 0.4)' }} />
            </div>
          </div>
        </div>
      </div>

      <button className="btn-premium btn-desktop-auto" style={{ width: '100%', marginTop: 24, fontSize: 14 }} onClick={onPlayMore}>
        🕹️ Play & Earn More
      </button>
    </div>
  )
}

export function QuickStat({ icon, label, value }) {
  return (
    <div className="glass-card" style={{ padding: '16px 14px', display: 'flex', flexDirection: 'column', gap: 6, position: 'relative', overflow: 'hidden' }}>
      <div style={{ fontSize: 20, marginBottom: 2 }}>{icon}</div>
      <div>
        <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', fontWeight: 800, letterSpacing: 0.5 }}>{label}</div>
        <div style={{ fontSize: 16, fontWeight: 800, marginTop: 1 }}>{value}</div>
      </div>
      <div style={{ position: 'absolute', bottom: -10, right: -10, fontSize: 32, opacity: 0.03 }}>{icon}</div>
    </div>
  )
}

export function DailyStreak({ days }) {
  return (
    <div className="glass-card" style={{ margin: '0 20px 16px', padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', opacity: 0.8 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{ fontSize: 32, filter: 'drop-shadow(0 0 10px rgba(245,158,11,0.5))', opacity: 0.5 }} className="animate-float">🔥</div>
        <div>
          <div style={{ fontSize: 16, fontWeight: 800 }}>Daily Streak</div>
          <div style={{ fontSize: 12, color: 'var(--neon-purple)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>Coming soon...</div>
        </div>
      </div>
      <div style={{ textAlign: 'right', opacity: 0.3 }}>
        <div style={{ fontSize: 18, fontWeight: 800, color: '#f59e0b' }}>0 Days</div>
        <div style={{ display: 'flex', gap: 5, marginTop: 6 }}>
          {[1,2,3,4,5,6,7].map(i => (
            <div key={i} style={{ width: 5, height: 5, borderRadius: '50%', background: 'rgba(255,255,255,0.1)' }} />
          ))}
        </div>
      </div>
    </div>
  )
}

export function WeeklyChallenge({ progress, total, reward }) {
  return (
    <div className="glass-card" style={{ margin: '0 20px 24px', padding: '20px', opacity: 0.8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
        <div style={{ display: 'flex', gap: 12 }}>
          <div style={{ fontSize: 24, filter: 'drop-shadow(0 0 8px rgba(168, 85, 247, 0.5))', opacity: 0.5 }}>🎯</div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 800 }}>Weekly Challenge</div>
            <div style={{ fontSize: 12, color: 'var(--neon-purple)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>Coming soon...</div>
          </div>
        </div>
      </div>
      <div style={{ height: 8, background: 'rgba(255,255,255,0.05)', borderRadius: 10, overflow: 'hidden', position: 'relative', opacity: 0.3 }}>
        <div style={{ width: `0%`, height: '100%', background: 'linear-gradient(90deg, #7c3aed, #a855f7)', borderRadius: 10 }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, marginTop: 10, color: 'rgba(255,255,255,0.3)', fontWeight: 600 }}>
        <span>New challenges arriving weekly</span>
        <span>0/5 Done</span>
      </div>
    </div>
  )
}

export function RecentActivity({ txs, onBrowseGames }) {
  return (
    <div className="glass-card" style={{ margin: '0 20px 24px', padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800 }}>Recent Activity</h3>
        <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--neon-purple)', textTransform: 'uppercase' }}>History</span>
      </div>
      {txs.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '10px 0' }}>
          <div style={{ fontSize: 56, marginBottom: 12, filter: 'grayscale(0.5) opacity(0.5)' }}>🎮</div>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'rgba(255,255,255,0.5)', marginBottom: 20 }}>Ready for your first win?</div>
          <button className="btn-premium" style={{ background: 'rgba(255,255,255,0.03)', border: '1.5px solid var(--neon-purple)', color: '#fff', width: '100%' }} onClick={onBrowseGames}>Browse Games</button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {txs.slice(0, 3).map(tx => (
            <div key={tx.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <div style={{ width: 42, height: 42, borderRadius: 14, background: tx.type === 'earn' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
                  {tx.type === 'earn' ? '💰' : '🎁'}
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, letterSpacing: -0.2 }}>{tx.note || (tx.game_name ? `Win: ${tx.game_name}` : 'Reward')}</div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 1 }}>{new Date(tx.created_at).toLocaleDateString(undefined, { month:'short', day:'numeric' })}</div>
                </div>
              </div>
              <div style={{ fontWeight: 800, fontSize: 15, color: tx.type === 'earn' ? '#22c55e' : '#ef4444' }}>
                {tx.type === 'earn' ? '+' : '-'}{tx.points}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export function AchievementCard({ title, icon, unlocked }) {
  return (
    <div className="glass-card" style={{
      minWidth: 140, padding: '24px 16px', textAlign: 'center',
      opacity: unlocked ? 1 : 0.4,
      filter: unlocked ? 'none' : 'grayscale(0.8) blur(0.5px)',
      border: unlocked ? '1px solid rgba(168, 85, 247, 0.4)' : '1px solid var(--glass-border)',
      boxShadow: unlocked ? '0 0 24px rgba(168, 85, 247, 0.2)' : 'none',
      transition: 'all 0.3s ease'
    }}>
      <div style={{ fontSize: 40, marginBottom: 14 }} className={unlocked ? "animate-float" : ""}>{icon}</div>
      <div style={{ fontSize: 12, fontWeight: 800, lineHeight: 1.3, marginBottom: 4 }}>{title}</div>
      <div style={{ fontSize: 9, color: unlocked ? 'var(--neon-purple)' : 'rgba(255,255,255,0.3)', fontWeight: 700, textTransform: 'uppercase' }}>{unlocked ? 'Collected' : 'Locked'}</div>
    </div>
  )
}

export function RewardCard({ brand, title, cost, logo, onClaim }) {
  return (
    <div className="glass-card" style={{ minWidth: 220, padding: '18px', position: 'relative', overflow: 'hidden' }}>
      <div style={{ width: '100%', height: 110, borderRadius: 20, background: 'linear-gradient(135deg, rgba(255,255,255,0.05), rgba(255,255,255,0.01))', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
        <span style={{ fontSize: 44, filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.2))' }}>{logo}</span>
      </div>
      <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--neon-purple)', textTransform: 'uppercase', letterSpacing: 0.5 }}>{brand}</div>
      <div style={{ fontSize: 15, fontWeight: 800, margin: '3px 0 14px', letterSpacing: -0.3 }}>{title}</div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: 14, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ fontSize: 12 }}>💎</span> {cost} <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>PC</span>
        </div>
        <button onClick={onClaim} style={{ background: 'rgba(168, 85, 247, 0.15)', border: '1px solid rgba(168, 85, 247, 0.3)', color: '#fff', padding: '6px 14px', borderRadius: 12, fontSize: 11, fontWeight: 800 }}>Redeem</button>
      </div>
    </div>
  )
}

export function RedesignGameCard({ game, onPlay, pcAmount, index, username }) {
  const hasLogo = Boolean(game.game_logo_url);
  const gameImg = game.game_logo_url || game.bg_image_url;

  const handleShare = (e) => {
    e.stopPropagation()
    const host = window.location.origin
    const slug = game.slug || ''
    const clientSlug = game.client_slug || ''
    const utm = username ? `?utm_source=@${username}` : ''
    const url = `${host}/play/${slug}/${clientSlug}${utm}`
    if (navigator.share) {
      navigator.share({ title: game.name, url })
    } else {
      navigator.clipboard.writeText(url)
    }
  }

  return (
    <div className="premium-game-card" onClick={() => onPlay(game)}>
      <div className="card-index-number">{index + 1}</div>
      <div className="reward-badge">+{pcAmount} PC</div>
      <div className="category-pill">{game.category || 'Arcade'}</div>

      {username && (
        <button className="share-btn" onClick={handleShare} title="Share game">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
        </button>
      )}

      <div className={`image-container${hasLogo ? ' logo-container' : ''}`}>
        {gameImg ? (
          <img src={gameImg} alt={game.name} className={`game-image${hasLogo ? ' logo-image' : ''}`} />
        ) : (
          <div className="card-overlay" />
        )}
      </div>

      <div className="content">
        <div className="game-title">{game.name}</div>
        <div className="metadata">
          <div className="meta-item"><span>💎</span> +{pcAmount} PC</div>
          <div className="meta-item"><span>🎮</span> {game.category?.toUpperCase() || 'ARCADE'}</div>
        </div>
      </div>
    </div>
  )
}
