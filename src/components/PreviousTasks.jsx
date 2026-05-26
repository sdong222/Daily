import { useState } from 'react'
import { playClick, playCheck } from '../utils/retroSound'
import { patchTaskInSession } from '../utils/storage'

export default function PreviousTasks({ tasks, onCarryOver, onRefresh }) {
  const [collapsed, setCollapsed] = useState(false)

  if (!tasks || tasks.length === 0) return null

  const grouped = groupByDate(tasks)

  const handleCarry = (task) => {
    playClick()
    patchTaskInSession(task._sessionId, task.id, { carriedOver: true })
    onCarryOver({
      task: task.task,
      priority: task.priority,
      pomodoroCount: task.pomodoroCount ?? 2,
      minutesPerRound: task.minutesPerRound ?? 25,
    })
    onRefresh()
  }

  const handleMarkDone = (task) => {
    playCheck()
    patchTaskInSession(task._sessionId, task.id, { done: true })
    onRefresh()
  }

  const handleDismiss = (task) => {
    playClick()
    patchTaskInSession(task._sessionId, task.id, { dismissed: true })
    onRefresh()
  }

  const handleCarryAll = () => {
    playClick()
    tasks.forEach((t) => {
      patchTaskInSession(t._sessionId, t.id, { carriedOver: true })
      onCarryOver({
        task: t.task,
        priority: t.priority,
        pomodoroCount: t.pomodoroCount ?? 2,
        minutesPerRound: t.minutesPerRound ?? 25,
      })
    })
    onRefresh()
  }

  const handleDismissAll = () => {
    playClick()
    tasks.forEach((t) => patchTaskInSession(t._sessionId, t.id, { dismissed: true }))
    onRefresh()
  }

  return (
    <div className="prev-tasks win95-window">
      <div className="win95-titlebar win95-titlebar--amber">
        <span className="win95-titlebar-text">
          <span className="win95-titlebar-icon">📋</span>
          UNFINISHED — {tasks.length} task{tasks.length !== 1 ? 's' : ''} from previous sessions
        </span>
        <div className="win95-titlebar-controls">
          <button
            className="win95-ctrl-btn"
            onClick={() => { playClick(); setCollapsed((v) => !v) }}
            title={collapsed ? 'Expand' : 'Collapse'}
          >{collapsed ? '□' : '─'}</button>
        </div>
      </div>

      {!collapsed && (
        <div className="prev-tasks-body">
          {Object.entries(grouped).map(([dateLabel, group]) => (
            <div key={dateLabel} className="prev-tasks-group">
              <div className="prev-tasks-date-header">{dateLabel}</div>
              {group.map((task, i) => (
                <div key={i} className="prev-task-row">
                  <span className={`priority-badge priority-badge--${task.priority}`}>
                    {task.priority}
                  </span>
                  <span className="prev-task-text" title={task.task}>{task.task}</span>
                  <div className="prev-task-actions">
                    <button
                      className="win95-btn win95-btn--blue prev-task-btn"
                      onClick={() => handleCarry(task)}
                      title="Carry to today's list"
                    >↺ Carry Over</button>
                    <button
                      className="win95-btn prev-task-btn"
                      onClick={() => handleMarkDone(task)}
                      title="Mark as already done"
                    >✓ Done</button>
                    <button
                      className="win95-btn win95-btn--red prev-task-btn"
                      onClick={() => handleDismiss(task)}
                      title="Dismiss and ignore"
                    >✕</button>
                  </div>
                </div>
              ))}
            </div>
          ))}

          <div className="prev-tasks-footer">
            <button className="win95-btn win95-btn--blue" onClick={handleCarryAll}>
              ↺ Carry All to Today
            </button>
            <button className="win95-btn" onClick={handleDismissAll}>
              Dismiss All
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function groupByDate(tasks) {
  const groups = {}
  for (const t of tasks) {
    const label = t._sessionDateLabel || t._sessionDate || 'Previous'
    if (!groups[label]) groups[label] = []
    groups[label].push(t)
  }
  return groups
}
