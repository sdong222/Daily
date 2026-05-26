const STEP_LABELS = ['Brain Dump', 'Energy', 'Limits']
const TOTAL_SEGMENTS = 12

export default function ProgressIndicator({ current, total }) {
  const filledSegments = Math.round((current / total) * TOTAL_SEGMENTS)

  return (
    <div className="retro-progress-wrap" role="progressbar" aria-valuenow={current + 1} aria-valuemax={total}>
      <span className="retro-progress-label">
        STEP {current + 1} OF {total}: {STEP_LABELS[current] ?? ''}
      </span>
      <div className="retro-progress-track">
        {Array.from({ length: TOTAL_SEGMENTS }).map((_, i) => (
          <div
            key={i}
            className={`retro-progress-segment ${i < filledSegments ? 'retro-progress-segment--filled' : ''}`}
          />
        ))}
      </div>
    </div>
  )
}
