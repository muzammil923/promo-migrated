import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import QRCode from 'qrcode'
import api from '../api'
import { useUploadErrors, uploadErrorMessage } from '../lib/builderUpload'
import PhoneFrame from '../components/PhoneFrame'
import FormPreview from '../components/FormPreview'
import ColorPicker from '../components/BuilderColorPicker'

/* ─────────────────────────────────────────────
   LIGHT THEME TOKENS  (scoped to .sr-wrap)
   Mirrors the shared builder token set so this
   page stays visually consistent with the rest.
───────────────────────────────────────────── */
const LIGHT = `
.sr-wrap {
  font-family: 'DM Sans', sans-serif;
  background: var(--gb-bg);
  color: var(--gb-text);
  min-height: 100vh;
}
.sr-wrap *,
.sr-wrap *::before,
.sr-wrap *::after { box-sizing: border-box; }

.sr-wrap input:not([type=checkbox]):not([type=file]):not([type=color]):not([type=range]),
.sr-wrap select,
.sr-wrap textarea {
  width: 100%;
  font-family: inherit;
  font-size: 14px;
  background: var(--gb-surface);
  border: none;
  border-bottom: 1.5px solid var(--gb-border);
  border-radius: 8px;
  color: var(--gb-text);
  padding: 10px 12px 8px;
  outline: none;
  transition: border-color .18s;
}
.sr-wrap input:not([type=checkbox]):not([type=file]):not([type=color]):not([type=range]):focus,
.sr-wrap select:focus,
.sr-wrap textarea:focus {
  border-bottom-color: #22c55e;
  border-bottom-width: 2px;
}
.sr-wrap select option { background: #fff; color: #1e1e2e; }
.sr-wrap input[type=color] {
  width: 100%; height: 42px; padding: 4px; cursor: pointer;
  border: 1.5px solid var(--gb-border); border-radius: 8px; background: var(--gb-surface);
}

.sr-btn {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 8px 16px; font-size: 13px; font-weight: 600;
  border-radius: var(--gb-radius-sm); border: none; cursor: pointer;
  transition: all .15s; white-space: nowrap; font-family: inherit;
}
.sr-btn:disabled { opacity: .5; cursor: not-allowed; }
.sr-btn-primary { background: var(--gb-primary); color: #fff; }
.sr-btn-primary:not(:disabled):hover { background: var(--gb-primary-d); transform: translateY(-1px); box-shadow: 0 4px 12px var(--gb-primary-g); }
.sr-btn-ghost { background: var(--gb-surface); color: var(--gb-text2); border: 1.5px solid var(--gb-border); }
.sr-btn-ghost:not(:disabled):hover { border-color: var(--gb-primary); color: var(--gb-primary); }
.sr-btn-danger { background: #fee2e2; color: var(--gb-danger); border: 1.5px solid #fecaca; }
.sr-btn-danger:not(:disabled):hover { background: #fecaca; }
.sr-btn-success { background: #dcfce7; color: var(--gb-success); border: 1.5px solid #bbf7d0; }
.sr-btn-success:not(:disabled):hover { background: #bbf7d0; }
.sr-btn-sm { padding: 5px 10px; font-size: 12px; }
.sr-alert {
  border-radius: 10px; padding: 11px 13px; font-size: 13px; line-height: 1.5;
  display: flex; gap: 8px; align-items: flex-start; margin-bottom: 14px;
}
.sr-alert-warn { background: #fffbeb; color: #92400e; border: 1px solid #fde68a; }
.sr-alert-err { background: #fef2f2; color: #b91c1c; border: 1px solid #fecaca; }
.sr-alert-ok { background: #f0fdf4; color: #15803d; border: 1px solid #bbf7d0; }

/* ── Shared builder primitives (same look as the quiz builder) ────────── */
.gb-label {
  font-size: 11px; font-weight: 700; letter-spacing: .06em;
  text-transform: uppercase; color: var(--gb-text2); margin-bottom: 4px;
  display: block;
}
.gb-swatch {
  width: 28px; height: 28px; border-radius: 6px;
  border: 2px solid var(--gb-border); cursor: pointer; flex-shrink: 0;
}
.gb-cpop {
  position: absolute; top: calc(100% + 6px); left: 0; z-index: 300;
  background: var(--gb-surface); border: 1.5px solid var(--gb-border);
  border-radius: 10px; padding: 12px; box-shadow: var(--gb-shadow-md);
  display: grid; grid-template-columns: repeat(7,1fr); gap: 5px; width: 220px;
}
.sr-btn-icon { padding: 6px; border-radius: 6px; }

.sr-card {
  background: var(--gb-surface);
  border: 1.5px solid var(--gb-border);
  border-radius: var(--gb-radius);
  box-shadow: var(--gb-shadow);
}

.sr-label {
  font-size: 11px; font-weight: 700; letter-spacing: .06em;
  text-transform: uppercase; color: var(--gb-text2); margin-bottom: 4px;
  display: block;
}

.sr-section {
  background: var(--gb-surface2);
  border: 1px solid var(--gb-border);
  border-radius: var(--gb-radius);
  padding: 16px;
  margin-bottom: 14px;
}
.sr-section-title {
  font-size: 12px; font-weight: 700; letter-spacing: .05em;
  text-transform: uppercase; color: var(--gb-primary);
  margin-bottom: 12px; display: flex; align-items: center; gap: 6px;
}

.sr-tabs {
  display: flex; border-bottom: 2px solid var(--gb-border);
  margin-bottom: 24px; gap: 0; overflow-x: auto;
}
.sr-tab {
  padding: 10px 18px; font-size: 13px; font-weight: 600;
  border: none; background: none; cursor: pointer;
  color: var(--gb-text2); border-bottom: 2px solid transparent;
  margin-bottom: -2px; transition: color .15s; white-space: nowrap;
  font-family: inherit;
}
.sr-tab.active { color: var(--gb-primary); border-bottom-color: var(--gb-primary); }
.sr-tab:hover:not(.active) { color: var(--gb-text); }

@keyframes sr-slide-in { from { opacity:0; transform:translateX(20px) } to { opacity:1; transform:none } }
.sr-toast {
  position: fixed; bottom: 24px; right: 24px; z-index: 9999;
  padding: 12px 18px; border-radius: 10px; color: #fff; font-weight: 600;
  font-size: 13px; box-shadow: 0 8px 24px rgba(0,0,0,.15);
  animation: sr-slide-in .22s ease; font-family: 'DM Sans',sans-serif;
  max-width: 320px;
}

.sr-row { display: flex; gap: 12px; flex-wrap: wrap; align-items: flex-start; }
.sr-col { flex: 1; min-width: 140px; }
.sr-fg { display: flex; flex-direction: column; gap: 4px; flex: 1; min-width: 120px; }

.sr-station {
  background: var(--gb-surface);
  border: 1.5px solid var(--gb-border);
  border-radius: var(--gb-radius);
  margin-bottom: 10px;
  overflow: hidden;
  transition: box-shadow .15s;
}
.sr-station:hover { box-shadow: var(--gb-shadow-md); }
.sr-station-head {
  display: flex; align-items: center; gap: 10px;
  padding: 12px 16px; cursor: pointer; user-select: none;
  background: var(--gb-surface);
}
.sr-station-head:hover { background: var(--gb-surface2); }
.sr-station-body { padding: 16px; border-top: 1.5px solid var(--gb-border); }
.sr-station.inactive { opacity: .6; }

.sr-order-pill {
  width: 26px; height: 26px; border-radius: 8px; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
  font-size: 12px; font-weight: 800; color: #fff; background: var(--gb-primary);
}
.sr-order-pill.done { background: var(--gb-success); }

.sr-code {
  font-family: ui-monospace, 'SF Mono', Menlo, monospace;
  font-size: 13px; letter-spacing: .12em; font-weight: 700;
  padding: 5px 10px; border-radius: 7px;
  background: var(--gb-surface2); border: 1px dashed var(--gb-border);
}

.sr-badge {
  display: inline-flex; align-items: center; gap: 4px;
  padding: 2px 8px; border-radius: 20px; font-size: 11px; font-weight: 700;
}
.sr-badge-green { background: rgba(22,163,74,.12); color: var(--gb-success); }
.sr-badge-gray  { background: #f0f2f8; color: var(--gb-text2); }
.sr-badge-red   { background: rgba(220,38,38,.12); color: var(--gb-danger); }

.sr-qr-sheet {
  background: #fff; border: 1.5px solid var(--gb-border);
  border-radius: 14px; padding: 20px; text-align: center;
  color: #1a1a2e;
}

.sr-empty { text-align: center; padding: 56px 20px; color: var(--gb-text2); }
.sr-empty-icon { font-size: 44px; margin-bottom: 12px; }

.sr-thumb {
  height: 44px; width: auto; border-radius: 6px;
  border: 1px solid var(--gb-border); object-fit: contain; background: #f9f9f9;
}

.sr-checkbox { display: flex; align-items: center; gap: 7px; font-size: 13px; cursor: pointer; padding-bottom: 2px; }
.sr-checkbox input { width: 16px; height: 16px; cursor: pointer; accent-color: #16a34a; }

.sr-hint { font-size: 12px; color: var(--gb-text3); line-height: 1.5; margin: 0; }
.sr-danger-note {
  font-size: 12px; color: var(--gb-danger); background: rgba(220,38,38,.07);
  border: 1px solid rgba(220,38,38,.25); border-radius: 8px; padding: 9px 12px; margin-bottom: 12px;
}

/* Printable sheet — hidden on screen, shown only in the print dialog */
.sr-print-only { display: none; }
@media print {
  body * { visibility: hidden !important; }
  .sr-print-area, .sr-print-area * { visibility: visible !important; }
  .sr-print-area {
    display: block !important; position: absolute; inset: 0;
    padding: 0; background: #fff;
  }
  .sr-print-area .sr-qr-sheet { break-inside: avoid; page-break-inside: avoid; border: none; }
}
`

function Toast({ msg, type, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3200)
    return () => clearTimeout(t)
  }, [onClose])
  return (
    <div className="sr-toast" style={{ background: type === 'success' ? '#16a34a' : '#dc2626' }}>
      {msg}
    </div>
  )
}

const FIELD_TYPES = [
  ['text', 'Text'],
  ['email', 'Email'],
  ['phone', 'Phone'],
  ['number', 'Number'],
  ['date', 'Date'],
  ['textarea', 'Long text'],
  ['select', 'Dropdown'],
]

/** Starter stations for a fresh game — tuned for a medical camp walk-through. */
const STARTER_STATIONS = [
  { station_name: 'Height', icon: '📏', heading_1: 'Height', description_text: 'Stand against the wall and record your height.', fields: [
    { field_label: 'Height (cm)', field_type: 'number', is_required: 1, field_options: [] },
  ] },
  { station_name: 'Weight', icon: '⚖️', heading_1: 'Weight', description_text: 'Step on the scale and record your weight.', fields: [
    { field_label: 'Weight (kg)', field_type: 'number', is_required: 1, field_options: [] },
  ] },
  { station_name: 'Blood Pressure', icon: '🩺', heading_1: 'Blood Pressure', description_text: 'Sit down and relax before the reading is taken.', fields: [
    { field_label: 'Systolic (mmHg)', field_type: 'number', is_required: 1, field_options: [] },
    { field_label: 'Diastolic (mmHg)', field_type: 'number', is_required: 1, field_options: [] },
  ] },
  { station_name: 'Blood Group', icon: '🩸', heading_1: 'Blood Group', description_text: 'Record your blood group.', fields: [
    { field_label: 'Blood Group', field_type: 'select', is_required: 1, field_options: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] },
  ] },
]

const DEFAULT_SETTINGS = {
  bg_color: '#f4f6ff',
  primary_color: '#4F46E5',
  font_family: 'DM Sans',
  heading_1: 'Health Check Registration',
  heading_2: 'Complete each station to finish',
  heading_3: '',
  description_text: 'Scan the QR code at each station to fill in your details.',
  heading_1_color: '#1a1a2e',
  heading_2_color: '#666666',
  heading_3_color: '#777777',
  description_color: '#888888',
  label_color: '#6b7280',
  field_border_color: '#e5e7eb',
  card_bg_color: '#ffffff',
  card_radius: '20',
  heading_1_size: '21',
  heading_2_size: '13.5',
  heading_3_size: '12',
  description_size: '13',
  stations_heading: 'Find your next station',
  stations_subheading: 'Scan the QR code at each station to fill in that section.',
  station_done_color: '#15803d',
  outro_text: '',
  start_button_text: 'Start Registration',
  start_button_text_color: '#ffffff',
  start_button_bg_color: '#4F46E5',
  scan_button_text: 'Scan Station QR Code',
  scan_button_text_color: '#ffffff',
  scan_button_bg_color: '#4F46E5',
  submit_button_text: 'Save & Continue',
  submit_button_text_color: '#ffffff',
  submit_button_bg_color: '#4F46E5',
  skip_button_text: 'Skip for now',
  skip_button_text_color: '#6b7280',
  skip_button_bg_color: 'transparent',
  thankyou_heading: 'All Stations Complete!',
  thankyou_text: 'Your report is on its way to your email. Please hand your phone back to the volunteer.',
  thankyou_heading_color: '#1a1a2e',
  thankyou_text_color: '#4b5563',
  thankyou_heading_size: '22',
  thankyou_text_size: '14',
  thankyou_summary_heading: 'Your entries',
  show_entries_summary: 1,
  finish_button_text: 'Finish',
  finish_button_text_color: '#6b7280',
  finish_button_bg_color: '#f3f4f6',
  complete_heading: 'All Stations Complete!',
  complete_text: 'Thank you. Please hand your phone back to the volunteer and collect your report card.',
  scan_hint_text: 'Point your camera at the QR code on this station.',
  require_order: 1,
  require_qr: 1,
  show_progress: 1,
  allow_rescan: 1,
  terms_enabled: 0,
  terms_text: '',
  terms_url: '',
  meta_description: '',
}

const DEFAULT_EMAIL = {
  is_enabled: 0,
  subject: 'Your Health Checkup Report',
  sender_name: 'Health Camp',
  sender_email: '',
  sender_account: '',
  header_text: '🩺 Your Health Report',
  header_color: '#4F46E5',
  accent_color: '#4F46E5',
  body_html: '',
  footer_text: '',
  show_bmi_block: 1,
  show_entries_table: 1,
  show_disclaimer: 1,
  disclaimer_text: '',
  use_full_html: 0,
}

const EMAIL_TOKENS = [
  { token: '{{player_name}}', hint: "Participant's name" },
  { token: '{{name}}', hint: "Participant's first name" },
  { token: '{{game_name}}', hint: 'Game name' },
  { token: '{{stations_completed}}', hint: 'How many stations were saved' },
  { token: '{{bmi}}', hint: 'The BMI number' },
  { token: '{{bmi_category}}', hint: 'e.g. Normal weight' },
  { token: '{{bmi_percentile}}', hint: "Children only, e.g. 62th" },
  { token: '{{bmi_height}}', hint: 'Height used, in cm' },
  { token: '{{bmi_weight}}', hint: 'Weight used, in kg' },
  { token: '{{bmi_card}}', hint: 'The coloured BMI card, placed exactly here' },
  { token: '{{measurements_table}}', hint: 'The table of every value entered, placed exactly here' },
  { token: '{{field:Age}}', hint: 'Any form/station value by its label: replace Age with the label' },
]

const STARTER_EMAIL_BODY = `<p style="font-size:16px;color:#333;margin:0 0 16px 0;">Hi <strong>{{player_name}}</strong>,</p>
<p style="font-size:16px;color:#333;margin:0 0 20px 0;">Thank you for completing all {{stations_completed}} stations of the <strong>{{game_name}}</strong> health checkup. Your report is below.</p>
{{bmi_card}}
{{measurements_table}}`

export default function SpotRegBuilderPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const upload = useUploadErrors()

  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState('')
  const [tab, setTab] = useState('stations')

  const [game, setGame] = useState(null)
  const [settings, setSettings] = useState(DEFAULT_SETTINGS)
  const [stations, setStations] = useState([])
  const [formFields, setFormFields] = useState([])

  const [openStations, setOpenStations] = useState({})
  const [emailSettings, setEmailSettings] = useState({})
  const [senders, setSenders] = useState([])
  const [savingEmail, setSavingEmail] = useState(false)
  const [previewing, setPreviewing] = useState(false)
  const [emailPreview, setEmailPreview] = useState(null)
  const emailBodyRef = useRef(null)
  const [saving, setSaving] = useState(false)
  const [savingStations, setSavingStations] = useState(false)
  const [savingForm, setSavingForm] = useState(false)
  const [toast, setToast] = useState(null)

  const bgImgRef = useRef(null)
  const logoRef = useRef(null)
  const stationBgRef = useRef(null)
  const thankyouBgRef = useRef(null)

  const showToast = (msg, type = 'success') => setToast({ msg, type })

  /* ─── Load ─── */
  const loadData = useCallback(async () => {
    setLoading(true)
    setFetchError('')
    try {
      const [settingsRes, gameRes, emailRes] = await Promise.all([
        api.get(`/spotreg/${id}/settings`),
        api.get(`/games/${id}`),
        api.get(`/spotreg/${id}/email-settings`),
      ])
      setGame(gameRes.data.game)
      setFormFields(gameRes.data.game.formFields || [])
      setSettings({ ...DEFAULT_SETTINGS, ...(settingsRes.data.settings || {}) })
      setStations(settingsRes.data.stations || [])
      setEmailSettings({ ...DEFAULT_EMAIL, ...(emailRes.data.settings || {}) })
      try {
        const sRes = await api.get('/spotreg/email-senders')
        setSenders(sRes.data.senders || [])
      } catch (e) { console.error('Could not load sender accounts:', e) }
    } catch (err) {
      console.error('SpotReg builder load failed:', err)
      setFetchError(err.response?.data?.message || 'Could not load this game')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => { loadData() }, [loadData])

  const gameLink = game?.slug
    ? `${window.location.origin}/play/spotreg/${game.slug}${game.client_slug ? '/' + game.client_slug : ''}`
    : ''

  // The printed QR points at the player page with the code attached, so a plain
  // camera app lands on the right game and the in-app scanner can still read
  // the same image (the backend pulls ?code= straight off the URL).
  const stationLink = (station) => (gameLink ? `${gameLink}?code=${station.station_code}` : '')

  /* ─── Station editing ─── */
  const addStation = () => {
    const index = stations.length
    setStations(prev => [...prev, {
      id: null,
      station_name: `Station ${prev.length + 1}`,
      station_code: null,
      icon: '📍',
      heading_1: '',
      description_text: '',
      image_url: '',
      is_active: 1,
      fields: [],
    }])
    // The panel looks itself up as `new-<index>`, so open that key.
    setOpenStations(prev => ({ ...prev, [`new-${index}`]: true }))
  }

  const seedMedicalStations = () => {
    setStations(prev => [...prev, ...STARTER_STATIONS.map(s => ({ ...s, id: null, station_code: null, image_url: '', is_active: 1 }))])
    showToast('Added 4 starter stations')
  }

  const removeStation = (i) => {
    setStations(prev => prev.filter((_, idx) => idx !== i))
  }

  const moveStation = (i, delta) => {
    setStations(prev => {
      const next = [...prev]
      const target = i + delta
      if (target < 0 || target >= next.length) return prev
      ;[next[i], next[target]] = [next[target], next[i]]
      return next
    })
  }

  const updateStation = (i, key, val) => {
    setStations(prev => prev.map((s, idx) => idx === i ? { ...s, [key]: val } : s))
  }

  const pickStationImage = (i, file) => {
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => updateStation(i, 'image_url', ev.target.result)
    reader.readAsDataURL(file)
  }

  const addStationField = (i) => {
    setStations(prev => prev.map((s, idx) => idx === i
      ? { ...s, fields: [...(s.fields || []), { field_label: 'New Field', field_type: 'text', is_required: 0, field_options: [] }] }
      : s))
  }

  const removeStationField = (i, fi) => {
    setStations(prev => prev.map((s, idx) => idx === i
      ? { ...s, fields: (s.fields || []).filter((_, k) => k !== fi) }
      : s))
  }

  const updateStationField = (i, fi, key, val) => {
    setStations(prev => prev.map((s, idx) => idx === i
      ? { ...s, fields: (s.fields || []).map((f, k) => k === fi ? { ...f, [key]: val } : f) }
      : s))
  }

  const saveStations = async () => {
    setSavingStations(true)
    try {
      const fd = new FormData()
      // Stations whose image is still a local data: URL get uploaded as a file.
      const serialisable = []
      stations.forEach((s, i) => {
        const isDataUrl = typeof s.image_url === 'string' && s.image_url.startsWith('data:')
        serialisable.push({
          id: s.id || undefined,
          station_name: s.station_name,
          icon: s.icon,
          heading_1: s.heading_1,
          description_text: s.description_text,
          image_url: isDataUrl ? '' : (s.image_url || ''),
          is_active: s.is_active,
          fields: (s.fields || []).map(f => ({
            field_label: f.field_label,
            field_type: f.field_type,
            field_options: f.field_type === 'select' && Array.isArray(f.field_options)
              ? f.field_options
              : (f.field_options || []),
            is_required: f.is_required,
          })),
        })
        if (isDataUrl) {
          const blob = dataUrlToBlob(s.image_url)
          // The index is encoded in the field name so the backend can match a
          // file to the right station even when only some stations are new.
          if (blob) fd.append(`station_images__${i}`, blob, `station-${i}.png`)
        }
      })
      fd.append('stations', JSON.stringify(serialisable))
      const res = await api.put(`/spotreg/${id}/stations`, fd)
      setStations(res.data.stations || [])
      showToast('Stations saved')
    } catch (err) {
      showToast(uploadErrorMessage(err), 'error')
    } finally {
      setSavingStations(false)
    }
  }

  /* ─── Email settings ─── */
  const saveEmailSettings = async () => {
    setSavingEmail(true)
    try {
      const res = await api.put(`/spotreg/${id}/email-settings`, emailSettings)
      setEmailSettings({ ...DEFAULT_EMAIL, ...(res.data.settings || {}) })
      showToast('Email settings saved')
    } catch (err) {
      showToast(uploadErrorMessage(err), 'error')
    } finally {
      setSavingEmail(false)
    }
  }

  const previewEmail = async () => {
    setPreviewing(true)
    setEmailPreview(null)
    try {
      // Persist first so the preview renders exactly what would be sent.
      await api.put(`/spotreg/${id}/email-settings`, emailSettings)
      const res = await api.post(`/spotreg/${id}/email-preview`, {})
      setEmailPreview(res.data)
    } catch (err) {
      showToast(err.response?.data?.message || 'Could not render the preview', 'error')
    } finally {
      setPreviewing(false)
    }
  }

  const insertEmailToken = (token) => {
    const el = emailBodyRef.current
    const current = emailSettings.body_html || ''
    if (!el) {
      setEmailSettings({ ...emailSettings, body_html: current + token })
      return
    }
    const start = el.selectionStart ?? current.length
    const end = el.selectionEnd ?? current.length
    const next = current.slice(0, start) + token + current.slice(end)
    setEmailSettings({ ...emailSettings, body_html: next })
    requestAnimationFrame(() => {
      el.focus()
      el.setSelectionRange(start + token.length, start + token.length)
    })
  }

  const regenerateCode = async (stationIndex) => {
    const station = stations[stationIndex]
    if (!station?.id) {
      // Brand-new stations get their code on the first save.
      showToast('Save the stations once first, then codes can be regenerated', 'error')
      return
    }
    if (!window.confirm('Generate a new code for this station? The old printed QR will stop working.')) return
    try {
      const res = await api.post(`/spotreg/${id}/stations/${station.id}/regenerate-code`)
      setStations(prev => prev.map((s, idx) =>
        idx === stationIndex ? { ...s, station_code: res.data.station_code } : s))
      showToast('New code generated — reprint this station')
    } catch (err) {
      showToast(uploadErrorMessage(err), 'error')
    }
  }

  /* ─── Registration form fields ─── */
  const addFormField = () => setFormFields(prev => [
    ...prev, { field_label: 'New Field', field_type: 'text', is_required: 0, field_options: [] },
  ])
  const removeFormField = (i) => setFormFields(prev => prev.filter((_, k) => k !== i))
  const updateFormField = (i, key, val) =>
    setFormFields(prev => prev.map((f, k) => k === i ? { ...f, [key]: val } : f))

  const saveFormFields = async () => {
    setSavingForm(true)
    try {
      await api.put(`/games/${id}/form-fields`, { fields: formFields })
      showToast('Registration form saved')
    } catch {
      showToast('Error saving form fields', 'error')
    } finally {
      setSavingForm(false)
    }
  }

  /* ─── Settings ─── */
  const saveSettings = async () => {
    setSaving(true)
    try {
      const fd = new FormData()
      const textFields = [
        'heading_1', 'heading_2', 'heading_3', 'description_text',
        'heading_1_color', 'heading_2_color', 'heading_3_color', 'description_color',
        'heading_1_size', 'heading_2_size', 'heading_3_size', 'description_size',
        'label_color', 'field_border_color', 'card_bg_color', 'card_radius',
        'bg_color', 'primary_color', 'font_family',
        'stations_heading', 'stations_subheading', 'station_done_color',
        'outro_text', 'outro_text_color',
        'start_button_text', 'start_button_text_color', 'start_button_bg_color',
        'scan_button_text', 'scan_button_text_color', 'scan_button_bg_color',
        'submit_button_text', 'submit_button_text_color', 'submit_button_bg_color',
        'skip_button_text', 'skip_button_text_color', 'skip_button_bg_color',
        'thankyou_heading', 'thankyou_text', 'thankyou_heading_color', 'thankyou_text_color',
        'thankyou_heading_size', 'thankyou_text_size', 'thankyou_summary_heading',
        'show_entries_summary',
        'finish_button_text', 'finish_button_text_color', 'finish_button_bg_color',
        'scan_hint_text', 'terms_text', 'terms_url', 'meta_description',
        'require_order', 'require_qr', 'show_progress', 'allow_rescan',
      ]
      for (const f of textFields) fd.append(f, settings[f] ?? '')

      const imageSlots = [
        ['bg_image', 'bg_image_url', '_bgFile'],
        ['game_logo', 'game_logo_url', '_logoFile'],
        ['station_bg_image', 'station_bg_image_url', '_stationBgFile'],
        ['thankyou_bg_image', 'thankyou_bg_image_url', '_thankyouBgFile'],
      ]
      for (const [fileKey, urlKey, stateKey] of imageSlots) {
        if (settings[stateKey]) fd.append(fileKey, settings[stateKey])
        else fd.append(urlKey, settings[urlKey] || '')
      }

      await api.put(`/spotreg/${id}/settings`, fd)
      upload.clearAll()
      showToast('Settings saved')
    } catch (err) {
      const msg = uploadErrorMessage(err)
      showToast(msg, 'error')
    } finally {
      setSaving(false)
    }
  }

  const pickImage = (stateKey, urlKey, file, ref) => {
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => setSettings(prev => ({
      ...prev,
      [urlKey]: ev.target.result,
      [stateKey]: file,
    }))
    reader.readAsDataURL(file)
    upload.clearFieldError(urlKey)
  }

  /* ─── Game name ─── */
  const [editingName, setEditingName] = useState(false)
  const [nameInput, setNameInput] = useState('')
  const saveGameName = async () => {
    if (!nameInput.trim()) { setEditingName(false); return }
    try {
      await api.put(`/games/${id}`, { name: nameInput.trim() })
      setGame(prev => ({ ...prev, name: nameInput.trim() }))
      showToast('Game name saved')
    } catch {
      showToast('Error saving name', 'error')
    }
    setEditingName(false)
  }

  /* ─── QR codes ─── */
  const [qrCodes, setQrCodes] = useState({})
  const stationRows = useMemo(
    () => stations.map((s, i) => ({ ...s, _index: i })),
    [stations]
  )

  useEffect(() => {
    let cancelled = false
    const pending = stationRows.filter(s => s.station_code)
    if (pending.length === 0) { setQrCodes({}); return }

    ;(async () => {
      const next = {}
      for (const s of pending) {
        try {
          const payload = stationLink(s) || s.station_code
          next[s.id] = await QRCode.toDataURL(payload, {
            width: 420, margin: 2, color: { dark: '#1a1a2e', light: '#FFFFFF' },
          })
        } catch (err) {
          console.error('QR generation failed for station', s.id, err)
        }
      }
      if (!cancelled) setQrCodes(next)
    })()

    return () => { cancelled = true }
  }, [stationRows, gameLink])

  const downloadQr = (station, dataUrl) => {
    const a = document.createElement('a')
    a.href = dataUrl
    a.download = `${(game?.name || 'game').replace(/[^a-z0-9]+/gi, '-').toLowerCase()}-${(station.station_name || 'station').replace(/[^a-z0-9]+/gi, '-').toLowerCase()}-qr.png`
    a.click()
  }

  const copyStationLink = async (station) => {
    try {
      await navigator.clipboard.writeText(stationLink(station) || station.station_code)
      showToast('Station code copied')
    } catch {
      showToast('Could not copy', 'error')
    }
  }

  const printSheet = () => window.print()

  const activeStationCount = stations.filter(s => s.is_active).length
  const fieldCount = stations.reduce((n, s) => n + (s.fields?.length || 0), 0)

  // The report email needs somewhere to go, so the registration form must
  // capture an address. Warn in the Email tab rather than failing silently.
  const hasEmailField = formFields.some(
    f => f.field_type === 'email' || /e-?mail/i.test(f.field_label || '')
  )

  const TABS = [
    { id: 'stations', label: `Stations${stations.length ? ` (${stations.length})` : ''}` },
    { id: 'form', label: 'Registration Form' },
    { id: 'qr', label: 'QR Codes' },
    { id: 'display', label: 'Design' },
    { id: 'thankyou', label: 'Thank You' },
    { id: 'email', label: 'Email' },
    { id: 'settings', label: 'Settings' },
  ]

  if (loading) return (
    <div className="sr-wrap" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
      <style>{LIGHT}</style>
      <div style={{ textAlign: 'center', color: 'var(--gb-text2)' }}>
        <div style={{ width: 40, height: 40, borderRadius: '50%', border: '3px solid #e2e6f0', borderTopColor: '#16a34a', animation: 'srspin .8s linear infinite', margin: '0 auto 16px' }} />
        Loading builder…
        <style>{'@keyframes srspin{to{transform:rotate(360deg)}}'}</style>
      </div>
    </div>
  )

  if (fetchError) return (
    <div className="sr-wrap" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
      <style>{LIGHT}</style>
      <div style={{ textAlign: 'center', maxWidth: 400 }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>⚠️</div>
        <h2 style={{ color: 'var(--gb-danger)', marginBottom: 8 }}>Builder Failed to Load</h2>
        <p style={{ color: 'var(--gb-text2)', marginBottom: 20 }}>{fetchError}</p>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
          <button className="sr-btn sr-btn-primary" onClick={loadData}>🔄 Retry</button>
          <button className="sr-btn sr-btn-ghost" onClick={() => navigate('/dashboard/games')}>← Back to Games</button>
        </div>
      </div>
    </div>
  )

  return (
    <div className="sr-wrap">
      <style>{LIGHT}</style>

      {/* ─── Header ─── */}
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr auto 1fr',
        background: 'var(--gb-surface)', borderBottom: '1.5px solid var(--gb-border)',
        padding: '10px 28px', gap: '4px 20px', alignItems: 'center',
        position: 'sticky', top: 62, zIndex: 50, boxShadow: '0 1px 8px rgba(0,0,0,.06)',
      }}>
        <div style={{ display: 'flex', gap: 6, alignItems: 'flex-start', justifySelf: 'start' }}>
          <button className="sr-btn sr-btn-ghost sr-btn-sm" onClick={() => navigate('/dashboard/games')}
            style={{ padding: '6px 8px', fontSize: 16, lineHeight: 1, marginTop: 1 }} title="Back to games">←</button>
          <div>
            {editingName ? (
              <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                <input value={nameInput} onChange={e => setNameInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') saveGameName(); if (e.key === 'Escape') setEditingName(false) }}
                  onBlur={saveGameName} autoFocus
                  style={{ width: 180, fontSize: 14, fontWeight: 700, padding: '3px 6px' }} />
                <button className="sr-btn sr-btn-ghost sr-btn-sm" onClick={() => setEditingName(false)} style={{ padding: '2px 6px' }}>✕</button>
              </div>
            ) : (
              <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--gb-text)', cursor: 'pointer', lineHeight: 1.3 }}
                onClick={() => { setNameInput(game?.name || ''); setEditingName(true) }} title="Click to edit">
                {game?.name} <span style={{ fontSize: 10, color: 'var(--gb-text3)', fontWeight: 400 }}>✎</span>
              </div>
            )}
            <div style={{ fontSize: 9.5, fontWeight: 600, color: 'var(--gb-text3)', letterSpacing: '.04em', textTransform: 'uppercase', marginTop: 1 }}>
              Spot Registration Builder
            </div>
          </div>
        </div>

        <div className="sr-tabs" style={{ marginBottom: 0, borderBottom: 'none', justifySelf: 'center' }}>
          {TABS.map(t => (
            <button key={t.id} className={`sr-tab${tab === t.id ? ' active' : ''}`} onClick={() => setTab(t.id)}
              style={{ padding: '6px 14px', fontSize: 12.5 }}>
              {t.label}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 6, alignItems: 'center', justifySelf: 'end' }}>
          <button className="sr-btn sr-btn-ghost sr-btn-sm" style={{ padding: '6px 8px', fontSize: 16, lineHeight: 1 }}
            onClick={() => { navigator.clipboard.writeText(gameLink); showToast('Player link copied!') }}
            title="Copy player link">🔗</button>
          {gameLink && (
            <a href={gameLink} target="_blank" rel="noreferrer" className="sr-btn sr-btn-ghost sr-btn-sm"
              style={{ padding: '6px 8px', fontSize: 16, lineHeight: 1, textDecoration: 'none' }}
              title="Open player page">👁</a>
          )}
        </div>
      </div>

      {/* ─── Content ─── */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 20px', display: 'grid', gridTemplateColumns: '1fr 320px', gap: 24, alignItems: 'start' }}>
        <div>
          {/* ════ STATIONS TAB ════ */}
          {tab === 'stations' && (
            <div>
              <div className="sr-section">
                <div className="sr-section-title">📍 Stations ({stations.length})</div>
                <p className="sr-hint" style={{ marginBottom: 14 }}>
                  Each station gets its own printed QR code. A visitor scans it to unlock
                  that station's form — they cannot open a station without walking to it.
                  Currently <strong>{activeStationCount}</strong> active station(s),
                  <strong> {fieldCount}</strong> field(s) in total.
                </p>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <button className="sr-btn sr-btn-ghost" onClick={addStation}>+ Add Station</button>
                  {stations.length === 0 && (
                    <button className="sr-btn sr-btn-ghost" onClick={seedMedicalStations}>🩺 Add 4 medical starter stations</button>
                  )}
                  <div style={{ flex: 1 }} />
                  <button className="sr-btn sr-btn-primary" onClick={saveStations} disabled={savingStations}>
                    {savingStations ? 'Saving…' : '💾 Save Stations'}
                  </button>
                </div>
              </div>

              {stations.length === 0 ? (
                <div className="sr-card sr-empty">
                  <div className="sr-empty-icon">📍</div>
                  <p style={{ fontWeight: 600, marginBottom: 6 }}>No stations yet</p>
                  <p style={{ fontSize: 13, marginBottom: 16 }}>
                    Add your first station, then save to generate its QR code.
                  </p>
                  <button className="sr-btn sr-btn-primary" onClick={addStation}>+ Add Station</button>
                </div>
              ) : stations.map((station, i) => {
                const key = station.id != null ? String(station.id) : `new-${i}`
                const isOpen = !!openStations[key]
                return (
                  <div key={key} className={`sr-station${station.is_active ? '' : ' inactive'}`}>
                    <div className="sr-station-head" onClick={() => setOpenStations(prev => ({ ...prev, [key]: !isOpen }))}>
                      <span className="sr-order-pill">{i + 1}</span>
                      <span style={{ fontSize: 18 }}>{station.icon || '📍'}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--gb-text)' }}>
                          {station.station_name || `Station ${i + 1}`}
                        </div>
                        <div style={{ fontSize: 11.5, color: 'var(--gb-text3)' }}>
                          {(station.fields?.length || 0)} field(s)
                          {station.station_code ? ' · code assigned' : ' · save to assign a code'}
                        </div>
                      </div>
                      {!station.is_active && <span className="sr-badge sr-badge-gray">Hidden</span>}
                      <span style={{ color: 'var(--gb-text3)', fontSize: 12 }}>{isOpen ? '▲' : '▼'}</span>
                    </div>

                    {isOpen && (
                      <div className="sr-station-body">
                        <div className="sr-row" style={{ marginBottom: 14 }}>
                          <div className="sr-fg" style={{ maxWidth: 78 }}>
                            <span className="sr-label">Icon</span>
                            <input value={station.icon || ''} onChange={e => updateStation(i, 'icon', e.target.value)}
                              placeholder="📍" style={{ textAlign: 'center' }} />
                          </div>
                          <div className="sr-fg" style={{ flex: 2 }}>
                            <span className="sr-label">Station Name</span>
                            <input value={station.station_name || ''} onChange={e => updateStation(i, 'station_name', e.target.value)}
                              placeholder="e.g. Blood Pressure" />
                          </div>
                          <label className="sr-checkbox" style={{ alignSelf: 'flex-end', paddingBottom: 10 }}>
                            <input type="checkbox" checked={!!station.is_active}
                              onChange={e => updateStation(i, 'is_active', e.target.checked ? 1 : 0)} />
                            Active
                          </label>
                        </div>

                        <div className="sr-row" style={{ marginBottom: 14 }}>
                          <div className="sr-fg" style={{ flex: 2 }}>
                            <span className="sr-label">Screen Heading</span>
                            <input value={station.heading_1 || ''} onChange={e => updateStation(i, 'heading_1', e.target.value)}
                              placeholder="Defaults to the station name" />
                          </div>
                        </div>

                        <div className="sr-fg" style={{ marginBottom: 14 }}>
                          <span className="sr-label">Instructions for the visitor</span>
                          <textarea rows={2} value={station.description_text || ''}
                            onChange={e => updateStation(i, 'description_text', e.target.value)}
                            placeholder="e.g. Sit down and rest for one minute before the reading." />
                        </div>

                        {/* Station image */}
                        <div style={{ marginBottom: 16 }}>
                          <span className="sr-label">Station Image</span>
                          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                            <input type="file" accept="image/png,image/jpeg,image/gif,image/webp" style={{ display: 'none' }}
                              id={`sr-st-img-${i}`}
                              onChange={e => { pickStationImage(i, e.target.files[0]); e.target.value = '' }} />
                            <button type="button" className="sr-btn sr-btn-ghost sr-btn-sm"
                              onClick={() => document.getElementById(`sr-st-img-${i}`).click()}>📷 Upload</button>
                            {station.image_url && (
                              <div style={{ position: 'relative', display: 'inline-block' }}>
                                <img src={station.image_url} alt="" className="sr-thumb" />
                                <button type="button"
                                  style={{ position: 'absolute', top: -8, right: -8, borderRadius: '50%', width: 24, height: 24, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, lineHeight: 1, background: 'var(--gb-danger)', color: '#fff', border: '2px solid #fff', cursor: 'pointer' }}
                                  onClick={() => updateStation(i, 'image_url', '')}>✕</button>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Fields */}
                        <div className="sr-section" style={{ marginBottom: 0, background: 'transparent' }}>
                          <div className="sr-section-title" style={{ marginBottom: 10 }}>
                            Fields at this station ({(station.fields?.length || 0)})
                          </div>

                          {(station.fields?.length || 0) === 0 ? (
                            <p className="sr-hint" style={{ marginBottom: 10 }}>
                              No fields yet — the visitor will see a simple "done" screen after scanning.
                            </p>
                          ) : (station.fields || []).map((f, fi) => (
                            <div key={fi} className="sr-card" style={{ padding: '12px 16px', marginBottom: 10 }}>
                              <div className="sr-row" style={{ alignItems: 'flex-end' }}>
                                <div className="sr-fg" style={{ flex: 2, minWidth: 130 }}>
                                  <span className="sr-label">Label</span>
                                  <input value={f.field_label || ''}
                                    onChange={e => updateStationField(i, fi, 'field_label', e.target.value)} />
                                </div>
                                <div className="sr-fg" style={{ flex: 1, minWidth: 110 }}>
                                  <span className="sr-label">Type</span>
                                  <select value={f.field_type || 'text'}
                                    onChange={e => updateStationField(i, fi, 'field_type', e.target.value)}>
                                    {FIELD_TYPES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                                  </select>
                                </div>
                                <label className="sr-checkbox">
                                  <input type="checkbox" checked={!!f.is_required}
                                    onChange={e => updateStationField(i, fi, 'is_required', e.target.checked ? 1 : 0)} />
                                  Required
                                </label>
                                <button className="sr-btn sr-btn-danger sr-btn-sm" onClick={() => removeStationField(i, fi)}>✕</button>
                              </div>

                              {f.field_type === 'select' && (
                                <div className="sr-fg" style={{ marginTop: 10 }}>
                                  <span className="sr-label">Options (one per line)</span>
                                  <textarea rows={3}
                                    value={(f.field_options || []).join('\n')}
                                    onChange={e => updateStationField(i, fi, 'field_options',
                                      e.target.value.split('\n').map(s => s.trim()).filter(Boolean))}
                                    placeholder={'A+\nA-\nB+\nB-'} />
                                </div>
                              )}
                            </div>
                          ))}

                          <button className="sr-btn sr-btn-ghost sr-btn-sm" onClick={() => addStationField(i)}>+ Add Field</button>
                        </div>

                        {/* Station code + actions */}
                        <div style={{ display: 'flex', gap: 8, marginTop: 16, flexWrap: 'wrap', alignItems: 'center' }}>
                          <span className="sr-label" style={{ marginBottom: 0 }}>Station Code</span>
                          {station.station_code ? (
                            <span className="sr-code">{station.station_code}</span>
                          ) : (
                            <span className="sr-badge sr-badge-gray">assigned on save</span>
                          )}
                          <div style={{ flex: 1 }} />
                          <button className="sr-btn sr-btn-ghost sr-btn-sm" onClick={() => moveStation(i, -1)} disabled={i === 0}>↑ Up</button>
                          <button className="sr-btn sr-btn-ghost sr-btn-sm" onClick={() => moveStation(i, 1)} disabled={i === stations.length - 1}>↓ Down</button>
                          <button className="sr-btn sr-btn-ghost sr-btn-sm" onClick={() => regenerateCode(i)}>🔄 New Code</button>
                          <button className="sr-btn sr-btn-danger sr-btn-sm" onClick={() => {
                            if (window.confirm(`Delete "${station.station_name}" and its fields?`)) removeStation(i)
                          }}>🗑 Delete</button>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          {/* ════ REGISTRATION FORM TAB ════ */}
          {tab === 'form' && (
            <div>
              <div className="sr-section">
                <div className="sr-section-title">📝 Registration Form</div>
                <p className="sr-hint" style={{ marginBottom: 14 }}>
                  This is the form the visitor fills in <em>before</em> walking to any station.
                  Common medical-camp fields are name, age, gender and phone number.
                </p>
              </div>

              <div className="sr-section">
                <div className="sr-section-title">📄 Screen Text</div>
                <p className="sr-hint" style={{ marginBottom: 14 }}>
                  Everything the visitor reads on the registration screen. Leave a box empty to
                  hide that line. Press <strong>Save Screen Text</strong> at the bottom of this tab
                  to apply it.
                </p>

                <div className="sr-fg" style={{ marginBottom: 12 }}>
                  <span className="sr-label">Heading 1 — main title</span>
                  <input value={settings.heading_1 || ''}
                    onChange={e => setSettings({ ...settings, heading_1: e.target.value })}
                    placeholder="Health Checkup Registration" />
                </div>
                <div className="sr-row" style={{ marginBottom: 12 }}>
                  <div className="sr-fg">
                    <ColorPicker label="Heading 1 colour"
                      value={settings.heading_1_color || '#1a1a2e'} noPresets
                      onChange={v => setSettings({ ...settings, heading_1_color: v })} />
                  </div>
                  <div className="sr-fg">
                    <span className="sr-label">Heading 1 size</span>
                    <input type="range" min="15" max="40" value={settings.heading_1_size || 21}
                      onChange={e => setSettings({ ...settings, heading_1_size: Number(e.target.value) })} />
                    <span className="sr-hint">{settings.heading_1_size || 21}px</span>
                  </div>
                </div>

                <div className="sr-fg" style={{ marginBottom: 12 }}>
                  <span className="sr-label">Heading 2 — subtitle</span>
                  <input value={settings.heading_2 || ''}
                    onChange={e => setSettings({ ...settings, heading_2: e.target.value })}
                    placeholder="Enter your details to begin" />
                </div>
                <div className="sr-row" style={{ marginBottom: 12 }}>
                  <div className="sr-fg">
                    <ColorPicker label="Heading 2 colour"
                      value={settings.heading_2_color || '#666666'} noPresets
                      onChange={v => setSettings({ ...settings, heading_2_color: v })} />
                  </div>
                  <div className="sr-fg">
                    <span className="sr-label">Heading 2 size</span>
                    <input type="range" min="11" max="26" value={settings.heading_2_size || 13.5}
                      onChange={e => setSettings({ ...settings, heading_2_size: Number(e.target.value) })} />
                    <span className="sr-hint">{settings.heading_2_size || 13.5}px</span>
                  </div>
                </div>

                <div className="sr-fg" style={{ marginBottom: 12 }}>
                  <span className="sr-label">Heading 3 — helper line</span>
                  <input value={settings.heading_3 || ''}
                    onChange={e => setSettings({ ...settings, heading_3: e.target.value })}
                    placeholder="Takes about 30 seconds" />
                </div>
                <div className="sr-row" style={{ marginBottom: 12 }}>
                  <div className="sr-fg">
                    <ColorPicker label="Heading 3 colour"
                      value={settings.heading_3_color || '#777777'} noPresets
                      onChange={v => setSettings({ ...settings, heading_3_color: v })} />
                  </div>
                  <div className="sr-fg">
                    <span className="sr-label">Heading 3 size</span>
                    <input type="range" min="10" max="22" value={settings.heading_3_size || 12}
                      onChange={e => setSettings({ ...settings, heading_3_size: Number(e.target.value) })} />
                    <span className="sr-hint">{settings.heading_3_size || 12}px</span>
                  </div>
                </div>

                <div className="sr-fg" style={{ marginBottom: 12 }}>
                  <span className="sr-label">Description</span>
                  <textarea rows={3} value={settings.description_text || ''}
                    onChange={e => setSettings({ ...settings, description_text: e.target.value })}
                    placeholder="Your details are used only for this health checkup and are not shared." />
                </div>
                <div className="sr-row">
                  <div className="sr-fg">
                    <ColorPicker label="Description colour"
                      value={settings.description_color || '#888888'} noPresets
                      onChange={v => setSettings({ ...settings, description_color: v })} />
                  </div>
                  <div className="sr-fg">
                    <span className="sr-label">Description size</span>
                    <input type="range" min="10" max="20" value={settings.description_size || 13}
                      onChange={e => setSettings({ ...settings, description_size: Number(e.target.value) })} />
                    <span className="sr-hint">{settings.description_size || 13}px</span>
                  </div>
                </div>
              </div>

              <div className="sr-section">
                <div className="sr-section-title">🏷️ Field Labels</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 12 }}>
                  {[
                    ['label_color', 'Label colour'],
                    ['field_border_color', 'Input border'],
                    ['card_bg_color', 'Card background'],
                  ].map(([key, label]) => (
                    <div key={key}>
                      <ColorPicker label={label} value={settings[key] || '#6b7280'}
                        onChange={v => setSettings({ ...settings, [key]: v })} />
                    </div>
                  ))}
                </div>
              </div>

              <div className="sr-section">
                <div className="sr-section-title">🚀 Start Button</div>
                <div className="sr-fg" style={{ marginBottom: 12 }}>
                  <span className="sr-label">Button text</span>
                  <input value={settings.start_button_text || ''}
                    onChange={e => setSettings({ ...settings, start_button_text: e.target.value })}
                    placeholder="Start Registration" />
                </div>
                <div className="sr-row">
                  <div className="sr-fg">
                    <ColorPicker label="Background" noPresets
                      value={settings.start_button_bg_color || settings.primary_color || '#4F46E5'}
                      onChange={v => setSettings({ ...settings, start_button_bg_color: v })} />
                  </div>
                  <div className="sr-fg">
                    <ColorPicker label="Text colour" noPresets
                      value={settings.start_button_text_color || '#ffffff'}
                      onChange={v => setSettings({ ...settings, start_button_text_color: v })} />
                  </div>
                </div>
              </div>

              <div className="sr-section">
                <div className="sr-section-title">📋 Fields</div>
                <div style={{ display: 'flex', gap: 10, marginBottom: 12, justifyContent: 'flex-end' }}>
                  <button className="sr-btn sr-btn-ghost sr-btn-sm" onClick={addFormField}>+ Add Field</button>
                </div>
                {formFields.map((f, i) => (
                <div key={i} className="sr-card" style={{ padding: '12px 16px', marginBottom: 10 }}>
                  <div className="sr-row" style={{ alignItems: 'flex-end' }}>
                    <div className="sr-fg" style={{ flex: 2, minWidth: 130 }}>
                      <span className="sr-label">Label</span>
                      <input value={f.field_label || ''} onChange={e => updateFormField(i, 'field_label', e.target.value)} />
                    </div>
                    <div className="sr-fg" style={{ flex: 1, minWidth: 110 }}>
                      <span className="sr-label">Type</span>
                      <select value={f.field_type || 'text'} onChange={e => updateFormField(i, 'field_type', e.target.value)}>
                        {FIELD_TYPES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                      </select>
                    </div>
                    <label className="sr-checkbox">
                      <input type="checkbox" checked={!!f.is_required}
                        onChange={e => updateFormField(i, 'is_required', e.target.checked ? 1 : 0)} />
                      Required
                    </label>
                    <button className="sr-btn sr-btn-danger sr-btn-sm" onClick={() => removeFormField(i)}>✕</button>
                  </div>
                  {f.field_type === 'select' && (
                    <div className="sr-fg" style={{ marginTop: 10 }}>
                      <span className="sr-label">Options (one per line)</span>
                      <textarea rows={3} value={(f.field_options || []).join('\n')}
                        onChange={e => updateFormField(i, 'field_options',
                          e.target.value.split('\n').map(s => s.trim()).filter(Boolean))} />
                    </div>
                  )}
                </div>
              ))}
              </div>

              <div style={{ display: 'flex', gap: 10, marginTop: 16, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                <button className="sr-btn sr-btn-ghost" onClick={saveFormFields} disabled={savingForm}>
                  {savingForm ? 'Saving…' : '💾 Save Fields'}
                </button>
                <button className="sr-btn sr-btn-primary" onClick={saveSettings} disabled={saving}>
                  {saving ? 'Saving…' : '💾 Save Screen Text'}
                </button>
              </div>
            </div>
          )}

          {/* ════ QR CODES TAB ════ */}
          {tab === 'qr' && (
            <div className="sr-print-area">
              {stations.length === 0 ? (
                <div className="sr-card sr-empty">
                  <div className="sr-empty-icon">🔗</div>
                  <p style={{ fontWeight: 600, marginBottom: 6 }}>No stations to print</p>
                  <p style={{ fontSize: 13 }}>Add stations and save them first — codes are generated on save.</p>
                </div>
              ) : (
                <>
                  <div className="sr-section" style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: 240 }}>
                      <div className="sr-section-title" style={{ marginBottom: 4 }}>🖨️ Print &amp; place at each station</div>
                      <p className="sr-hint">
                        Print one sheet per station and stick it at that desk. Use
                        <strong> Regenerate Code</strong> if a sheet is lost or replaced.
                      </p>
                    </div>
                    <button className="sr-btn sr-btn-primary" onClick={printSheet}>🖨️ Print All Sheets</button>
                  </div>

                  {stations.some(s => !s.station_code) && (
                    <div className="sr-danger-note">
                      Some stations have no code yet. Click <strong>Save Stations</strong> on the
                      Stations tab to generate them.
                    </div>
                  )}

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))', gap: 16 }}>
                    {stations.map((station, i) => (
                      <div key={station.id ?? `new-${i}`} className="sr-qr-sheet">
                        <div style={{ fontSize: 26, marginBottom: 6 }}>{station.icon || '📍'}</div>
                        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: '#666' }}>
                          Station {i + 1}
                        </div>
                        <div style={{ fontSize: 17, fontWeight: 800, margin: '4px 0 12px' }}>
                          {station.station_name || `Station ${i + 1}`}
                        </div>

                        {qrCodes[station.id] ? (
                          <img src={qrCodes[station.id]} alt=""
                            style={{ width: '100%', maxWidth: 200, height: 'auto', display: 'block', margin: '0 auto' }} />
                        ) : (
                          <div style={{
                            width: '100%', maxWidth: 200, aspectRatio: '1/1', margin: '0 auto',
                            border: '2px dashed #d4d4d8', borderRadius: 10,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: '#a1a1aa', fontSize: 12, textAlign: 'center', padding: 12,
                          }}>
                            Save stations to generate this QR code
                          </div>
                        )}

                        {station.station_code && (
                          <div style={{ marginTop: 12, fontFamily: 'ui-monospace,Menlo,monospace', fontSize: 13, letterSpacing: '.14em', fontWeight: 700 }}>
                            {station.station_code}
                          </div>
                        )}
                        <div style={{ fontSize: 11, color: '#888', marginTop: 4 }}>
                          Scan with the player's phone camera
                        </div>

                        <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginTop: 14, flexWrap: 'wrap' }}>
                          <button className="sr-btn sr-btn-ghost sr-btn-sm"
                            onClick={() => downloadQr(station, qrCodes[station.id])}
                            disabled={!qrCodes[station.id]}>⬇ PNG</button>
                          <button className="sr-btn sr-btn-ghost sr-btn-sm"
                            onClick={() => copyStationLink(station)}
                            disabled={!station.station_code}>🔗 Copy</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {/* ════ DESIGN TAB ════ */}
          {tab === 'display' && (
            <div>
              <div className="sr-section">
                <div className="sr-section-title">🎨 Global</div>
                <p className="sr-hint" style={{ marginBottom: 14 }}>
                  Applies to every screen. Per-screen text and buttons are set on the
                  Registration Form, Thank You and Settings tabs.
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 12 }}>
                  {[
                    ['bg_color', 'Page background'],
                    ['primary_color', 'Primary / Accent'],
                    ['card_bg_color', 'Card background'],
                    ['label_color', 'Field label'],
                    ['field_border_color', 'Input border'],
                    ['station_done_color', 'Completed badge'],
                  ].map(([key, label]) => (
                    <div key={key}>
                      <ColorPicker label={label} value={settings[key] || '#000000'} noPresets
                        onChange={v => setSettings({ ...settings, [key]: v })} />
                    </div>
                  ))}
                </div>
                <div className="sr-fg" style={{ marginTop: 12 }}>
                  <span className="sr-label">Font family</span>
                  <select value={settings.font_family || 'DM Sans'}
                    onChange={e => setSettings({ ...settings, font_family: e.target.value })}>
                    {['DM Sans', 'Inter', 'Poppins', 'Roboto', 'Lato', 'Montserrat', 'system-ui'].map(f => (
                      <option key={f} value={f}>{f}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="sr-section">
                <div className="sr-section-title">📍 Station List Screen</div>
                <div className="sr-fg" style={{ marginBottom: 12 }}>
                  <span className="sr-label">Heading</span>
                  <input value={settings.stations_heading || ''}
                    onChange={e => setSettings({ ...settings, stations_heading: e.target.value })}
                    placeholder="Find your next station" />
                </div>
                <div className="sr-fg">
                  <span className="sr-label">Sub-heading</span>
                  <textarea rows={2} value={settings.stations_subheading || ''}
                    onChange={e => setSettings({ ...settings, stations_subheading: e.target.value })}
                    placeholder="Scan the QR code at the station to fill in that section." />
                </div>
              </div>

              <div className="sr-section">
                <div className="sr-section-title">🖼️ Images</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 18 }}>
                  {[
                    ['bg_image_url', '_bgFile', bgImgRef, 'Background Image'],
                    ['game_logo_url', '_logoFile', logoRef, 'Logo'],
                    ['station_bg_image_url', '_stationBgFile', stationBgRef, 'Station Screen Image'],
                    ['thankyou_bg_image_url', '_thankyouBgFile', thankyouBgRef, 'Thank You Image (inside the card)'],
                  ].map(([urlKey, stateKey, ref, label]) => (
                    <div key={urlKey} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <span className="sr-label" style={{ textAlign: 'center' }}>{label}</span>
                      <input type="file" ref={ref} accept="image/png,image/jpeg,image/gif,image/webp"
                        onChange={e => pickImage(stateKey, urlKey, e.target.files[0], ref)} style={{ display: 'none' }} />
                      <button type="button" className="sr-btn sr-btn-ghost sr-btn-sm"
                        onClick={() => ref.current?.click()} style={{ border: 'none', background: 'transparent', padding: '6px 12px' }}>
                        📷 Upload
                      </button>
                      {settings[urlKey] && (
                        <div style={{ position: 'relative', display: 'inline-block', marginTop: 10 }}>
                          <img src={settings[urlKey]} alt="" className="sr-thumb" />
                          <button type="button"
                            style={{ position: 'absolute', top: -8, right: -8, borderRadius: '50%', width: 24, height: 24, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, lineHeight: 1, background: 'var(--gb-danger)', color: '#fff', border: '2px solid #fff', cursor: 'pointer' }}
                            onClick={() => setSettings({ ...settings, [urlKey]: '', [stateKey]: null })}>✕</button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button className="sr-btn sr-btn-primary" onClick={saveSettings} disabled={saving}>
                  {saving ? 'Saving…' : '💾 Save Design'}
                </button>
              </div>
            </div>
          )}

          {/* ════ THANK YOU TAB ════ */}
          {tab === 'thankyou' && (
            <div>
              <div className="sr-section">
                <div className="sr-section-title">🎉 Thank You Screen</div>
                <p className="sr-hint" style={{ marginBottom: 14 }}>
                  Shown once every station is saved. BMI is deliberately <em>not</em> shown here —
                  it goes to the participant by email.
                </p>

                <label className="sr-checkbox" style={{ alignItems: 'flex-start', marginBottom: 16 }}>
                  <input type="checkbox" checked={!!settings.show_entries_summary}
                    onChange={e => setSettings({ ...settings, show_entries_summary: e.target.checked ? 1 : 0 })} />
                  <span>
                    <strong>Show a summary of what was entered</strong>
                    <br />
                    <span className="sr-hint">
                      Lists every station and value the participant filled in, so a volunteer can
                      read it back. Turn off for a plainer screen.
                    </span>
                  </span>
                </label>

                <div className="sr-fg" style={{ marginBottom: 12 }}>
                  <span className="sr-label">Heading</span>
                  <input value={settings.thankyou_heading || ''}
                    onChange={e => setSettings({ ...settings, thankyou_heading: e.target.value })}
                    placeholder="All Stations Complete!" />
                </div>
                <div className="sr-row" style={{ marginBottom: 12 }}>
                  <div className="sr-fg">
                    <ColorPicker label="Heading colour" noPresets
                      value={settings.thankyou_heading_color || '#1a1a2e'}
                      onChange={v => setSettings({ ...settings, thankyou_heading_color: v })} />
                  </div>
                  <div className="sr-fg">
                    <span className="sr-label">Heading size</span>
                    <input type="range" min="16" max="36" value={settings.thankyou_heading_size || 22}
                      onChange={e => setSettings({ ...settings, thankyou_heading_size: Number(e.target.value) })} />
                    <span className="sr-hint">{settings.thankyou_heading_size || 22}px</span>
                  </div>
                </div>

                <div className="sr-fg" style={{ marginBottom: 12 }}>
                  <span className="sr-label">Message</span>
                  <textarea rows={3} value={settings.thankyou_text || ''}
                    onChange={e => setSettings({ ...settings, thankyou_text: e.target.value })}
                    placeholder="Your report is on its way to your email." />
                </div>
                <div className="sr-row">
                  <div className="sr-fg">
                    <ColorPicker label="Text colour" noPresets
                      value={settings.thankyou_text_color || '#4b5563'}
                      onChange={v => setSettings({ ...settings, thankyou_text_color: v })} />
                  </div>
                  <div className="sr-fg">
                    <span className="sr-label">Text size</span>
                    <input type="range" min="11" max="20" value={settings.thankyou_text_size || 14}
                      onChange={e => setSettings({ ...settings, thankyou_text_size: Number(e.target.value) })} />
                    <span className="sr-hint">{settings.thankyou_text_size || 14}px</span>
                  </div>
                </div>
              </div>

              <div className="sr-section">
                <div className="sr-section-title">📋 Summary Heading</div>
                <div className="sr-fg" style={{ marginBottom: 12 }}>
                  <span className="sr-label">Heading above the summary list</span>
                  <input value={settings.thankyou_summary_heading || ''}
                    onChange={e => setSettings({ ...settings, thankyou_summary_heading: e.target.value })}
                    placeholder="Your entries" />
                </div>
                <div className="sr-fg">
                  <span className="sr-label">Footer note</span>
                  <textarea rows={2} value={settings.outro_text || ''}
                    onChange={e => setSettings({ ...settings, outro_text: e.target.value })}
                    placeholder="Stay for the free health screening session in Hall B." />
                </div>
                <div className="sr-fg" style={{ marginTop: 12 }}>
                  <ColorPicker label="Footer note colour" noPresets
                    value={settings.outro_text_color || '#6b7280'}
                    onChange={v => setSettings({ ...settings, outro_text_color: v })} />
                </div>
              </div>

              <div className="sr-section">
                <div className="sr-section-title">🏁 Finish Button</div>
                <div className="sr-fg" style={{ marginBottom: 12 }}>
                  <span className="sr-label">Button text</span>
                  <input value={settings.finish_button_text || ''}
                    onChange={e => setSettings({ ...settings, finish_button_text: e.target.value })}
                    placeholder="Finish" />
                </div>
                <div className="sr-row">
                  <div className="sr-fg">
                    <ColorPicker label="Text colour" noPresets
                      value={settings.finish_button_text_color || '#6b7280'}
                      onChange={v => setSettings({ ...settings, finish_button_text_color: v })} />
                  </div>
                  <div className="sr-fg">
                    <ColorPicker label="Background" noPresets
                      value={settings.finish_button_bg_color || '#f3f4f6'}
                      onChange={v => setSettings({ ...settings, finish_button_bg_color: v })} />
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button className="sr-btn sr-btn-primary" onClick={saveSettings} disabled={saving}>
                  {saving ? 'Saving…' : '💾 Save Thank You'}
                </button>
              </div>
            </div>
          )}

          {/* ════ EMAIL TAB ════ */}
          {tab === 'email' && (
            <div>
              <div className="sr-section">
                <div className="sr-section-title">📧 Report Email</div>
                <p className="sr-hint" style={{ marginBottom: 14 }}>
                  Sent to the email address captured in the registration form once every
                  station is saved. BMI is calculated automatically and included in the email.
                </p>

                {!hasEmailField && (
                  <div className="sr-alert sr-alert-warn" style={{ marginBottom: 16 }}>
                    <span>⚠️</span>
                    <span>
                      Your registration form has no <strong>Email</strong> field. Add one on the
                      Registration Form tab, otherwise no report can be delivered.
                    </span>
                  </div>
                )}

                <label className="sr-checkbox" style={{ alignItems: 'flex-start', marginBottom: 16 }}>
                  <input type="checkbox" checked={!!emailSettings.is_enabled}
                    onChange={e => setEmailSettings({ ...emailSettings, is_enabled: e.target.checked ? 1 : 0 })} />
                  <span>
                    <strong>Send the report by email</strong>
                    <br />
                    <span className="sr-hint">Uses the SMTP settings configured for this server.</span>
                  </span>
                </label>
              </div>

              <div className="sr-section">
                <div className="sr-section-title">✉️ Envelope</div>
                <div className="sr-fg" style={{ marginBottom: 12 }}>
                  <span className="sr-label">Subject — {'{{name}}'} is replaced with the participant's name</span>
                  <input value={emailSettings.subject || ''}
                    onChange={e => setEmailSettings({ ...emailSettings, subject: e.target.value })}
                    placeholder="Your Health Checkup Report" />
                </div>
                <div className="sr-row">
                  <div className="sr-fg">
                    <span className="sr-label">Sender name</span>
                    <input value={emailSettings.sender_name || ''}
                      onChange={e => setEmailSettings({ ...emailSettings, sender_name: e.target.value })}
                      placeholder="Health Camp" />
                  </div>
                  <div className="sr-fg">
                    <span className="sr-label">Send from</span>
                    <select value={emailSettings.sender_account || 'default'}
                      onChange={e => setEmailSettings({ ...emailSettings, sender_account: e.target.value === 'default' ? '' : e.target.value })}>
                      {(senders.length ? senders : [{ key: 'default', label: 'Default' }]).map(s => (
                        <option key={s.key} value={s.key}>{s.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="sr-fg">
                    <span className="sr-label">Reply-to email (optional)</span>
                    <input value={emailSettings.sender_email || ''}
                      onChange={e => setEmailSettings({ ...emailSettings, sender_email: e.target.value })}
                      placeholder="replies@yourcamp.org" />
                  </div>
                </div>
              </div>

              <div className="sr-section">
                <div className="sr-section-title">🎨 Header</div>
                <div className="sr-fg" style={{ marginBottom: 12 }}>
                  <span className="sr-label">Header text</span>
                  <input value={emailSettings.header_text || ''}
                    onChange={e => setEmailSettings({ ...emailSettings, header_text: e.target.value })}
                    placeholder="🩺 Your Health Report" />
                </div>
                <div className="sr-row">
                  <div className="sr-fg">
                    <ColorPicker label="Header colour" noPresets
                      value={emailSettings.header_color || '#4F46E5'}
                      onChange={v => setEmailSettings({ ...emailSettings, header_color: v })} />
                  </div>
                  <div className="sr-fg">
                    <ColorPicker label="Accent colour" noPresets
                      value={emailSettings.accent_color || '#4F46E5'}
                      onChange={v => setEmailSettings({ ...emailSettings, accent_color: v })} />
                  </div>
                </div>
              </div>

              <div className="sr-section">
                <div className="sr-section-title">📝 Body HTML</div>
                <p className="sr-hint" style={{ marginBottom: 12 }}>
                  Full HTML is supported. Click a token to insert it at the cursor. Use{' '}
                  <code>{'{{bmi_card}}'}</code> and <code>{'{{measurements_table}}'}</code> to place those
                  blocks yourself, and <code>{'{{field:Label}}'}</code> for any value the participant entered.
                </p>

                <label className="sr-checkbox" style={{ alignItems: 'flex-start', marginBottom: 12 }}>
                  <input type="checkbox" checked={!!emailSettings.use_full_html}
                    onChange={e => setEmailSettings({ ...emailSettings, use_full_html: e.target.checked ? 1 : 0 })} />
                  <span>
                    <strong>My HTML is the whole email</strong>
                    <br />
                    <span className="sr-hint">
                      No header, card, footer or disclaimer is added around it. You control every pixel.
                    </span>
                  </span>
                </label>

                <button type="button" className="sr-btn sr-btn-ghost sr-btn-sm" style={{ marginBottom: 10 }}
                  onClick={() => {
                    if (emailSettings.body_html && !window.confirm('Replace the current body with the starter template?')) return
                    setEmailSettings({ ...emailSettings, body_html: STARTER_EMAIL_BODY })
                  }}>
                  Load starter template
                </button>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
                  {EMAIL_TOKENS.map(tok => (
                    <button key={tok.token} type="button" className="sr-btn sr-btn-ghost sr-btn-sm"
                      onClick={() => insertEmailToken(tok.token)}
                      title={tok.hint}>
                      {tok.token}
                    </button>
                  ))}
                </div>

                <textarea ref={emailBodyRef} rows={16} spellCheck={false}
                  value={emailSettings.body_html || ''}
                  onChange={e => setEmailSettings({ ...emailSettings, body_html: e.target.value })}
                  placeholder={'<p>Hi {{player_name}},</p>\n<p>Thank you for completing the health checkup.</p>\n<p>Your BMI is <strong>{{bmi}}</strong> ({{bmi_category}}).</p>'}
                  style={{ fontFamily: 'ui-monospace, Menlo, Consolas, monospace', fontSize: 12.5, lineHeight: 1.6 }}
                />
              </div>

              <div className="sr-section">
                <div className="sr-section-title">📄 Content Blocks</div>
                <div style={{ display: 'grid', gap: 14 }}>
                  <label className="sr-checkbox" style={{ alignItems: 'flex-start' }}>
                    <input type="checkbox" checked={emailSettings.show_bmi_block !== 0}
                      onChange={e => setEmailSettings({ ...emailSettings, show_bmi_block: e.target.checked ? 1 : 0 })} />
                    <span>
                      <strong>Include the BMI card</strong>
                      <br />
                      <span className="sr-hint">
                        A colour-coded card with the BMI, its band, and for children the
                        percentile. Omitted automatically if height or weight was not captured.
                      </span>
                    </span>
                  </label>
                  <label className="sr-checkbox" style={{ alignItems: 'flex-start' }}>
                    <input type="checkbox" checked={emailSettings.show_entries_table !== 0}
                      onChange={e => setEmailSettings({ ...emailSettings, show_entries_table: e.target.checked ? 1 : 0 })} />
                    <span>
                      <strong>Include the measurements table</strong>
                      <br />
                      <span className="sr-hint">Every value the participant entered, by station.</span>
                    </span>
                  </label>
                  <label className="sr-checkbox" style={{ alignItems: 'flex-start' }}>
                    <input type="checkbox" checked={emailSettings.show_disclaimer !== 0}
                      onChange={e => setEmailSettings({ ...emailSettings, show_disclaimer: e.target.checked ? 1 : 0 })} />
                    <span>
                      <strong>Include the disclaimer</strong>
                      <br />
                      <span className="sr-hint">Small print under the report. Edit the wording below.</span>
                    </span>
                  </label>
                  {emailSettings.show_disclaimer !== 0 && (
                    <textarea rows={3} value={emailSettings.disclaimer_text || ''}
                      onChange={e => setEmailSettings({ ...emailSettings, disclaimer_text: e.target.value })}
                      placeholder="This report is generated automatically for information only. It is not a medical diagnosis. Please follow up with a qualified health professional." />
                  )}
                </div>
              </div>

              <div className="sr-section">
                <div className="sr-section-title">🦶 Footer</div>
                <div className="sr-fg">
                  <span className="sr-label">Footer text — plain text, shown in a coloured strip</span>
                  <textarea rows={2} value={emailSettings.footer_text || ''}
                    onChange={e => setEmailSettings({ ...emailSettings, footer_text: e.target.value })}
                    placeholder="City Health Department · Free camp on 12 May" />
                </div>
              </div>

              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                <button className="sr-btn sr-btn-ghost" onClick={previewEmail} disabled={previewing}>
                  {previewing ? 'Rendering…' : '👁️ Preview'}
                </button>
                <button className="sr-btn sr-btn-primary" onClick={saveEmailSettings} disabled={savingEmail}>
                  {savingEmail ? 'Saving…' : '💾 Save Email'}
                </button>
              </div>
            </div>
          )}

          {emailPreview && (
            <div className="sr-section" style={{ marginTop: 18 }}>
              <div className="sr-section-title">👁️ Preview — {emailPreview.subject}</div>
              <p className="sr-hint" style={{ marginBottom: 12 }}>
                Rendered with sample data. This is the exact HTML the participant receives.
              </p>
              <iframe
                title="Email preview"
                srcDoc={emailPreview.html}
                style={{ width: '100%', height: 560, border: '1px solid var(--gb-border)', borderRadius: 12, background: '#fff' }}
              />
            </div>
          )}

          {/* ════ SETTINGS TAB ════ */}
          {tab === 'settings' && (
            <div>
              <div className="sr-section">
                <div className="sr-section-title">⚙️ Flow</div>
                <div style={{ display: 'grid', gap: 14 }}>
                  <label className="sr-checkbox" style={{ alignItems: 'flex-start' }}>
                    <input type="checkbox" checked={!!settings.require_qr}
                      onChange={e => setSettings({ ...settings, require_qr: e.target.checked ? 1 : 0 })} />
                    <span>
                      <strong>QR based stations</strong>
                      <br />
                      <span className="sr-hint">
                        <strong>On:</strong> each station must be unlocked by scanning the QR code
                        printed there — the camera is required.
                        <br />
                        <strong>Off:</strong> no camera and no QR codes are used at all. The
                        participant gets a <em>Fill in</em> / <em>Update</em> button on every
                        station and can correct any value freely.
                      </span>
                    </span>
                  </label>
                  <label className="sr-checkbox" style={{ alignItems: 'flex-start' }}>
                    <input type="checkbox" checked={!!settings.require_order}
                      onChange={e => setSettings({ ...settings, require_order: e.target.checked ? 1 : 0 })} />
                    <span>
                      <strong>Require stations in order</strong>
                      <br />
                      <span className="sr-hint">
                        <strong>On:</strong> each station has its own Scan button and unlocks only
                        after the previous one is saved.
                        <br />
                        <strong>Off:</strong> a single <em>Scan Station QR Code</em> button appears,
                        so the visitor can walk up to any station and scan it.
                      </span>
                    </span>
                  </label>
                  <label className="sr-checkbox" style={{ alignItems: 'flex-start' }}>
                    <input type="checkbox" checked={!!settings.show_progress}
                      onChange={e => setSettings({ ...settings, show_progress: e.target.checked ? 1 : 0 })} />
                    <span>
                      <strong>Show progress bar</strong>
                      <br />
                      <span className="sr-hint">"3 of 5 stations complete" while the visitor walks around.</span>
                    </span>
                  </label>
                  <label className="sr-checkbox" style={{ alignItems: 'flex-start' }}>
                    <input type="checkbox" checked={!!settings.allow_rescan}
                      onChange={e => setSettings({ ...settings, allow_rescan: e.target.checked ? 1 : 0 })} />
                    <span>
                      <strong>Allow re-editing a finished station</strong>
                      <br />
                      <span className="sr-hint">Visitor can reopen a completed station to correct a typo.</span>
                    </span>
                  </label>
                </div>
              </div>

              <div className="sr-section">
                <div className="sr-section-title">🔘 Station Screen Buttons</div>
                <p className="sr-hint" style={{ marginBottom: 14 }}>
                  The buttons the visitor taps on the station list and inside a station. The
                  registration screen's start button is on the Registration Form tab.
                </p>
                <div className="sr-fg" style={{ marginBottom: 12 }}>
                  <span className="sr-label">Scan Button — text</span>
                  <input value={settings.scan_button_text || ''}
                    onChange={e => setSettings({ ...settings, scan_button_text: e.target.value })} />
                </div>
                <div className="sr-row" style={{ marginBottom: 16 }}>
                  <div className="sr-fg">
                    <ColorPicker label="Background" noPresets
                      value={settings.scan_button_bg_color || '#4F46E5'}
                      onChange={v => setSettings({ ...settings, scan_button_bg_color: v })} />
                  </div>
                  <div className="sr-fg">
                    <ColorPicker label="Text colour" noPresets
                      value={settings.scan_button_text_color || '#ffffff'}
                      onChange={v => setSettings({ ...settings, scan_button_text_color: v })} />
                  </div>
                </div>

                <div className="sr-fg" style={{ marginBottom: 12 }}>
                  <span className="sr-label">Save Button — text</span>
                  <input value={settings.submit_button_text || ''}
                    onChange={e => setSettings({ ...settings, submit_button_text: e.target.value })} />
                </div>
                <div className="sr-row">
                  <div className="sr-fg">
                    <ColorPicker label="Background" noPresets
                      value={settings.submit_button_bg_color || '#4F46E5'}
                      onChange={v => setSettings({ ...settings, submit_button_bg_color: v })} />
                  </div>
                  <div className="sr-fg">
                    <ColorPicker label="Text colour" noPresets
                      value={settings.submit_button_text_color || '#ffffff'}
                      onChange={v => setSettings({ ...settings, submit_button_text_color: v })} />
                  </div>
                </div>
              </div>

              <div className="sr-section">
                <div className="sr-section-title">📱 Scanner</div>
                <div className="sr-fg">
                  <span className="sr-label">Scanner Hint Text</span>
                  <textarea rows={2} value={settings.scan_hint_text || ''}
                    onChange={e => setSettings({ ...settings, scan_hint_text: e.target.value })} />
                </div>
              </div>

              <div className="sr-section">
                <div className="sr-section-title">📄 Meta</div>
                <div className="sr-fg" style={{ marginBottom: 12 }}>
                  <span className="sr-label">Meta Description</span>
                  <textarea rows={2} value={settings.meta_description || ''}
                    onChange={e => setSettings({ ...settings, meta_description: e.target.value })} />
                </div>
                <div className="sr-fg">
                  <span className="sr-label">Player Link</span>
                  <input readOnly value={gameLink} style={{ fontSize: 12, opacity: .75 }} />
                </div>
              </div>

              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button className="sr-btn sr-btn-primary" onClick={saveSettings} disabled={saving}>
                  {saving ? 'Saving…' : '💾 Save Settings'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ─── RIGHT COL: phone preview ─── */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
          <PhoneFrame settings={settings}>
            {tab === 'form' ? (
              <FormPreview settings={settings} formFields={formFields}
                defaultButtonText={settings.start_button_text || 'Start Registration'} />
            ) : tab === 'thankyou' || tab === 'email' ? (
              <ThankYouPreview settings={settings} stations={stations} />
            ) : (
              <StationListPreview
                settings={settings}
                stations={stations}
                onPick={(i) => setOpenStations(prev => ({ ...prev, [stations[i].id != null ? String(stations[i].id) : `new-${i}`]: true }))}
              />
            )}
          </PhoneFrame>

          <div style={{ maxWidth: 320 }}>
            <div className="sr-card" style={{ padding: 14 }}>
              <div className="sr-section-title" style={{ marginBottom: 8 }}>Setup checklist</div>
              <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12.5, lineHeight: 1.9, color: 'var(--gb-text2)' }}>
                <li>{stations.length === 0 ? '⚠️ ' : '✓ '}{stations.length} station(s) added</li>
                <li>{stations.some(s => !s.station_code) ? '⚠️ ' : '✓ '}Station codes generated</li>
                <li>{formFields.length === 0 ? '⚠️ ' : '✓ '}Registration form has fields</li>
                <li>🖨️ Print the QR sheets from the QR Codes tab</li>
                <li>👁 Open the player link to test the flow</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  )
}

/** Compact read-only rendering of the player's station list, for the phone mockup. */
function StationListPreview({ settings, stations, onPick }) {
  const active = stations.filter(s => s.is_active)
  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: 16, background: settings.bg_image_url ? `url(${settings.bg_image_url}) center/cover` : (settings.bg_color || '#f4f6ff') }}>
      {settings.game_logo_url && (
        <div style={{ textAlign: 'center', marginBottom: 10 }}>
          <img src={settings.game_logo_url} alt="" style={{ maxWidth: '100%', maxHeight: 56, objectFit: 'contain' }} />
        </div>
      )}
      <h1 style={{ fontSize: 15, fontWeight: 800, textAlign: 'center', marginBottom: 2, color: settings.heading_1_color }}>
        {settings.heading_1 || 'Untitled'}
      </h1>
      {settings.heading_2 && (
        <div style={{ fontSize: 12, textAlign: 'center', marginBottom: 10, color: settings.heading_2_color }}>{settings.heading_2}</div>
      )}

      {active.length === 0 ? (
        <div style={{ textAlign: 'center', color: '#888', fontSize: 12, padding: '40px 10px' }}>
          Add stations to see the player screen
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {active.map((s) => {
            const realIndex = stations.indexOf(s)
            return (
              <div key={s.id ?? realIndex} onClick={() => onPick(realIndex)} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                background: 'rgba(255,255,255,0.93)', borderRadius: 12, padding: '10px 12px',
                border: '1px solid rgba(0,0,0,0.06)', cursor: 'pointer',
              }}>
                <div style={{
                  width: 30, height: 30, borderRadius: 9, flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15,
                  background: `${settings.primary_color || '#4F46E5'}18`,
                }}>{s.icon || '📍'}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 700, color: '#1a1a2e' }}>{s.station_name}</div>
                  <div style={{ fontSize: 10.5, color: '#888' }}>{(s.fields?.length || 0)} field(s)</div>
                </div>
                <span style={{ color: settings.primary_color || '#4F46E5', fontSize: 14 }}>›</span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

/** Preview of the screen shown once every station is saved. */
function ThankYouPreview({ settings, stations }) {
  const active = stations.filter(s => s.is_active)
  return (
    <div style={{
      flex: 1, overflowY: 'auto', padding: 16,
      display: 'flex', flexDirection: 'column', gap: 12,
      background: settings.bg_image_url
        ? `url(${settings.bg_image_url}) center/cover`
        : (settings.bg_color || '#f4f6ff'),
    }}>
      <div style={{
        background: settings.card_bg_color || 'rgba(255,255,255,0.94)',
        borderRadius: settings.card_radius || 20, padding: 20, textAlign: 'center',
      }}>
        <div style={{
          width: 56, height: 56, borderRadius: '50%', margin: '0 auto 12px',
          background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 6L9 17l-5-5" />
          </svg>
        </div>
        <div style={{
          fontSize: settings.thankyou_heading_size || 22, fontWeight: 800, lineHeight: 1.25,
          color: settings.thankyou_heading_color || '#1a1a2e',
        }}>
          {settings.thankyou_heading || 'All Stations Complete!'}
        </div>
        {settings.thankyou_text && (
          <div style={{
            fontSize: settings.thankyou_text_size || 14, marginTop: 10, lineHeight: 1.6,
            color: settings.thankyou_text_color || '#4b5563',
          }}>
            {settings.thankyou_text}
          </div>
        )}
        {settings.thankyou_bg_image_url && (
          <img
            src={settings.thankyou_bg_image_url}
            alt=""
            style={{ width: '100%', maxHeight: 120, objectFit: 'cover', display: 'block', borderRadius: 10, marginTop: 14 }}
          />
        )}
      </div>

      {settings.show_entries_summary !== 0 && active.length > 0 && (
        <div style={{
          background: settings.card_bg_color || 'rgba(255,255,255,0.94)',
          borderRadius: settings.card_radius || 20, padding: 16,
        }}>
          <div style={{
            fontSize: 10, fontWeight: 800, letterSpacing: '.07em', textTransform: 'uppercase',
            color: settings.label_color || '#6b7280', marginBottom: 8,
          }}>
            {settings.thankyou_summary_heading || 'Your entries'}
          </div>
          {active.map((s, i) => (
            <div key={s.id ?? i} style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: settings.heading_1_color || '#1a1a2e' }}>
                {s.icon} {s.station_name}
              </div>
              {(s.fields || []).slice(0, 2).map((f, j) => (
                <div key={j} style={{ display: 'flex', justifyContent: 'space-between', gap: 8, padding: '4px 0' }}>
                  <span style={{ fontSize: 11, color: '#64748b' }}>{f.field_label}</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#0f172a' }}>{f._sample || '—'}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {settings.outro_text && (
        <div style={{ fontSize: 12, textAlign: 'center', color: settings.outro_text_color || '#6b7280', lineHeight: 1.6 }}>
          {settings.outro_text}
        </div>
      )}

      <div style={{
        background: settings.finish_button_bg_color || '#f3f4f6',
        color: settings.finish_button_text_color || '#6b7280',
        fontWeight: 700, fontSize: 13, padding: 12, borderRadius: 12, textAlign: 'center',
      }}>
        {settings.finish_button_text || 'Finish'}
      </div>
    </div>
  )
}

/** Convert a `data:` URL into a Blob so it can go into FormData as a real file. */
function dataUrlToBlob(dataUrl) {
  try {
    const [header, payload] = dataUrl.split(',')
    const mime = (header.match(/:(.*?);/) || [])[1] || 'image/png'
    const binary = atob(payload)
    const bytes = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
    return new Blob([bytes], { type: mime })
  } catch {
    return null
  }
}
