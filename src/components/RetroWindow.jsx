export default function RetroWindow({ title, icon = '🖥', titleBarColor, children }) {
  return (
    <div className="win95-window">
      <div
        className="win95-titlebar"
        style={titleBarColor ? { background: titleBarColor } : undefined}
      >
        <span className="win95-titlebar-text">
          <span className="win95-titlebar-icon" aria-hidden="true">{icon}</span>
          {title}
        </span>
        <div className="win95-titlebar-controls" aria-hidden="true">
          <span className="win95-ctrl-btn">─</span>
          <span className="win95-ctrl-btn">□</span>
          <span className="win95-ctrl-btn">✕</span>
        </div>
      </div>
      <div className="win95-window-body">
        {children}
      </div>
    </div>
  )
}
