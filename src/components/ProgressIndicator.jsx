export default function ProgressIndicator({ current, total }) {
  return (
    <div className="progress-bar" role="progressbar" aria-valuenow={current + 1} aria-valuemax={total}>
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} className="progress-step-group" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            className={[
              'progress-dot',
              i === current ? 'progress-dot--active' : '',
              i < current ? 'progress-dot--done' : '',
            ]
              .filter(Boolean)
              .join(' ')}
          />
          {i < total - 1 && (
            <div className={`progress-line ${i < current ? 'progress-line--done' : ''}`} />
          )}
        </div>
      ))}
    </div>
  )
}
