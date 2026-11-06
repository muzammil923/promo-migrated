import { useState, useEffect, useRef } from 'react'
import api from '../api'

/*
 * PlayerAuthModal — compact player-only OTP login/signup overlay.
 * Instant signup: verifying the OTP creates the account right away
 * (incomplete profile), logs them in, and an optional skippable
 * name+username mini-form follows. Profile can be completed later.
 */

const CSS = `
.pam-overlay{position:fixed;inset:0;z-index:9500;background:rgba(5,2,12,0.88);backdrop-filter:blur(10px);display:flex;align-items:center;justify-content:center;padding:16px;animation:pamFade .18s ease both}
@keyframes pamFade{from{opacity:0}to{opacity:1}}
.pam-modal{width:100%;max-width:380px;background:#14102a;border:1px solid rgba(146,16,246,0.35);border-radius:24px;padding:30px 26px 22px;box-shadow:0 24px 80px rgba(0,0,0,0.55),0 0 40px rgba(146,16,246,0.12);animation:pamUp .26s cubic-bezier(.22,1,.36,1) both;font-family:'DM Sans',sans-serif;color:#fff;text-align:center}
@keyframes pamUp{from{opacity:0;transform:translateY(18px) scale(.97)}to{opacity:1;transform:none}}
.pam-head{display:flex;flex-direction:column;align-items:center;gap:8px;margin-bottom:16px}
.pam-mascot{width:58px;height:58px;border-radius:50%;background:radial-gradient(circle at 50% 35%,rgba(146,16,246,0.45),rgba(20,8,40,0.2));border:1px solid rgba(146,16,246,0.4);padding:5px}
.pam-brand{font-family:'Bebas Neue',sans-serif;font-size:15px;letter-spacing:3px;color:rgba(255,255,255,0.55)}
.pam-title{font-family:'Bebas Neue',sans-serif;font-size:28px;letter-spacing:2px;margin-bottom:4px}
.pam-sub{font-size:13px;line-height:1.55;color:rgba(255,255,255,0.65);margin-bottom:18px}
.pam-input{width:100%;padding:13px 14px;border-radius:12px;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.14);color:#fff;font-size:15px;outline:none;margin-bottom:10px;transition:border-color .2s;text-align:left}
.pam-input:focus{border-color:#9210f6}
.pam-input::placeholder{color:rgba(255,255,255,0.35)}
.pam-btn{width:100%;padding:13px;border:none;border-radius:12px;background:linear-gradient(135deg,#9210f6,#610497);color:#fff;font-family:'DM Sans',sans-serif;font-size:15px;font-weight:700;cursor:pointer;box-shadow:0 4px 20px rgba(146,16,246,0.35);transition:transform .15s,box-shadow .2s}
.pam-btn:hover{transform:translateY(-1px);box-shadow:0 6px 26px rgba(146,16,246,0.5)}
.pam-btn:disabled{opacity:.55;cursor:default;transform:none}
.pam-ghost{width:100%;padding:11px;margin-top:8px;border:none;border-radius:12px;background:transparent;color:rgba(255,255,255,0.55);font-family:'DM Sans',sans-serif;font-size:13px;font-weight:600;cursor:pointer;text-decoration:underline;text-underline-offset:3px}
.pam-ghost:hover{color:#fff}
.pam-link{background:none;border:none;color:#c084fc;font-size:12.5px;cursor:pointer;padding:8px 0 0;text-decoration:underline;text-underline-offset:3px}
.pam-row{display:flex;gap:10px}
.pam-err{font-size:12.5px;color:#ff8a8a;margin:-2px 0 10px;line-height:1.4}
.pam-ok{text-align:center;padding:10px 0 4px}
.pam-ok-ico{font-size:44px;margin-bottom:10px}
.pam-coins{display:inline-block;padding:7px 16px;border-radius:100px;background:rgba(245,200,66,0.12);border:1px solid rgba(245,200,66,0.4);color:#f5c842;font-size:13px;font-weight:700;margin-bottom:14px}
.pam-close{position:absolute;top:14px;right:16px;background:none;border:none;color:rgba(255,255,255,0.55);font-size:17px;cursor:pointer;padding:6px}
.pam-hint{font-size:11px;color:rgba(255,255,255,0.42);text-align:center;margin-top:10px}
.pam-uname-msg{font-size:11px;margin:-6px 0 10px 2px;color:rgba(255,255,255,0.5);text-align:left}
.pam-uname-msg.taken{color:#ff8a8a}
.pam-uname-msg.available{color:#7ee787}
`

export default function PlayerAuthModal({ onClose, onSuccess, onFinished }) {
  // steps: email → otp → profile (skippable) | done
  const [step, setStep] = useState('email')
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [created, setCreated] = useState(false)
  const [form, setForm] = useState({ name: '', username: '' })
  const [unameStatus, setUnameStatus] = useState('') // checking | available | taken
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [resendCD, setResendCD] = useState(0)
  const emailRef = useRef(null)

  useEffect(() => { emailRef.current?.focus() }, [])
  useEffect(() => {
    const onKey = e => { if (e.key === 'Escape') handleClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  })
  useEffect(() => {
    if (resendCD <= 0) return
    const t = setInterval(() => setResendCD(s => (s <= 1 ? (clearInterval(t), 0) : s - 1)), 1000)
    return () => clearInterval(t)
  }, [resendCD])

  const startCountdown = () => setResendCD(30)

  const store = (token, player) => {
    localStorage.setItem('playerToken', token)
    localStorage.setItem('playerUser', JSON.stringify(player))
  }

  // Live username availability (debounced)
  useEffect(() => {
    if (step !== 'profile') return
    const val = form.username.trim().toLowerCase()
    if (val.length < 3 || !/^[a-z0-9_]+$/.test(val)) { setUnameStatus(''); return }
    setUnameStatus('checking')
    const t = setTimeout(async () => {
      try {
        const { data } = await api.post('/pauth/check-username', { username: val })
        setUnameStatus(data.available ? 'available' : 'taken')
      } catch { setUnameStatus('') }
    }, 450)
    return () => clearTimeout(t)
  }, [form.username, step])

  function handleClose() {
    onClose?.()
  }

  const handleEmail = async () => {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return setError('Enter a valid email address')
    setError(''); setLoading(true)
    try {
      const { data } = await api.post('/pauth/check-email', { email })
      if (data.type === 'admin' || data.type === 'business_owner' || data.type === 'internal_team') {
        setError('This email is a staff account — use the full login page.')
      } else {
        await api.post('/pauth/send-otp', { email })
        setStep('otp'); startCountdown()
      }
    } catch (err) { setError(err.response?.data?.message || 'Something went wrong.') }
    finally { setLoading(false) }
  }

  const handleOtp = async () => {
    if (otp.length < 4) return setError('Enter the 4-digit code')
    setError(''); setLoading(true)
    try {
      const { data } = await api.post('/pauth/verify-otp', { email, otp })
      if (data.type === 'player') {
        store(data.token, { ...data.player })
        setCreated(!!data.created)
        setForm({ name: data.player.name || '', username: '' })
        // Fire attribution immediately — progress is saved even if they walk away.
        onSuccess?.({ ...data.player }, { isNew: !!data.created })
        setStep('profile') // optional, skippable
      } else {
        setError('Unexpected response. Try again.')
      }
    } catch (err) { setError(err.response?.data?.message || 'Invalid or expired code.'); setOtp('') }
    finally { setLoading(false) }
  }

  const saveProfile = async () => {
    const uname = form.username.trim().toLowerCase()
    const nm = form.name.trim()
    if (!nm && !uname) return finish()
    if (uname && (uname.length < 3 || !/^[a-z0-9_]+$/.test(uname))) return setError('Username: 3+ chars, lowercase letters/numbers/_')
    if (unameStatus === 'taken') return setError('Username is already taken')
    if (unameStatus === 'checking') return setError('Checking username…')
    setError(''); setLoading(true)
    try {
      const body = {}
      if (nm) body.name = nm
      if (uname) body.username = uname
      const { data } = await api.patch('/pauth/me', body)
      if (data.success) {
        // refresh cached profile copy
        try {
          const raw = JSON.parse(localStorage.getItem('playerUser') || '{}')
          localStorage.setItem('playerUser', JSON.stringify({ ...raw, ...data.player }))
        } catch {}
      }
      finish(true)
    } catch (err) {
      setError(err.response?.data?.message || 'Could not save. Try again.')
    } finally { setLoading(false) }
  }

  const finish = (saved = false) => {
    setStep('done')
    setTimeout(() => {
      // Parent decides what "done" means: close the game modal and return to
      // the arcade for fresh signups, or just dismiss here.
      onFinished?.()
      onClose?.()
    }, saved ? 900 : 650)
  }

  const resend = async () => {
    if (resendCD > 0) return
    try { await api.post('/pauth/send-otp', { email }); startCountdown() } catch { setError('Failed to resend.') }
  }

  return (
    <>
      <style>{CSS}</style>
      <div className="pam-overlay" onClick={e => { if (e.target === e.currentTarget && step !== 'done') handleClose() }}>
        <div className="pam-modal" role="dialog" aria-modal="true" aria-label="Login to save your progress" style={{ position: 'relative' }}>
          <button className="pam-close" onClick={handleClose} aria-label="Close">✕</button>
          {step !== 'done' && (
            <div className="pam-head">
              <img className="pam-mascot" src="/mascotques.webp" alt="" width="58" height="58" />
              <span className="pam-brand">PROMOGAMES</span>
            </div>
          )}
          {step === 'done' ? (
            <div className="pam-ok">
              <div className="pam-ok-ico">🎉</div>
              <div className="pam-title">{created ? 'Account Created!' : "You're In!"}</div>
              {created && <div><span className="pam-coins">+100 Welcome Coins</span></div>}
              <div className="pam-sub">Your progress is being saved…</div>
            </div>
          ) : step === 'profile' ? (
            <>
              <div className="pam-title">Set Up Your Profile</div>
              <div className="pam-sub">Optional — pick a name &amp; username so friends can find you.</div>
              <input className="pam-input" placeholder="Your name" value={form.name} maxLength={60}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
              <input className="pam-input" placeholder="Username (e.g. game_master)" value={form.username} maxLength={20}
                onChange={e => setForm(f => ({ ...f, username: e.target.value }))} />
              <div className={`pam-uname-msg ${unameStatus}`}>
                {unameStatus === 'checking' ? 'Checking…' : unameStatus === 'available' ? '✓ Available!' : unameStatus === 'taken' ? '✗ Already taken' : ''}
              </div>
              {error && <div className="pam-err">{error}</div>}
              <button className="pam-btn" onClick={saveProfile} disabled={loading}>
                {loading ? 'Saving…' : 'Save & Continue'}
              </button>
              <button className="pam-ghost" onClick={() => finish()}>Skip for now</button>
            </>
          ) : step === 'otp' ? (
            <>
              <div className="pam-title">Check Your Email</div>
              <div className="pam-sub">We sent a 4-digit code to <strong>{email}</strong></div>
              <input className="pam-input" placeholder="••••" inputMode="numeric" maxLength={4} value={otp} ref={emailRef}
                style={{ textAlign: 'center', fontSize: 22, letterSpacing: 10 }}
                onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
                onKeyDown={e => e.key === 'Enter' && handleOtp()} />
              {error && <div className="pam-err">{error}</div>}
              <button className="pam-btn" onClick={handleOtp} disabled={loading}>
                {loading ? 'Verifying…' : 'Verify Code'}
              </button>
              <div style={{ textAlign: 'center' }}>
                <button className="pam-link" onClick={resend} disabled={resendCD > 0}>
                  {resendCD > 0 ? `Resend code in ${resendCD}s` : 'Resend code'}
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="pam-title">Save Your Progress</div>
              <div className="pam-sub">Log in or create a free account to keep your coins, scores and rewards.</div>
              <input className="pam-input" placeholder="you@email.com" inputMode="email" value={email} ref={emailRef}
                onChange={e => setEmail(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleEmail()} />
              {error && <div className="pam-err">{error}</div>}
              <button className="pam-btn" onClick={handleEmail} disabled={loading}>
                {loading ? 'Sending…' : 'Continue with Email'}
              </button>
              <div className="pam-hint">No password needed — we'll email you a code</div>
            </>
          )}
        </div>
      </div>
    </>
  )
}
