import { useRef, useState } from 'react'

const SWIPE_THRESHOLD = 55   // px to commit open/close
const MAX_SWIPE = 160        // matches 2 × 80px action buttons

/**
 * SwipeableRow — horizontal swipe left to reveal action buttons behind the row.
 *
 * Props:
 *   actions: [{ label, sublabel?, color, textColor?, onClick }]
 *   children: the row content
 *
 * Works on touch (iPad) and mouse alike via Pointer Events.
 * Only triggers on predominantly horizontal movement so vertical scroll is unaffected.
 */
export default function SwipeableRow({ children, actions = [] }) {
  const actionWidth = actions.length * 80
  const contentRef  = useRef(null)
  const startX      = useRef(0)
  const startY      = useRef(0)
  const isDragging  = useRef(false)
  const isHoriz     = useRef(null)   // null = undecided, true/false after threshold
  const baseOffset  = useRef(0)      // offset at pointer-down
  const [isOpen, setIsOpen]   = useState(false)
  const [isTrans, setIsTrans] = useState(false)

  const applyOffset = (x, animate = false) => {
    if (!contentRef.current) return
    setIsTrans(animate)
    contentRef.current.style.transform = `translateX(${x}px)`
  }

  const snapTo = (open) => {
    applyOffset(open ? -actionWidth : 0, true)
    setIsOpen(open)
  }

  const onPointerDown = (e) => {
    // Only respond to primary pointer (finger or left-click)
    if (e.button > 0) return
    startX.current   = e.clientX
    startY.current   = e.clientY
    baseOffset.current = isOpen ? -actionWidth : 0
    isDragging.current = true
    isHoriz.current    = null
  }

  const onPointerMove = (e) => {
    if (!isDragging.current) return
    const dx = e.clientX - startX.current
    const dy = e.clientY - startY.current

    // Decide axis on first meaningful movement
    if (isHoriz.current === null) {
      if (Math.abs(dx) > 6 || Math.abs(dy) > 6) {
        isHoriz.current = Math.abs(dx) > Math.abs(dy)
      }
      return
    }
    if (!isHoriz.current) return

    e.preventDefault()
    // Clamp between fully closed and fully open
    const raw = baseOffset.current + dx
    const clamped = Math.max(-actionWidth, Math.min(0, raw))
    applyOffset(clamped, false)
  }

  const onPointerUp = (e) => {
    if (!isDragging.current) return
    isDragging.current = false
    if (!isHoriz.current) return

    const dx = e.clientX - startX.current
    if (isOpen) {
      // Swiping right (positive dx) closes; swiping further left keeps open
      snapTo(dx > SWIPE_THRESHOLD ? false : true)
    } else {
      snapTo(dx < -SWIPE_THRESHOLD ? true : false)
    }
    isHoriz.current = null
  }

  const closeRow = () => {
    if (isOpen) snapTo(false)
  }

  return (
    <div className="swr-wrapper" onClick={isOpen ? closeRow : undefined}>
      {/* Actions revealed behind the content */}
      <div className="swr-actions" style={{ width: actionWidth }}>
        {actions.map((action, i) => (
          <button
            key={i}
            className="swr-action-btn"
            style={{
              background: action.color ?? '#555',
              color: action.textColor ?? '#fff',
              width: 80,
            }}
            onClick={(e) => {
              e.stopPropagation()
              snapTo(false)
              action.onClick()
            }}
          >
            <span className="swr-action-label">{action.label}</span>
            {action.sublabel && (
              <span className="swr-action-sublabel">{action.sublabel}</span>
            )}
          </button>
        ))}
      </div>

      {/* Sliding content */}
      <div
        ref={contentRef}
        className={`swr-content ${isTrans ? 'swr-content--anim' : ''}`}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
        onPointerCancel={onPointerUp}
        style={{ touchAction: 'pan-y' }}
      >
        {children}
      </div>
    </div>
  )
}
