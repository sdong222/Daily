const KEY = 'adhd-daily-sessions'
const MAX_SESSIONS = 90

function parsePomodoro(estimate) {
  if (!estimate) return { pomodoroCount: 2, minutesPerRound: 25 }
  const c = estimate.match(/(\d+)\s*[Pp]omodoro/)
  const m = estimate.match(/\((\d+)\s*min\)/)
  const count = c ? parseInt(c[1]) : 2
  const totalMin = m ? parseInt(m[1]) : count * 25
  return {
    pomodoroCount: count,
    minutesPerRound: Math.max(5, Math.round(totalMin / Math.max(1, count))),
  }
}

function read() {
  try { return JSON.parse(localStorage.getItem(KEY) || '[]') }
  catch { return [] }
}

function write(sessions) {
  localStorage.setItem(KEY, JSON.stringify(sessions))
}

/** Returns all sessions, newest first */
export function getAllSessions() {
  return read()
}

/** Creates a brand-new session from check-in data + Claude results. Returns session id. */
export function createSession({ brainDump, energy, constraints, results }) {
  const now = new Date()
  const id = `s-${now.getTime()}`

  const tasks = []
  results.quickWins?.forEach((win, i) =>
    tasks.push({ id: `qw-${i}`, task: win, priority: 'C', done: false, pomodoroCount: 1, minutesPerRound: 5, completedRounds: 0 })
  )
  if (results.mainTask) {
    const p = parsePomodoro(results.mainTask.pomodoroEstimate)
    tasks.push({ id: 'main', task: results.mainTask.task, priority: 'A', done: false, completedRounds: 0, ...p })
  }
  results.supportingTasks?.forEach((item, i) => {
    const p = parsePomodoro(item.pomodoroEstimate)
    tasks.push({ id: `support-${i}`, task: item.task, priority: 'B', done: false, completedRounds: 0, ...p })
  })

  const session = {
    id,
    date: now.toLocaleDateString('en-CA'),          // "2026-05-26"
    timestamp: now.getTime(),
    dateLabel: now.toLocaleDateString('en-US', {    // "Tue, May 26"
      weekday: 'short', month: 'short', day: 'numeric',
    }),
    brainDump: brainDump || '',
    energy: energy || '',
    constraints: constraints || '',
    tasks,
    parkingNotes: '',
    letGoOf: results.letGoOf || '',
    encouragement: results.encouragement || '',
  }

  const sessions = read()
  sessions.unshift(session)
  if (sessions.length > MAX_SESSIONS) sessions.splice(MAX_SESSIONS)
  write(sessions)
  return id
}

/** Patch any top-level fields on a session */
export function updateSession(id, patch) {
  const sessions = read()
  const idx = sessions.findIndex((s) => s.id === id)
  if (idx < 0) return
  sessions[idx] = { ...sessions[idx], ...patch }
  write(sessions)
}

/** Replace the tasks array on a session (strips UI-only fields) */
export function updateSessionTasks(id, tasks) {
  const clean = tasks.map(({ collapsed, isNew, ...t }) => t)
  updateSession(id, { tasks: clean })
}

/**
 * Returns all tasks that are not done / not carried-over / not dismissed
 * from sessions OTHER than excludeSessionId.
 */
export function getIncompleteTasks(excludeSessionId) {
  const sessions = read()
  const result = []
  for (const s of sessions) {
    if (s.id === excludeSessionId) continue
    for (const t of s.tasks || []) {
      if (!t.done && !t.carriedOver && !t.dismissed) {
        result.push({
          ...t,
          _sessionId: s.id,
          _sessionDate: s.date,
          _sessionDateLabel: s.dateLabel || s.date,
          _sessionTimestamp: s.timestamp,
        })
      }
    }
  }
  result.sort((a, b) => b._sessionTimestamp - a._sessionTimestamp)
  return result
}

/** Patch a specific task inside a specific session */
export function patchTaskInSession(sessionId, taskId, patch) {
  const sessions = read()
  const sIdx = sessions.findIndex((s) => s.id === sessionId)
  if (sIdx < 0) return
  const tIdx = sessions[sIdx].tasks.findIndex((t) => t.id === taskId)
  if (tIdx < 0) return
  sessions[sIdx].tasks[tIdx] = { ...sessions[sIdx].tasks[tIdx], ...patch }
  write(sessions)
}

export function deleteSession(id) {
  const sessions = read().filter((s) => s.id !== id)
  write(sessions)
}
