import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { playClick, playSuccess, playBreakChime } from '../utils/retroSound'

const BREAK_DURATION_OPTIONS = [
  { label: '2 min',  minutes: 2 },
  { label: '5 min',  minutes: 5 },
  { label: '10 min', minutes: 10 },
  { label: '15 min', minutes: 15 },
  { label: '20 min', minutes: 20 },
]

function getBreakSuggestions(minutes) {
  if (minutes <= 2) return [
    'Close your eyes and take 5 slow, deep breaths',
    'Roll your shoulders backward 5 times slowly',
    'Look at a fixed point across the room and let your eyes soften',
    'Stretch your wrists, shake out your hands',
  ]
  if (minutes <= 5) return [
    'Stand up, get a glass of water, drink it slowly',
    'Do a gentle full-body stretch — arms up, forward fold, side bends',
    'Walk to another room at a slow pace and back',
    'Step outside or open a window and take 5 deep breaths of fresh air',
    'Sit quietly with no input — just let your mind drift for a moment',
  ]
  if (minutes <= 10) return [
    'Go for a slow walk outside without your phone',
    'Lie flat on the floor, close your eyes, let your spine decompress',
    'Make a cup of tea or water, sit away from your desk and do nothing',
    'Do a few minutes of gentle stretching or light yoga',
    'Find a window, look outside, and let your thoughts settle naturally',
  ]
  return [
    'Take a proper rest — lie down, close your eyes, set an alarm',
    'Go for a walk outside, no phone, just notice your surroundings',
    'Eat a nourishing snack away from your desk, without screens',
    'Sit somewhere comfortable and do absolutely nothing for a few minutes',
    'Step outside, find somewhere to sit, and let yourself recharge fully',
    'Do a longer gentle stretch or slow yoga sequence if that feels good',
  ]
}

function formatTime(seconds) {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

const BUDDY_MESSAGES = [
  'in the zone',
  'lets go',
  'you got this',
  'focused',
  'deep work',
  'crushing it',
]

export default function PomodoroTimer({
  task,
  pomodoroCount,
  minutesPerRound,
  startRound,
  onRoundComplete,
  onStop,
  parkingNotes,
  onParkingNotesChange,
}) {
  const focusSecs = minutesPerRound * 60

  const [phase, setPhase] = useState('focus')
  const [round, setRound] = useState(startRound)
  const [timeLeft, setTimeLeft] = useState(focusSecs)
  const [isRunning, setIsRunning] = useState(true)
  const [parkingOpen, setParkingOpen] = useState(false)
  const [breakMinutes, setBreakMinutes] = useState(null)
  const [breakSuggestions, setBreakSuggestions] = useState([])
  // Tracks whether all rounds finished so break→decision becomes break→done
  const [allRoundsDone, setAllRoundsDone] = useState(false)

  useEffect(() => {
    if (!isRunning || phase === 'decision' || phase === 'done' || phase === 'break-setup') return
    const id = setInterval(() => setTimeLeft((p) => Math.max(0, p - 1)), 1000)
    return () => clearInterval(id)
  }, [isRunning, phase])

  useEffect(() => {
    if (timeLeft > 0) return
    if (phase === 'focus') {
      playBreakChime()
      onRoundComplete(round)
      const finished = round >= pomodoroCount
      if (finished) playSuccess()
      setAllRoundsDone(finished)
      setPhase('break-setup')
      setIsRunning(false)
    } else if (phase === 'break') {
      playSuccess()
      setPhase(allRoundsDone ? 'done' : 'decision')
      setIsRunning(false)
    }
  }, [timeLeft])

  const handleStartBreak = (minutes) => {
    playClick()
    setBreakMinutes(minutes)
    setBreakSuggestions(getBreakSuggestions(minutes))
    setTimeLeft(minutes * 60)
    setPhase('break')
    setIsRunning(true)
  }

  const handleTakeBreakNow = () => {
    playClick()
    playBreakChime()
    onRoundComplete(round)
    const finished = round >= pomodoroCount
    if (finished) playSuccess()
    setAllRoundsDone(finished)
    setPhase('break-setup')
    setIsRunning(false)
  }

  const handleKeepGoing = () => {
    playClick()
    setRound((r) => r + 1)
    setPhase('focus')
    setTimeLeft(focusSecs)
    setBreakMinutes(null)
    setIsRunning(true)
  }

  const handleStop  = () => { playClick(); onStop() }
  const handlePause = () => { playClick(); setIsRunning((v) => !v) }

  const pct = phase === 'focus'
    ? ((focusSecs - timeLeft) / focusSecs) * 100
    : phase === 'break' && breakMinutes
    ? (((breakMinutes * 60) - timeLeft) / (breakMinutes * 60)) * 100
    : 100

  return createPortal(
    <div className="pomodoro-overlay">
      {/* Parking lot button */}
      <button
        className={`floppy-btn ${parkingOpen ? 'floppy-btn--open' : ''}`}
        onClick={() => { playClick(); setParkingOpen((v) => !v) }}
        title="Parking Lot"
        aria-label={parkingOpen ? 'Close parking lot' : 'Open parking lot'}
      >
        <ParkingIcon active={parkingOpen} />
        <span className="floppy-btn-label">PARK</span>
      </button>

      {/* Parking lot panel */}
      {parkingOpen && (
        <div className="floppy-panel win95-window">
          <div className="win95-titlebar">
            <span className="win95-titlebar-text">Parking Lot</span>
            <div className="win95-titlebar-controls">
              <button className="win95-ctrl-btn" onClick={() => setParkingOpen(false)} aria-label="Close">X</button>
            </div>
          </div>
          <div className="win95-window-body floppy-panel-body">
            <p className="floppy-hint">Timer keeps running.</p>
            <textarea
              className="retro-textarea floppy-textarea"
              value={parkingNotes}
              onChange={(e) => onParkingNotesChange(e.target.value)}
              placeholder="Random thought? Park it here."
              autoFocus
            />
          </div>
        </div>
      )}

      {/* ── DONE ── */}
      {phase === 'done' && (
        <div className="timer-overlay-content">
          <div className="win95-window timer-end-window">
            <div className="win95-titlebar win95-titlebar--blue">
              <span className="win95-titlebar-text">ALL ROUNDS COMPLETE</span>
            </div>
            <div className="win95-window-body timer-end-body">
              <p className="timer-end-msg">All {pomodoroCount} rounds done.</p>
              <p className="timer-end-sub">Excellent focus session.</p>
              <button className="win95-btn win95-btn--blue timer-end-btn" onClick={handleStop}>
                Back to Tasks
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── BREAK SETUP ── */}
      {phase === 'break-setup' && (
        <div className="timer-overlay-content">
          <div className="win95-window timer-end-window">
            <div className="win95-titlebar win95-titlebar--teal">
              <span className="win95-titlebar-text">ROUND {round} COMPLETE — HOW LONG IS YOUR BREAK?</span>
            </div>
            <div className="win95-window-body timer-end-body">
              <p className="timer-end-msg">Round {round} of {pomodoroCount} done.</p>
              <p className="timer-end-sub">Choose your break length:</p>
              <div className="break-duration-grid">
                {BREAK_DURATION_OPTIONS.map(({ label, minutes }) => (
                  <button
                    key={minutes}
                    className="win95-btn win95-btn--blue break-duration-btn"
                    onClick={() => handleStartBreak(minutes)}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <button className="win95-btn" onClick={handleStop} style={{ marginTop: 8 }}>
                Skip Break
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── DECISION ── */}
      {phase === 'decision' && (
        <div className="timer-overlay-content">
          <div className="win95-window timer-end-window">
            <div className="win95-titlebar win95-titlebar--blue">
              <span className="win95-titlebar-text">BREAK OVER — ROUND {round} OF {pomodoroCount}</span>
            </div>
            <div className="win95-window-body timer-end-body">
              <p className="timer-end-msg">Break complete.</p>
              <p className="timer-end-sub">Ready to keep going?</p>
              <div className="timer-decision-btns">
                {round < pomodoroCount && (
                  <button className="win95-btn win95-btn--blue" onClick={handleKeepGoing}>
                    Keep Going — Round {round + 1} of {pomodoroCount}
                  </button>
                )}
                <button className="win95-btn win95-btn--teal" onClick={handleStop}>
                  Switch to Another Task
                </button>
                <button className="win95-btn" onClick={handleStop}>
                  Done for Now
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── FOCUS / BREAK ── */}
      {(phase === 'focus' || phase === 'break') && (
        <div className="timer-overlay-content">
          <div className={`timer-phase-badge ${phase === 'break' ? 'timer-phase-badge--break' : ''}`}>
            {phase === 'focus' ? 'FOCUS MODE' : 'BREAK TIME'}
          </div>

          <div className="timer-task-name">{task}</div>

          <div className="timer-round-row">
            <span className="timer-round-label">Round {round} of {pomodoroCount}</span>
            <div className="timer-round-pips">
              {Array.from({ length: pomodoroCount }).map((_, i) => (
                <span
                  key={i}
                  className={`timer-pip ${i < round - 1 ? 'timer-pip--done' : i === round - 1 ? 'timer-pip--active' : ''}`}
                />
              ))}
            </div>
          </div>

          <div className="timer-clock-wrap">
            <div className="timer-clock">
              <span className="timer-digits">{formatTime(timeLeft)}</span>
            </div>
            <div className="timer-progress-track">
              <div className="timer-progress-fill" style={{ width: `${pct}%` }} />
            </div>
          </div>

          {/* Break suggestions */}
          {phase === 'break' && breakSuggestions.length > 0 && (
            <div className="timer-break-panel win95-window">
              <div className="win95-titlebar win95-titlebar--teal">
                <span className="win95-titlebar-text">BREAK SUGGESTIONS — {breakMinutes} min away from screens</span>
              </div>
              <div className="win95-window-body timer-break-body">
                {breakSuggestions.map((tip, i) => (
                  <p key={i} className="timer-break-tip">{tip}</p>
                ))}
              </div>
            </div>
          )}

          <div className="timer-controls">
            <button className="win95-btn timer-ctrl-btn" onClick={handlePause}>
              {isRunning ? 'Pause' : 'Resume'}
            </button>
            {phase === 'focus' && (
              <button className="win95-btn win95-btn--teal timer-ctrl-btn" onClick={handleTakeBreakNow}>
                Take Break Now
              </button>
            )}
            <button className="win95-btn timer-ctrl-btn" onClick={handleStop}>
              Stop
            </button>
          </div>

          {phase === 'focus' && <FocusBuddy />}
        </div>
      )}
    </div>,
    document.body
  )
}

const BUDDY_FRAMES = ['( * _ * )', '( * o * )', '( * - * )']
const BUDDY_MSG    = BUDDY_MESSAGES

function FocusBuddy() {
  const [msgIdx] = useState(() => Math.floor(Math.random() * BUDDY_MSG.length))
  const [frame, setFrame]   = useState(0)

  useEffect(() => {
    const id = setInterval(() => setFrame((f) => (f + 1) % BUDDY_FRAMES.length), 700)
    return () => clearInterval(id)
  }, [])

  return (
    <div className="focus-buddy" aria-hidden="true">
      <div className="buddy-speech-bubble">{BUDDY_MSG[msgIdx]}</div>
      <div className="buddy-character" style={{ fontFamily: 'monospace', fontSize: 16, letterSpacing: 1 }}>
        {BUDDY_FRAMES[frame]}
      </div>
    </div>
  )
}

function ParkingIcon({ active }) {
  const c = active ? '#ffffff' : '#ffffff'
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
      <polyline points="17 21 17 13 7 13 7 21"/>
      <polyline points="7 3 7 8 15 8"/>
    </svg>
  )
}
