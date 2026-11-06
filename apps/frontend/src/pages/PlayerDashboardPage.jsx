import { useNavigate } from 'react-router-dom'
import { usePlayer } from './PlayerLayout'
import { WalletHero, QuickStat, DailyStreak, WeeklyChallenge, RecentActivity, AchievementCard } from '../components/DashboardSharedComponents'

export default function PlayerDashboardPage() {
  const { player, txs } = usePlayer()
  const navigate = useNavigate()

  return (
    <div className="fade-in">
      <WalletHero balance={player.pc_balance} city={player.city} onPlayMore={() => navigate('/player/dashboard/games')} />

      <div className="stats-grid">
        <QuickStat icon="💎" label="Total PC" value={player.pc_balance.toLocaleString()} />
        <QuickStat icon="🎮" label="Games" value={txs.filter(t => t.type === 'earn' && t.game_id).length} />
        <QuickStat icon="🎁" label="Redeemed" value={txs.filter(t => t.type === 'spend').length} />
        <QuickStat icon="🏆" label="Rank" value="Silver" />
      </div>

      <div className="challenges-grid">
        <DailyStreak days={3} />
        <WeeklyChallenge progress={2} total={5} reward={200} />
        <RecentActivity txs={txs} onBrowseGames={() => navigate('/player/dashboard/games')} />
      </div>

      <div style={{ margin: '0 0 24px' }}>
        <h3 style={{ fontSize: 17, fontWeight: 800, margin: '0 20px 16px' }}>Achievements</h3>
        <div className="no-scrollbar" style={{ display: 'flex', gap: 16, overflowX: 'auto', padding: '0 20px 10px' }}>
          <AchievementCard title="Welcome Aboard" icon="🚀" unlocked={true} />
          <AchievementCard title="First Play" icon="🎯" unlocked={true} />
          <AchievementCard title="Coin Collector" icon="💰" unlocked={false} />
          <AchievementCard title="Master Player" icon="👑" unlocked={false} />
          <AchievementCard title="Social Butterfly" icon="🤝" unlocked={false} />
        </div>
      </div>
    </div>
  )
}
