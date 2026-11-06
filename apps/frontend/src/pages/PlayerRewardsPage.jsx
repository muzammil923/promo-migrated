import { useState, useEffect } from 'react'
import { usePlayer } from './PlayerLayout'
import api from '../api'

export default function PlayerRewardsPage() {
  const { player } = usePlayer()
  const [redemptions, setRedemptions] = useState([])
  const [loading, setLoading] = useState(true)
  const [revealingId, setRevealingId] = useState(null)
  const [revealedCode, setRevealedCode] = useState(null)
  const [revealError, setRevealError] = useState('')

  const fetchRedemptions = () => {
    if (!player?.email) return
    api.get('/business/player-redemptions', { params: { email: player.email } })
      .then(r => { setRedemptions(r.data.redemptions || []) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchRedemptions() }, [player])

  const handleRevealCode = async (redemption) => {
    setRevealingId(redemption.id)
    setRevealError('')
    setRevealedCode(null)
    try {
      const { data } = await api.post('/business/reveal-code', {
        redemption_id: redemption.id,
        email: player.email,
      })
      if (data.success) {
        setRevealedCode({ id: redemption.id, code: data.code })
        // Update local state
        setRedemptions(prev => prev.map(r =>
          r.id === redemption.id ? { ...r, status: 'code_revealed', code: data.code } : r
        ))
      }
    } catch (err) {
      setRevealError(err.response?.data?.message || 'Failed to reveal code')
    } finally {
      setRevealingId(null)
    }
  }

  const statusColor = (s) => {
    switch(s) {
      case 'pending': return '#f59e0b'
      case 'code_revealed': return '#3b82f6'
      case 'code_entered': return '#8b5cf6'
      case 'player_confirmed': return '#22c55e'
      case 'completed': return '#22c55e'
      default: return '#6b7280'
    }
  }

  const statusLabel = (s) => {
    switch(s) {
      case 'pending': return 'Ready to redeem'
      case 'code_revealed': return 'Show code to business'
      case 'code_entered': return 'Business verified — confirm?'
      case 'player_confirmed': return 'Confirmed!'
      case 'completed': return 'Redeemed'
      default: return s
    }
  }

  if (loading) return <div className="fade-in" style={{ textAlign:'center', padding:40, color:'#888' }}>Loading...</div>

  return (
    <div className="fade-in" style={{ padding: '0 20px', color:'#fff' }}>
      <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 4 }}>My Rewards</h2>
      <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14, marginBottom: 24 }}>
        Offers you've earned from playing games. Tap "Redeem" when you're at the business!
      </p>

      {redemptions.length === 0 ? (
        <div style={{
          textAlign:'center', padding:'60px 40px',
          background:'rgba(168, 85, 247, 0.03)', borderRadius:16,
          border:'1px solid rgba(168, 85, 247, 0.1)',
        }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🎁</div>
          <h3 style={{ fontSize: 20, fontWeight: 800, marginBottom: 8 }}>No rewards yet</h3>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 15 }}>
            Play games at business locations to earn offers
          </p>
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          {redemptions.map(r => (
            <div key={r.id} style={{
              background:'rgba(255,255,255,0.03)', border:'1px solid rgba(168, 85, 247, 0.1)',
              borderRadius:16, padding:'20px',
            }}>
              {/* Header */}
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:12 }}>
                <div>
                  <div style={{ fontWeight:700, fontSize:16 }}>{r.game_name}</div>
                  {r.location_name && <div style={{ fontSize:13, color:'rgba(255,255,255,0.4)', marginTop:2 }}>📍 {r.location_name}</div>}
                  {r.reward_text && <div style={{ fontSize:13, color:'#4ade80', marginTop:2 }}>🎁 {r.reward_text}</div>}
                </div>
                <div style={{
                  fontSize:11, fontWeight:700, padding:'4px 12px', borderRadius:100,
                  background: statusColor(r.status) + '22', color: statusColor(r.status),
                }}>
                  {statusLabel(r.status)}
                </div>
              </div>

              {/* PENDING: Show Redeem button */}
              {r.status === 'pending' && (
                <div style={{
                  padding:'16px', background:'rgba(245,158,11,0.08)', borderRadius:12,
                  border:'1px solid rgba(245,158,11,0.15)',
                }}>
                  <div style={{ fontSize:13, color:'rgba(255,255,255,0.6)', marginBottom:12 }}>
                    You earned this offer! When you're at the business, tap below to get your redemption code.
                  </div>
                  <button
                    onClick={() => handleRevealCode(r)}
                    disabled={revealingId === r.id}
                    style={{
                      width:'100%', padding:'14px 24px', borderRadius:12, border:'none',
                      background: revealingId === r.id ? 'rgba(255,255,255,0.1)' : 'linear-gradient(135deg,#8b5cf6,#6d28d9)',
                      color:'#fff', fontWeight:700, fontSize:15, cursor:'pointer',
                      fontFamily:'inherit', boxShadow: revealingId === r.id ? 'none' : '0 4px 20px rgba(139,92,246,0.3)',
                    }}
                  >
                    {revealingId === r.id ? 'Generating code...' : '🎁 Redeem Now'}
                  </button>
                  {revealError && (
                    <div style={{ marginTop:8, fontSize:12, color:'#f87171' }}>{revealError}</div>
                  )}
                </div>
              )}

              {/* CODE REVEALED: Show the 6-digit code */}
              {(r.status === 'code_revealed' || (revealedCode?.id === r.id)) && (
                <div style={{
                  padding:'16px', background:'rgba(59,130,246,0.08)', borderRadius:12,
                  border:'1px solid rgba(59,130,246,0.15)',
                }}>
                  <div style={{ fontSize:13, color:'rgba(255,255,255,0.6)', marginBottom:12 }}>
                    Show this code to the business owner:
                  </div>
                  <div style={{
                    display:'flex', alignItems:'center', gap:16,
                    padding:'16px', background:'rgba(0,0,0,0.3)', borderRadius:12,
                  }}>
                    <div style={{
                      fontSize:36, fontWeight:800, letterSpacing:10,
                      background:'linear-gradient(135deg,#a855f7,#7c3aed)',
                      WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent',
                      fontFamily:'monospace',
                    }}>
                      {r.code || revealedCode?.code || '------'}
                    </div>
                  </div>
                  <div style={{ fontSize:12, color:'rgba(255,255,255,0.4)', marginTop:8, textAlign:'center' }}>
                    The business will enter this code to verify your redemption
                  </div>
                </div>
              )}

              {/* CODE ENTERED: Ask player to confirm */}
              {r.status === 'code_entered' && (
                <div style={{
                  padding:'16px', background:'rgba(139,92,246,0.08)', borderRadius:12,
                  border:'1px solid rgba(139,92,246,0.15)',
                }}>
                  <div style={{ fontWeight:600, fontSize:14, color:'#c084fc', marginBottom:8 }}>
                    The business verified your code!
                  </div>
                  <div style={{ fontSize:13, color:'rgba(255,255,255,0.6)', marginBottom:12 }}>
                    Have you received your surprise/reward?
                  </div>
                  <button onClick={async () => {
                    try {
                      await api.post('/business/confirm-redemption', { code: r.code })
                      fetchRedemptions()
                    } catch {}
                  }} style={{
                    width:'100%', padding:'14px 24px', borderRadius:12, border:'none',
                    background:'linear-gradient(135deg,#22c55e,#16a34a)',
                    color:'#fff', fontWeight:700, fontSize:15, cursor:'pointer',
                    fontFamily:'inherit', boxShadow:'0 4px 20px rgba(34,197,94,0.3)',
                  }}>
                    ✅ Yes, I got it!
                  </button>
                </div>
              )}

              {/* COMPLETED / CONFIRMED */}
              {(r.status === 'completed' || r.status === 'player_confirmed') && (
                <div style={{
                  padding:'12px 16px', background:'rgba(34,197,94,0.08)', borderRadius:10,
                  border:'1px solid rgba(34,197,94,0.15)',
                  fontSize:13, color:'#4ade80', fontWeight:600,
                }}>
                  ✅ Redemption complete — {r.status === 'player_confirmed' ? 'confirmed' : 'redeemed'}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
