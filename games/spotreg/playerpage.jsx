import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import api from '../../apps/frontend/src/api'
import QrScanner from '../../apps/frontend/src/components/QrScanner'
import LogoLoader from '../../apps/frontend/src/components/LogoLoader'

/**
 * SPOT REGISTRATION — player flow.
 *
 *   registration form → station list → scan QR → fill that station → repeat
 *   → all stations saved → completion screen
 *
 * The session token is kept in localStorage (keyed per game) so a phone that
 * locks, refreshes or loses signal at a station can resume exactly where it was.
 */

const CSS = `
.srp *, .srp *::before, .srp *::after { box-sizing: border-box; margin: 0; padding: 0; }
.srp {
  min-height: 100vh; min-height: 100dvh;
  font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  display: flex; flex-direction: column; align-items: center; color: #1a1a2e;
  background: #f4f6ff;
  -webkit-font-smoothing: antialiased;
}
.srp-bg {
  position: fixed; inset: 0; z-index: 0;
  background-size: cover; background-position: center;
}
.srp-shell {
  position: relative; z-index: 1;
  flex: 1; display: flex; flex-direction: column;
  width: 100%; max-width: 520px; margin: 0 auto;
  padding: 0 16px calc(24px + env(safe-area-inset-bottom));
}
/* Holds the active screen and centres it in the viewport. Auto block margins
   centre it vertically only while it fits, and the padding above/below stops
   long forms from being clipped at the top the way justify-content:center does. */
.srp-main {
  width: 100%; margin: auto 0; padding: 18px 0;
  display: flex; flex-direction: column;
}

@keyframes srpFadeUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: none; } }
@keyframes srpPop { 0% { transform: scale(.7); opacity: 0; } 60% { transform: scale(1.06); opacity: 1; } 100% { transform: scale(1); } }
@keyframes srpShake { 0%,100% { transform: translateX(0); } 20% { transform: translateX(-7px); } 40% { transform: translateX(7px); } 60% { transform: translateX(-4px); } 80% { transform: translateX(4px); } }

.srp-card {
  background: var(--srp-card-bg, rgba(255,255,255,0.94));
  backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
  border-radius: var(--srp-card-radius, 20px); padding: 22px 18px;
  border: 1px solid rgba(255,255,255,0.7);
  box-shadow: 0 10px 40px rgba(15,20,60,0.12);
  width: 100%; max-width: 460px; margin: 0 auto;
  animation: srpFadeUp .3s cubic-bezier(.22,1,.36,1);
}

.srp-label {
  display: block; font-size: 11px; font-weight: 800;
  letter-spacing: .07em; text-transform: uppercase;
  color: var(--srp-label-color, #6b7280); margin-bottom: 6px;
}
.srp-input, .srp-select, .srp-textarea {
  width: 100%; font-family: inherit; font-size: 16px; color: #1a1a2e;
  background: #fff; border: 1.5px solid var(--srp-field-border, #e5e7eb);
  border-radius: 12px;
  padding: 13px 14px; outline: none; transition: border-color .16s, box-shadow .16s;
  -webkit-appearance: none; appearance: none;
}
.srp-input:focus, .srp-select:focus, .srp-textarea:focus {
  border-color: var(--srp-primary); box-shadow: 0 0 0 3.5px var(--srp-primary-soft);
}
.srp-textarea { resize: none; line-height: 1.5; }
.srp-select {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath fill='%236b7280' d='M1 1l5 5 5-5'/%3E%3C/svg%3E");
  background-repeat: no-repeat; background-position: right 14px center; padding-right: 38px;
}
.srp-field { margin-bottom: 16px; }
.srp-field.shake { animation: srpShake .35s ease; }
.srp-error { font-size: 12px; color: #dc2626; margin-top: 5px; font-weight: 600; }

.srp-btn {
  width: 100%; max-width: 460px; margin-left: auto; margin-right: auto;
  padding: 16px; font-size: 16px; font-weight: 800;
  font-family: inherit; color: var(--srp-start-fg, #fff); background: var(--srp-start-bg, var(--srp-primary));
  border: none; border-radius: 14px; cursor: pointer;
  display: flex; align-items: center; justify-content: center; gap: 8px;
  transition: transform .14s, opacity .14s, box-shadow .14s;
  box-shadow: 0 8px 24px var(--srp-primary-glow);
}
.srp-btn:disabled { opacity: .55; cursor: not-allowed; box-shadow: none; }
.srp-btn-submit { background: var(--srp-submit-bg, var(--srp-primary)); color: var(--srp-submit-fg, #fff); }
.srp-btn-skip {
  background: var(--srp-skip-bg, transparent); color: var(--srp-skip-fg, #6b7280);
  font-weight: 700; font-size: 14px; padding: 12px; box-shadow: none;
}
.srp-btn-finish {
  background: var(--srp-finish-bg, #f3f4f6); color: var(--srp-finish-fg, #6b7280);
  font-weight: 700; font-size: 14px; padding: 12px; box-shadow: none;
}
.srp-btn-row { display: flex; gap: 10px; }

.srp-header {
  display: flex; align-items: center; gap: 12px;
  padding: calc(18px + env(safe-area-inset-top)) 0 16px;
}
.srp-header img { max-height: 44px; max-width: 130px; object-fit: contain; border-radius: 8px; }

.srp-progress-track {
  height: 7px; background: rgba(0,0,0,.09); border-radius: 99px; overflow: hidden; margin-bottom: 6px;
  width: 100%; max-width: 460px; margin-left: auto; margin-right: auto;
}
.srp-progress-fill {
  height: 100%; border-radius: 99px; background: var(--srp-primary);
  transition: width .45s cubic-bezier(.22,1,.36,1);
}
.srp-progress-text { font-size: 12px; font-weight: 700; color: #6b7280; margin-bottom: 18px; text-align: center; }

.srp-station {
  display: flex; align-items: center; gap: 13px;
  background: var(--srp-card-bg, rgba(255,255,255,0.95));
  backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px);
  border: 1.5px solid rgba(255,255,255,0.7);
  border-radius: 16px; padding: 15px 16px; margin-bottom: 10px;
  box-shadow: 0 4px 18px rgba(15,20,60,0.07);
  width: 100%; max-width: 460px; margin-left: auto; margin-right: auto;
  animation: srpFadeUp .3s cubic-bezier(.22,1,.36,1) backwards;
}
.srp-station.next { border-color: var(--srp-primary); box-shadow: 0 6px 26px var(--srp-primary-glow); }
.srp-station.locked { opacity: .55; }
.srp-station-ico {
  width: 42px; height: 42px; border-radius: 13px; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center; font-size: 20px;
  background: var(--srp-primary-soft);
}
.srp-station.done .srp-station-ico { background: #dcfce7; }
.srp-station-body { flex: 1; min-width: 0; }
.srp-station-name { font-size: 15px; font-weight: 800; }
.srp-station-sub { font-size: 12px; color: #6b7280; margin-top: 2px; }
.srp-station-action {
  flex-shrink: 0; font-size: 12px; font-weight: 800;
  padding: 9px 15px; border-radius: 10px; font-family: inherit; cursor: pointer;
  border: none; background: var(--srp-scan-bg, var(--srp-primary));
  color: var(--srp-scan-fg, #fff);
}
.srp-station-action:disabled { cursor: not-allowed; }

.srp-badge {
  display: inline-flex; align-items: center; gap: 5px;
  font-size: 11.5px; font-weight: 800; padding: 4px 10px; border-radius: 99px;
}
.srp-badge-done { background: #dcfce7; color: var(--srp-done-color, #15803d); }
.srp-badge-todo { background: var(--srp-primary-soft); color: var(--srp-primary); }
.srp-badge-lock { background: #f3f4f6; color: #6b7280; }

.srp-modal-backdrop {
  position: fixed; inset: 0; z-index: 60;
  background: rgba(8,8,20,.6); backdrop-filter: blur(6px);
  display: flex; align-items: flex-end; justify-content: center;
  animation: srpFadeUp .2s ease;
}
@media (min-width: 520px) { .srp-modal-backdrop { align-items: center; } }
.srp-modal {
  width: 100%; max-width: 520px; max-height: 92vh; max-height: 92dvh; overflow-y: auto;
  background: #fff; border-radius: 22px 22px 0 0; padding: 22px 18px calc(22px + env(safe-area-inset-bottom));
  animation: srpFadeUp .25s cubic-bezier(.22,1,.36,1);
}
@media (min-width: 520px) { .srp-modal { border-radius: 22px; } }

.srp-alert {
  border-radius: 13px; padding: 13px 15px; font-size: 13.5px; font-weight: 600;
  margin-bottom: 16px; display: flex; gap: 9px; align-items: flex-start; line-height: 1.45;
  width: 100%; max-width: 460px; margin-left: auto; margin-right: auto;
}
.srp-alert-err { background: #fef2f2; color: #b91c1c; border: 1px solid #fecaca; }
.srp-alert-ok  { background: #f0fdf4; color: #15803d; border: 1px solid #bbf7d0; }
.srp-alert-info { background: #eff6ff; color: #1d4ed8; border: 1px solid #bfdbfe; }

.srp-hero {
  text-align: center; padding: 34px 20px;
}
.srp-hero-check {
  width: 84px; height: 84px; border-radius: 50%; margin: 0 auto 18px;
  background: #dcfce7; display: flex; align-items: center; justify-content: center;
  animation: srpPop .45s cubic-bezier(.34,1.56,.64,1);
}


.srp-center-screen {
  flex: 1; display: flex; flex-direction: column;
  align-items: center; justify-content: center; gap: 14px;
  padding: 40px 20px; text-align: center;
}

.srp-summary-row {
  display: flex; align-items: baseline; justify-content: space-between; gap: 14px;
  padding: 11px 0; border-bottom: 1px solid #f0f0f4;
}
.srp-summary-row:last-child { border-bottom: none; }
.srp-summary-key { font-size: 13px; color: var(--srp-h2-color, #6b7280); font-weight: 700; }
.srp-summary-val { font-size: 14px; font-weight: 800; text-align: right; word-break: break-word; }
`

const FALLBACK_PRIMARY = '#4F46E5'

function hexToRgba(hex, alpha) {
  if (!hex || !/^#?[0-9a-f]{6}$/i.test(hex)) return `rgba(79,70,229,${alpha})`
  const h = hex.replace('#', '')
  const r = parseInt(h.slice(0, 2), 16)
  const g = parseInt(h.slice(2, 4), 16)
  const b = parseInt(h.slice(4, 6), 16)
  return `rgba(${r},${g},${b},${alpha})`
}

function validateField(value, fieldType, isRequired) {
  const v = (value || '').trim()
  if (isRequired && !v) return 'This field is required'
  if (!v) return ''
  if (fieldType === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return 'Enter a valid email address'
  if (fieldType === 'phone' && !/^[\d\s+\-()]{7,20}$/.test(v)) return 'Enter a valid phone number'
  if (fieldType === 'number' && !/^-?\d+(\.\d+)?$/.test(v)) return 'Enter a number only'
  return ''
}

function FieldInput({ field, value, error, touched, onChange, onBlur, accent }) {
  const id = `srp-f-${field.id ?? field.field_label}`
  const showError = touched && error

  const style = showError
    ? { borderColor: '#dc2626', boxShadow: '0 0 0 3.5px rgba(220,38,38,.14)' }
    : {}

  return (
    <div className={`srp-field${showError ? ' shake' : ''}`} key={id}>
      <label className="srp-label" htmlFor={id}>
        {field.field_label}
        {field.is_required ? <span style={{ color: '#dc2626', marginLeft: 3 }}>*</span> : null}
      </label>

      {field.field_type === 'textarea' ? (
        <textarea
          id={id} className="srp-textarea" rows={3}
          value={value || ''} placeholder={field.field_label}
          onChange={e => onChange(e.target.value)}
          onBlur={onBlur} style={style}
        />
      ) : field.field_type === 'select' ? (
        <select
          id={id} className="srp-select"
          value={value || ''}
          onChange={e => onChange(e.target.value)}
          onBlur={onBlur} style={style}
        >
          <option value="">Select…</option>
          {(field.field_options || []).map(opt => <option key={opt} value={opt}>{opt}</option>)}
        </select>
      ) : (
        <input
          id={id} className="srp-input"
          type={field.field_type === 'email' ? 'email'
            : field.field_type === 'phone' ? 'tel'
            : field.field_type === 'number' ? 'number'
            : field.field_type === 'date' ? 'date'
            : 'text'}
          inputMode={field.field_type === 'phone' ? 'tel' : field.field_type === 'number' ? 'decimal' : undefined}
          value={value || ''} placeholder={field.field_label}
          onChange={e => onChange(e.target.value)}
          onBlur={onBlur} style={style}
        />
      )}

      {showError && <div className="srp-error">{error}</div>}
    </div>
  )
}

export default function SpotRegPlayerPage() {
  const { gameName, companyName } = useParams()
  const [searchParams] = useSearchParams()
  const linkCode = searchParams.get('code')

  const storageKey = `spotreg:${gameName}:${companyName || ''}`

  const [phase, setPhase] = useState('loading') // loading|error|form|stations|station|complete
  const [game, setGame] = useState(null)
  const [errorMsg, setErrorMsg] = useState('')

  const [formData, setFormData] = useState({})
  const [formErrors, setFormErrors] = useState({})
  const [formTouched, setFormTouched] = useState({})
  const [submitting, setSubmitting] = useState(false)

  const [sessionToken, setSessionToken] = useState(null)
  const [progress, setProgress] = useState(null) // { stations, total, done, all_done, settings }

  const [activeStation, setActiveStation] = useState(null)
  const [stationAnswers, setStationAnswers] = useState({})
  const [stationErrors, setStationErrors] = useState({})
  const [stationTouched, setStationTouched] = useState({})
  const [savingStation, setSavingStation] = useState(false)

  const [scannerOpen, setScannerOpen] = useState(false)
  const [scanError, setScanError] = useState('')
  const [scanBusy, setScanBusy] = useState(false)
  const [scanNotice, setScanNotice] = useState('')
  const [rescanPrompt, setRescanPrompt] = useState(null)
  const scanLockRef = useRef(false)

  const [completing, setCompleting] = useState(false)
  const [reportResult, setReportResult] = useState(null)
  const completionSentRef = useRef(false)

  /* ───────── Load the game ───────── */
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const res = await api.get(
          `/spotreg/game/${encodeURIComponent(gameName)}${companyName ? `/${encodeURIComponent(companyName)}` : ''}`
        )
        if (cancelled) return
        const g = res.data.game
        setGame(g)

        const initial = {}
        for (const f of (g.formFields || [])) initial[f.field_label] = ''
        setFormData(initial)

        // Resume a run that this phone already started, if any.
        const saved = localStorage.getItem(storageKey)
        if (saved) {
          try {
      const p = await api.get(`/spotreg/progress/${saved}`)
          if (cancelled) return
          completionSentRef.current = !!p.data.session.completed
          setSessionToken(saved)
          setProgress(p.data)
          const allSaved = Array.isArray(p.data.stations)
            && p.data.stations.length > 0
            && p.data.stations.every(st => st.saved)
          // A run that was already finalised goes to the thank-you screen; one
          // that is merely finished waits for the visitor to press Complete.
          if (p.data.session.completed) {
            setPhase('complete')
            return
          }
          if (p.data.all_done || allSaved) {
            setPhase('stations')
            return
          }
          setPhase('stations')
          return
          } catch {
            // Stale or invalid token — fall through and register again.
            localStorage.removeItem(storageKey)
          }
        }
        setPhase('form')
      } catch (err) {
        if (cancelled) return
        setErrorMsg(err.response?.data?.message || 'This activity could not be loaded.')
        setPhase('error')
      }
    })()
    return () => { cancelled = true }
  }, [gameName, companyName, storageKey])

  const s = game?.settings || {}
  const primary = s.primary_color || FALLBACK_PRIMARY
  const fontFamily = s.font_family ? `'${s.font_family}', -apple-system, sans-serif` : undefined
  // Builder logo first, then the client's logo as a fallback.
  const logo = s.game_logo_url || game?.client_logo || null

  // Every colour, size and radius is driven from the builder, with a fallback
  // for games created before these settings existed.
  const num = (v, fallback) => (v === undefined || v === null || v === '' ? fallback : Number(v) || fallback)
  const themeVars = {
    '--srp-primary': primary,
    '--srp-primary-soft': hexToRgba(primary, 0.12),
    '--srp-primary-glow': hexToRgba(primary, 0.28),
    '--srp-card-bg': s.card_bg_color || '#ffffff',
    '--srp-card-radius': `${num(s.card_radius, 20)}px`,
    '--srp-label-color': s.label_color || '#6b7280',
    '--srp-field-border': s.field_border_color || '#e5e7eb',
    '--srp-done-color': s.station_done_color || '#15803d',
    '--srp-h1': `${num(s.heading_1_size, 21)}px`,
    '--srp-h1-color': s.heading_1_color || '#1a1a2e',
    '--srp-h2': `${num(s.heading_2_size, 13.5)}px`,
    '--srp-h2-color': s.heading_2_color || '#666666',
    '--srp-h3': `${num(s.heading_3_size, 12)}px`,
    '--srp-h3-color': s.heading_3_color || '#777777',
    '--srp-desc': `${num(s.description_size, 13)}px`,
    '--srp-desc-color': s.description_color || '#888888',
    '--srp-start-bg': s.start_button_bg_color || primary,
    '--srp-start-fg': s.start_button_text_color || '#ffffff',
    '--srp-scan-bg': s.scan_button_bg_color || primary,
    '--srp-scan-fg': s.scan_button_text_color || '#ffffff',
    '--srp-submit-bg': s.submit_button_bg_color || primary,
    '--srp-submit-fg': s.submit_button_text_color || '#ffffff',
    '--srp-skip-bg': s.skip_button_bg_color || 'transparent',
    '--srp-skip-fg': s.skip_button_text_color || '#6b7280',
    '--srp-finish-bg': s.finish_button_bg_color || '#f3f4f6',
    '--srp-finish-fg': s.finish_button_text_color || '#6b7280',
    '--srp-ty-heading': s.thankyou_heading_color || '#1a1a2e',
    '--srp-ty-heading-size': `${num(s.thankyou_heading_size, 22)}px`,
    '--srp-ty-text': s.thankyou_text_color || '#4b5563',
    '--srp-ty-text-size': `${num(s.thankyou_text_size, 14)}px`,
  }

  /* ───────── Registration form ───────── */
  const handleFormChange = (label, value, fieldType, isRequired) => {
    setFormData(prev => ({ ...prev, [label]: value }))
    if (formTouched[label]) {
      setFormErrors(prev => ({ ...prev, [label]: validateField(value, fieldType, isRequired) }))
    }
  }

  const handleFormSubmit = async (e) => {
    e.preventDefault()
    const fields = game?.formFields || []
    const errors = {}
    let hasErrors = false
    for (const f of fields) {
      const err = validateField(formData[f.field_label] || '', f.field_type, f.is_required)
      errors[f.field_label] = err
      if (err) hasErrors = true
    }
    setFormErrors(errors)
    setFormTouched(Object.fromEntries(fields.map(f => [f.field_label, true])))
    if (hasErrors) return

    setSubmitting(true)
    try {
      const res = await api.post('/play/session/start', {
        game_id: game.id,
        player_data: formData,
        source_type: 'link',
      })
      const token = res.data.session_token
      localStorage.setItem(storageKey, token)
      setSessionToken(token)

      const p = await api.get(`/spotreg/progress/${token}`)
      setProgress(p.data)
      setPhase('stations')
    } catch (err) {
      const data = err.response?.data
      setErrorMsg(data?.message || 'Could not start your registration. Please try again.')
      setPhase('error')
    } finally {
      setSubmitting(false)
    }
  }

  /* ───────── Stations ───────── */
  const refreshProgress = useCallback(async () => {
    if (!sessionToken) return null
    const p = await api.get(`/spotreg/progress/${sessionToken}`)
    setProgress(p.data)
    return p.data
  }, [sessionToken])

  /** Open a station's form directly — used when its QR was already scanned. */
  const showStationForm = (station, answers) => {
    setStationAnswers({ ...(answers || {}) })
    setStationErrors({})
    setStationTouched({})
    setScanError('')
    setActiveStation(station)
    setPhase('station')
  }

  /**
   * Tapping a station on the list. If its QR has already been scanned there is
   * no reason to make the visitor scan it again, so the form opens straight
   * away; otherwise the scanner opens.
   */
  const openStation = (station) => {
    // With no QR gate every station is open, so it goes straight to the form
    // and finished stations stay editable.
    if (!requireQr) {
      showStationForm(
        { ...station, saved: false, isNext: true, locked: false },
        station.answers || {}
      )
      return
    }

    const allowRescan = progress?.settings?.allow_rescan
    // A finished station is read-only unless the builder allowed re-editing.
    if (station.saved && !allowRescan) return

    if (station.scanned) {
      showStationForm(station, station.answers)
      return
    }

    setScanError('')
    setActiveStation(station)
    setScannerOpen(true)
    scanLockRef.current = false
  }

  /** The single entry point used when stations can be visited in any order. */
  const openScanner = () => {
    setScanError('')
    setScanNotice('')
    setActiveStation(null)
    setScannerOpen(true)
    scanLockRef.current = false
  }

  const handleScan = async (decoded) => {
    if (scanLockRef.current || scanBusy) return
    scanLockRef.current = true
    setScanBusy(true)
    setScanError('')
    setScanNotice('')

    try {
      const res = await api.post('/spotreg/scan', {
        session_token: sessionToken,
        code: decoded,
      })
      const station = res.data.station
      setScannerOpen(false)

      // Already filled in at this station. Offer to correct the old values
      // rather than replacing them with a blank form.
      if (station.saved) {
        if (progress?.settings?.allow_rescan) {
          setRescanPrompt(station)
        } else {
          setScanNotice(`"${station.station_name}" is already complete.`)
        }
        return
      }

      // Scanned before but not saved: carry on from what was typed.
      showStationForm(
        { ...station, saved: false, answers: station.answers || {}, isNext: true, locked: false },
        station.answers || {}
      )
    } catch (err) {
      const data = err.response?.data
      setScanError(data?.message || 'Could not read that QR code. Please try again.')
      // Release the lock after a moment so a corrected scan can succeed.
      setTimeout(() => { scanLockRef.current = false }, 1200)
    } finally {
      setScanBusy(false)
    }
  }

  const closeStation = async () => {
    setScannerOpen(false)
    setActiveStation(null)
    setScanError('')
    setPhase('stations')
  }

  // A printed QR opened in a normal camera app arrives as ?code=… — honour it
  // automatically so the tap lands on the station instead of a dead end.
  const linkCodeUsedRef = useRef(false)
  useEffect(() => {
    if (!linkCode || linkCodeUsedRef.current || phase !== 'stations') return
    // Nothing to unlock by scanning when the game has no QR gate.
    if (progress?.settings?.require_qr === false) return
    linkCodeUsedRef.current = true
    handleScan(linkCode)
  }, [linkCode, phase, progress?.settings?.require_qr])

  /* ───────── Station form ───────── */
  const handleStationChange = (label, value, fieldType, isRequired) => {
    setStationAnswers(prev => ({ ...prev, [label]: value }))
    if (stationTouched[label]) {
      setStationErrors(prev => ({ ...prev, [label]: validateField(value, fieldType, isRequired) }))
    }
  }

  const handleStationSubmit = async (e) => {
    e.preventDefault()
    const fields = activeStation?.fields || []
    const errors = {}
    let hasErrors = false
    for (const f of fields) {
      const err = validateField(stationAnswers[f.field_label] || '', f.field_type, f.is_required)
      errors[f.field_label] = err
      if (err) hasErrors = true
    }
    setStationErrors(errors)
    setStationTouched(Object.fromEntries(fields.map(f => [f.field_label, true])))
    if (hasErrors) return

    setSavingStation(true)
    try {
      await api.post('/spotreg/station-submit', {
        session_token: sessionToken,
        station_id: activeStation.id,
        answers: stationAnswers,
      })
      const data = await refreshProgress()
      setActiveStation(null)
      // Deliberately stay on the list even when the last station is saved.
      // The thank-you screen is reached only by pressing Complete, so nobody
      // is taken off a station before they are ready.
      setPhase('stations')
    } catch (err) {
      setScanError(err.response?.data?.message || 'Could not save. Please try again.')
    } finally {
      setSavingStation(false)
    }
  }

  /* ───────── Completion ───────── */
  useEffect(() => {
    if (phase !== 'complete' || completionSentRef.current || !sessionToken) return
    completionSentRef.current = true

    ;(async () => {
      setCompleting(true)
      try {
        // Spotreg owns its own finalisation: the server computes BMI from the
        // station answers and emails the report. BMI is never returned here.
        const res = await api.post('/spotreg/complete', { session_token: sessionToken })
        setReportResult(res.data)
      } catch (err) {
        // The station data is already saved; a failed finalisation is not fatal.
        console.error('Finalise failed:', err)
        setReportResult({ email: { sent: false, reason: 'report_failed' } })
        completionSentRef.current = false
      } finally {
        setCompleting(false)
      }
    })()
  }, [phase, sessionToken])

  /* ───────── Render helpers ─────────
     The game's admin-side name is never shown to participants: on a public
     health-camp link the name is an internal label, and volunteers often name
     games after the venue or date. Only builder-supplied branding appears. */
  const ProgressBar = () => {
    if (!progress || progress.total === 0 || !progress.settings?.show_progress) return null
    const pct = Math.round((progress.done / progress.total) * 100)
    return (
      <>
        <div className="srp-progress-track">
          <div className="srp-progress-fill" style={{ width: `${pct}%` }} />
        </div>
        <div className="srp-progress-text">
          {progress.done} of {progress.total} station{progress.total === 1 ? '' : 's'} complete
        </div>
      </>
    )
  }

  /* ───────── Loading / error ───────── */
  if (phase === 'loading') {
    return (
      <div className="srp" style={{ background: s.bg_color || '#f4f6ff', ...themeVars }}>
        <style>{CSS}</style>
        <div className="srp-center-screen">
          <LogoLoader size={34} />
          <div style={{ fontSize: 14, fontWeight: 600, color: '#6b7280' }}>Loading…</div>
        </div>
      </div>
    )
  }

  if (phase === 'error') {
    return (
      <div className="srp" style={{ background: s.bg_color || '#f4f6ff', ...themeVars }}>
        <style>{CSS}</style>
        <div className="srp-center-screen">
          <div style={{ fontSize: 46 }}>⚠️</div>
          <h2 style={{ fontSize: 18, fontWeight: 800 }}>Something went wrong</h2>
          <p style={{ fontSize: 14, color: '#6b7280', maxWidth: 300, lineHeight: 1.5 }}>{errorMsg}</p>
          <button className="srp-btn" style={{ maxWidth: 260, marginTop: 6 }}
            onClick={() => window.location.reload()}>
            Try again
          </button>
        </div>
      </div>
    )
  }

  const noStations = progress?.total === 0
  // Unordered camps allow scanning any station in one go; ordered camps keep
  // the original one-station-at-a-time unlock.
  const requireOrder = progress?.settings?.require_order !== false
  // When QR-based stations are off there is no camera anywhere in the flow and
  // every station is opened directly.
  const requireQr = progress?.settings?.require_qr !== false
  // Trust the server flag, but also derive it, so a stale payload can never
  // hide the Complete button or show it too early.
  const stationList = progress?.stations || []
  const allStationsSaved = stationList.length > 0 && stationList.every(st => st.saved)
  // A station is "required" when it has at least one required field. The run can
  // be finished once all of those are saved; a station with only optional fields
  // may be skipped. If no station has a required field, every station is needed.
  const requiredStations = stationList.filter(st => (st.fields || []).some(f => f.is_required))
  const gatingStations = requiredStations.length > 0 ? requiredStations : stationList
  const requiredStationsSaved = gatingStations.length > 0 && gatingStations.every(st => st.saved)
  const readyToComplete = !noStations && (progress?.all_done === true || requiredStationsSaved)

  /** The visitor pressed Complete — only now is the thank-you screen shown. */
  const completeRun = () => setPhase('complete')

  return (
    <div className="srp" style={{ background: s.bg_color || '#f4f6ff', ...themeVars }}>
      <style>{CSS}</style>

      {/* The general page background only. The thank-you image is placed inside
          the thank-you card, after the tick, rather than behind everything. */}
      {s.bg_image_url && (
        <div className="srp-bg" style={{ backgroundImage: `url(${s.bg_image_url})` }} />
      )}

      <div className="srp-shell" style={{ fontFamily }}>
        {/* The logo appears on the registration card only — it is not repeated
            on the station screens that follow. */}

        <div className="srp-main">
        {/* ════ REGISTRATION FORM ════ */}
        {phase === 'form' && (
          <>
            <div className="srp-card">
              {logo && (
                /* Bleeds to the card edges: the negative margins cancel the
                   card's own padding so the logo has no white space around it. */
                <div style={{
                  margin: '-22px -18px 16px',
                  display: 'flex', justifyContent: 'center', alignItems: 'center',
                  overflow: 'hidden',
                  borderTopLeftRadius: 'var(--srp-card-radius, 20px)',
                  borderTopRightRadius: 'var(--srp-card-radius, 20px)',
                }}>
                  <img
                    src={logo}
                    alt=""
                    style={{ width: '100%', height: 'auto', display: 'block' }}
                  />
                </div>
              )}
              <h1 style={{
                fontSize: 'var(--srp-h1)', color: 'var(--srp-h1-color)',
                fontWeight: 800, lineHeight: 1.25, textAlign: 'center',
              }}>
                {s.heading_1}
              </h1>
              {s.heading_2 && (
                <p style={{
                  fontSize: 'var(--srp-h2)', color: 'var(--srp-h2-color)',
                  marginTop: 6, lineHeight: 1.45, textAlign: 'center',
                }}>
                  {s.heading_2}
                </p>
              )}
              {s.heading_3 && (
                <p style={{
                  fontSize: 'var(--srp-h3)', color: 'var(--srp-h3-color)',
                  marginTop: 4, lineHeight: 1.45, textAlign: 'center',
                }}>
                  {s.heading_3}
                </p>
              )}
              {s.description_text && (
                <p style={{ fontSize: 'var(--srp-desc)', color: 'var(--srp-desc-color)', marginTop: 10, lineHeight: 1.55, textAlign: 'center' }}>
                  {s.description_text}
                </p>
              )}

              <form onSubmit={handleFormSubmit} style={{ marginTop: 22 }}>
                {(game?.formFields || []).length === 0 ? (
                  <p style={{ fontSize: 13.5, color: '#6b7280', textAlign: 'center', padding: '12px 0', lineHeight: 1.5 }}>
                    Tap the button below to begin.
                  </p>
                ) : (game.formFields || []).map(f => (
                  <FieldInput
                    key={f.id ?? f.field_label}
                    field={f}
                    value={formData[f.field_label]}
                    error={formErrors[f.field_label]}
                    touched={formTouched[f.field_label]}
                    onChange={v => handleFormChange(f.field_label, v, f.field_type, f.is_required)}
                    onBlur={() => {
                      setFormTouched(prev => ({ ...prev, [f.field_label]: true }))
                      setFormErrors(prev => ({
                        ...prev,
                        [f.field_label]: validateField(formData[f.field_label] || '', f.field_type, f.is_required),
                      }))
                    }}
                  />
                ))}

                {/* `!!` matters: MySQL returns TINYINT 0/1, and a bare
                    `0 && <jsx/>` makes React render a literal "0" on screen. */}
                {!!s.terms_enabled && (
                  <label style={{ display: 'flex', gap: 9, alignItems: 'flex-start', marginBottom: 16, fontSize: 13, color: '#6b7280' }}>
                    <input type="checkbox" required style={{ marginTop: 2, width: 17, height: 17, accentColor: primary }} />
                    <span>
                      {s.terms_text || 'I agree to the terms'}
                      {s.terms_url && (
                        <a href={s.terms_url} target="_blank" rel="noreferrer"
                          style={{ color: primary, marginLeft: 4, fontWeight: 700 }}>Read more</a>
                      )}
                    </span>
                  </label>
                )}

                <button className="srp-btn" type="submit" disabled={submitting}>
                  {submitting ? 'Please wait…' : (s.start_button_text || 'Start Registration')}
                </button>
              </form>
            </div>
          </>
        )}

        {/* ════ STATION LIST ════ */}
        {phase === 'stations' && (
          <>
            <ProgressBar />

            {scanNotice && (
              <div className="srp-alert srp-alert-ok" style={{ marginBottom: 14 }}>
                <span>✓</span>
                <span>{scanNotice}</span>
              </div>
            )}

            <h2 style={{ fontSize: 'var(--srp-h1)', color: 'var(--srp-h1-color)', marginBottom: 4, textAlign: 'center', width: '100%', maxWidth: 460, marginLeft: 'auto', marginRight: 'auto' }}>
              {s.stations_heading || 'Find your next station'}
            </h2>
            <p style={{ fontSize: 'var(--srp-h2)', color: 'var(--srp-h2-color)', marginBottom: 16, lineHeight: 1.5, textAlign: 'center', width: '100%', maxWidth: 460, marginLeft: 'auto', marginRight: 'auto' }}>
              {noStations
                ? 'This activity has no stations yet.'
                : readyToComplete
                  ? 'Check your entries below, then press Complete.'
                  : !requireQr
                    ? (s.stations_subheading || 'Tap a section to fill in or update your details.')
                    : requireOrder
                      ? (s.stations_subheading || 'Scan the QR code at the station to fill in that section.')
                      : 'Walk up to any station and scan the QR code printed there. Order does not matter.'}
            </p>

            {/* Everything is filled in: the confirmation sits at the top of the
                list, and the Complete button at the very bottom, so the visitor
                reviews their entries before finishing. */}
            {readyToComplete && (
              <div className="srp-card" style={{ marginBottom: 16, textAlign: 'center' }}>
                <div style={{
                  width: 54, height: 54, borderRadius: '50%', margin: '0 auto 12px',
                  background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                </div>
                <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--srp-h1-color)' }}>
                  {allStationsSaved ? 'All stations complete' : 'Required stations complete'}
                </div>
                <p style={{ fontSize: 13, color: 'var(--srp-h2-color)', marginTop: 6, lineHeight: 1.5 }}>
                  {allStationsSaved
                    ? 'Press Complete when you are ready to finish.'
                    : 'Press Complete to finish, or fill in the optional stations first.'}
                </p>
              </div>
            )}

            {/* Unordered QR camps get one entry point: scan whatever code is in
                front of you and that station opens. Ordered camps keep a Scan
                button on the single station that is currently unlocked. With QR
                disabled there is no camera at all. */}
            {requireQr && !requireOrder && !noStations && !allStationsSaved && (
              <button className="srp-btn" style={{ marginBottom: 16 }} onClick={openScanner} disabled={scanBusy}>
                📷 {s.scan_button_text || 'Scan Station QR Code'}
              </button>
            )}

            {(progress?.stations || []).map((station, i) => (
              <div
                key={station.id}
                className={`srp-station${station.saved ? ' done' : ''}${station.isNext ? ' next' : ''}${station.locked ? ' locked' : ''}`}
                style={{ animationDelay: `${i * 45}ms` }}
              >
                <div className="srp-station-ico">{station.saved ? '✓' : (station.icon || '📍')}</div>
                <div className="srp-station-body">
                  <div className="srp-station-name">{station.station_name}</div>
                  <div className="srp-station-sub">
                    {!requireQr
                      ? (station.saved
                        ? 'Filled in — tap to update'
                        : `${(station.fields?.length || 0)} field(s) to fill`)
                      : station.saved
                        ? `${(station.fields?.length || 0)} field(s) filled in`
                        : station.scanned ? 'Ready to fill in'
                        : station.locked ? 'Locked — finish the station above'
                        : `${(station.fields?.length || 0)} field(s) to fill`}
                  </div>
                </div>
                {!requireQr ? (
                  <button
                    className="srp-station-action"
                    onClick={() => openStation(station)}
                    disabled={savingStation}
                  >
                    {station.saved ? 'Update' : 'Fill in'}
                  </button>
                ) : station.saved ? (
                  <span className="srp-badge srp-badge-done">Done</span>
                ) : station.scanned ? (
                  <button
                    className="srp-station-action"
                    onClick={() => openStation(station)}
                    disabled={scanBusy}
                  >
                    Continue
                  </button>
                ) : station.locked ? (
                  <span className="srp-badge srp-badge-lock">🔒</span>
                ) : requireOrder ? (
                  <button
                    className="srp-station-action"
                    onClick={() => openStation(station)}
                    disabled={scanBusy}
                  >
                    Scan
                  </button>
                ) : null}
              </div>
            ))}

            {/* A finished station can be reopened when the builder allows it. */}
            {requireQr && !!progress?.settings?.allow_rescan && (progress?.stations || []).some(st => st.saved) && (
              <p style={{ fontSize: 12, color: '#9ca3af', textAlign: 'center', marginTop: 10, width: '100%', maxWidth: 460, marginLeft: 'auto', marginRight: 'auto' }}>
                Tap a completed station to correct a value.
              </p>
            )}

            {/* The explicit final step, below the list so every entry has been
                seen before the visitor commits. */}
            {readyToComplete && (
              <button className="srp-btn" style={{ marginTop: 20 }} onClick={completeRun}>
                Complete
              </button>
            )}
          </>
        )}

        {/* ════ STATION FORM ════ */}
        {phase === 'station' && activeStation && (
          <>
            {scanError && (
              <div className="srp-alert srp-alert-err"><span>⚠️</span><span>{scanError}</span></div>
            )}

            <div className="srp-card">
              {activeStation.image_url && (
                <img src={activeStation.image_url} alt=""
                  style={{ width: '100%', maxHeight: 170, objectFit: 'cover', borderRadius: 14, marginBottom: 16 }} />
              )}

              <div style={{ fontSize: 30, marginBottom: 8 }}>{activeStation.icon || '📍'}</div>
              <h1 style={{ fontSize: 'var(--srp-h1)', color: 'var(--srp-h1-color)', lineHeight: 1.25 }}>
                {activeStation.heading_1 || activeStation.station_name}
              </h1>
              {activeStation.description_text && (
                <p style={{ fontSize: 'var(--srp-desc)', color: 'var(--srp-desc-color)', marginTop: 8, lineHeight: 1.55 }}>
                  {activeStation.description_text}
                </p>
              )}

              <form onSubmit={handleStationSubmit} style={{ marginTop: 20 }}>
                {(activeStation.fields?.length || 0) === 0 ? (
                  <p style={{ fontSize: 13.5, color: '#6b7280', textAlign: 'center', padding: '10px 0', lineHeight: 1.5 }}>
                    Nothing to fill in at this station.
                  </p>
                ) : activeStation.fields.map(f => (
                  <FieldInput
                    key={f.id ?? f.field_label}
                    field={f}
                    value={stationAnswers[f.field_label]}
                    error={stationErrors[f.field_label]}
                    touched={stationTouched[f.field_label]}
                    onChange={v => handleStationChange(f.field_label, v, f.field_type, f.is_required)}
                    onBlur={() => {
                      setStationTouched(prev => ({ ...prev, [f.field_label]: true }))
                      setStationErrors(prev => ({
                        ...prev,
                        [f.field_label]: validateField(stationAnswers[f.field_label] || '', f.field_type, f.is_required),
                      }))
                    }}
                  />
                ))}

                <button className="srp-btn srp-btn-submit" type="submit" disabled={savingStation}>
                  {savingStation ? 'Saving…' : (s.submit_button_text || 'Save & Continue')}
                </button>
              </form>

              <button className="srp-btn srp-btn-skip" onClick={closeStation} style={{ marginTop: 4 }}>
                {s.skip_button_text || 'Back to station list'}
              </button>
            </div>
          </>
        )}

        {/* ════ COMPLETE ════ */}
        {phase === 'complete' && (
          <>
            <div className="srp-card srp-hero">
              <div className="srp-hero-check">
                <svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
              </div>
              <h1 style={{ fontSize: 'var(--srp-ty-heading-size)', color: 'var(--srp-ty-heading)', lineHeight: 1.25, textAlign: 'center' }}>
                {s.thankyou_heading || 'All Stations Complete!'}
              </h1>
              {s.thankyou_text && (
                <p style={{ fontSize: 'var(--srp-ty-text-size)', color: 'var(--srp-ty-text)', marginTop: 12, lineHeight: 1.6, textAlign: 'center' }}>
                  {s.thankyou_text}
                </p>
              )}
              {s.thankyou_bg_image_url && (
                <img
                  src={s.thankyou_bg_image_url}
                  alt=""
                  style={{
                    width: '100%', maxHeight: 180, objectFit: 'cover',
                    display: 'block', borderRadius: 12, marginTop: 16,
                  }}
                />
              )}
              {completing && (
                <p style={{ fontSize: 12, color: '#9ca3af', marginTop: 14, textAlign: 'center' }}>Finalising your details…</p>
              )}
              {!completing && reportResult?.email?.sent && (
                <p style={{ fontSize: 13, color: '#15803d', marginTop: 14, fontWeight: 700, textAlign: 'center' }}>
                  ✓ Your health report is on its way by email
                </p>
              )}
              {!completing && reportResult && !reportResult.email?.sent && reportResult.email?.reason && reportResult.email?.reason !== 'Email disabled in the builder' && (
                <p style={{ fontSize: 13, color: '#b45309', marginTop: 14, fontWeight: 700, textAlign: 'center' }}>
                  Your report could not be emailed — please ask the volunteer for a printed copy.
                </p>
              )}
            </div>

            {/* What was collected — handy if the volunteer needs to read it back.
                BMI is intentionally not shown here; it goes out by email. */}
            {s.show_entries_summary !== 0 && (progress?.stations || []).length > 0 && (
              <div className="srp-card" style={{ marginTop: 14 }}>
                <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: '.07em', textTransform: 'uppercase', color: 'var(--srp-label-color)', marginBottom: 10 }}>
                  {s.thankyou_summary_heading || 'Your entries'}
                </div>
                {progress.stations.map(st => {
                  const entries = Object.entries(st.answers || {}).filter(([, v]) => v !== '' && v != null)
                  if (entries.length === 0) return null
                  return (
                    <div key={st.id} style={{ marginBottom: 14 }}>
                      <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--srp-h1-color)', marginBottom: 2 }}>
                        {st.icon} {st.station_name}
                      </div>
                      {entries.map(([k, v]) => (
                        <div className="srp-summary-row" key={k}>
                          <span className="srp-summary-key">{k}</span>
                          <span className="srp-summary-val">{String(v)}</span>
                        </div>
                      ))}
                    </div>
                  )
                })}
              </div>
            )}

            {s.outro_text && (
              <p style={{ fontSize: 13, color: s.outro_text_color || 'var(--srp-h2-color)', textAlign: 'center', marginTop: 18, lineHeight: 1.6, width: '100%', maxWidth: 460, marginLeft: 'auto', marginRight: 'auto' }}>
                {s.outro_text}
              </p>
            )}

            <button className="srp-btn srp-btn-finish" style={{ marginTop: 14 }}
              onClick={() => { localStorage.removeItem(storageKey); window.location.reload() }}>
              {s.finish_button_text || 'Finish'}
            </button>
          </>
        )}
        </div>

        {/* ════ SCANNER MODAL ════ */}
        {scannerOpen && (
          <div className="srp-modal-backdrop" onClick={() => !scanBusy && setScannerOpen(false)}>
            <div className="srp-modal" onClick={e => e.stopPropagation()}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <h3 style={{ fontSize: 16, fontWeight: 800 }}>
                  {activeStation ? `Scan ${activeStation.station_name}` : 'Scan a station QR'}
                </h3>
                <button className="srp-btn srp-btn-plain" style={{ width: 'auto', padding: 6, fontSize: 20 }}
                  onClick={closeStation} aria-label="Close scanner">×</button>
              </div>

              {scanError && (
                <div className="srp-alert srp-alert-err"><span>⚠️</span><span>{scanError}</span></div>
              )}

              {scanBusy ? (
                <div style={{ padding: '50px 0', textAlign: 'center' }}>
                  <LogoLoader size={34} />
                  <p style={{ fontSize: 13, color: '#6b7280', marginTop: 14 }}>Checking the code…</p>
                </div>
              ) : (
                <QrScanner
                  accentColor={primary}
                  hint={s.scan_hint_text || 'Point your camera at the QR code on this station.'}
                  onScan={handleScan}
                  onClose={closeStation}
                  onError={() => setScanError('')}
                />
              )}
            </div>
          </div>
        )}

        {/* ════ RE-SCAN PROMPT ════
            A station that has already been filled in is never silently
            overwritten: the previous values are shown and the visitor chooses
            whether to correct them or leave them as they are. */}
        {rescanPrompt && (
          <div className="srp-modal-backdrop">
            <div className="srp-modal" onClick={e => e.stopPropagation()}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                <div className="srp-station-ico">{rescanPrompt.icon || '📍'}</div>
                <div>
                  <h3 style={{ fontSize: 16, fontWeight: 800 }}>{rescanPrompt.station_name}</h3>
                  <p style={{ fontSize: 12, color: '#6b7280' }}>Already completed</p>
                </div>
              </div>

              <p style={{ fontSize: 13.5, color: '#4b5563', margin: '10px 0 14px', lineHeight: 1.5 }}>
                You already entered these values. Would you like to change them?
              </p>

              <div style={{
                background: '#f8fafc', border: '1px solid #e2e8f0',
                borderRadius: 12, padding: '4px 14px', marginBottom: 18, maxHeight: 200, overflowY: 'auto',
              }}>
                {Object.entries(rescanPrompt.answers || {})
                  .filter(([, v]) => v !== '' && v != null)
                  .map(([k, v]) => (
                    <div className="srp-summary-row" key={k}>
                      <span className="srp-summary-key">{k}</span>
                      <span className="srp-summary-val">{String(v)}</span>
                    </div>
                  ))}
                {Object.values(rescanPrompt.answers || {}).filter(v => v !== '' && v != null).length === 0 && (
                  <p style={{ fontSize: 13, color: '#6b7280', padding: '10px 0' }}>No values were saved.</p>
                )}
              </div>

              <button className="srp-btn" onClick={() => {
                const st = rescanPrompt
                setRescanPrompt(null)
                showStationForm({ ...st, saved: true }, st.answers)
              }}>
                ✏️ Edit my answers
              </button>
              <button className="srp-btn srp-btn-skip" style={{ marginTop: 8 }}
                onClick={() => setRescanPrompt(null)}>
                Continue without changing
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
