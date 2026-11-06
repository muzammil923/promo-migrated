import React, { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../api'
import { AvatarGrid, DEFAULT_AVATARS } from '../components/AvatarData'
import MascotLogin from '../components/MascotLogin'

const STEP_EMAIL     = 'email'
const STEP_PASSWORD  = 'password'
const STEP_BUSINESS_PASS = 'business_pass'
const STEP_IT_PASS   = 'it_password'
const STEP_OTP       = 'otp'
const STEP_REGISTER  = 'register'

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;0,9..40,800&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{
  --brand:#7c3aed;--brand-light:#a78bfa;--brand-lighter:#c4b5fd;--brand-dark:#6d28d9;
  --text:#f8fafc;--text2:rgba(248,250,252,0.55);--text3:rgba(248,250,252,0.3);
  --success:#10b981;--danger:#ef4444;
  --font:'DM Sans',system-ui,-apple-system,sans-serif;
  --card-bg:rgba(15,12,28,0.85);
  --card-border:rgba(124,58,237,0.2);
  --card-glow:rgba(124,58,237,0.12);
  --input-bg:rgba(255,255,255,0.04);
  --input-border:rgba(255,255,255,0.08);
  --input-focus:#7c3aed;
}
html,body,#root{height:100%;font-family:var(--font);-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale}

@keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
@keyframes dotBounce{0%,80%,100%{transform:translateY(0)}40%{transform:translateY(-5px)}}
@keyframes shake{0%,100%{transform:translateX(0)}20%{transform:translateX(-6px)}40%{transform:translateX(6px)}60%{transform:translateX(-4px)}80%{transform:translateX(4px)}}

.pg-card{
  width:100%;max-width:420px;
  background:var(--card-bg);
  border:1px solid var(--card-border);
  border-radius:24px;
  box-shadow:0 0 40px rgba(124,58,237,0.08),0 0 80px rgba(124,58,237,0.04),0 24px 80px rgba(0,0,0,0.4),0 0 0 1px rgba(124,58,237,0.08) inset;
  backdrop-filter:blur(24px);
  overflow:hidden;
}

.pg-prog{height:3px;background:rgba(255,255,255,0.03);position:relative;overflow:hidden}
.pg-prog-fill{position:absolute;left:0;top:0;height:100%;background:linear-gradient(90deg,var(--brand),var(--brand-light));border-radius:0 2px 2px 0;transition:width 0.5s cubic-bezier(0.4,0,0.2,1)}

.pg-inner{padding:40px 36px 32px}

.pg-title{font-size:28px;font-weight:800;color:var(--text);margin-bottom:6px;letter-spacing:-0.03em;line-height:1.2}
.pg-sub{font-size:14px;font-weight:400;color:var(--text2);margin-bottom:28px;line-height:1.6}

.pg-lbl{display:block;font-size:13px;font-weight:600;color:var(--text2);margin-bottom:8px}

.pg-inp{
  width:100%;padding:14px 16px;
  font-family:var(--font);font-size:14px;font-weight:500;
  color:var(--text);caret-color:var(--brand-light);
  background:var(--input-bg);
  border:1.5px solid var(--input-border);
  border-radius:14px;outline:none;
  transition:all 0.2s ease;-webkit-appearance:none;
}
.pg-inp::placeholder{color:rgba(255,255,255,0.18)}
.pg-inp:focus{border-color:var(--input-focus);background:rgba(124,58,237,0.04);box-shadow:0 0 0 4px rgba(124,58,237,0.08)}
.pg-inp:disabled{opacity:0.3;cursor:not-allowed}
.pg-fg{margin-bottom:20px}
.pg-row{display:grid;grid-template-columns:1fr 1fr;gap:14px}

.pg-btn{
  width:100%;padding:15px 24px;
  font-family:var(--font);font-size:15px;font-weight:700;
  color:#fff;border:none;border-radius:14px;cursor:pointer;
  background:linear-gradient(135deg,var(--brand),var(--brand-dark));
  box-shadow:0 4px 20px rgba(124,58,237,0.35);
  display:flex;align-items:center;justify-content:center;gap:8px;
  transition:all 0.2s ease;position:relative;
  letter-spacing:0.01em;
}
.pg-btn:hover:not(:disabled){box-shadow:0 6px 28px rgba(124,58,237,0.5);transform:translateY(-1px)}
.pg-btn:active:not(:disabled){transform:scale(0.98)}
.pg-btn:disabled{opacity:0.3;cursor:not-allowed;transform:none;box-shadow:none}

.pg-back{
  background:none;border:none;color:var(--text2);font-size:13px;
  font-weight:600;font-family:var(--font);cursor:pointer;padding:0;
  margin-bottom:20px;display:inline-flex;align-items:center;gap:6px;
  transition:color 0.15s;
}
.pg-back:hover{color:var(--text)}

.pg-lnk{background:none;border:none;color:var(--brand-light);font-size:13px;font-weight:700;font-family:var(--font);cursor:pointer;padding:0}
.pg-lnk:hover{color:var(--text)}

.pg-err{
  background:rgba(239,68,68,0.06);border:1px solid rgba(239,68,68,0.12);
  border-radius:12px;padding:12px 16px;margin-bottom:20px;
  color:#fca5a5;font-size:13px;font-weight:600;
  display:flex;align-items:center;gap:8px;animation:shake 0.4s ease;
}

.pg-pw-wrap{position:relative}
.pg-pw-wrap .pg-inp{padding-right:48px}
.pg-pw-toggle{
  position:absolute;right:6px;top:50%;transform:translateY(-50%);
  background:none;border:none;cursor:pointer;padding:8px;
  color:var(--text3);display:flex;align-items:center;justify-content:center;
  transition:color 0.15s;border-radius:10px;
}
.pg-pw-toggle:hover{color:var(--text)}

.otp-row{display:flex;gap:10px;justify-content:center;margin:24px 0;cursor:text}
.otp-box{
  width:56px;height:64px;display:flex;align-items:center;justify-content:center;
  font-size:26px;font-weight:800;
  background:var(--input-bg);border:1.5px solid var(--input-border);
  border-radius:14px;color:var(--text);transition:all 0.2s ease;user-select:none;
}
.otp-box.active{border-color:var(--brand);background:rgba(124,58,237,0.04);box-shadow:0 0 0 4px rgba(124,58,237,0.08)}
.otp-box.filled{border-color:var(--success);background:rgba(16,185,129,0.04);color:#6ee7b7;transform:scale(1.05)}

.dots{display:flex;gap:4px;align-items:center}
.dots span{width:5px;height:5px;border-radius:50%;background:var(--brand-light);animation:dotBounce 1s ease infinite}
.dots span:nth-child(2){animation-delay:0.14s}
.dots span:nth-child(3){animation-delay:0.28s}

.steps{display:flex;gap:6px;justify-content:center;margin-bottom:24px}
.step-dot{height:4px;border-radius:2px;background:rgba(255,255,255,0.08);transition:all 0.35s ease}
.step-dot.active{background:var(--brand-light);width:24px}
.step-dot.done{background:var(--success);width:14px}
.step-dot.pending{width:8px}

.email-badge{
  display:inline-flex;align-items:center;gap:5px;
  background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.06);
  border-radius:100px;padding:5px 14px 5px 10px;
  font-size:13px;font-weight:600;color:rgba(255,255,255,0.7);margin-bottom:16px;
}

.role-badge{
  display:flex;align-items:center;gap:14px;
  padding:14px 16px;background:rgba(255,255,255,0.03);
  border:1px solid rgba(255,255,255,0.06);border-radius:14px;margin-bottom:22px;
}
.role-badge-icon{
  width:44px;height:44px;border-radius:12px;background:rgba(124,58,237,0.1);
  display:flex;align-items:center;justify-content:center;font-size:20px;flex-shrink:0;
}
.role-badge-name{font-weight:700;font-size:15px;color:var(--text)}
.role-badge-email{font-size:12px;color:var(--brand-light);font-weight:600;margin-top:2px}

.bonus{
  background:rgba(16,185,129,0.06);border:1px solid rgba(16,185,129,0.1);
  border-radius:12px;padding:12px 16px;margin-bottom:18px;
  display:flex;align-items:center;gap:10px;
  font-size:13px;font-weight:600;color:rgba(255,255,255,0.8);
}

.timer{
  display:inline-flex;align-items:center;
  background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.06);
  border-radius:100px;padding:4px 12px;
  font-size:12px;font-weight:700;color:var(--text2);font-variant-numeric:tabular-nums;
}
.resend{
  text-align:center;margin-top:16px;
  font-size:13px;font-weight:600;color:var(--text3);
  display:flex;align-items:center;justify-content:center;gap:6px;
}

.pg-footer{text-align:center;margin-top:36px;font-size:11px;font-weight:600;color:var(--text3);letter-spacing:0.02em}

.fadeup{animation:fadeUp 0.4s cubic-bezier(0.34,1.4,0.64,1)}

@media(max-width:767px){
  .pg-card{max-width:100%;border-radius:20px;margin:0 4px}
  .pg-inner{padding:28px 20px 24px}
  .pg-title{font-size:22px}
  .pg-sub{font-size:13px;margin-bottom:20px}
  .pg-inp{padding:12px 14px;font-size:13px}
  .pg-btn{padding:13px 18px;font-size:14px}
  .otp-box{width:50px;height:56px;font-size:22px}
  .pg-row{grid-template-columns:1fr;gap:12px}
}
`

function useStyles() {
  useEffect(() => {
    const id = 'pg-v6-css'
    if (document.getElementById(id)) return
    const el = document.createElement('style')
    el.id = id; el.textContent = CSS
    document.head.appendChild(el)
  }, [])
}

function Dots() { return <div className="dots"><span/><span/><span/></div> }

function StepDots({ step }) {
  const order = [STEP_EMAIL, STEP_OTP, STEP_REGISTER]
  const i = order.indexOf(step)
  return (
    <div className="steps">
      {order.map((s,j) => (
        <div key={s} className={`step-dot ${j===i?'active':j<i?'done':'pending'}`}/>
      ))}
    </div>
  )
}

function OTPInput({ value, onChange, onFocus, onBlur }) {
  const ref = useRef(null)
  const [focused, setFocused] = useState(false)
  const digits = (value+'    ').slice(0,4).split('')
  const handleChange = e => {
    const v = e.target.value.replace(/\D/g,'').slice(0,4)
    onChange(v)
    requestAnimationFrame(() => { if(ref.current) ref.current.setSelectionRange(v.length,v.length) })
  }
  return (
    <div className="otp-row" onClick={() => ref.current?.focus()}>
      <input ref={ref} type="text" inputMode="numeric" value={value}
        onChange={handleChange}
        onKeyDown={e => e.key==='Backspace' && value.length===0 && e.preventDefault()}
        onPaste={e => { e.preventDefault(); const p=e.clipboardData.getData('text').replace(/\D/g,'').slice(0,4); if(p) onChange(p) }}
        onFocus={() => { setFocused(true); onFocus?.() }} onBlur={() => { setFocused(false); onBlur?.() }}
        maxLength={4}
        style={{position:'absolute',opacity:0,pointerEvents:'none',width:1,height:1}}/>
      {digits.map((d,i) => {
        const filled = d.trim()!==''
        const active = focused && i===value.length
        return (
          <div key={i} className={`otp-box${active?' active':''}${filled?' filled':''}`}>
            {filled ? d : active
              ? <div style={{width:2,height:24,background:'rgba(255,255,255,0.8)',borderRadius:1,animation:'blink 1s step-end infinite'}}/>
              : null}
          </div>
        )
      })}
    </div>
  )
}

export default function LoginPage() {
  const navigate = useNavigate()
  const { login } = useAuth()

  const [step, setStep] = useState(STEP_EMAIL)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [otp, setOtp] = useState('')
  const [tempToken, setTempToken] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [resendCD, setResendCD] = useState(0)
  const [rememberMe, setRememberMe] = useState(true)
  const [form, setForm] = useState({name:'',username:'',dob:'',whatsapp:'',city:'',pincode:'',avatar_id:DEFAULT_AVATARS[0].id})
  const [usernameStatus, setUsernameStatus] = useState('')
  const [usernameMsg, setUsernameMsg] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [inputFocused, setInputFocused] = useState(false)

  const setField = (k,v) => setForm(f=>({...f,[k]:v}))

  useEffect(() => {
    const val = form.username.trim().toLowerCase()
    if (val.length < 3) { setUsernameStatus(''); setUsernameMsg(val.length ? 'At least 3 characters' : ''); return }
    if (!/^[a-z0-9_]+$/.test(val)) { setUsernameStatus(''); setUsernameMsg('Only lowercase, numbers and _'); return }
    setUsernameStatus('checking'); setUsernameMsg('')
    const t = setTimeout(async () => {
      try {
        const { data } = await api.post('/pauth/check-username', { username: val })
        if (data.available) { setUsernameStatus('available'); setUsernameMsg('Available!') }
        else { setUsernameStatus('taken'); setUsernameMsg('Already taken') }
      } catch { setUsernameStatus(''); setUsernameMsg('') }
    }, 500)
    return () => clearTimeout(t)
  }, [form.username])

  const storeAuth = (token, player) => {
    const storage = rememberMe ? localStorage : sessionStorage
    storage.setItem('playerToken', token)
    storage.setItem('playerUser', JSON.stringify(player))
  }
  const clearErr = () => setError('')
  const startCountdown = () => {
    setResendCD(30)
    const t = setInterval(() => setResendCD(s => { if(s<=1){clearInterval(t);return 0} return s-1 }),1000)
  }

const handleEmailSubmit = async () => {
    if (!email) return setError('Please enter your email')
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return setError('Please enter a valid email address')
    clearErr(); setLoading(true)
    try {
      const { data } = await api.post('/pauth/check-email', { email })
      if (data.type === 'admin') setStep(STEP_PASSWORD)
      else if (data.type === 'business_owner') setStep(STEP_BUSINESS_PASS)
      else if (data.type === 'internal_team') setStep(STEP_IT_PASS)
      else { await api.post('/pauth/send-otp', { email }); setStep(STEP_OTP); startCountdown() }
    } catch(err) { setError(err.response?.data?.message || 'Something went wrong.') }
    finally { setLoading(false) }
  }

  const handleBusinessLogin = async () => {
    if (!password) return setError('Please enter your phone number')
    clearErr(); setLoading(true)
    try {
      const { data } = await api.post('/business/login', { business_name: email, password })
      localStorage.setItem('businessToken', data.token)
      localStorage.setItem('businessUser', JSON.stringify(data.bo))
      navigate('/bo/dashboard')
    } catch(err) { setError(err.response?.data?.message || 'Invalid credentials.') }
    finally { setLoading(false) }
  }

  const handleITLogin = async () => {
    if (!password) return setError('Please enter your phone number')
    if (!/^\d{10}$/.test(password)) return setError('Phone number must be exactly 10 digits')
    clearErr(); setLoading(true)
    try {
      const { data } = await api.post('/internal-team/login', { email, password })
      localStorage.setItem('itToken', data.token)
      localStorage.setItem('itUser', JSON.stringify(data.member))
      navigate('/internal-team/dashboard')
    } catch(err) { setError(err.response?.data?.message || 'Invalid credentials.') }
    finally { setLoading(false) }
  }

  const handleAdminLogin = async () => {
    if (!password) return setError('Please enter your password')
    clearErr(); setLoading(true)
    try { await login(email, password); navigate('/dashboard') }
    catch(err) { setError(err.response?.data?.message || 'Incorrect password.') }
    finally { setLoading(false) }
  }

  const handleOTPSubmit = async () => {
    if (otp.length < 4) return setError('Enter the 4-digit code')
    clearErr(); setLoading(true)
    try {
      const { data } = await api.post('/pauth/verify-otp', { email, otp })
      if (data.type === 'player') {
        storeAuth(data.token, { ...data.player, avatar_id: form.avatar_id })
        navigate('/')
      } else { setTempToken(data.tempToken); setStep(STEP_REGISTER) }
    } catch(err) { setError(err.response?.data?.message || 'Invalid or expired code.'); setOtp('') }
    finally { setLoading(false) }
  }

  const handleRegister = async () => {
    if (!form.name.trim()) return setError('Name is required')
    if (!form.username.trim() || form.username.length < 3) return setError('Username must be at least 3 characters')
    if (!/^[a-z0-9_]+$/.test(form.username)) return setError('Only lowercase letters, numbers and underscores')
    if (usernameStatus === 'taken') return setError('Username is already taken')
    if (usernameStatus === 'checking') return setError('Checking username…')
    clearErr(); setLoading(true)
    try {
      const { data } = await api.post('/pauth/register', {
        tempToken, name: form.name.trim(),
        username: form.username.trim().toLowerCase(),
        dob: form.dob||null,
        whatsapp: form.whatsapp||null, city: form.city||null, pincode: form.pincode||null,
        avatar_id: form.avatar_id,
      })
      storeAuth(data.token, { ...data.player, avatar_id: form.avatar_id })
      navigate('/arcade', { state: { welcomeBonus: true } })
    } catch(err) { setError(err.response?.data?.message || 'Registration failed.') }
    finally { setLoading(false) }
  }

  const handleResend = async () => {
    if (resendCD > 0) return
    clearErr(); setOtp('')
    try { await api.post('/pauth/send-otp', { email }); startCountdown() }
    catch { setError('Failed to resend.') }
  }

  const goBack = () => { setPassword(''); setOtp(''); clearErr(); setStep(STEP_EMAIL); setShowPassword(false); setInputFocused(false) }

  // Mascot state
  const isTyping = inputFocused

  const pct = {[STEP_EMAIL]:15,[STEP_OTP]:55,[STEP_PASSWORD]:70,[STEP_BUSINESS_PASS]:70,[STEP_IT_PASS]:70,[STEP_REGISTER]:88}[step]||0

  const goBackFromPassword = () => { setPassword(''); clearErr(); setStep(STEP_EMAIL); setShowPassword(false); setInputFocused(false) }

  return (
    <MascotLogin
      isTyping={isTyping}
      showPassword={showPassword}
      passwordLength={password.length}
      loginFailed={!!error}
      loginSuccess={false}
    >
      <div className="pg-card">
        <div className="pg-prog">
          <div className="pg-prog-fill" style={{width:`${pct}%`}}/>
        </div>
        <div className="pg-inner">
          {/* Logo inside form */}
          <div style={{ display:'flex', justifyContent:'center', marginBottom: 28 }}>
            <img src="/favicon2.png" alt="PromoGames" style={{ height: 48, width: 'auto', borderRadius: 10 }} />
          </div>
          {error && <div className="pg-err"><span>⚠</span><span>{error}</span></div>}

          {/* ── EMAIL ── */}
          {step === STEP_EMAIL && (
            <div className="fadeup">
              <div className="pg-title">Welcome back 👋</div>
              <div className="pg-sub">Enter your email to get started.</div>
              <div className="pg-fg">
                <label className="pg-lbl">Email Address</label>
                <input className="pg-inp" type="email" value={email} autoFocus
                  onChange={e=>{setEmail(e.target.value);clearErr()}}
                  onKeyDown={e=>e.key==='Enter'&&!loading&&email&&handleEmailSubmit()}
                  onFocus={()=>setInputFocused(true)} onBlur={()=>setInputFocused(false)}
                  placeholder="you@example.com"/>
              </div>
              <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:16}}>
                <div onClick={()=>setRememberMe(!rememberMe)} style={{width:18,height:18,flexShrink:0,border:`2px solid ${rememberMe?'rgba(139,92,246,0.6)':'rgba(255,255,255,0.15)'}`,borderRadius:4,background:rememberMe?'rgba(139,92,246,0.15)':'transparent',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',transition:'all 0.15s'}}>
                  {rememberMe && <span style={{color:'#fff',fontSize:10,fontWeight:700}}>✓</span>}
                </div>
                <span style={{fontSize:12,fontWeight:600,color:'var(--text2)',cursor:'pointer',userSelect:'none'}} onClick={()=>setRememberMe(!rememberMe)}>Remember me</span>
              </div>
              <button className={`pg-btn${loading?' busy':''}`} onClick={handleEmailSubmit} disabled={loading||!email}>
                {loading ? <><Dots/>&nbsp;Checking…</> : 'Continue →'}
              </button>
            </div>
          )}

          {/* ── OTP ── */}
          {step === STEP_OTP && (
            <div className="fadeup">
              <button className="pg-back" onClick={goBack}>← Back</button>
              <StepDots step={step}/>
              <div className="pg-title">Check your email ✉️</div>
              <p style={{color:'var(--text2)',fontSize:13,fontWeight:500,marginBottom:4}}>We sent a 4-digit code to</p>
              <span className="email-badge">✉ {email}</span>
              <OTPInput value={otp} onChange={v=>{setOtp(v);clearErr()}} onFocus={()=>setInputFocused(true)} onBlur={()=>setInputFocused(false)}/>
              <button className={`pg-btn${loading?' busy':''}`} onClick={handleOTPSubmit} disabled={loading||otp.length<4}>
                {loading ? <><Dots/>&nbsp;Verifying…</> : 'Verify Code →'}
              </button>
              <div className="resend">
                Didn't receive it?
                {resendCD>0
                  ? <span className="timer">⏱ {resendCD}s</span>
                  : <button className="pg-lnk" onClick={handleResend}>Resend code</button>}
              </div>
            </div>
          )}

          {/* ── REGISTER ── */}
          {step === STEP_REGISTER && (
            <div className="fadeup" style={{maxHeight:'70vh',overflowY:'auto',paddingRight:4}}>
              <StepDots step={step}/>
              <div className="pg-title">Almost there! 🎉</div>
              <div className="pg-sub">A few details to set up your wallet.</div>
              <div className="pg-fg">
                <label className="pg-lbl">Email</label>
                <input className="pg-inp" type="email" value={email} disabled/>
              </div>
              <div className="pg-fg">
                <label className="pg-lbl">Full Name <span style={{color:'#f87171'}}>*</span></label>
                <input className="pg-inp" type="text" value={form.name} autoFocus
                  onChange={e=>{setField('name',e.target.value);clearErr()}}
                  onFocus={()=>setInputFocused(true)} onBlur={()=>setInputFocused(false)}
                  placeholder="Your full name"/>
              </div>
              <div className="pg-fg">
                <label className="pg-lbl">Username <span style={{color:'#f87171'}}>*</span></label>
                <input className="pg-inp" type="text" value={form.username}
                  onChange={e=>{setField('username',e.target.value.toLowerCase().replace(/[^a-z0-9_]/g,''));clearErr()}}
                  onFocus={()=>setInputFocused(true)} onBlur={()=>setInputFocused(false)}
                  placeholder="e.g. venu_gamer" maxLength={20}/>
                {usernameMsg && (
                  <span style={{fontSize:11,marginTop:3,display:'block',fontWeight:700,
                    color: usernameStatus==='available' ? '#34d399' : usernameStatus==='taken' ? '#f87171' : usernameStatus==='checking' ? '#a78bfa' : '#9ca3af'
                  }}>{usernameMsg}</span>
                )}
              </div>
              <div className="pg-row pg-fg">
                <div>
                  <label className="pg-lbl">Date of Birth</label>
                  <input className="pg-inp" type="date" value={form.dob} onChange={e=>setField('dob',e.target.value)}/>
                </div>
                <div>
                  <label className="pg-lbl">WhatsApp</label>
                  <input className="pg-inp" type="tel" value={form.whatsapp}
                    onChange={e=>setField('whatsapp',e.target.value)} placeholder="+91 9876543210"/>
                </div>
              </div>
              <div className="pg-row pg-fg">
                <div>
                  <label className="pg-lbl">City</label>
                  <input className="pg-inp" type="text" value={form.city}
                    onChange={e=>setField('city',e.target.value)} placeholder="Bangalore"/>
                </div>
                <div>
                  <label className="pg-lbl">Pincode</label>
                  <input className="pg-inp" type="text" value={form.pincode}
                    onChange={e=>setField('pincode',e.target.value)} placeholder="560001" maxLength={6}/>
                </div>
              </div>
              <div style={{marginBottom:16}}>
                <label className="pg-lbl" style={{marginBottom:6,display:'block'}}>Choose Avatar</label>
                <AvatarGrid selected={form.avatar_id} onSelect={id => setField('avatar_id', id)} size={62} />
              </div>
              <button className={`pg-btn${loading?' busy':''}`} onClick={handleRegister} disabled={loading||!form.name.trim()||!form.username.trim()||usernameStatus==='taken'||usernameStatus==='checking'}>
                {loading ? <><Dots/>&nbsp;Creating…</> : 'Create Account →'}
              </button>
            </div>
          )}

          {/* ── ADMIN PASSWORD ── */}
          {step === STEP_PASSWORD && (
            <div className="fadeup">
              <button className="pg-back" onClick={goBackFromPassword}>← Back</button>
              <div className="role-badge">
                <div className="role-badge-icon">🛡️</div>
                <div><div className="role-badge-name">Admin Login</div><div className="role-badge-email">{email}</div></div>
              </div>
              <div className="pg-fg">
                <label className="pg-lbl">Password</label>
                <div className="pg-pw-wrap">
                  <input className="pg-inp" type={showPassword?'text':'password'} value={password} autoFocus
                    onChange={e=>{setPassword(e.target.value);clearErr()}}
                    onKeyDown={e=>e.key==='Enter'&&!loading&&password&&handleAdminLogin()}
                    onFocus={()=>setInputFocused(true)} onBlur={()=>setInputFocused(false)}
                    placeholder="••••••••"/>
                  <button type="button" className="pg-pw-toggle" onClick={()=>setShowPassword(!showPassword)} tabIndex={-1}>
                    {showPassword
                      ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                      : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                    }
                  </button>
                </div>
              </div>
              <button className={`pg-btn${loading?' busy':''}`} onClick={handleAdminLogin} disabled={loading||!password}>
                {loading ? <><Dots/>&nbsp;Signing in…</> : 'Sign In →'}
              </button>
            </div>
          )}

          {/* ── BUSINESS OWNER PASSWORD ── */}
          {step === STEP_BUSINESS_PASS && (
            <div className="fadeup">
              <button className="pg-back" onClick={goBackFromPassword}>← Back</button>
              <div className="role-badge">
                <div className="role-badge-icon">🏢</div>
                <div><div className="role-badge-name">Business Owner</div><div className="role-badge-email">Username: {email}</div></div>
              </div>
              <div className="pg-fg">
                <label className="pg-lbl">Password (Phone Number)</label>
                <div className="pg-pw-wrap">
                  <input className="pg-inp" type={showPassword?'text':'password'} value={password} autoFocus
                    onChange={e=>{setPassword(e.target.value);clearErr()}}
                    onKeyDown={e=>e.key==='Enter'&&!loading&&password&&handleBusinessLogin()}
                    onFocus={()=>setInputFocused(true)} onBlur={()=>setInputFocused(false)}
                    placeholder="Enter your phone number"/>
                  <button type="button" className="pg-pw-toggle" onClick={()=>setShowPassword(!showPassword)} tabIndex={-1}>
                    {showPassword
                      ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                      : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                    }
                  </button>
                </div>
              </div>
              <button className={`pg-btn${loading?' busy':''}`} onClick={handleBusinessLogin} disabled={loading||!password}>
                {loading ? <><Dots/>&nbsp;Signing in…</> : 'Sign In →'}
              </button>
            </div>
          )}

          {/* ── IT PASSWORD ── */}
          {step === STEP_IT_PASS && (
            <div className="fadeup">
              <button className="pg-back" onClick={goBackFromPassword}>← Back</button>
              <div className="role-badge">
                <div className="role-badge-icon">🛠️</div>
                <div><div className="role-badge-name">Internal Team</div><div className="role-badge-email">{email}</div></div>
              </div>
              <div className="pg-fg">
                <label className="pg-lbl">Password (Phone Number)</label>
                <div className="pg-pw-wrap">
                  <input className="pg-inp" type={showPassword?'text':'password'} value={password} autoFocus
                    onChange={e=>{setPassword(e.target.value);clearErr()}}
                    onKeyDown={e=>e.key==='Enter'&&!loading&&password&&handleITLogin()}
                    onFocus={()=>setInputFocused(true)} onBlur={()=>setInputFocused(false)}
                    placeholder="Enter your phone number"/>
                  <button type="button" className="pg-pw-toggle" onClick={()=>setShowPassword(!showPassword)} tabIndex={-1}>
                    {showPassword
                      ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                      : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                    }
                  </button>
                </div>
              </div>
              <button className={`pg-btn${loading?' busy':''}`} onClick={handleITLogin} disabled={loading||!password}>
                {loading ? <><Dots/>&nbsp;Signing in…</> : 'Sign In →'}
              </button>
            </div>
          )}

          <div className="pg-footer">Secured by PromoGames</div>
        </div>
      </div>
      <style>{CSS}</style>
    </MascotLogin>
  )
}
