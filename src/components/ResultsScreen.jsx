export default function ResultsScreen({ results, onReset }) {
  if (!results) return null

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })

  const { mainTask, supportingTasks = [], quickWins = [], letGoOf, encouragement } = results

  return (
    <div className="results-screen">
      <div className="results-header">
        <p className="results-date">{today}</p>
        <h1 className="results-title">Here's your day.</h1>
        {encouragement && (
          <p className="results-encouragement">{encouragement}</p>
        )}
      </div>

      <div className="results-body">
        {/* Main focus card */}
        {mainTask && (
          <div className="result-card result-card--main">
            <div className="card-label card-label--primary">Main Focus</div>
            <p className="card-task">{mainTask.task}</p>
            {mainTask.pomodoroEstimate && (
              <span className="card-estimate">{mainTask.pomodoroEstimate}</span>
            )}
          </div>
        )}

        {/* Supporting tasks */}
        {supportingTasks.length > 0 && (
          <div className="result-card result-card--support">
            <div className="card-label">Supporting Tasks</div>
            <div className="support-list">
              {supportingTasks.map((item, i) => (
                <div key={i} className="support-item">
                  <p className="card-task">{item.task}</p>
                  {item.pomodoroEstimate && (
                    <span className="card-estimate">{item.pomodoroEstimate}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick wins */}
        {quickWins.length > 0 && (
          <div className="result-card result-card--quickwin">
            <div className="card-label">Quick Wins (under 5 min)</div>
            <div className="quick-wins-items">
              {quickWins.map((win, i) => (
                <div key={i} className="quick-win-row">
                  <span className="quick-win-check" aria-hidden="true">&#10003;</span>
                  <span>{win}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Let go of */}
        {letGoOf && (
          <div className="result-card result-card--letgo">
            <div className="card-label">Let go of today</div>
            <p className="card-task">{letGoOf}</p>
          </div>
        )}
      </div>

      <div className="results-footer">
        <button className="btn btn-secondary" onClick={onReset}>
          Start fresh
        </button>
      </div>
    </div>
  )
}
