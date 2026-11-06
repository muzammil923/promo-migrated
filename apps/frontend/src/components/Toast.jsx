import { useEffect } from 'react'

export default function Toast({ msg, type = 'success', onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3200)
    return () => clearTimeout(t)
  }, [msg])

  if (!msg) return null

  const icons = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' }

  return (
    <div className={`toast ${type}`} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <span style={{ fontSize: 16 }}>{icons[type] || '✅'}</span>
      <span style={{ fontSize: 14 }}>{msg}</span>
    </div>
  )
}
