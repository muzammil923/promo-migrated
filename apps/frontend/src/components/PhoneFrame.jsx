/**
 * Shared phone mockup frame for all game builders.
 * 
 * Usage:
 *   <PhoneFrame settings={settings}>
 *     {/* Game-specific preview content *\/}
 *   </PhoneFrame>
 * 
 * Props:
 *   settings - game settings object (for bg_color, bg_image_url, font_family)
 *   children - the preview content to render inside the phone
 *   style    - optional additional styles for the phone container
 */
export default function PhoneFrame({ settings, children, style }) {
  const hasBg = settings?.bg_image_url
  const bgColor = settings?.bg_color || '#f4f4ff'
  const fontFamily = settings?.font_family ? `'${settings.font_family}', sans-serif` : "'DM Sans', sans-serif"

  return (
    <div style={{
      position: 'sticky', top: 80,
      width: 320, height: 640, borderRadius: 36,
      border: '4px solid #1a1a2e',
      background: hasBg ? `url(${settings.bg_image_url}) center/cover` : bgColor,
      overflow: 'hidden',
      boxShadow: '0 12px 48px rgba(0,0,0,.18)',
      fontFamily,
      flexShrink: 0,
      display: 'flex', flexDirection: 'column',
      marginRight: 20,
      ...style,
    }}>
      {/* Notch */}
      <div style={{
        width: 100, height: 24, background: '#1a1a2e',
        borderRadius: '0 0 16px 16px', margin: '0 auto', flexShrink: 0,
      }} />
      {/* Content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {children}
      </div>
    </div>
  )
}
