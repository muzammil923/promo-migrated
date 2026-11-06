/**
 * Shared "logo spin loader" — the spinning PromoGames favicon used as the
 * site-wide loading indicator (matches the landing-page preloader).
 *
 *   <LogoLoader />                  → lone spinning logo (inline)
 *   <LogoLoader size={96} />        → custom size
 *   <LogoLoader fullscreen />       → full-screen dark overlay (route preloads)
 */
export default function LogoLoader({ size = 48, fullscreen = false }) {
  const logo = (
    <img
      src="/favicon.png"
      alt="Loading"
      className="logo-loader-img"
      style={{ width: size, height: size }}
    />
  )

  if (fullscreen) {
    return (
      <div style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: '#07040f',
      }}>
        {logo}
      </div>
    )
  }

  return logo
}
