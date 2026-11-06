/**
 * Shared form preview card for all game builder phone mockups.
 *
 * Props:
 *   settings          - game settings object (headings, colors, bg, form config)
 *   formFields        - array of { field_label, field_type, is_required }
 *   bgUrl             - optional override for background image URL
 *   logoUrl           - optional override for logo image URL
 *   defaultButtonText - optional override for start button text
 */
export default function FormPreview({ settings, formFields, bgUrl, logoUrl, defaultButtonText }) {
  const hasBg = bgUrl ?? settings?.bg_image_url
  const logo = logoUrl ?? settings?.game_logo_url
  const fontFamily = settings?.font_family ? `'${settings.font_family}', sans-serif` : "'DM Sans', sans-serif"

  return (
    <div style={{
      flex: 1, display: 'flex', flexDirection: 'column',
      background: hasBg ? `url(${hasBg}) center/cover` : (settings?.bg_color || '#f4f4ff'),
      padding: 'clamp(16px,4vw,20px) 12px',
      overflow: 'auto',
      fontFamily,
    }}>
      <div style={{
        width: '100%', maxWidth: 280, margin: 'auto',
        background: hasBg ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.93)',
        backdropFilter: 'blur(28px)', WebkitBackdropFilter: 'blur(28px)',
        borderRadius: 22, padding: '20px 16px', boxSizing: 'border-box',
        boxShadow: hasBg ? '0 8px 40px rgba(0,0,0,0.28), inset 0 1px 0 rgba(255,255,255,0.4)' : '0 8px 40px rgba(0,0,0,0.12)',
        border: hasBg ? '1px solid rgba(255,255,255,0.35)' : '1px solid rgba(255,255,255,0.85)',
      }}>
        {logo && (
          <div style={{ textAlign: 'center', marginBottom: 14 }}>
            <img src={logo} alt="" style={{ maxWidth: '100%', maxHeight: 80, objectFit: 'contain', borderRadius: 8 }} />
          </div>
        )}
        <h1 style={{ fontSize: 16, fontWeight: 800, textAlign: 'center', marginBottom: 2, color: settings?.heading_1_color || '#1a1a2e', lineHeight: 1.2, textShadow: hasBg ? '0 2px 8px rgba(0,0,0,0.3)' : 'none' }}>{settings?.heading_1 || 'Untitled'}</h1>
        {settings?.heading_2 && <div style={{ fontSize: 13, fontWeight: 600, textAlign: 'center', marginBottom: 4, color: settings?.heading_2_color || '#666666', lineHeight: 1.3 }}>{settings.heading_2}</div>}
        {settings?.intro_text && (
          <div style={{
            background: hasBg ? 'rgba(255,255,255,0.15)' : '#f0f0ff',
            border: `1.5px solid ${hasBg ? 'rgba(255,255,255,0.3)' : '#6366f130'}`,
            borderRadius: 10, padding: '8px 12px', margin: '10px 0 14px',
            color: settings?.intro_text_color || '#444', fontSize: 12, textAlign: 'center', lineHeight: 1.5,
          }}>{settings.intro_text}</div>
        )}
        {(formFields || []).map((f, i) => (
          <div key={i} style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: hasBg ? 'rgba(255,255,255,0.9)' : '#555', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {f.field_label}{f.is_required ? <span style={{ color: '#ef4444' }}>*</span> : ''}
            </div>
            {f.field_type === 'textarea' ? (
              <textarea rows={2} placeholder={f.field_label}
                style={{ width: '100%', background: 'rgba(255,255,255,0.88)', border: `1.5px solid ${hasBg ? 'rgba(255,255,255,0.45)' : '#e0e0f0'}`, borderRadius: 8, padding: '9px 12px', fontSize: 13, color: '#1a1a2e', outline: 'none', boxSizing: 'border-box', resize: 'none', fontFamily: 'inherit' }} />
            ) : (
              <input type={f.field_type === 'email' ? 'email' : f.field_type === 'phone' ? 'tel' : f.field_type === 'number' ? 'number' : 'text'}
                placeholder={f.field_label}
                style={{ width: '100%', background: 'rgba(255,255,255,0.88)', border: `1.5px solid ${hasBg ? 'rgba(255,255,255,0.45)' : '#e0e0f0'}`, borderRadius: 8, padding: '9px 12px', fontSize: 13, color: '#1a1a2e', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }} />
            )}
          </div>
        ))}
        {!!settings?.terms_enabled && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12, fontSize: 11, color: hasBg ? 'rgba(255,255,255,0.85)' : '#666' }}>
            <span style={{ width: 14, height: 14, border: '1.5px solid currentColor', borderRadius: 3, display: 'inline-block', flexShrink: 0 }} />
            {settings?.terms_text || 'Terms & Conditions'}
          </div>
        )}
        <div style={{ marginTop: !!settings?.terms_enabled && (settings?.terms_text || settings?.terms_url) ? 0 : 8 }}>
          <div style={{
            width: '100%', textAlign: 'center',
            background: settings?.start_button_bg_color || `linear-gradient(135deg, ${settings?.primary_color || '#6366f1'}, ${(settings?.primary_color || '#6366f1')}cc)`,
            color: settings?.start_button_text_color || '#fff', border: 'none', borderRadius: 10, padding: '12px', fontSize: 14, fontWeight: 700,
            boxShadow: settings?.start_button_bg_color ? '0 6px 20px rgba(0,0,0,0.15)' : `0 6px 20px ${(settings?.primary_color || '#6366f1')}44`,
            cursor: 'pointer',
          }}>
            {defaultButtonText || settings?.start_button_text || 'Start Game →'}
          </div>
        </div>
      </div>
    </div>
  )
}
