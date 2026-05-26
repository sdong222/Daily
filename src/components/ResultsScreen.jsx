import { useState, useEffect, useRef } from 'react'
import PomodoroTimer from './PomodoroTimer'
import PreviousTasks from './PreviousTasks'
import { playClick, playCheck, playSuccess } from '../utils/retroSound'

const PRIORITY_CYCLE = { A: 'B', B: 'C', C: 'A' }

const TITLE_BAR_COLORS = {
  A: 'linear-gradient(135deg, #d670ff 0%, #E8A0FF 100%)',  /* Violet — eye-catching */
  B: 'linear-gradient(135deg, #006EE9 0%, #0099FF 100%)',  /* Blue Raspberry */
  C: 'linear-gradient(135deg, #B8F088 0%, #D0FFA4 100%)',  /* Powdered Lime */
}

const BURST_PARTICLES = ['★', '✦', '♥', '◆', '✦', '★', '◈', '●']

function parsePomodoro(estimate) {
  if (!estimate) return { count: 2, minutesPerRound: 25 }
  const countMatch = estimate.match(/(\d+)\s*[Pp]omodoro/)
  const minMatch = estimate.match(/\((\d+)\s*min\)/)
  const count = countMatch ? parseInt(countMatch[1]) : 2
  const totalMin = minMatch ? parseInt(minMatch[1]) : count * 25
  const minutesPerRound = Math.max(5, Math.round(totalMin / Math.max(1, count)))
  return { count, minutesPerRound }
}

let taskIdCounter = 100

function buildInitialTasks(results) {
  const tasks = []

  results.quickWins?.forEach((win, i) => {
    tasks.push({
      id: `qw-${i}`,
      priority: 'C',
      task: win,
      pomodoroCount: 1,
      minutesPerRound: 5,
      done: false,
      completedRounds: 0,
      collapsed: false,
    })
  })

  if (results.mainTask) {
    const { count, minutesPerRound } = parsePomodoro(results.mainTask.pomodoroEstimate)
    tasks.push({
      id: 'main',
      priority: 'A',
      task: results.mainTask.task,
      pomodoroCount: count,
      minutesPerRound,
      done: false,
      completedRounds: 0,
      collapsed: false,
    })
  }

  results.supportingTasks?.forEach((item, i) => {
    const { count, minutesPerRound } = parsePomodoro(item.pomodoroEstimate)
    tasks.push({
      id: `support-${i}`,
      priority: 'B',
      task: item.task,
      pomodoroCount: count,
      minutesPerRound,
      done: false,
      completedRounds: 0,
      collapsed: false,
    })
  })

  return tasks
}

function makeNewTask(overrides = {}) {
  return {
    id: `added-${taskIdCounter++}`,
    priority: 'B',
    task: 'New task',
    pomodoroCount: 2,
    minutesPerRound: 25,
    done: false,
    completedRounds: 0,
    collapsed: false,
    isNew: true,
    ...overrides,
  }
}

export default function ResultsScreen({
  results,
  onReset,
  parkingNotes,
  onParkingNotesChange,
  pendingTask,
  onPendingTaskConsumed,
  onTasksChange,
  incompleteTasks = [],
  onRefreshIncomplete,
  overrideTasks,
  preloadedTasks = [],
  onPreloadedTasksConsumed,
}) {
  const [tasks, setTasks] = useState(() =>
    overrideTasks?.length ? overrideTasks : buildInitialTasks(results)
  )
  const [activeTimer, setActiveTimer] = useState(null)
  const [editingId, setEditingId] = useState(null)
  const [justCompleted, setJustCompleted] = useState(null)
  const [dragId, setDragId] = useState(null)
  const [dragOverId, setDragOverId] = useState(null)
  const dragInfo = useRef({ startY: 0, currentY: 0 })

  // Auto-save tasks to localStorage whenever they change
  useEffect(() => {
    if (onTasksChange) onTasksChange(tasks)
  }, [tasks])

  // Absorb tasks added via parking lot AI scan
  useEffect(() => {
    if (!pendingTask) return
    const { count, minutesPerRound } = parsePomodoro(pendingTask.pomodoroEstimate)
    setTasks((prev) => [
      ...prev,
      makeNewTask({
        task: pendingTask.task,
        priority: pendingTask.priority || 'B',
        pomodoroCount: count,
        minutesPerRound,
        isNew: false,
      }),
    ])
    onPendingTaskConsumed()
  }, [pendingTask])

  // Inject cherry-picked tasks from SessionBrowser (preloaded before AI generation)
  useEffect(() => {
    if (!preloadedTasks?.length) return
    const injected = preloadedTasks.map((t) =>
      makeNewTask({
        task: t.task,
        priority: t.priority || 'B',
        pomodoroCount: t.pomodoroCount ?? 2,
        minutesPerRound: t.minutesPerRound ?? 25,
        isNew: true,
        _preloaded: true,
      })
    )
    setTasks((prev) => [...prev, ...injected])
    if (onPreloadedTasksConsumed) onPreloadedTasksConsumed()
  }, [preloadedTasks])

  if (!results) return null

  const { letGoOf, encouragement } = results

  const updateTask = (id, patch) =>
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)))

  const removeTask = (id) => {
    playClick()
    setTasks((prev) => prev.filter((t) => t.id !== id))
  }

  const handleCheck = (id) => {
    const task = tasks.find((t) => t.id === id)
    if (!task) return
    const nowDone = !task.done
    if (nowDone) {
      playSuccess()
      setJustCompleted(id)
      setTimeout(() => setJustCompleted((cur) => (cur === id ? null : cur)), 1200)
    } else {
      playCheck()
    }
    updateTask(id, { done: nowDone })
  }

  const handlePriorityClick = (id) => {
    playClick()
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, priority: PRIORITY_CYCLE[t.priority] } : t))
    )
  }

  const handleCollapse = (id) => {
    playClick()
    updateTask(id, { collapsed: !tasks.find((t) => t.id === id)?.collapsed })
  }

  const handleCarryOver = ({ task, priority, pomodoroCount, minutesPerRound }) => {
    playClick()
    setTasks((prev) => [
      ...prev,
      makeNewTask({ task, priority, pomodoroCount, minutesPerRound, isNew: false }),
    ])
  }

  // Pointer-based drag (works on mouse + iPad touch)
  const handlePointerDown = (e, id) => {
    if (e.target.closest('button, input, textarea')) return
    e.currentTarget.setPointerCapture(e.pointerId)
    dragInfo.current.startY = e.clientY
    setDragId(id)
  }

  const handlePointerMove = (e, id) => {
    if (dragId !== id) return
    dragInfo.current.currentY = e.clientY
    // Find which card the pointer is over
    const elements = document.querySelectorAll('[data-task-id]')
    for (const el of elements) {
      const rect = el.getBoundingClientRect()
      if (e.clientY >= rect.top && e.clientY <= rect.bottom) {
        const overId = el.dataset.taskId
        if (overId !== dragId) setDragOverId(overId)
        break
      }
    }
  }

  const handlePointerUp = (e, id) => {
    if (dragId === id && dragOverId && dragId !== dragOverId) {
      setTasks((prev) => {
        const items = [...prev]
        const from  = items.findIndex((t) => t.id === dragId)
        const to    = items.findIndex((t) => t.id === dragOverId)
        const [moved] = items.splice(from, 1)
        items.splice(to, 0, moved)
        return items
      })
    }
    setDragId(null)
    setDragOverId(null)
  }

  const moveTask = (id, dir) => {
    playClick()
    setTasks((prev) => {
      const items = [...prev]
      const idx = items.findIndex((t) => t.id === id)
      const next = idx + dir
      if (next < 0 || next >= items.length) return prev
      const copy = [...items]
      ;[copy[idx], copy[next]] = [copy[next], copy[idx]]
      return copy
    })
  }

  const handleAddTask = () => {
    playClick()
    const newTask = makeNewTask()
    setTasks((prev) => [...prev, newTask])
    setEditingId(newTask.id)
  }

  const handleStartFocus = (task) => {
    playClick()
    setActiveTimer({ taskId: task.id })
  }

  const activeTask = activeTimer ? tasks.find((t) => t.id === activeTimer.taskId) : null

  return (
    <>
      {activeTask && (
        <PomodoroTimer
          task={activeTask.task}
          pomodoroCount={activeTask.pomodoroCount}
          minutesPerRound={activeTask.minutesPerRound}
          startRound={activeTask.completedRounds + 1}
          onRoundComplete={(round) => updateTask(activeTask.id, { completedRounds: round })}
          onStop={() => setActiveTimer(null)}
          parkingNotes={parkingNotes}
          onParkingNotesChange={onParkingNotesChange}
        />
      )}

      <div className="results-screen">
        <PreviousTasks
          tasks={incompleteTasks}
          onCarryOver={handleCarryOver}
          onRefresh={onRefreshIncomplete}
        />

        <div className="results-task-list" style={{ marginTop: incompleteTasks?.length > 0 ? 10 : 0 }}>
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              isEditing={editingId === task.id}
              isBursting={justCompleted === task.id}
              isDragging={dragId === task.id}
              isDragOver={dragOverId === task.id}
              onCheck={() => handleCheck(task.id)}
              onPriorityClick={() => handlePriorityClick(task.id)}
              onCollapse={() => handleCollapse(task.id)}
              onRemove={() => removeTask(task.id)}
              onStartFocus={() => handleStartFocus(task)}
              onEditStart={() => { playClick(); setEditingId(task.id) }}
              onEditEnd={(val) => {
                updateTask(task.id, { task: val, isNew: false })
                setEditingId(null)
              }}
              onPomodoroCountChange={(v) =>
                updateTask(task.id, { pomodoroCount: Math.max(1, Math.min(20, v)) })
              }
              onMinutesChange={(v) =>
                updateTask(task.id, { minutesPerRound: Math.max(1, Math.min(90, v)) })
              }
              taskIndex={tasks.indexOf(task)}
              taskTotal={tasks.length}
              onMoveUp={() => moveTask(task.id, -1)}
              onMoveDown={() => moveTask(task.id, 1)}
              onPointerDown={(e) => handlePointerDown(e, task.id)}
              onPointerMove={(e) => handlePointerMove(e, task.id)}
              onPointerUp={(e) => handlePointerUp(e, task.id)}
            />
          ))}
        </div>

        <button className="win95-btn add-task-btn" onClick={handleAddTask}>
          + Add Task
        </button>

        {(letGoOf || encouragement) && (
          <div className="bottom-card" style={{ marginTop: 10 }}>
            {encouragement && (
              <div className="bottom-card-section">
                <span className="bottom-card-label">Today's Encouragement</span>
                <p className="bottom-card-text">"{encouragement}"</p>
              </div>
            )}
            {letGoOf && (
              <div className="bottom-card-section">
                <span className="bottom-card-label">Let go of today</span>
                <p className="bottom-card-text">{letGoOf}</p>
              </div>
            )}
          </div>
        )}

        <div className="results-footer">
          <button className="win95-btn" onClick={() => { playClick(); onReset() }}>
            ↺ Start Fresh
          </button>
        </div>
      </div>
    </>
  )
}

function TaskCard({
  task,
  isEditing,
  isBursting,
  isDragging,
  isDragOver,
  taskIndex,
  taskTotal,
  onCheck,
  onPriorityClick,
  onCollapse,
  onRemove,
  onStartFocus,
  onEditStart,
  onEditEnd,
  onPomodoroCountChange,
  onMinutesChange,
  onMoveUp,
  onMoveDown,
  onPointerDown,
  onPointerMove,
  onPointerUp,
}) {
  const [editVal, setEditVal] = useState(task.task)
  useEffect(() => { setEditVal(task.task) }, [task.task])

  const priorityLabel =
    task.priority === 'A' ? 'A — Must Do' :
    task.priority === 'B' ? 'B — Should Do' :
                            'C — Quick Win'

  const titleBarClass =
    task.priority === 'A' ? 'win95-titlebar--red' :
    task.priority === 'B' ? 'win95-titlebar--blue' :
                            'win95-titlebar--amber'

  return (
    <div
      className={[
        'task-card win95-window',
        task.done    ? 'task-card--done'      : '',
        isBursting   ? 'task-card-done-flash' : '',
        isDragging   ? 'task-card--dragging'  : '',
        isDragOver   ? 'task-card--drag-over' : '',
      ].filter(Boolean).join(' ')}
      style={{ position: 'relative', touchAction: 'none' }}
      data-task-id={task.id}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
    >
      {/* Completion burst */}
      {isBursting && (
        <div className="completion-burst">
          {BURST_PARTICLES.map((char, i) => (
            <span key={i} className={`burst-particle burst-particle--${i}`} style={{ color: ['#ff6b6b','#ffcc00','#00cccc','#cc66ff','#ff9944','#44ff99','#ff44aa','#44aaff'][i] }}>
              {char}
            </span>
          ))}
        </div>
      )}

      {/* Title bar */}
      <div className={`win95-titlebar ${titleBarClass}`} style={{ cursor: 'grab' }}>
        <span className="win95-titlebar-text">
          {priorityLabel}
          {task.completedRounds > 0 && (
            <span style={{ marginLeft: 10, opacity: 0.85, fontFamily: 'inherit', fontSize: 13, fontWeight: 400 }}>
              ({task.completedRounds}/{task.pomodoroCount} rounds done)
            </span>
          )}
        </span>
        <div className="win95-titlebar-controls" onClick={(e) => e.stopPropagation()}>
          <button
            className="win95-ctrl-btn"
            onClick={onMoveUp}
            disabled={taskIndex === 0}
            title="Move up"
            aria-label="Move task up"
          >▲</button>
          <button
            className="win95-ctrl-btn"
            onClick={onMoveDown}
            disabled={taskIndex === taskTotal - 1}
            title="Move down"
            aria-label="Move task down"
          >▼</button>
          <button
            className="win95-ctrl-btn"
            onClick={onCollapse}
            title={task.collapsed ? 'Expand' : 'Collapse'}
            aria-label={task.collapsed ? 'Expand task' : 'Collapse task'}
          >{task.collapsed ? '+' : '–'}</button>
          <button
            className="win95-ctrl-btn win95-ctrl-btn--close"
            onClick={onRemove}
            title="Remove task"
            aria-label="Remove task"
          >X</button>
        </div>
      </div>

      {/* Collapsible body */}
      {!task.collapsed && (
        <div className="task-card-body">
          <div className="task-card-top">
            <div className="task-card-check-col">
              <button
                className={`retro-checkbox ${task.done ? 'retro-checkbox--checked' : ''}`}
                onClick={onCheck}
                aria-label={task.done ? 'Mark incomplete' : 'Mark complete'}
              />
            </div>
            <div className="task-card-main">
              {isEditing ? (
                <input
                  className="retro-input task-text-input"
                  value={editVal}
                  autoFocus
                  onChange={(e) => setEditVal(e.target.value)}
                  onBlur={() => onEditEnd(editVal)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') onEditEnd(editVal)
                    if (e.key === 'Escape') { setEditVal(task.task); onEditEnd(task.task) }
                  }}
                />
              ) : (
                <p
                  className={`task-text ${task.done ? 'task-text--done' : ''}`}
                  onClick={onEditStart}
                  title="Click to edit"
                  style={{ cursor: 'text' }}
                >
                  {task.task}
                </p>
              )}
            </div>
          </div>

          <div className="task-card-controls">
            <button
              className={`priority-badge priority-badge--${task.priority}`}
              onClick={onPriorityClick}
              title="Click to change priority"
            >
              {task.priority}
            </button>

            <div className="pomodoro-controls">
              <span className="pomodoro-label">ROUNDS:</span>
              <input
                type="number"
                className="pomo-num-input"
                value={task.pomodoroCount}
                min={1}
                max={20}
                onChange={(e) => onPomodoroCountChange(parseInt(e.target.value) || 1)}
                onClick={(e) => e.stopPropagation()}
              />
              <span className="pomo-separator">×</span>
              <input
                type="number"
                className="pomo-num-input"
                value={task.minutesPerRound}
                min={1}
                max={90}
                onChange={(e) => onMinutesChange(parseInt(e.target.value) || 25)}
                onClick={(e) => e.stopPropagation()}
              />
              <span className="pomodoro-label">MIN</span>
            </div>

            {!task.done && (
              <button
                className="win95-btn win95-btn--navy start-focus-btn"
                onClick={onStartFocus}
              >
                ▶ Start Focus
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
