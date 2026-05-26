import RetroWindow from './RetroWindow'
import { playClick } from '../utils/retroSound'

export default function ConstraintsScreen({ value, onChange, onGenerate, isLoading, error }) {
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !isLoading) {
      playClick()
      onGenerate()
    }
  }

  if (isLoading) {
    return (
      <RetroWindow title="GENERATING YOUR DAY..." icon="⏳">
        <div className="loading-wrapper">
          <div className="loading-retro-bar">
            <div className="loading-retro-block" />
            <div className="loading-retro-block" />
            <div className="loading-retro-block" />
            <div className="loading-retro-block" />
            <div className="loading-retro-block" />
          </div>
          <p className="loading-text">Putting your day together...</p>
        </div>
      </RetroWindow>
    )
  }

  return (
    <RetroWindow title="ANY LIMITS TODAY?" icon="🚧">
      <div className="screen-header">
        <h1>Any limits on today?</h1>
        <p>Hard stops, appointments, or energy limits. Leave blank if none.</p>
      </div>

      <input
        type="text"
        className="retro-input constraints-input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="e.g. Call at 2pm, need to be done by 4"
        autoFocus
      />

      {error && (
        <div className="error-box">
          Something went wrong: {error}
        </div>
      )}

      <div className="screen-footer">
        <button
          className="win95-btn win95-btn--navy btn-generate"
          onClick={() => { playClick(); onGenerate() }}
          disabled={isLoading}
        >
          Generate my day ▶
        </button>
      </div>
    </RetroWindow>
  )
}
