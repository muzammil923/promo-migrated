/**
 * Shared "thank you" / completion screen preview for all game builder phone mockups.
 *
 * Props:
 *   settings       - game settings object
 *   bgUrl          - optional override for background image URL
 *   submitGifUrl   - optional URL for a submission GIF/image
 */
export default function ThankYouPreview({ settings, bgUrl, submitGifUrl }) {
  const hasBg = bgUrl ?? settings?.thankyou_bg_image_url ?? settings?.bg_image_url

  return (
    <div style={{
      flex: 1, display: 'flex', flexDirection: 'column',
      background: hasBg
        ? `url(${hasBg}) center/cover`
        : (settings?.bg_color || '#f4f4ff'),
      padding: 'clamp(16px,4vw,20px) 12px',
      overflow: 'auto',
      fontFamily: settings?.font_family ? `'${settings.font_family}', sans-serif` : "'DM Sans', sans-serif",
    }}>
      <div style={{
        width: '100%', maxWidth: 280, margin: 'auto', textAlign: 'center',
        background: hasBg ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.95)',
        backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
        borderRadius: 22, padding: '24px 16px', boxSizing: 'border-box',
        boxShadow: hasBg ? '0 16px 60px rgba(0,0,0,0.28)' : '0 16px 60px rgba(0,0,0,0.12)',
        border: hasBg ? '1px solid rgba(255,255,255,0.35)' : '1px solid rgba(0,0,0,0.06)',
      }}>
        {submitGifUrl
          ? <img src={submitGifUrl} alt="" style={{ width: '100%', maxHeight: 130, objectFit: 'contain', display: 'block', margin: '0 auto 14px', borderRadius: 12, background: '#f9f9f9' }} />
          : <div style={{ fontSize: 44, marginBottom: 8 }}>{'\ud83c\udf89'}</div>
        }
        <h2 style={{ fontSize: 18, fontWeight: 800, color: settings?.outro_text_color || '#1a1a2e', marginBottom: 14, lineHeight: 1.25, textShadow: hasBg ? '0 2px 8px rgba(0,0,0,0.25)' : 'none' }}>
          {settings?.outro_text || 'Yay! You completed the game!'}
        </h2>
        {settings?.thankyou_subtitle && (
          <div style={{
            background: hasBg ? 'rgba(255,255,255,0.15)' : '#f0f0ff',
            border: `1.5px solid ${hasBg ? 'rgba(255,255,255,0.3)' : '#6366f130'}`,
            borderRadius: 12, padding: '10px 14px', marginBottom: 16,
            color: settings?.thankyou_subtitle_color || '#444', fontSize: 12,
          }}>
            {settings.thankyou_subtitle}
          </div>
        )}
        <div style={{
          width: '100%',
          background: settings?.submit_button_bg_color || `linear-gradient(135deg, ${settings?.primary_color || '#6366f1'}, ${(settings?.primary_color || '#6366f1')}cc)`,
          color: settings?.submit_button_text_color || '#fff', borderRadius: 12, padding: '12px', fontSize: 14, fontWeight: 700,
          boxShadow: settings?.submit_button_bg_color ? '0 6px 24px rgba(0,0,0,0.15)' : `0 6px 24px ${(settings?.primary_color || '#6366f1')}55`,
          cursor: 'pointer',
        }}>
          {settings?.submit_button_text || 'Submit & Explore'}
        </div>
        {settings?.continue_button_text && (
          <div style={{ marginTop: 10, width: '100%', textAlign: 'center', background: settings?.continue_button_bg_color || 'rgba(0,0,0,0.06)', color: settings?.continue_button_text_color || '#1a1a2e', borderRadius: 12, padding: '10px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            {settings.continue_button_text}
          </div>
        )}
      </div>
    </div>
  )
}
