import renderMedia, { isVideoUrl } from '../../apps/frontend/src/components/renderMedia'
import { inAnim } from '../../apps/frontend/src/components/animations'

const OVERLAY_STYLES = `
  @keyframes flyFromBottom  { from { transform: translateY(110vh) scale(0.9); opacity:0 } to { transform: translateY(0) scale(1); opacity:1 } }
  @keyframes flyFromTop     { from { transform: translateY(-110vh) scale(0.9); opacity:0 } to { transform: translateY(0) scale(1); opacity:1 } }
  @keyframes flyFromLeft    { from { transform: translateX(-110vw) scale(0.9); opacity:0 } to { transform: translateX(0) scale(1); opacity:1 } }
  @keyframes flyFromRight   { from { transform: translateX(110vw) scale(0.9); opacity:0 } to { transform: translateX(0) scale(1); opacity:1 } }
  @keyframes zoomIn         { from { transform: scale(0.1); opacity:0 } to { transform: scale(1); opacity:1 } }
  @keyframes fadeIn         { from { opacity:0 } to { opacity:1 } }
  @keyframes scaleIn        { from { transform: scale(0.5); opacity:0 } to { transform: scale(1); opacity:1 } }
  @keyframes floatIn        { from { transform:translateY(40px); opacity:0 } to { transform:translateY(0); opacity:1 } }
  @keyframes flyToTop       { from { transform: translateY(0) scale(1); opacity:1 } to { transform: translateY(-110vh) scale(0.9); opacity:0 } }
  @keyframes flyToBottom    { from { transform: translateY(0) scale(1); opacity:1 } to { transform: translateY(110vh) scale(0.9); opacity:0 } }
  @keyframes flyToLeft      { from { transform: translateX(0) scale(1); opacity:1 } to { transform: translateX(-110vw) scale(0.9); opacity:0 } }
  @keyframes flyToRight     { from { transform: translateX(0) scale(1); opacity:1 } to { transform: translateX(110vw) scale(0.9); opacity:0 } }
  @keyframes zoomOut        { from { transform: scale(1); opacity:1 } to { transform: scale(0.1); opacity:0 } }
  @keyframes fadeOut        { from { opacity:1 } to { opacity:0 } }
  @keyframes spin           { to { transform: rotate(360deg) } }
  @keyframes questionEnter  { from { opacity:0; transform: translateY(18px) scale(0.98) } to { opacity:1; transform: translateY(0) scale(1) } }
  @keyframes mascotFloat    { 0%,100% { transform: translateY(0px) } 50% { transform: translateY(-8px) } }
  @keyframes nextBtnIn      { from { opacity:0; transform: translateY(16px) scale(0.9) } to { opacity:1; transform: translateY(0) scale(1) } }
  @keyframes pulse          { 0%,100% { box-shadow: 0 0 0 0 currentColor } 50% { box-shadow: 0 0 0 8px transparent } }
  @keyframes modalIn        { from { opacity:0; transform: scale(0.82) translateY(32px) } to { opacity:1; transform: scale(1) translateY(0) } }
  @keyframes backdropIn     { from { opacity:0 } to { opacity:1 } }
  @keyframes qImgFloat      { 0%,100% { transform: translateY(0px) scale(1) } 50% { transform: translateY(-10px) scale(1.02) } }
  @keyframes qImgBreathe    { 0%,100% { transform: scale(1); opacity:1 } 50% { transform: scale(1.04); opacity:0.9 } }
  @keyframes qImgPulse      { 0%,100% { transform: scale(1); filter: brightness(1) } 50% { transform: scale(1.05); filter: brightness(1.08) } }
  @keyframes qImgShimmer    { 0%,100% { transform: rotate(-1deg) scale(1) } 50% { transform: rotate(1deg) scale(1.03) } }
  @keyframes qImgKenBurns   { 0% { transform: scale(1) translate(0,0) } 100% { transform: scale(1.08) translate(-2%,-2%) } }
  @keyframes qImgBounce     { 0%,100% { transform: translateY(0) } 20% { transform: translateY(-14px) } 40% { transform: translateY(-7px) } 60% { transform: translateY(-3px) } 80% { transform: translateY(-1px) } }
  @keyframes qImgSway      { 0%,100% { transform: translateX(0) } 25% { transform: translateX(-6px) } 75% { transform: translateX(6px) } }
  @keyframes qImgWobble    { 0%,100% { transform: translateX(0) } 15% { transform: translateX(-6px) rotate(-3deg) } 30% { transform: translateX(4px) rotate(2deg) } 45% { transform: translateX(-3px) rotate(-1deg) } 60% { transform: translateX(2px) rotate(1deg) } }
  @keyframes qImgSwing     { 0%,100% { transform: rotate(0deg) } 20% { transform: rotate(6deg) } 40% { transform: rotate(-5deg) } 60% { transform: rotate(3deg) } 80% { transform: rotate(-2deg) } }
  @keyframes qImgTada      { 0%,100% { transform: scale(1) rotate(0deg) } 10% { transform: scale(0.94) rotate(-2deg) } 20% { transform: scale(1.06) rotate(2deg) } 30% { transform: scale(1) rotate(-2deg) } 40% { transform: scale(1.02) rotate(0deg) } }
  @keyframes qImgHeartBeat { 0%,100% { transform: scale(1) } 15% { transform: scale(1.12) } 30% { transform: scale(1) } 45% { transform: scale(1.08) } 60% { transform: scale(1) } }
  @keyframes qImgRotate    { 0% { transform: rotate(0deg) } 100% { transform: rotate(360deg) } }
  @keyframes qImgFlash     { 0%,100% { opacity:1 } 25% { opacity:0.3 } 50% { opacity:1 } 75% { opacity:0.3 } }
  @keyframes qImgRubberBand { 0%,100% { transform: scaleX(1) scaleY(1) } 15% { transform: scaleX(1.2) scaleY(0.85) } 30% { transform: scaleX(0.9) scaleY(1.1) } 45% { transform: scaleX(1.08) scaleY(0.95) } 60% { transform: scaleX(0.97) scaleY(1.03) } }
  @keyframes qImgSlideUpDown { 0%,100% { transform: translateY(0) } 25% { transform: translateY(-20px) } 50% { transform: translateY(0) } 75% { transform: translateY(12px) } }
  @keyframes qImgZoomInOut  { 0%,100% { transform: scale(1) } 50% { transform: scale(1.12) } }
  @keyframes qImgFadeInOut  { 0%,100% { opacity:1 } 50% { opacity:0.3 } }
  @keyframes qImgWave       { 0%,100% { transform: translateY(0) rotate(0deg) } 25% { transform: translateY(-6px) rotate(1deg) } 50% { transform: translateY(0) rotate(0deg) } 75% { transform: translateY(4px) rotate(-1deg) } }
  @keyframes qImgOrbit      { 0% { transform: translate(0,0) } 25% { transform: translate(10px,-10px) } 50% { transform: translate(0,-16px) } 75% { transform: translate(-10px,-10px) } 100% { transform: translate(0,0) } }
  @keyframes qImgGlitch     { 0%,100% { transform: translate(0) } 20% { transform: translate(-2px,1px) skewX(-1deg) } 40% { transform: translate(2px,-1px) skewX(1deg) } 60% { transform: translate(-1px,-1px) skewX(-0.5deg) } 80% { transform: translate(1px,2px) skewX(0.5deg) } }
  @keyframes qImgBlurBlink  { 0%,100% { filter:blur(0);opacity:1 } 25% { filter:blur(3px);opacity:0.6 } 50% { filter:blur(0);opacity:1 } 75% { filter:blur(2px);opacity:0.7 } }
  @keyframes qImgSkew       { 0%,100% { transform: skewX(0deg) } 25% { transform: skewX(-4deg) } 50% { transform: skewX(0deg) } 75% { transform: skewX(4deg) } }
  @keyframes qImgRoll       { 0% { transform: translateX(0) rotate(0deg) } 50% { transform: translateX(60px) rotate(360deg) } 100% { transform: translateX(0) rotate(720deg) } }
  @keyframes qImgBounceIn   { 0% { transform: scale(0);opacity:0 } 50% { transform: scale(1.12) } 70% { transform: scale(0.94) } 85% { transform: scale(1.04) } 100% { transform: scale(1);opacity:1 } }
  @keyframes qImgJello      { 0%,100% { transform: skewX(0deg) skewY(0deg) } 25% { transform: skewX(-5deg) skewY(3deg) } 50% { transform: skewX(5deg) skewY(-3deg) } 75% { transform: skewX(-3deg) skewY(2deg) } }
`

const parseCornersJson = (s) => {
  if (!s) return {}
  try { const o = JSON.parse(s); if (o && typeof o === 'object') return o } catch {}
  return {}
}
const cornersToCss = (overrides, base) => {
  const b = base != null ? Number(base) : 0
  const tl = Number(overrides?.tl ?? b)
  const tr = Number(overrides?.tr ?? b)
  const br = Number(overrides?.br ?? b)
  const bl = Number(overrides?.bl ?? b)
  return `${tl}px ${tr}px ${br}px ${bl}px`
}
// Gradient border ring that follows border-radius (border-image cannot round corners).
const ringBorder = (fill, grad, width) => {
  if (!grad || !width || width <= 0) return null
  const f = String(fill || '#1a1a2e').startsWith('linear-gradient') ? fill : `linear-gradient(135deg, ${fill || '#1a1a2e'}, ${fill || '#1a1a2e'})`
  return {
    background: `${f} padding-box, ${grad} border-box`,
    backgroundClip: 'padding-box, border-box',
    border: `${width}px solid transparent`,
  }
}

function SubmittingPopup({ primaryColor, ff }) {
  return (
    <div style={{
      position:'fixed',inset:0,zIndex:2100,
      display:'flex',alignItems:'center',justifyContent:'center',
      background:'rgba(0,0,0,0.65)',backdropFilter:'blur(8px)',
      animation:'backdropIn 0.3s ease'
    }}>
      <div style={{
        background:'#fff',borderRadius:24,
        padding:'clamp(28px,7vw,40px) clamp(24px,6vw,36px)',
        maxWidth:340,width:'100%',textAlign:'center',
        boxShadow:'0 24px 80px rgba(0,0,0,0.35)',
        animation:'modalIn 0.45s cubic-bezier(0.34,1.56,0.64,1)',
        fontFamily:ff,boxSizing:'border-box'
      }}>
        <div style={{
          width:56,height:56,borderRadius:'50%',
          background:`${primaryColor}15`,display:'flex',
          alignItems:'center',justifyContent:'center',
          margin:'0 auto 20px',animation:'pulse 1.5s ease-in-out infinite'
        }}>
          <div style={{
            width:28,height:28,border:`3px solid ${primaryColor}30`,
            borderTopColor:primaryColor,borderRadius:'50%',
            animation:'spin 0.8s linear infinite'
          }} />
        </div>
        <h3 style={{fontSize:20,fontWeight:800,color:'#1a1a2e',marginBottom:10,lineHeight:1.3}}>
          Submitting your progress…
        </h3>
        <p style={{fontSize:14,color:'#666',margin:0,lineHeight:1.5}}>
          Please wait a moment.
        </p>
      </div>
    </div>
  )
}

export default function QuizPlayerPage({
  game, currentQ, sessionToken, answered, selectedOpt, selectValue, checkedOpts,
  shortAnswerText, score, totalScoreable, completing, timeLeft, questionKey,
  overlayState, overlayData, showNextBtn, primaryColor, ff, s,
  showContinueBtn, qImgWrapRef, flyOutRef,
  handleOptionSelect, handleSelectSubmit, handleCheckboxSubmit,
  handleShortAnswerSubmit, handleCheckboxToggle, handleContinueClick,
  setSelectValue, setShortAnswerText,
  getPageBg, optionBgColor, optionTextColor, optionBorderColor,
  questions,
}) {
  const qlist = questions && questions.length ? questions : (game.questions || [])
  const question = qlist[currentQ]
  const poolLen = qlist.length
  if (!question || !poolLen) {
    return (
      <div style={{ minHeight:'100dvh', display:'flex', alignItems:'center', justifyContent:'center', background:'#f4f4ff', fontFamily:'DM Sans, sans-serif' }}>
        <div style={{ textAlign:'center', padding:40 }}>
          <div style={{ fontSize:48, marginBottom:12 }}>😕</div>
          <h2 style={{ color:'#1a1a2e', fontSize:22, marginBottom:8 }}>No questions available</h2>
          <p style={{ color:'#666', fontSize:14 }}>This game doesn't have any questions configured.</p>
        </div>
      </div>
    )
  }

  const tpl = s.templateConfig || {}
  const progress = (currentQ / poolLen) * 100
  const qBg = question.question_bg_image_url
  const gameBg = s.bg_image_url
  const bgStyle = getPageBg(qBg, gameBg, s.bg_color || '#f4f4ff')
  const hasBgImage = !!(qBg || gameBg)
  const isOverlayActive = overlayState !== 'hidden'
  const qImgAnimKey = question.question_image_animation || 'float'

  const getOverlayImgStyle = () => {
    if (!overlayData) return {}
    if (overlayState === 'flyingIn') return { animation: `${overlayData.animIn} 0.6s cubic-bezier(0.34,1.3,0.64,1) forwards` }
    if (overlayState === 'visible') return { transform: 'translateY(0) translateX(0) scale(1)', opacity: 1 }
    if (overlayState === 'flyingOut') return { animation: `${overlayData.animOut} 0.5s cubic-bezier(0.55,0,0.85,0.36) forwards` }
    return { opacity: 0 }
  }

  const getOptionStyleLocal = (opt, question, currentSelectedOpt) => {
    const borderColor = opt.option_border_color && opt.option_border_color !== 'transparent' ? opt.option_border_color : optionBorderColor
    const borderWidth = (opt.option_border_width ?? 0) > 0 ? opt.option_border_width : (borderColor && borderColor !== 'transparent' ? 2 : 0)
    const radius = opt.option_corners_json ? cornersToCss(parseCornersJson(opt.option_corners_json), opt.option_border_radius != null ? opt.option_border_radius : 14) : (opt.option_border_radius != null ? opt.option_border_radius : 14)
    const gradient = opt.option_font_gradient
    const base = { borderColor, borderWidth, radius, gradient }
    if (!answered) {
      const ring = ringBorder(opt.option_bg_gradient || opt.option_color || optionBgColor, opt.option_border_gradient, borderWidth)
      return { ring, bg: opt.option_bg_gradient || opt.option_color || optionBgColor, text: opt.option_text_color || optionTextColor, border: `${borderWidth}px solid ${borderColor||'transparent'}`, radius, gradient, shadow: '0 2px 8px rgba(0,0,0,0.1)', opacity: 1, scale: 'scale(1)' }
    }
    const isRightWrong = question.question_type === 'right_wrong'
    const isSelected = currentSelectedOpt?.id === opt.id
    if (isRightWrong) {
      if (opt.is_correct) return { bg: '#22c55e', text: '#fff', border: `${borderWidth}px solid #16a34a`, radius, gradient, shadow: '0 4px 20px rgba(34,197,94,0.45)', opacity: 1, scale: 'scale(1)' }
      else if (isSelected) return { bg: '#ef4444', text: '#fff', border: `${borderWidth}px solid #dc2626`, radius, gradient, shadow: '0 4px 20px rgba(239,68,68,0.45)', opacity: 1, scale: 'scale(0.97)' }
      else return { bg: '#ef4444', text: '#fff', border: `${borderWidth}px solid #dc2626`, radius, gradient, shadow: 'none', opacity: 0.45, scale: 'scale(0.97)' }
    } else {
      if (isSelected) return { bg: primaryColor, text: '#fff', border: `${borderWidth}px solid ${primaryColor}`, radius, gradient, shadow: `0 4px 16px ${primaryColor}55`, opacity: 1, scale: 'scale(0.97)' }
      return { bg: opt.option_bg_gradient || opt.option_color || '#1a1a2e', text: opt.option_text_color || '#ffffff', border: `${borderWidth}px solid ${borderColor||'transparent'}`, radius, gradient, shadow: '0 2px 8px rgba(0,0,0,0.1)', opacity: 0.5, scale: 'scale(1)' }
    }
  }

  return (
    <>
      {completing && <SubmittingPopup primaryColor={primaryColor} ff={ff} />}
      <div style={{
        height:'100dvh',maxHeight:'100dvh',overflow:'hidden',
        ...bgStyle,
        display:'flex',flexDirection:'column',alignItems:'center',
        fontFamily:ff,position:'relative',
        paddingTop:'env(safe-area-inset-top)',paddingBottom:'env(safe-area-inset-bottom)',
        paddingLeft:'env(safe-area-inset-left)',paddingRight:'env(safe-area-inset-right)',
        boxSizing:'border-box',
      }}>
        {qBg && isVideoUrl(qBg) && (
          <video src={qBg} autoPlay muted loop playsInline
            style={{ position:'absolute',inset:0,width:'100%',height:'100%',objectFit:'cover',zIndex:0 }} />
        )}

        {isOverlayActive && overlayData && (
          <div style={{
            position:'fixed',inset:0,zIndex:1000,
            display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',
            background:'rgba(0,0,0,0.82)',backdropFilter:'blur(6px)',WebkitBackdropFilter:'blur(6px)',
          }}>
            {renderMedia(overlayData.src, {
              width:'100vw',height:'100dvh',objectFit:'contain',display:'block',
              ...getOverlayImgStyle()
            }, { autoPlay:true,muted:false,loop:false,controls:false })}
            {showNextBtn && (
              <button onClick={() => flyOutRef.current?.()} style={{
                position:'absolute',bottom:'calc(env(safe-area-inset-bottom) + 32px)',zIndex:1001,
                background:s.next_button_bg_color||`linear-gradient(135deg, ${primaryColor}, ${primaryColor}cc)`,
                color:s.next_button_text_color||'#fff',border:'none',borderRadius:50,
                padding:'16px 44px',fontSize:18,fontWeight:700,cursor:'pointer',fontFamily:ff,
                boxShadow:s.next_button_bg_color?'0 12px 40px rgba(0,0,0,0.2)':`0 12px 40px ${primaryColor}88`,
                animation:'nextBtnIn 0.4s cubic-bezier(0.34,1.56,0.64,1) forwards',
                letterSpacing:'0.02em',minWidth:160,minHeight:54,touchAction:'manipulation',
              }}>
                {s.next_button_text||'Next →'}
              </button>
            )}
          </div>
        )}

        <div style={{ width:'100%',maxWidth:520,flex:1,minHeight:0,display:'flex',flexDirection:'column',boxSizing:'border-box',padding:'0 14px' }}>
          {s.show_progress !== 0 && (
            <div style={{ flexShrink:0,paddingTop:12,paddingBottom:10 }}>
              <div style={{ display:'flex',justifyContent:'space-between',marginBottom:5,fontSize:12,color:hasBgImage?'rgba(255,255,255,0.9)':'#888',fontWeight:600 }}>
                <span>Question {currentQ+1} of {poolLen}</span>
                <div style={{ display:'flex',gap:12,alignItems:'center' }}>
                  {timeLeft!==null&&!answered&&(
                    <span style={{ color:timeLeft<=5?'#ef4444':(hasBgImage?'rgba(255,255,255,0.9)':'#888'),fontWeight:700 }}>
                      ⏱ {timeLeft}s
                    </span>
                  )}
                  <span>{Math.round(progress)}%</span>
                </div>
              </div>
              <div style={{ height:5,background:hasBgImage?'rgba(255,255,255,0.25)':'#e8e8f5',borderRadius:10,overflow:'hidden' }}>
                <div style={{ height:'100%',width:`${progress}%`,background:`linear-gradient(90deg, ${primaryColor}, ${primaryColor}bb)`,borderRadius:10,transition:'width 0.5s ease' }} />
              </div>
            </div>
          )}

          <div key={questionKey} style={{
            flex:1,minHeight:0,display:'flex',flexDirection:'column',
            background:hasBgImage?'rgba(255,255,255,0.14)':'rgba(255,255,255,0.97)',
            backdropFilter:'blur(20px)',WebkitBackdropFilter:'blur(20px)',
            borderRadius:22,border:hasBgImage?'1px solid rgba(255,255,255,0.3)':'1px solid rgba(0,0,0,0.06)',
            boxShadow:hasBgImage?'0 8px 40px rgba(0,0,0,0.28)':'0 8px 40px rgba(0,0,0,0.12)',
            animation:'questionEnter 0.4s cubic-bezier(0.34,1.3,0.64,1)',marginBottom:12,overflow:'hidden',boxSizing:'border-box',
          }}>
            {question.question_image_url && (() => {
              const idleAnimDef = qImgAnimKey!=='none' ? (() => {
                const map = {
                  float:'qImgFloat 3s ease-in-out infinite',breathe:'qImgBreathe 2.8s ease-in-out infinite',
                  pulse:'qImgPulse 2.4s ease-in-out infinite',shimmer:'qImgShimmer 3s ease-in-out infinite',
                  kenburns:'qImgKenBurns 8s ease-in-out infinite alternate',bounce:'qImgBounce 1.8s ease-in-out infinite',
                  sway:'qImgSway 2.5s ease-in-out infinite',wobble:'qImgWobble 2.2s ease-in-out infinite',
                  swing:'qImgSwing 2.4s ease-in-out infinite',tada:'qImgTada 2.6s ease-in-out infinite',
                  heartBeat:'qImgHeartBeat 1.6s ease-in-out infinite',rotate:'qImgRotate 6s linear infinite',
                  flash:'qImgFlash 1.8s ease-in-out infinite',rubberBand:'qImgRubberBand 2s ease-in-out infinite',
                  slideUpDown:'qImgSlideUpDown 3s ease-in-out infinite',zoomInOut:'qImgZoomInOut 2.4s ease-in-out infinite',
                  fadeInOut:'qImgFadeInOut 2.6s ease-in-out infinite',wave:'qImgWave 2.8s ease-in-out infinite',
                  orbit:'qImgOrbit 4s ease-in-out infinite',glitch:'qImgGlitch 1.5s ease-in-out infinite',
                  blurBlink:'qImgBlurBlink 2.2s ease-in-out infinite',skew:'qImgSkew 2.5s ease-in-out infinite',
                  roll:'qImgRoll 3s ease-in-out infinite',bounceIn:'qImgBounceIn 2.2s ease-in-out infinite',
                  jello:'qImgJello 2.4s ease-in-out infinite',
                }
                return map[qImgAnimKey]||map.float
              })() : null
              const entranceAnim = inAnim(tpl.anim_question_in||'floatIn', 0.5)
              const combinedAnim = idleAnimDef ? `${entranceAnim}, ${idleAnimDef}` : entranceAnim
              return (
                <div ref={qImgWrapRef} style={{
                  flex:1,minHeight:0,display:'flex',alignItems:'center',justifyContent:'center',
                  padding:'14px 14px 0',background:hasBgImage?'rgba(0,0,0,0.10)':'rgba(0,0,0,0.03)',
                  overflow:'hidden',position:'relative',boxSizing:'border-box',
                }}>
                  {renderMedia(question.question_image_url, {
                    width:'100%',height:'100%',objectFit:'contain',display:'block',borderRadius:10,
                    animation:combinedAnim,transformOrigin:'center center',
                  }, { autoPlay:true,muted:false,loop:false,playsInline:true,
                    onTimeUpdate:(e)=>{ const v=e.currentTarget; if(v.currentTime>=7){try{v.pause()}catch{}} }
                  })}
                  {Boolean(game?.settings?.enable_mascot)&&(
                    <img src="/mascot.png.png" alt="Mascot" style={{
                      position:'absolute',right:10,bottom:10,width:64,height:'auto',zIndex:5,
                      pointerEvents:'none',filter:'drop-shadow(0 4px 10px rgba(0,0,0,0.25))',
                      animation:'mascotFloat 3s ease-in-out infinite',
                    }} />
                  )}
                </div>
              )
            })()}

            <div style={{ flexShrink:0,display:'flex',flexDirection:'column',padding:'12px 14px 14px',gap:10,boxSizing:'border-box' }}>
              <h2 style={{
                color:hasBgImage?'#fff':(question.question_color||'#1a1a2e'),
                fontSize:'clamp(13px,3.8vw,18px)',lineHeight:1.4,textAlign:'center',
                fontFamily:ff,margin:0,textShadow:hasBgImage?'0 1px 4px rgba(0,0,0,0.4)':'none',
                fontWeight:700,animation:'questionEnter 0.45s 0.1s both ease',
              }}>
                {question.question_text}
              </h2>

              <div style={{ display:'flex',flexDirection:'column',gap:8 }}>
                {question.question_type==='select' ? (
                  <div style={{ display:'flex',flexDirection:'column',gap:10,alignItems:'center' }}>
                    <select value={selectValue} onChange={e=>setSelectValue(e.target.value)} disabled={answered}
                      style={{ width:'100%',maxWidth:420,padding:'14px 18px',borderRadius:14,border:`2px solid ${primaryColor}40`,background:'rgba(255,255,255,0.95)',fontSize:'clamp(15px,4vw,18px)',fontWeight:600,color:'#1a1a2e',textAlign:'center',fontFamily:ff,outline:'none' }}>
                      <option value="">— Select an option —</option>
                      {(question.options||[]).map(o=>(<option key={o.id} value={o.id}>{o.option_text}</option>))}
                    </select>
                    {!answered&&(
                      <button onClick={()=>handleSelectSubmit(sessionToken)} disabled={!selectValue}
                        style={{ background:selectValue?`linear-gradient(135deg, ${primaryColor}, ${primaryColor}cc)`:'#ccc',color:'#fff',border:'none',borderRadius:50,padding:'14px 40px',fontSize:16,fontWeight:700,cursor:selectValue?'pointer':'not-allowed',fontFamily:ff }}>
                        Submit →
                      </button>
                    )}
                    {answered&&<div style={{ marginTop:8,padding:'10px 18px',borderRadius:12,background:'rgba(34,197,94,0.1)',border:'1.5px solid rgba(34,197,94,0.3)',color:'#16a34a',fontSize:14,fontWeight:600 }}>✓ Recorded</div>}
                  </div>
                ) : question.question_type==='checkbox' ? (
                  <div style={{ display:'flex',flexDirection:'column',gap:8 }}>
                    {(question.options||[]).map(opt=>{
                      const checked=checkedOpts.some(o=>o.id===opt.id)
                      return (
                        <button key={opt.id} onClick={()=>handleCheckboxToggle(opt)} disabled={answered}
                          style={{ display:'flex',alignItems:'center',gap:12,textAlign:'left',background:checked?`${primaryColor}1a`:'rgba(255,255,255,0.95)',border:`2px solid ${checked?primaryColor:'#e3e6f0'}`,borderRadius:14,padding:'14px 18px',cursor:answered?'default':'pointer',fontFamily:ff }}>
                          <span style={{ width:22,height:22,borderRadius:6,border:`2px solid ${checked?primaryColor:'#cbd0dd'}`,display:'flex',alignItems:'center',justifyContent:'center',background:checked?primaryColor:'#fff',color:'#fff',fontWeight:800,fontSize:14 }}>{checked?'✓':''}</span>
                          <span style={{ fontSize:'clamp(15px,4vw,18px)',fontWeight:600,color:'#1a1a2e' }}>{opt.option_text}</span>
                        </button>
                      )
                    })}
                    {!answered&&(
                      <button onClick={()=>handleCheckboxSubmit(sessionToken)} disabled={checkedOpts.length===0}
                        style={{ alignSelf:'center',marginTop:6,background:checkedOpts.length?`linear-gradient(135deg, ${primaryColor}, ${primaryColor}cc)`:'#ccc',color:'#fff',border:'none',borderRadius:50,padding:'14px 40px',fontSize:16,fontWeight:700,cursor:checkedOpts.length?'pointer':'not-allowed',fontFamily:ff }}>
                        Submit →
                      </button>
                    )}
                    {answered&&<div style={{ alignSelf:'center',marginTop:8,padding:'10px 18px',borderRadius:12,background:'rgba(34,197,94,0.1)',border:'1.5px solid rgba(34,197,94,0.3)',color:'#16a34a',fontSize:14,fontWeight:600 }}>✓ Recorded</div>}
                  </div>
                ) : question.question_type==='short_answer' ? (
                  <div style={{ display:'flex',flexDirection:'column',gap:10,alignItems:'center' }}>
                    <input type={question.answer_is_number?'number':'text'} value={shortAnswerText}
                      onChange={e=>setShortAnswerText(e.target.value)}
                      onKeyDown={e=>{if(e.key==='Enter')handleShortAnswerSubmit()}}
                      placeholder={question.answer_is_number?'Enter a number…':'Type your answer…'}
                      disabled={answered}
                      style={{ width:'100%',padding:'14px 18px',borderRadius:14,border:answered?'2px solid #22c55e':`2px solid ${primaryColor}40`,background:answered?'rgba(34,197,94,0.08)':'rgba(255,255,255,0.95)',fontSize:'clamp(15px,4vw,18px)',fontWeight:600,color:'#1a1a2e',textAlign:'center',fontFamily:ff,outline:'none',transition:'all 0.25s ease',boxShadow:answered?'0 4px 16px rgba(34,197,94,0.2)':'0 2px 8px rgba(0,0,0,0.06)' }} />
                    {!answered&&(
                      <button onClick={handleShortAnswerSubmit} disabled={!shortAnswerText.trim()}
                        style={{ background:shortAnswerText.trim()?`linear-gradient(135deg, ${primaryColor}, ${primaryColor}cc)`:'#ccc',color:'#fff',border:'none',borderRadius:50,padding:'14px 40px',fontSize:16,fontWeight:700,cursor:shortAnswerText.trim()?'pointer':'not-allowed',fontFamily:ff,boxShadow:shortAnswerText.trim()?`0 8px 24px ${primaryColor}66`:'none',transition:'all 0.25s ease',touchAction:'manipulation',animation:'questionEnter 0.4s 0.2s both ease' }}>
                        Submit Answer →
                      </button>
                    )}
                    {answered&&(
                      <div style={{ marginTop:8,padding:'10px 18px',borderRadius:12,background:'rgba(34,197,94,0.1)',border:'1.5px solid rgba(34,197,94,0.3)',color:'#16a34a',fontSize:14,fontWeight:600,fontFamily:ff,animation:'questionEnter 0.3s ease' }}>
                        ✓ Answer recorded
                      </div>
                    )}
                  </div>
                ) : (
                  (question.options||[]).map((opt,optIdx)=>{
                    const os = getOptionStyleLocal(opt,question,selectedOpt)
                    return (
                      <button key={opt.id} onClick={()=>handleOptionSelect(opt,sessionToken)} disabled={answered}
                        style={{
                          ...(os.ring ? { background:os.ring.background, backgroundClip:os.ring.backgroundClip, border:os.ring.border } : { background:os.bg, border:os.border }),
                          borderRadius:os.radius,flex:1,minHeight:48,
                          color:os.text,fontSize:'clamp(13px,3.5vw,15px)',fontWeight:600,
                          cursor:answered?'default':'pointer',textAlign:'center',lineHeight:1.3,
                          fontFamily:ff,transition:'all 0.25s ease',boxShadow:os.shadow,
                          display:'flex',alignItems:'center',justifyContent:'center',gap:10,
                          transform:os.scale,width:'100%',opacity:os.opacity,touchAction:'manipulation',
                          animation:`questionEnter 0.4s ${0.15+optIdx*0.06}s both ease`,
                          WebkitTapHighlightColor:'transparent',userSelect:'none',WebkitUserSelect:'none',
                          padding:'0 14px',boxSizing:'border-box',
                        }}>
                        {opt.option_image_url&&renderMedia(opt.option_image_url,{width:'auto',height:32,objectFit:'contain',borderRadius:8,flexShrink:0})}
                        {os.gradient ? (
                          <span style={{ flex:1,textAlign:'center',background:os.gradient,WebkitBackgroundClip:'text',backgroundClip:'text',color:'transparent',WebkitTextFillColor:'transparent' }}>{opt.option_text}</span>
                        ) : (
                          <span style={{ flex:1,textAlign:'center' }}>{opt.option_text}</span>
                        )}
                      </button>
                    )
                  })
                )}
              </div>

              {showContinueBtn&&(
                <button onClick={handleContinueClick} style={{
                  marginTop:12,background:`linear-gradient(135deg, ${primaryColor}, ${primaryColor}cc)`,
                  color:'#fff',border:'none',borderRadius:50,padding:'16px 44px',fontSize:18,fontWeight:700,
                  cursor:'pointer',fontFamily:ff,boxShadow:`0 12px 40px ${primaryColor}88`,
                  animation:'nextBtnIn 0.4s cubic-bezier(0.34,1.56,0.64,1) forwards',
                  letterSpacing:'0.02em',minWidth:160,minHeight:54,touchAction:'manipulation',
                  width:'100%',maxWidth:160,alignSelf:'center',
                }}>
                  Continue →
                </button>
              )}
            </div>
          </div>
        </div>

        {completing&&(
          <div style={{ marginBottom:12,flexShrink:0,display:'flex',alignItems:'center',gap:10,background:'rgba(255,255,255,0.85)',backdropFilter:'blur(10px)',borderRadius:12,padding:'10px 18px',fontSize:13,color:'#555' }}>
            <span style={{ width:16,height:16,border:`2px solid ${primaryColor}44`,borderTopColor:primaryColor,borderRadius:'50%',animation:'spin 0.7s linear infinite',display:'inline-block' }} />
            Saving results…
          </div>
        )}
        <style>{OVERLAY_STYLES}</style>
      </div>
    </>
  )
}
