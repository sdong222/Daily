import { useState, useEffect } from 'react'
import { playClick, playSuccess } from '../utils/retroSound'
import { analyzeParkingLot } from '../services/anthropicService'

export default function ParkingLot({ notes = '', onChange = () => {}, onAddTask = null }) {
  const [isOpen, setIsOpen] = useState(false)
  const [aiState, setAiState] = useState('idle') // 'idle' | 'loading' | 'done' | 'error'
  const [aiSuggestions, setAiSuggestions] = useState([])
  const [aiError, setAiError] = useState('')
  const [confirmClear, setConfirmClear] = useState(false)

  // Push content left when panel opens
  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('parking-panel-open')
    } else {
      document.body.classList.remove('parking-panel-open')
    }
    return () => document.body.classList.remove('parking-panel-open')
  }, [isOpen])

  const handleToggle = () => {
    playClick()
    setIsOpen((v) => !v)
  }

  const handleSave = () => {
    playClick()
    const date = new Date().toLocaleDateString('en-CA')
    const time = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    const content = `Parking Lot — ${date} ${time}\n${'─'.repeat(38)}\n\n${notes}`
    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `parking-lot-${date}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleNewLot = () => {
    playClick()
    if (!confirmClear) { setConfirmClear(true); return }
    onChange('')
    setAiSuggestions([])
    setAiState('idle')
    setConfirmClear(false)
    playSuccess()
  }

  const handleAiScan = async () => {
    if (!notes.trim()) return
    playClick()
    setAiState('loading')
    setAiSuggestions([])
    setAiError('')
    try {
      const suggestions = await analyzeParkingLot(notes)
      setAiSuggestions(suggestions)
      setAiState('done')
    } catch (err) {
      setAiError(err.message)
      setAiState('error')
    }
  }

  const handleAddSuggestion = (suggestion) => {
    playClick()
    if (onAddTask) onAddTask(suggestion)
    setAiSuggestions((prev) => prev.filter((s) => s !== suggestion))
  }

  return (
    <>
      {/* Toggle button */}
      <button
        className={`parking-lot-btn ${isOpen ? 'parking-lot-btn--open' : ''}`}
        onClick={handleToggle}
        aria-label={isOpen ? 'Close parking lot' : 'Open parking lot'}
        title="Parking Lot"
      >
        <FloppyIcon active={isOpen} />
        <span className="parking-lot-btn-label">PARK</span>
      </button>

      {/* Side panel */}
      <aside
        className={`parking-lot-panel ${isOpen ? 'parking-lot-panel--open' : ''}`}
        aria-label="Parking Lot"
        aria-hidden={!isOpen}
      >
        {/* Title bar */}
        <div className="win95-titlebar">
          <span className="win95-titlebar-text">
            <span className="win95-titlebar-icon">💾</span>
            PARKING LOT
          </span>
          <div className="win95-titlebar-controls">
            <button
              className="win95-ctrl-btn win95-ctrl-btn--close"
              onClick={() => { playClick(); setIsOpen(false) }}
              aria-label="Close"
            >✕</button>
          </div>
        </div>

        <div className="parking-lot-panel-inner">
          {/* Header */}
          <div className="parking-lot-head">
            <div className="parking-lot-head-text">
              <h3>Parking Lot</h3>
              <p>Dump distracting thoughts here.</p>
            </div>
          </div>

          {/* Textarea — fills remaining height */}
          <textarea
            className="retro-textarea parking-lot-textarea"
            value={notes}
            onChange={(e) => { onChange(e.target.value); setConfirmClear(false) }}
            placeholder="Random thought? Put it here and get back to work."
            tabIndex={isOpen ? 0 : -1}
          />

          {/* AI results */}
          {aiState === 'loading' && (
            <div className="ai-loading-msg">SCANNING FOR<br />ACTION ITEMS...</div>
          )}
          {aiState === 'error' && (
            <div className="ai-error-msg">{aiError}</div>
          )}
          {aiState === 'done' && aiSuggestions.length === 0 && (
            <div className="ai-loading-msg">No action items found.</div>
          )}
          {aiSuggestions.length > 0 && (
            <div className="ai-suggestions-panel">
              {aiSuggestions.map((s, i) => (
                <div key={i} className="ai-suggestion-item">
                  <span className={`ai-suggestion-badge priority-badge priority-badge--${s.priority || 'B'}`}>
                    {s.priority || 'B'}
                  </span>
                  <span className="ai-suggestion-text">{s.task}</span>
                  {onAddTask && (
                    <button
                      className="win95-btn win95-btn--blue"
                      style={{ fontSize: 10, padding: '2px 6px', minHeight: 20 }}
                      onClick={() => handleAddSuggestion(s)}
                    >+ Add</button>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Action buttons */}
          <div className="parking-lot-actions">
            <button
              className="win95-btn"
              onClick={handleSave}
              disabled={!notes.trim()}
              title="Download notes as .txt"
            >💾 Save</button>

            <button
              className={`win95-btn ${confirmClear ? 'win95-btn--red' : ''}`}
              onClick={handleNewLot}
              disabled={!notes.trim()}
              title={confirmClear ? 'Click again to confirm' : 'Clear and start a fresh lot'}
            >{confirmClear ? '⚠ Confirm?' : '🗑 New Lot'}</button>

            {onAddTask && (
              <button
                className="win95-btn win95-btn--blue win95-btn--full"
                onClick={handleAiScan}
                disabled={!notes.trim() || aiState === 'loading'}
                title="Let AI find action items in your notes"
              >{aiState === 'loading' ? '⌛ Scanning...' : '🤖 AI Scan for Tasks'}</button>
            )}
          </div>
        </div>
      </aside>
    </>
  )
}

function FloppyIcon({ active }) {
  const fill = active ? '#ffffff' : '#ffffff'
  return (
    <svg width="22" height="22" viewBox="0 0 26 26" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <rect x="1" y="1" width="24" height="24" rx="2" fill="none" stroke={fill} strokeWidth="2"/>
      <rect x="5" y="1" width="11" height="8" fill="none" stroke={fill} strokeWidth="1.5"/>
      <rect x="7" y="2.5" width="2" height="5" fill={fill} opacity="0.7"/>
      <rect x="3" y="13" width="20" height="10" rx="1" fill="none" stroke={fill} strokeWidth="1.5"/>
      <rect x="5" y="15" width="16" height="6" fill={fill} opacity="0.3"/>
    </svg>
  )
}
