/* ─────────────────────────────────────────────────────────────────────────
 * Shared builder upload-error helper
 * Used by all game-builder pages for uniform UX:
 *   - a field that fails upload (413 / wrong type / server reject) gets a red
 *     border + message
 *   - tabs that contain a failing field get a red dot (VS Code style)
 *
 * Usage in a builder:
 *   const upload = useUploadErrors()
 *   // when an upload fails for field "bg_image_url":
 *   upload.setFieldError('bg_image_url', 'File too large (max 25MB)')
 *   // clear on success / on new file:
 *   upload.clearFieldError('bg_image_url')
 *   // in TABS render:
 *   {TABS.map(t => <button ...>{t.label}{upload.tabHasError(t.id, FIELDS_BY_TAB[t.id]) && <span className="gb-tab-err-dot"/>}</button>)}
 * ───────────────────────────────────────────────────────────────────────── */

import { useState, useCallback } from 'react'

export function useUploadErrors() {
  const [errors, setErrors] = useState({}) // { fieldName: message }

  const setFieldError = useCallback((field, message) => {
    setErrors(prev => ({ ...prev, [field]: message }))
  }, [])

  const clearFieldError = useCallback((field) => {
    setErrors(prev => {
      if (!(field in prev)) return prev
      const next = { ...prev }
      delete next[field]
      return next
    })
  }, [])

  const clearAll = useCallback(() => setErrors({}), [])

  const hasError = useCallback((field) => Boolean(errors[field]), [errors])

  // tabHasError(tabId, fieldsForTab) → true if any of the tab's fields error
  const tabHasError = useCallback((tabId, fieldsForTab) => {
    const fields = fieldsForTab || []
    return fields.some(f => errors[f])
  }, [errors])

  return { errors, setFieldError, clearFieldError, clearAll, hasError, tabHasError }
}

/* Map a failed axios/fetch error to a friendly message.
   Catches 413 (too large) and any server upload rejection. */
export function uploadErrorMessage(err) {
  const status = err?.response?.status
  const data = err?.response?.data || {}
  if (status === 413) return 'File too large (max 25MB)'
  if (data?.message) return data.message
  if (data?.error) return data.error
  if (err?.message) return err.message
  return 'Upload failed'
}

/* Wrap an upload api call. On failure, marks the field in error state,
   shows a toast, and rethrows so callers can stop further work. */
export async function guardedUpload({ field, apiCall, setFieldError, showToast, clearOnStart = true }) {
  if (clearOnStart) setFieldError && setFieldError(field, '') // optimistic clear while uploading
  try {
    const res = await apiCall()
    setFieldError && setFieldError(field, '') // success → clear
    return res
  } catch (err) {
    setFieldError && setFieldError(field, uploadErrorMessage(err))
    showToast && showToast(uploadErrorMessage(err), 'error')
    throw err
  }
}
