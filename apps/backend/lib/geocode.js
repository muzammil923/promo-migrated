// Geocode an Indian PIN code to lat/lng.
// Primary: OpenStreetMap Nominatim (free, no API key).
// Fallback: deterministic pseudo-coordinates centred on Karnataka so pins still
// spread out meaningfully even when the network/rate-limit is unavailable.

const KARNATAKA_CENTER = { lat: 12.9716, lng: 77.5946 } // Bangalore

function karnatakaFallback(pincode) {
  const p = String(pincode || '').replace(/\D/g, '')
  // Derive a stable offset from the pincode digits (spread ~±0.9°).
  let h = 0
  for (let i = 0; i < p.length; i++) h = (h * 31 + p.charCodeAt(i)) % 100000
  const latOff = ((h % 9000) / 10000) - 0.45 // -0.45 .. +0.45
  const lngOff = (((h >> 4) % 9000) / 10000) - 0.45
  return {
    latitude: +(KARNATAKA_CENTER.lat + latOff).toFixed(6),
    longitude: +(KARNATAKA_CENTER.lng + lngOff).toFixed(6),
    approximated: true,
  }
}

async function geocodePincode(pincode) {
  const p = String(pincode || '').replace(/\D/g, '')
  if (p.length < 4) return karnatakaFallback(pincode)
  try {
    const url = `https://nominatim.openstreetmap.org/search?postalcode=${encodeURIComponent(p)}&country=India&format=json&limit=1`
    const ctrl = new AbortController()
    const t = setTimeout(() => ctrl.abort(), 4000)
    const res = await fetch(url, {
      headers: { 'User-Agent': 'PromoGames/1.0 (location-manager)' },
      signal: ctrl.signal,
    })
    clearTimeout(t)
    if (!res.ok) return karnatakaFallback(pincode)
    const data = await res.json()
    if (Array.isArray(data) && data[0]?.lat && data[0]?.lon) {
      return {
        latitude: parseFloat(data[0].lat).toFixed(6),
        longitude: parseFloat(data[0].lon).toFixed(6),
        approximated: false,
      }
    }
    return karnatakaFallback(pincode)
  } catch {
    return karnatakaFallback(pincode)
  }
}

module.exports = { geocodePincode, karnatakaFallback }
