const ENERGY_OPTIONS = [
  {
    level: 'low',
    icon: '○',
    label: 'Low',
    desc: 'Running on fumes',
  },
  {
    level: 'okay',
    icon: '◑',
    label: 'Okay',
    desc: "I'm here",
  },
  {
    level: 'solid',
    icon: '●',
    label: 'Solid',
    desc: 'Ready to go',
  },
]

export default function EnergyScreen({ onSelect }) {
  return (
    <div>
      <div className="screen-header">
        <h1>How are you feeling right now?</h1>
        <p>Tap one. No judgment.</p>
      </div>

      <div className="energy-grid">
        {ENERGY_OPTIONS.map(({ level, icon, label, desc }) => (
          <button
            key={level}
            className={`energy-btn energy-btn--${level}`}
            onClick={() => onSelect(level)}
          >
            <span className="energy-icon" aria-hidden="true">{icon}</span>
            <span className="energy-label">{label}</span>
            <span className="energy-desc">{desc}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
