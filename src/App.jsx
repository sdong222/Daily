import { useState } from 'react'
import ProgressIndicator from './components/ProgressIndicator'
import BrainDumpScreen from './components/BrainDumpScreen'
import EnergyScreen from './components/EnergyScreen'
import ConstraintsScreen from './components/ConstraintsScreen'
import ResultsScreen from './components/ResultsScreen'
import ParkingLot from './components/ParkingLot'
import HistoryDrawer from './components/HistoryDrawer'
import SessionBrowser from './components/SessionBrowser'
import { generateDayPlan } from './services/anthropicService'
import {
  createSession,
  updateSession,
  updateSessionTasks,
  getIncompleteTasks,
} from './utils/storage'
import './App.css'

export default function App() {
  const [screen, setScreen] = useState(0)
  const [brainDump, setBrainDump] = useState('')
  const [energy, setEnergy] = useState(null)
  const [constraints, setConstraints] = useState('')
  const [results, setResults] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [parkingNotes, setParkingNotes] = useState('')
  const [pendingTask, setPendingTask] = useState(null)
  const [currentSessionId, setCurrentSessionId] = useState(null)
  const [incompleteTasks, setIncompleteTasks] = useState([])
  const [showHistory, setShowHistory] = useState(false)
  const [showSessionBrowser, setShowSessionBrowser] = useState(false)
  // Tasks loaded directly from a previous session (bypasses AI generation)
  const [overrideTasks, setOverrideTasks] = useState(null)
  // Tasks cherry-picked from previous sessions to inject after AI generation
  const [preloadedTasks, setPreloadedTasks] = useState([])

  const handleEnergySelect = (level) => {
    setEnergy(level)
    setScreen(2)
  }

  const handleGenerate = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await generateDayPlan({ brainDump, energy, constraints })
      const sessionId = createSession({ brainDump, energy, constraints, results: data })
      setCurrentSessionId(sessionId)
      setResults(data)
      setIncompleteTasks(getIncompleteTasks(sessionId))
      setScreen(3)
    } catch (err) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleReset = () => {
    setScreen(0)
    setBrainDump('')
    setEnergy(null)
    setConstraints('')
    setResults(null)
    setError(null)
    setCurrentSessionId(null)
    setIncompleteTasks([])
    setOverrideTasks(null)
    setPreloadedTasks([])
  }

  /** Load an old session directly into the results screen without re-running AI */
  const handleContinueSession = (session) => {
    setParkingNotes(session.parkingNotes || '')
    setCurrentSessionId(session.id)
    setBrainDump(session.brainDump || '')
    setEnergy(session.energy || null)
    setConstraints(session.constraints || '')
    // Minimal results shell — letGoOf / encouragement are preserved; tasks come via overrideTasks
    setResults({
      letGoOf: session.letGoOf || '',
      encouragement: session.encouragement || '',
      mainTask: null,
      supportingTasks: [],
      quickWins: [],
    })
    setOverrideTasks(
      (session.tasks || []).map((t) => ({ ...t, collapsed: false }))
    )
    setIncompleteTasks(getIncompleteTasks(session.id))
    setScreen(3)
  }

  /** Store cherry-picked tasks; they will be injected into results after AI generation */
  const handleAddPickedTasks = (tasks) => {
    setPreloadedTasks(tasks)
  }

  /**
   * Add tasks from a previous session to today.
   * Works pre- and post-checkin: preloads tasks if still in check-in, injects directly into
   * ResultsScreen if already on screen 3 (via the preloadedTasks mechanism).
   */
  const handleAddToToday = (tasks) => {
    const clean = tasks.filter((t) => !t.done && !t.dismissed)
    if (!clean.length) return
    setPreloadedTasks((prev) => {
      const existingIds = new Set(prev.map((t) => t.id))
      const deduped = clean.filter((t) => !existingIds.has(t.id))
      return [...prev, ...deduped]
    })
  }

  const handleParkingNotesChange = (notes) => {
    setParkingNotes(notes)
    if (currentSessionId) updateSession(currentSessionId, { parkingNotes: notes })
  }

  const handleTasksChange = (tasks) => {
    if (currentSessionId) updateSessionTasks(currentSessionId, tasks)
  }

  const handleRefreshIncomplete = () => {
    if (currentSessionId) setIncompleteTasks(getIncompleteTasks(currentSessionId))
  }

  const currentContent = [
    <BrainDumpScreen
      value={brainDump}
      onChange={setBrainDump}
      onNext={() => setScreen(1)}
      onBrowseSessions={() => setShowSessionBrowser(true)}
      preloadedCount={preloadedTasks.length}
    />,
    <EnergyScreen onSelect={handleEnergySelect} />,
    <ConstraintsScreen
      value={constraints}
      onChange={setConstraints}
      onGenerate={handleGenerate}
      isLoading={isLoading}
      error={error}
    />,
    <ResultsScreen
      results={results}
      onReset={handleReset}
      parkingNotes={parkingNotes}
      onParkingNotesChange={handleParkingNotesChange}
      pendingTask={pendingTask}
      onPendingTaskConsumed={() => setPendingTask(null)}
      onTasksChange={handleTasksChange}
      incompleteTasks={incompleteTasks}
      onRefreshIncomplete={handleRefreshIncomplete}
      overrideTasks={overrideTasks}
      preloadedTasks={preloadedTasks}
      onPreloadedTasksConsumed={() => setPreloadedTasks([])}
    />,
  ][screen]

  return (
    <div className="app">
      {screen < 3 && <ProgressIndicator current={screen} total={3} />}

      <main className="screen-container">
        <div key={screen} className="screen-wrapper">
          {currentContent}
        </div>
      </main>

      {/* History button — always visible */}
      <button
        className="history-fab"
        onClick={() => setShowHistory(true)}
        title="View session history"
        aria-label="Session history"
      >
        <span style={{ fontSize: 18 }}>📅</span>
        <span className="history-fab-label">LOG</span>
      </button>

      <ParkingLot
        notes={parkingNotes}
        onChange={handleParkingNotesChange}
        onAddTask={screen === 3 ? (task) => setPendingTask(task) : null}
      />

      {showHistory && (
        <HistoryDrawer
          onClose={() => setShowHistory(false)}
          onAddToToday={handleAddToToday}
        />
      )}

      {showSessionBrowser && (
        <SessionBrowser
          onClose={() => setShowSessionBrowser(false)}
          onContinueSession={handleContinueSession}
          onAddPickedTasks={handleAddPickedTasks}
          onAddToToday={handleAddToToday}
        />
      )}
    </div>
  )
}
