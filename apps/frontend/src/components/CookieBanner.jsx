import { useState, useEffect } from 'react'

const CSS = `
.cb-wrap{position:fixed;bottom:0;left:0;right:0;z-index:99999;padding:16px 20px;animation:cbSlideUp .4s cubic-bezier(.22,1,.36,1) both}
@keyframes cbSlideUp{from{opacity:0;transform:translateY(40px)}to{opacity:1;transform:none}}
.cb-inner{max-width:900px;margin:0 auto;display:flex;align-items:center;gap:16px;padding:16px 24px;border-radius:16px;background:rgba(13,8,32,0.97);backdrop-filter:blur(24px);-webkit-backdrop-filter:blur(24px);border:1px solid rgba(146,16,246,0.25);box-shadow:0 8px 40px rgba(0,0,0,0.6),0 0 20px rgba(146,16,246,0.1)}
.cb-icon{font-size:24px;flex-shrink:0}
.cb-text{flex:1;font-family:'DM Sans',sans-serif;font-size:13px;line-height:1.6;color:rgba(255,255,255,0.75)}
.cb-text a{color:#c084ff;text-decoration:underline;text-underline-offset:2px}
.cb-text a:hover{color:#fff}
.cb-btns{display:flex;gap:8px;flex-shrink:0}
.cb-accept{padding:10px 20px;border-radius:100px;border:none;background:linear-gradient(90deg,#610497,#9210f6);color:#fff;font-family:'DM Sans',sans-serif;font-weight:700;font-size:12px;cursor:pointer;transition:opacity .2s;white-space:nowrap}
.cb-accept:hover{opacity:.85}
.cb-decline{padding:10px 20px;border-radius:100px;border:1px solid rgba(255,255,255,0.15);background:transparent;color:rgba(255,255,255,0.6);font-family:'DM Sans',sans-serif;font-weight:600;font-size:12px;cursor:pointer;transition:all .2s;white-space:nowrap}
.cb-decline:hover{border-color:rgba(255,255,255,0.3);color:#fff}
@media(max-width:640px){
  .cb-inner{flex-direction:column;text-align:center;padding:20px}
  .cb-btns{width:100%}
  .cb-accept,.cb-decline{flex:1;text-align:center}
}
`

export default function CookieBanner() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    // Never show inside the GameModal iframe — the parent page owns cookie consent
    if (window.self !== window.top) return
    const consent = localStorage.getItem('pg_cookie_consent')
    if (!consent) setVisible(true)
  }, [])

  const handleAccept = () => {
    localStorage.setItem('pg_cookie_consent', 'accepted')
    setVisible(false)
  }

  const handleDecline = () => {
    localStorage.setItem('pg_cookie_consent', 'declined')
    setVisible(false)
  }

  if (!visible) return null

  return (
    <>
      <style>{CSS}</style>
      <div className="cb-wrap">
        <div className="cb-inner">
          <span className="cb-icon">🍪</span>
          <p className="cb-text">
            We use cookies to improve your experience, analyze traffic, and personalise content.
            By continuing, you agree to our use of cookies.
            Read our <a href="/privacy">Privacy Policy</a> for details.
          </p>
          <div className="cb-btns">
            <button className="cb-decline" onClick={handleDecline}>Decline</button>
            <button className="cb-accept" onClick={handleAccept}>Accept All</button>
          </div>
        </div>
      </div>
    </>
  )
}
