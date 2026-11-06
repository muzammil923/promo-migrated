import { useState, useEffect, useMemo } from 'react'
import PlayerNavbar from '../components/PlayerNavbar'
import { AvatarDisplay } from '../components/AvatarData'
import LogoLoader from '../components/LogoLoader'

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}

.lb-page {
  min-height: 100vh;
  background: radial-gradient(ellipse at 50% -10%, #2a1a4e 0%, #171030 42%, #0b0917 100%);
  font-family: 'Outfit', sans-serif;
  color: #fff;
  padding: 108px 24px 64px;
  overflow: hidden;
  position: relative;
}
/* ambient gradient lighting */
.lb-page::before{
  content:''; position: fixed; top:-25%; left:-12%; width: 62vw; height: 62vw;
  background: radial-gradient(circle, rgba(124,58,237,0.18), transparent 62%);
  pointer-events:none; z-index:0;
}
.lb-page::after{
  content:''; position: fixed; bottom:-22%; right:-12%; width: 56vw; height: 56vw;
  background: radial-gradient(circle, rgba(59,130,246,0.12), transparent 62%);
  pointer-events:none; z-index:0;
}
.lb-inner{ position: relative; z-index: 1; max-width: 1000px; margin: 0 auto; }

/* ── Podium ── */
.lb-podium{
  max-width: 820px;
  margin: 34px auto 40px;
  display: grid;
  grid-template-columns: 1fr 1.18fr 1fr;
  align-items: end;
  gap: 18px;
  padding: 30px 0 0;
}
.lb-pod{
  position: relative;
  border-radius: 18px;
  padding: 28px 16px 20px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  --lift: 0px;
  transition: box-shadow .3s ease, border-color .3s ease;
  animation: lbFadeUp .5s ease both;
}
@keyframes lbFadeUp{
  from{ opacity: 0; transform: translateY(calc(var(--lift, 0px) + 18px)); }
  to{   opacity: 1; transform: translateY(var(--lift, 0px)); }
}
.lb-pod.second{ animation-delay: .08s; }
.lb-pod.first{ animation-delay: 0s; }
.lb-pod.third{ animation-delay: .16s; }

.lb-pod.second, .lb-pod.third{
  background: #13122c;
  border: 1px solid rgba(255,255,255,0.07);
}
.lb-pod.second:hover, .lb-pod.third:hover{
  --lift: -5px;
  border-color: rgba(255,255,255,0.16);
}
.lb-pod.first{
  --lift: -16px;
  background: linear-gradient(180deg, rgba(245,166,35,0.10) 0%, rgba(19,18,44,0.55) 48%, #13122c 100%);
  border: 1.5px solid rgba(245,166,35,0.55);
  box-shadow:
    0 0 0 1px rgba(245,166,35,0.14),
    0 0 44px rgba(245,166,35,0.14),
    0 14px 44px rgba(0,0,0,0.35);
  padding-top: 44px;
  min-height: 300px;
}
.lb-pod.first:hover{
  --lift: -21px;
  box-shadow:
    0 0 0 1px rgba(245,166,35,0.2),
    0 0 60px rgba(245,166,35,0.22),
    0 18px 50px rgba(0,0,0,0.4);
}

/* crown above champion — gentle bob + glow pulse (loops) */
.lb-crown{
  position: absolute;
  top: -24px; left: 50%;
  transform: translateX(-50%);
  width: 48px; height: 48px;
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  color: #fde68a;
  background: radial-gradient(circle at 32% 28%, #fde68a, #f59e0b 58%, #b45309);
  box-shadow: 0 0 0 4px rgba(11,9,23,0.95), 0 0 26px rgba(245,166,35,0.65);
  z-index: 3;
  animation: lbCrownBob 3.6s ease-in-out .45s infinite;
}
@keyframes lbCrownBob{
  0%,100%{
    transform: translateX(-50%) translateY(0);
    box-shadow: 0 0 0 4px rgba(11,9,23,0.95), 0 0 26px rgba(245,166,35,0.65);
  }
  50%{
    transform: translateX(-50%) translateY(-4px);
    box-shadow: 0 0 0 4px rgba(11,9,23,0.95), 0 0 42px rgba(245,166,35,0.95);
  }
}

/* warm aura breathing behind the champion card */
.lb-pod.first::before{
  content: '';
  position: absolute;
  inset: -6px;
  border-radius: 24px;
  background: radial-gradient(62% 48% at 50% -4%, rgba(245,166,35,0.32), rgba(245,166,35,0) 70%);
  filter: blur(10px);
  pointer-events: none;
  z-index: -1;
  animation: lbChampionAura 3.6s ease-in-out .45s infinite;
}
@keyframes lbChampionAura{
  0%,100%{ opacity: .5; }
  50%{ opacity: 1; }
}

/* avatar rings — heartbeat pulse + breathing glow (loops, staggered) */
.lb-pod-avatar{
  --g: 139,92,246; /* default glow: purple */
  width: 72px; height: 72px;
  border-radius: 50%;
  padding: 3px;
  background: #0b0917;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
  animation: lbAvatarPulse 3.6s ease-in-out infinite;
}
@keyframes lbAvatarPulse{
  0%,100%{
    transform: scale(1);
    box-shadow: 0 0 0 3px rgba(var(--g),0.4), 0 0 20px rgba(var(--g),0.4);
  }
  50%{
    transform: scale(1.06);
    box-shadow: 0 0 0 4px rgba(var(--g),0.75), 0 0 34px rgba(var(--g),0.65);
  }
}
.lb-pod.first .lb-pod-avatar{
  --g: 245,166,35; /* gold */
  width: 84px; height: 84px;
  box-shadow:
    0 0 0 3px rgba(245,166,35,0.5),
    0 0 24px rgba(245,166,35,0.55),
    0 0 74px rgba(245,166,35,0.28);
  animation-delay: .45s;
}
.lb-pod.second .lb-pod-avatar{
  box-shadow:
    0 0 0 3px rgba(139,92,246,0.45),
    0 0 22px rgba(139,92,246,0.45);
  animation-delay: 0s;
}
.lb-pod.third .lb-pod-avatar{
  --g: 236,72,153; /* pink */
  box-shadow:
    0 0 0 3px rgba(236,72,153,0.45),
    0 0 22px rgba(236,72,153,0.4);
  animation-delay: .9s;
}

.lb-pod-name{
  font-size: 14px; font-weight: 700; color: #fff;
  max-width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  margin-top: 2px;
}
.lb-pod.first .lb-pod-name{ font-size: 18px; }

/* tier pill (shared with table) */
.lb-tier{
  display: inline-flex; align-items: center; gap: 5px;
  padding: 4px 12px;
  border-radius: 999px;
  font-size: 12px; font-weight: 700; letter-spacing: .02em;
  white-space: nowrap;
}

.lb-score{
  display: flex; align-items: center; gap: 6px;
  font-size: 15px; font-weight: 800;
  margin-top: 2px;
}
.lb-score .pts{ color: #fff; font-variant-numeric: tabular-nums; }
.lb-score .pc{ font-size: 12px; font-weight: 700; letter-spacing: .02em; }
.lb-pod.second .lb-score .pc, .lb-pod.third .lb-score .pc{ color: #60a5fa; }
.lb-pod.first .lb-score .pc{ color: #fbbf24; }

.lb-streak{
  display: flex; align-items: center; gap: 6px;
}
.lb-streak .flame{ color: #fb923c; display: inline-flex; }
.lb-streak .num{
  color: #f97316; font-weight: 800; font-size: 15px;
  font-variant-numeric: tabular-nums;
}
.lb-streak .lbl{
  color: rgba(255,255,255,0.45); font-size: 12px; font-weight: 600;
}

/* ── Table ── */
.lb-table-wrap{
  background: rgba(13,12,26,0.72);
  border: 1px solid rgba(168,85,247,0.24);
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 22px 60px rgba(0,0,0,0.38);
  animation: lbFadeUp .55s ease .2s both;
}
.lb-table{ width: 100%; border-collapse: collapse; }
.lb-table th{
  padding: 16px 22px;
  text-align: left;
  font-size: 11px; font-weight: 700;
  color: rgba(255,255,255,0.35);
  text-transform: uppercase;
  letter-spacing: 1.5px;
  border-bottom: 1px solid rgba(168,85,247,0.16);
  background: rgba(168,85,247,0.05);
  white-space: nowrap;
}
.lb-table td{
  padding: 14px 22px;
  font-size: 14px;
  border-bottom: 1px solid rgba(255,255,255,0.04);
  vertical-align: middle;
}
/* tier badges — centered in their column */
.lb-table th.lb-tier-head,
.lb-table td.lb-tier-cell{
  text-align: center;
}
.lb-table tbody tr{ transition: background .2s ease; }
.lb-table tbody tr:hover{ background: rgba(255,255,255,0.035); }
.lb-table tbody tr:last-child td{ border-bottom: none; }

/* "YOU" row — glowing purple outline + tint */
.lb-table tbody tr.me td{
  background: rgba(168,85,247,0.09);
  box-shadow: inset 0 0 0 1px rgba(168,85,247,0.5);
}
.lb-table tbody tr.me:hover td{ background: rgba(168,85,247,0.13); }
.lb-table tbody tr.me td:first-child{
  box-shadow: inset 3px 0 0 0 #a855f7, inset 0 0 0 1px rgba(168,85,247,0.5);
}
.lb-rank{
  font-weight: 800; color: rgba(255,255,255,0.55);
  width: 72px; font-variant-numeric: tabular-nums;
}
.lb-player{ display: flex; align-items: center; gap: 11px; }
.lb-player-avatar{
  width: 38px; height: 38px; border-radius: 50%;
  padding: 2px; background: #0b0917;
  border: 1px solid rgba(255,255,255,0.08);
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.lb-player-name{ font-weight: 700; color: #fff; }
.lb-you{
  padding: 2px 9px; border-radius: 7px;
  background: rgba(168,85,247,0.2);
  border: 1px solid rgba(168,85,247,0.55);
  color: #d8b4fe; font-size: 10px; font-weight: 800; letter-spacing: .7px;
  flex-shrink: 0;
}
.lb-rate{
  color: #4ade80; font-weight: 800;
  font-variant-numeric: tabular-nums;
}

/* ── Pagination ── */
.lb-pagination{
  margin: 20px auto 0;
  display: flex; align-items: center; justify-content: center;
  gap: 14px; flex-wrap: wrap;
  font-size: 13px; font-weight: 600; color: rgba(255,255,255,0.4);
}
.lb-page-btn{
  width: 34px; height: 34px;
  border-radius: 10px;
  border: 1px solid rgba(255,255,255,0.08);
  background: rgba(255,255,255,0.04);
  color: rgba(255,255,255,0.55);
  font-size: 13px; font-weight: 700;
  font-family: 'Outfit', sans-serif;
  cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  transition: all .2s ease;
}
.lb-page-btn:hover{ background: rgba(255,255,255,0.09); color: #fff; }
.lb-page-btn.active{
  background: linear-gradient(135deg, #7c3aed, #a855f7);
  color: #fff; border-color: transparent;
  box-shadow: 0 4px 16px rgba(168,85,247,0.35);
}
.lb-page-btn:disabled{ opacity: 0.3; cursor: not-allowed; }

/* ── Loading / Empty ── */
.lb-loading{
  display: flex; flex-direction: column; align-items: center; gap: 16px;
  padding: 90px 0;
}

.lb-empty{ text-align: center; padding: 90px 20px; max-width: 420px; margin: 0 auto; }
.lb-empty-icon{
  width: 84px; height: 84px; margin: 0 auto 20px;
  background: rgba(168,85,247,0.1);
  border: 1px solid rgba(168,85,247,0.25);
  border-radius: 22px;
  display: flex; align-items: center; justify-content: center;
}
.lb-empty h3{ font-size: 21px; font-weight: 800; margin-bottom: 8px; }
.lb-empty p{ color: rgba(255,255,255,0.4); font-size: 14px; margin-bottom: 26px; }
.lb-play-btn{
  display: inline-flex; align-items: center; gap: 8px;
  padding: 12px 26px;
  background: linear-gradient(135deg, #7c3aed, #a855f7);
  border: none; border-radius: 12px;
  color: #fff; font-size: 14px; font-weight: 700;
  font-family: 'Outfit', sans-serif; cursor: pointer; text-decoration: none;
  transition: all .2s ease;
  box-shadow: 0 6px 22px rgba(168,85,247,0.35);
}
.lb-play-btn:hover{ opacity: .88; transform: translateY(-2px); }

/* ── Reduced motion: kill the looping micro-animations ── */
@media (prefers-reduced-motion: reduce){
  .lb-crown, .lb-pod-avatar, .lb-pod.first::before{ animation: none; }
}

/* ── Mobile ── */
@media (max-width: 768px) {
  .lb-page{ padding: 104px 12px 44px; }
  .lb-podium{ grid-template-columns: 1fr 1.08fr 1fr; gap: 8px; margin: 24px auto 34px; padding: 26px 0 0; }
  .lb-pod{ padding: 26px 8px 16px; gap: 7px; border-radius: 14px; }
  .lb-pod.first{ --lift: -10px; padding-top: 40px; min-height: 270px; }
  .lb-pod.first:hover{ --lift: -13px; }
  .lb-crown{ width: 42px; height: 42px; top: -21px; }
  .lb-pod-avatar{ width: 58px; height: 58px; }
  .lb-pod.first .lb-pod-avatar{ width: 66px; height: 66px; }
  .lb-pod-name{ font-size: 12px; }
  .lb-pod.first .lb-pod-name{ font-size: 15px; }
  .lb-score{ font-size: 13px; }
  .lb-tier{ font-size: 10px; padding: 3px 9px; }
  .lb-streak .num{ font-size: 13px; }
  .lb-table-wrap{ overflow-x: auto; }
  .lb-table{ min-width: 620px; }
}
`

/* ── Tier ladder — assigned by rank (rank = PC balance order) ────────────── */
const TIER_SEQUENCE = [
  { name: 'Legend',       icon: '🏆', color: '#fbbf24' }, // #1
  { name: 'Diamond I',    icon: '◇',  color: '#2dd4bf' }, // #2
  { name: 'Diamond II',   icon: '◇',  color: '#2dd4bf' }, // #3
  { name: 'Diamond III',  icon: '◇',  color: '#2dd4bf' }, // #4
  { name: 'Master I',     icon: '🛡', color: '#c4b5fd' }, // #5
  { name: 'Master II',    icon: '🛡', color: '#c4b5fd' }, // #6
  { name: 'Master III',   icon: '🛡', color: '#c4b5fd' }, // #7
  { name: 'Platinum I',   icon: '♜',  color: '#4ade80' }, // #8
  { name: 'Platinum II',  icon: '♜',  color: '#4ade80' }, // #9
  { name: 'Platinum III', icon: '♜',  color: '#4ade80' }, // #10
  { name: 'Gold I',       icon: 'O',  color: '#fb923c' }, // #11
  { name: 'Gold II',      icon: 'O',  color: '#fb923c' }, // #12
  { name: 'Gold III',     icon: 'O',  color: '#fb923c' }, // #13
  { name: 'Silver I',     icon: 'S',  color: '#cbd5e1' }, // #14
  { name: 'Silver II',    icon: 'S',  color: '#cbd5e1' }, // #15
  { name: 'Silver III',   icon: 'S',  color: '#cbd5e1' }, // #16
  { name: 'Bronze I',     icon: 'B',  color: '#d97706' }, // #17
  { name: 'Bronze II',    icon: 'B',  color: '#d97706' }, // #18
  { name: 'Bronze III',   icon: 'B',  color: '#d97706' }, // #19+
]

/* Higher rank (higher PC balance) always means a better tier */
function getTier(rank) {
  return TIER_SEQUENCE[Math.min(Math.max((rank || 1) - 1, 0), TIER_SEQUENCE.length - 1)]
}

function rgba(hex, a) {
  const n = parseInt(hex.slice(1), 16)
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`
}

function tierPillStyle(t) {
  return {
    color: t.color,
    background: rgba(t.color, 0.13),
    border: `1px solid ${rgba(t.color, 0.4)}`,
  }
}

/* ── Icons ── */
function StarIcon({ color = 'currentColor', size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color} aria-hidden="true">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  )
}
function FlameIcon({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
    </svg>
  )
}
function CrownIcon({ size = 24 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M3 7l3.8 5L12 4l5.2 8L21 7v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z" />
    </svg>
  )
}

const PER_PAGE = 10

export default function LeaderboardPage() {
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [currentUser, setCurrentUser] = useState(null)

  useEffect(() => {
    const stored = localStorage.getItem('playerUser') || sessionStorage.getItem('playerUser')
    if (stored) { try { setCurrentUser(JSON.parse(stored)) } catch {} }
  }, [])

  useEffect(() => {
    fetch('/api/leaderboard')
      .then(r => r.json())
      .then(d => { if (d.success) setEntries(d.entries || []) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const sorted = useMemo(
    () => [...entries].sort((a, b) => (b.total_pc || 0) - (a.total_pc || 0)),
    [entries]
  )

  const top3 = sorted.slice(0, 3)
  const rest = sorted.slice(3)
  const totalPages = Math.max(1, Math.ceil(rest.length / PER_PAGE))
  const paginated = rest.slice((page - 1) * PER_PAGE, page * PER_PAGE)

  const isMe = entry =>
    currentUser && (entry.id === currentUser.id || (currentUser.email && entry.email === currentUser.email))

  /* Podium order: 2nd, 1st, 3rd (a lone leader takes the champion slot) */
  const podiumEntries = top3.length === 1 ? [top3[0]] : [top3[1], top3[0], top3[2]].filter(Boolean)
  const podium = podiumEntries.map((entry, i) => ({
    entry,
    cls: top3.length === 1 ? 'first' : ['second', 'first', 'third'][i],
  }))

  const startRank = (page - 1) * PER_PAGE + 4
  const endRank = Math.min(page * PER_PAGE + 3, sorted.length)

  return (
    <>
      <style>{CSS}</style>
      <div className="lb-page">
        <PlayerNavbar />
        <div className="lb-inner">
          {loading ? (
            <div className="lb-loading">
              <LogoLoader size={42} />
              <div style={{ fontSize: 13, fontWeight: 700, color: 'rgba(168,85,247,0.5)', letterSpacing: 2 }}>LOADING...</div>
            </div>
          ) : sorted.length === 0 ? (
            <div className="lb-empty">
              <div className="lb-empty-icon">
                <CrownIcon size={36} />
              </div>
              <h3>No Rankings Yet</h3>
              <p>Play games to become the first champion.</p>
              <a href="/arcade" className="lb-play-btn">Play Now</a>
            </div>
          ) : (
            <>
              {/* Podium */}
              {podium.length > 0 && (
                <div className="lb-podium">
                  {podium.map(({ entry, cls }) => {
                    const tier = getTier(entry.rank)
                    const first = cls === 'first'
                    return (
                      <div key={entry.id} className={`lb-pod ${cls}`}>
                        {first && (
                          <div className="lb-crown"><CrownIcon size={24} /></div>
                        )}
                        <div className="lb-pod-avatar">
                          <AvatarDisplay avatarId={entry.avatar_id} size={first ? 76 : 64} style={{ border: 'none', borderRadius: '50%' }} />
                        </div>
                        <div className="lb-pod-name">{entry.player_name}</div>
                        <span className="lb-tier" style={tierPillStyle(tier)}>
                          {tier.icon} {tier.name}
                        </span>
                        <div className={`lb-score ${cls}`}>
                          <StarIcon color={first ? '#fbbf24' : cls === 'second' ? '#ffffff' : '#c084fc'} size={first ? 16 : 14} />
                          <span className="pts">{entry.total_pc?.toLocaleString()}</span>
                          <span className="pc">PC</span>
                        </div>
                        {first && (
                          <div className="lb-streak">
                            <span className="flame"><FlameIcon size={15} /></span>
                            <span className="num">{entry.win_streak > 0 ? entry.win_streak : '—'}</span>
                            <span className="lbl">Win Streak</span>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Table */}
              <div className="lb-table-wrap">
                <table className="lb-table">
                  <thead>
                    <tr>
                      <th scope="col">Rank</th>
                      <th scope="col">Player</th>
                      <th scope="col" className="lb-tier-head">Tier</th>
                      <th scope="col">Win Rate</th>
                      <th scope="col">Win Streak</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginated.map(entry => {
                      const me = isMe(entry)
                      const tier = getTier(entry.rank)
                      return (
                        <tr key={entry.id} className={me ? 'me' : ''}>
                          <td className="lb-rank">#{entry.rank}</td>
                          <td>
                            <div className="lb-player">
                              <div className="lb-player-avatar">
                                <AvatarDisplay avatarId={entry.avatar_id} size={32} style={{ border: 'none' }} />
                              </div>
                              <span className="lb-player-name">{entry.player_name}</span>
                              {me && <span className="lb-you">YOU</span>}
                            </div>
                          </td>
                          <td className="lb-tier-cell">
                            <span className="lb-tier" style={tierPillStyle(tier)}>
                              {tier.icon} {tier.name}
                            </span>
                          </td>
                          <td className="lb-rate">{entry.win_rate != null ? `${entry.win_rate}%` : '—'}</td>
                          <td>
                            <div className="lb-streak">
                              <span className="flame"><FlameIcon size={14} /></span>
                              <span className="num">{entry.win_streak > 0 ? entry.win_streak : '—'}</span>
                              <span className="lbl">Streak</span>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="lb-pagination">
                  <span>Showing #{startRank}–#{endRank} of {sorted.length} players</span>
                  <button className="lb-page-btn" disabled={page === 1} onClick={() => setPage(p => p - 1)} aria-label="Previous page">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m15 18-6-6 6-6" /></svg>
                  </button>
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                    const p = i + 1
                    return (
                      <button key={p} className={`lb-page-btn${p === page ? ' active' : ''}`} onClick={() => setPage(p)}>
                        {p}
                      </button>
                    )
                  })}
                  {totalPages > 5 && <span>...</span>}
                  <button className="lb-page-btn" disabled={page === totalPages} onClick={() => setPage(p => p + 1)} aria-label="Next page">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m9 18 6-6-6-6" /></svg>
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  )
}
