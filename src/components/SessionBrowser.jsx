import { useState } from 'react'
import { getAllSessions, deleteSession } from '../utils/storage'
import { playClick } from '../utils/retroSound'
import SwipeableRow from './SwipeableRow'

const ENERGY_COLORS = { low: '#f59e0b', medium: '#3b82f6', high: '#10b981' }

export default function SessionBrowser({ onClose, onContinueSession, onAddPickedTasks, onAddToToday }) {
  const [sessions, setSessions] = useState(getAllSessions)
  const [expandedId, setExpandedId] = useState(sessions[0]?.id ?? null)
  // { "sessionId:taskId": taskObject }
  const [selected, setSelected] = useState({})

  const toggleTask = (task, sessionId) => {
    playClick()
    const key = `${sessionId}:${task.id}`
    setSelected((prev) => {
      const next = { ...prev }
      if (next[key]) delete next[key]
      else next[key] = { ...task, _sessionId: sessionId }
      return next
    })
  }

  const selectAllIncomplete = (session) => {
    playClick()
    const incomplete = session.tasks?.filter((t) => !t.done && !t.dismissed) ?? []
    setSelected((prev) => {
      const next = { ...prev }
      incomplete.forEach((t) => {
        next[`${session.id}:${t.id}`] = { ...t, _sessionId: session.id }
      })
      return next
    })
  }

  const selectedCount = Object.keys(selected).length
  const selectedList = Object.values(selected)

  const handleAddSelected = () => {
    playClick()
    onAddPickedTasks(selectedList)
    onClose()
  }

  const handleDelete = (sessionId) => {
    playClick()
    deleteSession(sessionId)
    setSessions(getAllSessions())
    if (expandedId === sessionId) setExpandedId(null)
  }

  const handleAddToToday = (session) => {
    playClick()
    const incomplete = (session.tasks ?? []).filter((t) => !t.done && !t.dismissed)
    if (onAddToToday) {
      onAddToToday(incomplete)
    } else {
      onAddPickedTasks(incomplete)
    }
    onClose()
  }

  const handleContinue = (session) => {
    playClick()
    onContinueSession(session)
    onClose()
  }

  return (
    <div className="sb-overlay">
      <div className="sb-backdrop" onClick={onClose} />
      <div className="sb-panel">
        {/* Title bar */}
        <div className="sb-titlebar">
          <span className="sb-title-text">Browse Previous Sessions</span>
          <button className="sb-close-btn" onClick={onClose} aria-label="Close">✕</button>
        </div>

        {/* Session list */}
        <div className="sb-body">
          {sessions.length === 0 ? (
            <div className="sb-empty">
              <div className="sb-empty-icon">📭</div>
              <p>No previous sessions yet.</p>
              <p style={{ color: 'var(--gray-600)', fontSize: 'var(--font-sm)' }}>
                Complete your first check-in to build history.
              </p>
            </div>
          ) : (
            sessions.map((session) => {
              const total = session.tasks?.length ?? 0
              const done = session.tasks?.filter((t) => t.done).length ?? 0
              const incomplete = session.tasks?.filter((t) => !t.done && !t.dismissed) ?? []
              const isExpanded = expandedId === session.id
              const pct = total > 0 ? Math.round((done / total) * 100) : 0

              return (
                <div key={session.id} className={`sb-session ${isExpanded ? 'sb-session--open' : ''}`}>
                  {/* Swipeable session header */}
                  <SwipeableRow
                    actions={[
                      {
                        label: '+ Today',
                        sublabel: `${incomplete.length} tasks`,
                        color: '#0078D7',
                        onClick: () => handleAddToToday(session),
                      },
                      {
                        label: 'Delete',
                        color: '#dc3545',
                        onClick: () => handleDelete(session.id),
                      },
                    ]}
                  >
                  <button
                    className="sb-session-header"
                    onClick={() => { playClick(); setExpandedId(isExpanded ? null : session.id) }}
                    aria-expanded={isExpanded}
                  >
                    <div className="sb-session-left">
                      <span className="sb-session-date">{session.dateLabel || session.date}</span>
                      {session.energy && (
                        <span
                          className="sb-energy-pill"
                          style={{ background: ENERGY_COLORS[session.energy] || '#888' }}
                        >
                          {session.energy}
                        </span>
                      )}
                    </div>
                    <div className="sb-session-right">
                      <div className="sb-progress-bar">
                        <div className="sb-progress-fill" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="sb-session-stats">{done}/{total}</span>
                      <span className="sb-chevron">{isExpanded ? '▲' : '▼'}</span>
                    </div>
                  </button>
                  </SwipeableRow>

                  {/* Expanded task list */}
                  {isExpanded && (
                    <div className="sb-task-list">
                      {session.brainDump && (
                        <p className="sb-brain-preview">
                          "{session.brainDump.slice(0, 120)}{session.brainDump.length > 120 ? '…' : ''}"
                        </p>
                      )}

                      {session.tasks?.length === 0 && (
                        <p className="sb-no-tasks">No tasks in this session.</p>
                      )}

                      {session.tasks?.map((task, i) => {
                        const key = `${session.id}:${task.id}`
                        const isChecked = !!selected[key]
                        return (
                          <label key={i} className={`sb-task-row ${task.done ? 'sb-task-row--done' : ''}`}>
                            <input
                              type="checkbox"
                              className="sb-task-check"
                              checked={isChecked}
                              disabled={task.done}
                              onChange={() => !task.done && toggleTask(task, session.id)}
                            />
                            <span className={`priority-badge priority-badge--${task.priority}`} style={{ fontSize: 12, padding: '2px 8px', minHeight: 'unset' }}>
                              {task.priority}
                            </span>
                            <span className="sb-task-label">{task.task}</span>
                            {task.done && <span className="sb-status-tag sb-done-tag">Done</span>}
                            {task.carriedOver && <span className="sb-status-tag sb-carried-tag">Carried</span>}
                          </label>
                        )
                      })}

                      {/* Action row */}
                      <div className="sb-session-actions">
                        <button
                          className="win95-btn win95-btn--blue"
                          onClick={() => handleContinue(session)}
                        >
                          ↺ Continue This Session
                        </button>
                        {incomplete.length > 0 && (
                          <button
                            className="win95-btn"
                            onClick={() => selectAllIncomplete(session)}
                          >
                            + Select Incomplete ({incomplete.length})
                          </button>
                        )}
                        <button
                          className="win95-btn win95-btn--red sb-delete-btn"
                          onClick={() => handleDelete(session.id)}
                        >
                          Delete Session
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>

        {/* Sticky footer for selected tasks */}
        {selectedCount > 0 && (
          <div className="sb-footer">
            <span className="sb-footer-count">
              {selectedCount} task{selectedCount !== 1 ? 's' : ''} selected
            </span>
            <button className="win95-btn win95-btn--blue" onClick={handleAddSelected}>
              Add to New Session ▶
            </button>
            <button className="win95-btn" onClick={() => setSelected({})}>
              Clear
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
