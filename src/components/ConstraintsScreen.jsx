export default function ConstraintsScreen({
  value,
  onChange,
  onGenerate,
  isLoading,
  error,
}) {
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !isLoading) {
      onGenerate()
    }
  }

  if (isLoading) {
    return (
      <div className="loading-wrapper">
        <div className="loading-dots">
          <div className="loading-dot" />
          <div className="loading-dot" />
          <div className="loading-dot" />
        </div>
        <p className="loading-text">Putting your day together...</p>
      </div>
    )
  }

  return (
    <div>
      <div className="screen-header">
        <h1>Any limits on today?</h1>
        <p>Hard stops, appointments, or energy limits. Leave blank if none.</p>
      </div>

      <input
        type="text"
        className="constraints-input"
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
          className="btn btn-primary btn-generate"
          onClick={onGenerate}
          disabled={isLoading}
        >
          Generate my day
        </button>
      </div>
    </div>
  )
}
