import { useState, useEffect, useRef } from 'react'
import api from '../api'

const DESIGN_TEMPLATES = {
  background: { label: 'Game Background', width: 1920, height: 1080, icon: '🖼️' },
  logo: { label: 'Game Logo', width: 500, height: 500, icon: '🎨' },
  question_image: { label: 'Question Image', width: 800, height: 600, icon: '❓' },
  card_image: { label: 'Card Image', width: 400, height: 400, icon: '🃏' },
  thankyou_bg: { label: 'Thank You Background', width: 1920, height: 1080, icon: '🎉' },
  overlay: { label: 'Overlay Image', width: 1080, height: 1920, icon: '📱' },
}

export default function CanvaDesignButton({
  gameId,
  imageType = 'background',
  onImageUploaded,
  buttonText,
  variant = 'default',
  disabled = false
}) {
  const [showModal, setShowModal] = useState(false)
  const [templates, setTemplates] = useState(DESIGN_TEMPLATES)
  const [selectedTemplate, setSelectedTemplate] = useState(imageType)
  const [uploading, setUploading] = useState(false)
  const [canvaConfigured, setCanvaConfigured] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef(null)

  const template = templates[selectedTemplate] || templates.background

  useEffect(() => {
    api.get('/canva/config').then(res => {
      setCanvaConfigured(res.data.configured)
      if (res.data.templates) {
        setTemplates(prev => ({ ...prev, ...res.data.templates }))
      }
    }).catch(() => {})
  }, [])

  const handleOpenCanva = async () => {
    try {
      const res = await api.get('/canva/auth-url')
      if (res.data.authUrl) {
        window.open(res.data.authUrl, '_blank', 'width=800,height=600')
      } else {
        // If not configured, show manual upload instructions
        setShowModal(true)
      }
    } catch {
      setShowModal(true)
    }
  }

  const handleFileUpload = async (file) => {
    if (!file) return
    setUploading(true)

    try {
      const reader = new FileReader()
      reader.onload = async (e) => {
        const base64 = e.target.result
        try {
          const res = await api.post('/canva/upload-design', {
            imageBase64: base64,
            gameId,
            imageType: selectedTemplate
          })

          if (res.data.imageUrl) {
            onImageUploaded?.(res.data.imageUrl, selectedTemplate)
            setShowModal(false)
          }
        } catch (err) {
          alert('Upload failed: ' + (err.response?.data?.message || err.message))
        }
        setUploading(false)
      }
      reader.readAsDataURL(file)
    } catch {
      setUploading(false)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragActive(false)
    const file = e.dataTransfer.files[0]
    if (file && file.type.startsWith('image/')) {
      handleFileUpload(file)
    }
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    setDragActive(true)
  }

  const handleDragLeave = () => setDragActive(false)

  const btnStyle = variant === 'small' ? {
    padding: '5px 10px',
    fontSize: 11,
    borderRadius: 6,
    border: '1.5px dashed #8B5CF6',
    background: '#F5F3FF',
    color: '#7C3AED',
    cursor: 'pointer',
    fontWeight: 600,
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
    fontFamily: "'DM Sans', sans-serif",
    transition: 'all 0.15s',
  } : {
    padding: '8px 14px',
    fontSize: 12,
    borderRadius: 8,
    border: '1.5px dashed #8B5CF6',
    background: 'linear-gradient(135deg, #F5F3FF 0%, #EDE9FE 100%)',
    color: '#7C3AED',
    cursor: 'pointer',
    fontWeight: 600,
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    fontFamily: "'DM Sans', sans-serif",
    transition: 'all 0.15s',
    boxShadow: '0 2px 8px rgba(139, 92, 246, 0.15)',
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setShowModal(true)}
        disabled={disabled}
        style={btnStyle}
        onMouseOver={e => {
          e.currentTarget.style.transform = 'translateY(-1px)'
          e.currentTarget.style.boxShadow = '0 4px 12px rgba(139, 92, 246, 0.25)'
        }}
        onMouseOut={e => {
          e.currentTarget.style.transform = 'translateY(0)'
          e.currentTarget.style.boxShadow = variant === 'small' ? 'none' : '0 2px 8px rgba(139, 92, 246, 0.15)'
        }}
      >
        <span style={{ fontSize: variant === 'small' ? 12 : 14 }}>🎨</span>
        {buttonText || 'Design in Canva'}
      </button>

      {showModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 9000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(8px)',
          padding: 20,
        }}>
          <div style={{
            background: '#fff',
            borderRadius: 24,
            width: '100%',
            maxWidth: 520,
            maxHeight: '90vh',
            overflow: 'auto',
            boxShadow: '0 24px 80px rgba(0,0,0,0.3)',
            animation: 'canvaModalIn 0.3s cubic-bezier(0.34,1.56,0.64,1)',
          }}>
            {/* Header */}
            <div style={{
              padding: '24px 28px 16px',
              borderBottom: '1px solid #F3F4F6',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <div>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: '#111', margin: 0 }}>
                  🎨 Design in Canva
                </h3>
                <p style={{ fontSize: 13, color: '#666', margin: '4px 0 0' }}>
                  Create your design and import it here
                </p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                style={{
                  width: 32, height: 32, borderRadius: 8,
                  border: '1px solid #E5E7EB', background: '#F9FAFB',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', fontSize: 16, color: '#666',
                }}
              >✕</button>
            </div>

            {/* Template Selector */}
            <div style={{ padding: '20px 28px' }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 8, display: 'block' }}>
                Design Type
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                {Object.entries(templates).map(([key, t]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setSelectedTemplate(key)}
                    style={{
                      padding: '12px 8px',
                      borderRadius: 12,
                      border: selectedTemplate === key ? '2px solid #8B5CF6' : '1.5px solid #E5E7EB',
                      background: selectedTemplate === key ? '#F5F3FF' : '#FAFAFA',
                      cursor: 'pointer',
                      textAlign: 'center',
                      transition: 'all 0.15s',
                    }}
                  >
                    <div style={{ fontSize: 20, marginBottom: 4 }}>{t.icon}</div>
                    <div style={{ fontSize: 10, fontWeight: 600, color: selectedTemplate === key ? '#7C3AED' : '#374151' }}>
                      {t.label}
                    </div>
                    <div style={{ fontSize: 9, color: '#999', marginTop: 2 }}>
                      {t.width}×{t.height}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Design Info */}
            <div style={{ padding: '0 28px 20px' }}>
              <div style={{
                background: '#F8F7FF',
                borderRadius: 12,
                padding: 16,
                border: '1px solid #E5E4F0',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                  <span style={{ fontSize: 24 }}>{template.icon}</span>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#111' }}>{template.label}</div>
                    <div style={{ fontSize: 12, color: '#666' }}>Recommended size: {template.width}×{template.height}px</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ padding: '0 28px 24px', display: 'flex', flexDirection: 'column', gap: 10 }}>
              {/* Open Canva Button */}
              <button
                type="button"
                onClick={handleOpenCanva}
                disabled={!canvaConfigured}
                style={{
                  width: '100%',
                  padding: '14px 20px',
                  borderRadius: 12,
                  border: 'none',
                  background: canvaConfigured
                    ? 'linear-gradient(135deg, #00C4CC 0%, #7D2AE8 100%)'
                    : '#ccc',
                  color: '#fff',
                  fontSize: 15,
                  fontWeight: 700,
                  cursor: canvaConfigured ? 'pointer' : 'not-allowed',
                  fontFamily: "'DM Sans', sans-serif",
                  boxShadow: canvaConfigured ? '0 4px 16px rgba(0, 196, 204, 0.3)' : 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 10,
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                </svg>
                {canvaConfigured ? 'Open Canva & Design' : 'Canva Not Connected'}
              </button>

              {!canvaConfigured && (
                <div style={{
                  background: '#FFF7ED',
                  borderRadius: 10,
                  padding: 12,
                  fontSize: 12,
                  color: '#92400E',
                  lineHeight: 1.5,
                }}>
                  <strong>Setup required:</strong> Add CANVA_CLIENT_ID and CANVA_CLIENT_SECRET to your .env file.
                  <br />
                  <a href="https://www.canva.com/developers/" target="_blank" rel="noopener noreferrer"
                    style={{ color: '#7C3AED', fontWeight: 600 }}>
                    Get your API credentials →
                  </a>
                </div>
              )}

              {/* Divider */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '4px 0' }}>
                <div style={{ flex: 1, height: 1, background: '#E5E7EB' }} />
                <span style={{ fontSize: 12, color: '#999', fontWeight: 500 }}>OR</span>
                <div style={{ flex: 1, height: 1, background: '#E5E7EB' }} />
              </div>

              {/* Upload File */}
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => fileInputRef.current?.click()}
                style={{
                  width: '100%',
                  padding: '20px',
                  borderRadius: 12,
                  border: `2px dashed ${dragActive ? '#8B5CF6' : '#D1D5DB'}`,
                  background: dragActive ? '#F5F3FF' : '#FAFAFA',
                  cursor: 'pointer',
                  textAlign: 'center',
                  transition: 'all 0.15s',
                }}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={e => handleFileUpload(e.target.files[0])}
                />
                <div style={{ fontSize: 32, marginBottom: 8 }}>📁</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#374151', marginBottom: 4 }}>
                  {uploading ? 'Uploading...' : 'Upload from Computer'}
                </div>
                <div style={{ fontSize: 12, color: '#999' }}>
                  Drag & drop or click to browse
                </div>
                <div style={{ fontSize: 11, color: '#bbb', marginTop: 6 }}>
                  PNG, JPG, GIF, WebP up to 10MB
                </div>
              </div>
            </div>
          </div>

          <style>{`
            @keyframes canvaModalIn {
              from { opacity: 0; transform: scale(0.95) translateY(10px); }
              to { opacity: 1; transform: scale(1) translateY(0); }
            }
          `}</style>
        </div>
      )}
    </>
  )
}
