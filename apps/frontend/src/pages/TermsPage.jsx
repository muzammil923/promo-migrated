import { useEffect } from 'react'
import PlayerNavbar from '../components/PlayerNavbar'
import MascotBubble from '../components/MascotBubble'
import MascotCursor from '../components/MascotCursor'

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
html,body{background:#07040f;width:100%;min-height:100vh}
.tp-page{min-height:100vh;background:#07040f;font-family:'Outfit',sans-serif;color:#fff;padding:120px 24px 80px;position:relative;overflow:hidden;width:100%}
.tp-page::before{content:'';position:absolute;top:-200px;left:50%;transform:translateX(-50%);width:900px;height:900px;background:radial-gradient(circle,rgba(146,16,246,0.18) 0%,rgba(146,16,246,0.06) 40%,transparent 70%);pointer-events:none}
.tp-page::after{content:'';position:absolute;bottom:-300px;right:-200px;width:700px;height:700px;background:radial-gradient(circle,rgba(97,4,151,0.12) 0%,transparent 60%);pointer-events:none}
.tp-container{max-width:780px;margin:0 auto;position:relative;z-index:1}
.tp-hero{position:relative;padding:48px 40px;border-radius:24px;background:linear-gradient(135deg,rgba(146,16,246,0.15) 0%,rgba(97,4,151,0.08) 100%);border:1px solid rgba(146,16,246,0.2);margin-bottom:48px;overflow:hidden}
.tp-hero::before{content:'';position:absolute;top:0;right:0;width:200px;height:200px;background:radial-gradient(circle,rgba(192,132,252,0.15) 0%,transparent 70%);pointer-events:none}
.tp-badge{display:inline-flex;align-items:center;gap:8px;padding:6px 16px;border-radius:100px;background:rgba(146,16,246,0.2);border:1px solid rgba(146,16,246,0.35);font-size:12px;font-weight:600;color:#c084ff;margin-bottom:20px;letter-spacing:.5px}
.tp-title{font-size:clamp(32px,5vw,48px);font-weight:800;line-height:1.15;margin-bottom:12px;background:linear-gradient(135deg,#fff 20%,#c084ff 100%);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
.tp-updated{font-size:13px;color:rgba(255,255,255,0.5);margin-bottom:0}
.tp-section{margin-bottom:12px;padding:28px 32px;border-radius:16px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.05);transition:border-color .2s}
.tp-section:hover{border-color:rgba(146,16,246,0.2)}
.tp-section-num{display:inline-flex;align-items:center;justify-content:center;width:28px;height:28px;border-radius:8px;background:linear-gradient(135deg,#9210f6,#610497);font-size:12px;font-weight:800;color:#fff;margin-right:10px;flex-shrink:0}
.tp-section-title{font-size:18px;font-weight:700;color:#fff;margin-bottom:14px;padding-bottom:12px;border-bottom:1px solid rgba(146,16,246,0.15);display:flex;align-items:center}
.tp-text{font-size:15px;line-height:1.8;color:rgba(255,255,255,0.65);margin-bottom:14px}
.tp-text a{color:#c084ff;text-decoration:underline;text-underline-offset:2px}
.tp-text a:hover{color:#fff}
.tp-list{list-style:none;padding:0;margin:0 0 14px}
.tp-list li{font-size:15px;line-height:1.8;color:rgba(255,255,255,0.65);padding-left:22px;position:relative;margin-bottom:6px}
.tp-list li::before{content:'';position:absolute;left:0;top:10px;width:7px;height:7px;border-radius:50%;background:linear-gradient(135deg,#9210f6,#c084ff);box-shadow:0 0 8px rgba(146,16,246,0.4)}
.tp-contact{margin-top:48px;padding:32px;border-radius:20px;background:linear-gradient(135deg,rgba(146,16,246,0.12) 0%,rgba(97,4,151,0.06) 100%);border:1px solid rgba(146,16,246,0.2);position:relative;overflow:hidden}
.tp-contact::before{content:'';position:absolute;top:-40px;right:-40px;width:120px;height:120px;background:radial-gradient(circle,rgba(192,132,252,0.12) 0%,transparent 70%);pointer-events:none}
.tp-contact-title{font-size:16px;font-weight:700;color:#fff;margin-bottom:10px}
.tp-contact-text{font-size:14px;color:rgba(255,255,255,0.6);line-height:1.7}
.tp-contact-text a{color:#c084ff;text-decoration:underline;text-underline-offset:2px}
.tp-contact-text a:hover{color:#fff}
.tp-back{display:inline-flex;align-items:center;gap:8px;font-size:14px;font-weight:600;color:rgba(255,255,255,0.5);text-decoration:none;margin-bottom:24px;transition:color .2s;padding:8px 16px;border-radius:100px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08)}
.tp-back:hover{color:#fff;background:rgba(146,16,246,0.12);border-color:rgba(146,16,246,0.25)}
`

export default function TermsPage() {
  useEffect(() => { window.scrollTo(0, 0) }, [])

  return (
    <>
      <style>{CSS}</style>
      <PlayerNavbar />
      <MascotBubble />
      <MascotCursor />
      <div className="tp-page">
        <div className="tp-container">
          <a href="/" className="tp-back">← Back to Home</a>
          <div className="tp-hero">
            <div className="tp-badge">📋 Legal</div>
            <h1 className="tp-title">Terms & Conditions</h1>
            <p className="tp-updated">Last updated: July 2026</p>
          </div>

          <div className="tp-section">
            <h2 className="tp-section-title"><span className="tp-section-num">1</span> Acceptance of Terms</h2>
            <p className="tp-text">
              By accessing or using PromoGames ("Platform"), you agree to be bound by these Terms &
              Conditions. If you do not agree, please do not use our platform. These terms apply to
              all visitors, players, and business users.
            </p>
          </div>

          <div className="tp-section">
            <h2 className="tp-section-title"><span className="tp-section-num">2</span> Eligibility</h2>
            <p className="tp-text">
              You must be at least 13 years old to use PromoGames. By using the platform, you
              represent that you meet this age requirement and have the legal capacity to enter
              into these terms.
            </p>
          </div>

          <div className="tp-section">
            <h2 className="tp-section-title"><span className="tp-section-num">3</span> Account Registration</h2>
            <ul className="tp-list">
              <li>You must provide accurate and complete information during registration</li>
              <li>You are responsible for safeguarding your account credentials</li>
              <li>You must notify us immediately of any unauthorised access</li>
              <li>One person may not maintain more than one account</li>
              <li>We reserve the right to suspend or terminate accounts that violate these terms</li>
            </ul>
          </div>

          <div className="tp-section">
            <h2 className="tp-section-title"><span className="tp-section-num">4</span> Games & Gameplay</h2>
            <ul className="tp-list">
              <li>Games are provided for entertainment and promotional purposes</li>
              <li>Gameplay is subject to fair play rules — manipulation, bots, or exploitation is prohibited</li>
              <li>Scores, rankings, and achievements are determined by platform algorithms</li>
              <li>We may modify, suspend, or discontinue any game at any time without notice</li>
            </ul>
          </div>

          <div className="tp-section">
            <h2 className="tp-section-title"><span className="tp-section-num">5</span> Rewards & Redemptions</h2>
            <ul className="tp-list">
              <li>Rewards are subject to availability and may change without prior notice</li>
              <li>Points or credits earned have no monetary value and cannot be exchanged for cash</li>
              <li>Redemption of rewards is subject to verification and eligibility criteria</li>
              <li>Fraudulent activity related to rewards will result in account termination</li>
              <li>We are not responsible for rewards provided by third-party partners</li>
            </ul>
          </div>

          <div className="tp-section">
            <h2 className="tp-section-title"><span className="tp-section-num">6</span> User Conduct</h2>
            <p className="tp-text">You agree not to:</p>
            <ul className="tp-list">
              <li>Use automated tools, bots, or scripts to interact with the platform</li>
              <li>Attempt to gain unauthorised access to other accounts or system areas</li>
              <li>Harass, abuse, or harm other users</li>
              <li>Upload or transmit harmful, offensive, or illegal content</li>
              <li>Violate any applicable laws or regulations while using the platform</li>
              <li>Reverse engineer, decompile, or disassemble any part of the platform</li>
            </ul>
          </div>

          <div className="tp-section">
            <h2 className="tp-section-title"><span className="tp-section-num">7</span> Intellectual Property</h2>
            <p className="tp-text">
              All content on PromoGames — including games, designs, logos, text, and software — is
              owned by or licensed to us and protected by intellectual property laws. You may not
              copy, modify, distribute, or create derivative works without our express permission.
            </p>
          </div>

          <div className="tp-section">
            <h2 className="tp-section-title"><span className="tp-section-num">8</span> Limitation of Liability</h2>
            <p className="tp-text">
              PromoGames is provided "as is" without warranties of any kind. We are not liable for
              any indirect, incidental, or consequential damages arising from your use of the platform.
              Our total liability shall not exceed the amount you paid to us in the 12 months preceding
              the claim.
            </p>
          </div>

          <div className="tp-section">
            <h2 className="tp-section-title"><span className="tp-section-num">9</span> Termination</h2>
            <p className="tp-text">
              We may suspend or terminate your access to the platform at any time, with or without
              cause, and without prior notice. Upon termination, your right to use the platform
              ceases immediately. We may also delete your account and associated data.
            </p>
          </div>

          <div className="tp-section">
            <h2 className="tp-section-title"><span className="tp-section-num">10</span> Changes to Terms</h2>
            <p className="tp-text">
              We reserve the right to modify these terms at any time. Changes will be effective
              upon posting. Your continued use of the platform after changes constitutes acceptance
              of the revised terms.
            </p>
          </div>

          <div className="tp-contact">
            <h3 className="tp-contact-title">Contact Us</h3>
            <p className="tp-contact-text">
              For questions about these Terms & Conditions, contact us at{' '}
              <a href="mailto:play@promogames.in">play@promogames.in</a>
            </p>
          </div>
        </div>
      </div>
    </>
  )
}
