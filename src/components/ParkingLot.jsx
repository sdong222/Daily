import { useState } from 'react'

export default function ParkingLot() {
  const [isOpen, setIsOpen] = useState(false)
  const [notes, setNotes] = useState('')

  return (
    <>
      <button
        className={`parking-lot-btn ${isOpen ? 'parking-lot-btn--open' : ''}`}
        onClick={() => setIsOpen((v) => !v)}
        aria-label={isOpen ? 'Close parking lot' : 'Open parking lot'}
        title="Parking Lot"
      >
        {isOpen ? '×' : 'P'}
      </button>

      {isOpen && (
        <div className="parking-lot-panel" role="dialog" aria-label="Parking Lot notepad">
          <div className="parking-lot-head">
            <div className="parking-lot-head-text">
              <h3>Parking Lot</h3>
              <p>Distracting thoughts go here.</p>
            </div>
            <button
              className="parking-lot-close"
              onClick={() => setIsOpen(false)}
              aria-label="Close"
            >
              ×
            </button>
          </div>
          <textarea
            className="parking-lot-textarea"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Dump it here, come back later..."
            autoFocus
          />
        </div>
      )}
    </>
  )
}
