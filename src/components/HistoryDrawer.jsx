import { useState, useEffect } from 'react'
import { playClick } from '../utils/retroSound'
import { getAllSessions, deleteSession } from '../utils/storage'
import SwipeableRow from './SwipeableRow'

const ENERGY_ICONS = { low: '○', okay: '◑', solid: '●' }
const ENERGY_LABELS = { low: 'Low', okay: 'Okay', solid: 'Solid' }

export default function HistoryDrawer({ onClose, onAddToToday }) {
  const [sessions, setSessions] = useState([])
  const [expandedId, setExpandedId] = useState(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState(null)

  useEffect(() => {
    setSessions(getAllSessions())
  }, [])

  const handleDelete = (id) => {
    if (confirmDeleteId !== id) { playClick(); setConfirmDeleteId(id); return }
    playClick()
    deleteSession(id)
    setSessions(getAllSessions())
    setConfirmDeleteId(null)
    if (expandedId === id) setExpandedId(null)
  }

  const toggleExpand = (id) => {
    playClick()
    setExpandedId((cur) => (cur === id ? null : id))
    setConfirmDeleteId(null)
  }

  return (
    <div className="history-overlay" role="dialog" aria-label="Session History">
      {/* Backdrop */}
      <div className="history-backdrop" onClick={onClose} />

      {/* Drawer */}
      <div className="history-drawer win95-window">
        <div className="win95-titlebar">
          <span className="win95-titlebar-text">
            <span className="win95-titlebar-icon">📅</span>
            SESSION HISTORY — {sessions.length} session{sessions.length !== 1 ? 's' : ''}
          </span>
          <div className="win95-titlebar-controls">
            <button className="win95-ctrl-btn win95-ctrl-btn--close" onClick={onClose} aria-label="Close">✕</button>
          </div>
        </div>

        <div className="history-body">
          {sessions.length === 0 && (
            <div className="history-empty">
              <p className="history-empty-msg">No sessions yet.</p>
              <p>Complete a check-in to start tracking your history.</p>
            </div>
          )}

          {sessions.map((session) => {
            const totalTasks   = session.tasks?.length ?? 0
            const doneTasks    = session.tasks?.filter((t) => t.done).length ?? 0
            const incompleteTasks = session.tasks?.filter((t) => !t.done && !t.dismissed) ?? []
            const pct = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0
            const isExpanded = expandedId === session.id
            const isConfirmDelete = confirmDeleteId === session.id

            return (
              <div key={session.id} className={`history-session ${isExpanded ? 'history-session--expanded' : ''}`}>
                {/* Swipe-left to reveal Delete / Add to Today */}
                <SwipeableRow
                  actions={[
                    ...(onAddToToday && incompleteTasks.length > 0 ? [{
                      label: '+ Today',
                      sublabel: `${incompleteTasks.length} tasks`,
                      color: '#0078D7',
                      onClick: () => { playClick(); onAddToToday(incompleteTasks) },
                    }] : []),
                    {
                      label: 'Delete',
                      color: '#dc3545',
                      onClick: () => handleDelete(session.id),
                    },
                  ]}
                >
                {/* Session header row */}
                <div className="history-session-header" onClick={() => toggleExpand(session.id)}>
                  <div className="history-session-meta">
                    <span className="history-session-date">{session.dateLabel || session.date}</span>
                    {session.energy && (
                      <span className="history-energy-badge">
                        {ENERGY_ICONS[session.energy]} {ENERGY_LABELS[session.energy] || session.energy}
                      </span>
                    )}
                  </div>

                  <div className="history-session-stats">
                    <span className="history-task-count">
                      {doneTasks}/{totalTasks} done
                    </span>
                    <div className="history-progress-bar">
                      <div className="history-progress-fill" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="history-expand-icon">{isExpanded ? '▲' : '▼'}</span>
                  </div>
                </div>
                </SwipeableRow>

                {/* Expanded content */}
                {isExpanded && (
                  <div className="history-session-detail">
                    {/* Brain dump */}
                    {session.brainDump && (
                      <div className="history-section">
                        <div className="history-section-label">Brain Dump</div>
                        <p className="history-brain-dump">{session.brainDump}</p>
                      </div>
                    )}

                    {/* Constraints */}
                    {session.constraints && (
                      <div className="history-section">
                        <div className="history-section-label">Constraints</div>
                        <p className="history-text">{session.constraints}</p>
                      </div>
                    )}

                    {/* Tasks */}
                    {session.tasks?.length > 0 && (
                      <div className="history-section">
                        <div className="history-section-label">Tasks</div>
                        <div className="history-task-list">
                          {session.tasks.map((task, i) => (
                            <div key={i} className={`history-task-row ${task.done ? 'history-task-row--done' : ''}`}>
                              <span className="history-task-check">
                                {task.done ? '✓' : task.carriedOver ? '↺' : task.dismissed ? '–' : '○'}
                              </span>
                              <span className={`priority-badge priority-badge--${task.priority}`}>
                                {task.priority}
                              </span>
                              <span className="history-task-text">{task.task}</span>
                              {task.completedRounds > 0 && (
                                <span className="history-task-rounds">
                                  {task.completedRounds}/{task.pomodoroCount} rounds
                                </span>
                              )}
                              {task.carriedOver && <span className="history-tag">carried →</span>}
                              {task.dismissed  && <span className="history-tag history-tag--dim">dismissed</span>}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Parking notes */}
                    {session.parkingNotes && (
                      <div className="history-section">
                        <div className="history-section-label">Parking Lot Notes</div>
                        <p className="history-brain-dump">{session.parkingNotes}</p>
                      </div>
                    )}

                    {/* Let go of */}
                    {session.letGoOf && (
                      <div className="history-section">
                        <div className="history-section-label">Let Go Of</div>
                        <p className="history-text history-italic">{session.letGoOf}</p>
                      </div>
                    )}

                    {/* Delete session */}
                    <div className="history-session-actions">
                      <button
                        className={`win95-btn ${isConfirmDelete ? 'win95-btn--red' : ''}`}
                        onClick={() => handleDelete(session.id)}
                        style={{ fontSize: 11 }}
                      >
                        {isConfirmDelete ? '⚠ Confirm Delete?' : '🗑 Delete Session'}
                      </button>
                      {isConfirmDelete && (
                        <button
                          className="win95-btn"
                          onClick={() => { playClick(); setConfirmDeleteId(null) }}
                          style={{ fontSize: 11 }}
                        >Cancel</button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
