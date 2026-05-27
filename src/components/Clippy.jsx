import { useState, useEffect, useRef } from 'react'
import { playClick } from '../utils/retroSound'

const IDLE_MESSAGES = [
  'It looks like you\'re planning your day. Need help?',
  'You\'ve got this! One task at a time.',
  'Remember: done is better than perfect.',
  'Take breaks — your brain needs them!',
  'Tip: Start with a quick win to build momentum.',
]

export default function Clippy({ encouragement, letGoOf }) {
  const [open, setOpen] = useState(false)
  const [hasBeenOpened, setHasBeenOpened] = useState(false)
  const [wiggle, setWiggle] = useState(false)
  const idleRef = useRef(null)

  // Wiggle after 8 seconds to invite a click
  useEffect(() => {
    idleRef.current = setTimeout(() => setWiggle(true), 8000)
    return () => clearTimeout(idleRef.current)
  }, [])

  // Auto-open bubble briefly on first load
  useEffect(() => {
    const t = setTimeout(() => {
      setOpen(true)
      setHasBeenOpened(true)
      // Auto-close after 5s if user hasn't interacted
      const close = setTimeout(() => setOpen(false), 5000)
      return () => clearTimeout(close)
    }, 1500)
    return () => clearTimeout(t)
  }, [])

  const toggle = () => {
    playClick()
    setOpen((o) => !o)
    setHasBeenOpened(true)
    setWiggle(false)
    clearTimeout(idleRef.current)
  }

  const idleMsg = IDLE_MESSAGES[Math.floor(Math.random() * IDLE_MESSAGES.length)]

  return (
    <div className="clippy-root">
      {/* Speech bubble */}
      {open && (
        <div className="clippy-bubble" role="dialog" aria-label="Clippy says">
          <button className="clippy-bubble-close" onClick={toggle} aria-label="Close">✕</button>

          {encouragement && (
            <div className="clippy-section">
              <span className="clippy-section-label">Today's encouragement</span>
              <p className="clippy-section-text">"{encouragement}"</p>
            </div>
          )}

          {letGoOf && (
            <div className="clippy-section">
              <span className="clippy-section-label">Let go of today</span>
              <p className="clippy-section-text">{letGoOf}</p>
            </div>
          )}

          {!encouragement && !letGoOf && (
            <p className="clippy-section-text">{idleMsg}</p>
          )}

          {/* Bubble tail pointing right toward Clippy */}
          <div className="clippy-bubble-tail" aria-hidden="true" />
        </div>
      )}

      {/* Clippy character */}
      <button
        className={`clippy-btn ${wiggle ? 'clippy-btn--wiggle' : ''}`}
        onClick={toggle}
        aria-label={open ? 'Close Clippy' : 'Open Clippy tip'}
        title="It looks like you're planning your day!"
      >
        <img
          src="/clippy.png"
          alt="Clippy"
          className="clippy-img"
          draggable={false}
        />
        {!hasBeenOpened && (
          <span className="clippy-ping" aria-hidden="true" />
        )}
      </button>
    </div>
  )
}
