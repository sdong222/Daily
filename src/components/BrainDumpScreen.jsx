import { useState, useEffect } from 'react'
import RetroWindow from './RetroWindow'
import { playClick } from '../utils/retroSound'
import { getAllSessions } from '../utils/storage'

export default function BrainDumpScreen({ value, onChange, onNext, onBrowseSessions, preloadedCount = 0 }) {
  const [recentSession, setRecentSession] = useState(null)

  useEffect(() => {
    const sessions = getAllSessions()
    if (sessions.length > 0) setRecentSession(sessions[0])
  }, [])

  return (
    <RetroWindow title="MORNING CHECK-IN" icon="🖥">
      <div className="screen-header">
        <h1>Good morning.</h1>
        <p>What's on your mind? Messy is fine.</p>
      </div>

      {/* Previous session callout */}
      {recentSession && (
        <div className="bd-session-callout">
          <div className="bd-callout-left">
            <span className="bd-callout-label">Last session</span>
            <span className="bd-callout-date">{recentSession.dateLabel || recentSession.date}</span>
            {recentSession.tasks?.length > 0 && (
              <span className="bd-callout-stats">
                {recentSession.tasks.filter((t) => t.done).length}/{recentSession.tasks.length} done
              </span>
            )}
          </div>
          <div className="bd-callout-actions">
            <button
              className="win95-btn win95-btn--blue"
              onClick={() => { playClick(); onBrowseSessions() }}
            >
              ↺ Continue
            </button>
            <button
              className="win95-btn"
              onClick={() => { playClick(); onBrowseSessions() }}
            >
              Browse All
            </button>
          </div>
        </div>
      )}

      {/* Preloaded tasks banner */}
      {preloadedCount > 0 && (
        <div className="bd-preloaded-banner">
          <span>
            {preloadedCount} task{preloadedCount !== 1 ? 's' : ''} selected from previous sessions — they'll be added to your plan.
          </span>
          <button
            className="win95-btn"
            style={{ padding: '4px 10px', fontSize: 13 }}
            onClick={() => { playClick(); onBrowseSessions() }}
          >
            Edit
          </button>
        </div>
      )}


      <textarea
        className="retro-textarea brain-dump-textarea"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Start typing... it doesn't need to make sense. Dump it all here."
        autoFocus
      />

      <div className="screen-footer">
        <button
          className="win95-btn win95-btn--navy"
          onClick={() => { playClick(); onNext() }}
          disabled={!value.trim()}
        >
          Next ▶
        </button>
      </div>
    </RetroWindow>
  )
}
