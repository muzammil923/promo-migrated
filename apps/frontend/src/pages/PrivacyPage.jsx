import { useEffect } from 'react'
import PlayerNavbar from '../components/PlayerNavbar'
import MascotBubble from '../components/MascotBubble'
import MascotCursor from '../components/MascotCursor'

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
html,body{background:#07040f;width:100%;min-height:100vh}
.pp-page{min-height:100vh;background:#07040f;font-family:'Outfit',sans-serif;color:#fff;padding:120px 24px 80px;position:relative;overflow:hidden;width:100%}
.pp-page::before{content:'';position:absolute;top:-200px;left:50%;transform:translateX(-50%);width:900px;height:900px;background:radial-gradient(circle,rgba(146,16,246,0.18) 0%,rgba(146,16,246,0.06) 40%,transparent 70%);pointer-events:none}
.pp-page::after{content:'';position:absolute;bottom:-300px;right:-200px;width:700px;height:700px;background:radial-gradient(circle,rgba(97,4,151,0.12) 0%,transparent 60%);pointer-events:none}
.pp-container{max-width:780px;margin:0 auto;position:relative;z-index:1}
.pp-hero{position:relative;padding:48px 40px;border-radius:24px;background:linear-gradient(135deg,rgba(146,16,246,0.15) 0%,rgba(97,4,151,0.08) 100%);border:1px solid rgba(146,16,246,0.2);margin-bottom:48px;overflow:hidden}
.pp-hero::before{content:'';position:absolute;top:0;right:0;width:200px;height:200px;background:radial-gradient(circle,rgba(192,132,252,0.15) 0%,transparent 70%);pointer-events:none}
.pp-badge{display:inline-flex;align-items:center;gap:8px;padding:6px 16px;border-radius:100px;background:rgba(146,16,246,0.2);border:1px solid rgba(146,16,246,0.35);font-size:12px;font-weight:600;color:#c084ff;margin-bottom:20px;letter-spacing:.5px}
.pp-title{font-size:clamp(32px,5vw,48px);font-weight:800;line-height:1.15;margin-bottom:12px;background:linear-gradient(135deg,#fff 20%,#c084ff 100%);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
.pp-updated{font-size:13px;color:rgba(255,255,255,0.5);margin-bottom:0}
.pp-section{margin-bottom:12px;padding:28px 32px;border-radius:16px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.05);transition:border-color .2s}
.pp-section:hover{border-color:rgba(146,16,246,0.2)}
.pp-section-num{display:inline-flex;align-items:center;justify-content:center;width:28px;height:28px;border-radius:8px;background:linear-gradient(135deg,#9210f6,#610497);font-size:12px;font-weight:800;color:#fff;margin-right:10px;flex-shrink:0}
.pp-section-title{font-size:18px;font-weight:700;color:#fff;margin-bottom:14px;padding-bottom:12px;border-bottom:1px solid rgba(146,16,246,0.15);display:flex;align-items:center}
.pp-text{font-size:15px;line-height:1.8;color:rgba(255,255,255,0.65);margin-bottom:14px}
.pp-text a{color:#c084ff;text-decoration:underline;text-underline-offset:2px}
.pp-text a:hover{color:#fff}
.pp-list{list-style:none;padding:0;margin:0 0 14px}
.pp-list li{font-size:15px;line-height:1.8;color:rgba(255,255,255,0.65);padding-left:22px;position:relative;margin-bottom:6px}
.pp-list li::before{content:'';position:absolute;left:0;top:10px;width:7px;height:7px;border-radius:50%;background:linear-gradient(135deg,#9210f6,#c084ff);box-shadow:0 0 8px rgba(146,16,246,0.4)}
.pp-contact{margin-top:48px;padding:32px;border-radius:20px;background:linear-gradient(135deg,rgba(146,16,246,0.12) 0%,rgba(97,4,151,0.06) 100%);border:1px solid rgba(146,16,246,0.2);position:relative;overflow:hidden}
.pp-contact::before{content:'';position:absolute;top:-40px;right:-40px;width:120px;height:120px;background:radial-gradient(circle,rgba(192,132,252,0.12) 0%,transparent 70%);pointer-events:none}
.pp-contact-title{font-size:16px;font-weight:700;color:#fff;margin-bottom:10px}
.pp-contact-text{font-size:14px;color:rgba(255,255,255,0.6);line-height:1.7}
.pp-contact-text a{color:#c084ff;text-decoration:underline;text-underline-offset:2px}
.pp-contact-text a:hover{color:#fff}
.pp-back{display:inline-flex;align-items:center;gap:8px;font-size:14px;font-weight:600;color:rgba(255,255,255,0.5);text-decoration:none;margin-bottom:24px;transition:color .2s;padding:8px 16px;border-radius:100px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08)}
.pp-back:hover{color:#fff;background:rgba(146,16,246,0.12);border-color:rgba(146,16,246,0.25)}
`

export default function PrivacyPage() {
  useEffect(() => { window.scrollTo(0, 0) }, [])

  return (
    <>
      <style>{CSS}</style>
      <PlayerNavbar />
      <MascotBubble />
      <MascotCursor />
      <div className="pp-page">
        <div className="pp-container">
          <a href="/" className="pp-back">← Back to Home</a>
          <div className="pp-hero">
            <div className="pp-badge">📄 Legal</div>
            <h1 className="pp-title">Privacy Policy</h1>
            <p className="pp-updated">Last updated: July 2026</p>
          </div>

          <div className="pp-section">
            <h2 className="pp-section-title"><span className="pp-section-num">1</span> Introduction</h2>
            <p className="pp-text">
              Welcome to PromoGames ("we," "our," or "us"). We are committed to protecting your privacy.
              This Privacy Policy explains how we collect, use, disclose, and safeguard your information
              when you visit our website <a href="https://www.promogames.in">promogames.in</a> and use our gamification platform.
            </p>
          </div>

          <div className="pp-section">
            <h2 className="pp-section-title"><span className="pp-section-num">2</span> Information We Collect</h2>
            <p className="pp-text">We may collect the following types of information:</p>
            <ul className="pp-list">
              <li>Personal identification details (name, email address, phone number) when you register or contact us</li>
              <li>Account credentials and profile information</li>
              <li>Gameplay data including scores, achievements, and reward history</li>
              <li>Device information, browser type, IP address, and operating system</li>
              <li>Usage data such as pages visited, time spent, and interaction patterns</li>
              <li>Cookies and similar tracking technologies</li>
            </ul>
          </div>

          <div className="pp-section">
            <h2 className="pp-section-title"><span className="pp-section-num">3</span> How We Use Your Information</h2>
            <ul className="pp-list">
              <li>To provide, operate, and maintain our platform and services</li>
              <li>To personalise your experience and deliver relevant game content</li>
              <li>To process transactions, rewards, and redemptions</li>
              <li>To communicate with you about updates, promotions, and support</li>
              <li>To analyse usage patterns and improve our platform</li>
              <li>To detect and prevent fraud, abuse, and security issues</li>
              <li>To comply with legal obligations and enforce our terms</li>
            </ul>
          </div>

          <div className="pp-section">
            <h2 className="pp-section-title"><span className="pp-section-num">4</span> Cookies & Tracking</h2>
            <p className="pp-text">
              We use cookies and similar technologies to enhance your experience. Essential cookies are
              necessary for the platform to function. Analytics cookies help us understand how visitors
              interact with our site. You can manage your cookie preferences through our cookie banner
              or your browser settings.
            </p>
          </div>

          <div className="pp-section">
            <h2 className="pp-section-title"><span className="pp-section-num">5</span> Data Sharing</h2>
            <p className="pp-text">We do not sell your personal information. We may share data with:</p>
            <ul className="pp-list">
              <li>Service providers who assist in platform operations (hosting, analytics, payment processing)</li>
              <li>Business partners when you participate in branded game campaigns (with your consent)</li>
              <li>Law enforcement when required by law or to protect our rights</li>
              <li>In connection with a merger, acquisition, or sale of assets (with prior notice)</li>
            </ul>
          </div>

          <div className="pp-section">
            <h2 className="pp-section-title"><span className="pp-section-num">6</span> Data Security</h2>
            <p className="pp-text">
              We implement industry-standard security measures including encryption, access controls,
              and regular security audits. While no method of transmission is 100% secure, we strive
              to protect your personal information using commercially acceptable means.
            </p>
          </div>

          <div className="pp-section">
            <h2 className="pp-section-title"><span className="pp-section-num">7</span> Your Rights</h2>
            <ul className="pp-list">
              <li>Access, correct, or delete your personal data</li>
              <li>Opt out of marketing communications at any time</li>
              <li>Request a copy of the data we hold about you</li>
              <li>Withdraw consent for data processing where applicable</li>
              <li>Lodge a complaint with a relevant data protection authority</li>
            </ul>
          </div>

          <div className="pp-section">
            <h2 className="pp-section-title"><span className="pp-section-num">8</span> Children's Privacy</h2>
            <p className="pp-text">
              Our platform is not intended for children under 13. We do not knowingly collect personal
              information from children. If you believe a child has provided us with personal data,
              please contact us immediately.
            </p>
          </div>

          <div className="pp-section">
            <h2 className="pp-section-title"><span className="pp-section-num">9</span> Changes to This Policy</h2>
            <p className="pp-text">
              We may update this Privacy Policy from time to time. Changes will be posted on this page
              with an updated revision date. Continued use of the platform after changes constitutes
              acceptance of the revised policy.
            </p>
          </div>

          <div className="pp-contact">
            <h3 className="pp-contact-title">Contact Us</h3>
            <p className="pp-contact-text">
              If you have questions about this Privacy Policy, please reach out at{' '}
              <a href="mailto:play@promogames.in">play@promogames.in</a>
            </p>
          </div>
        </div>
      </div>
    </>
  )
}
