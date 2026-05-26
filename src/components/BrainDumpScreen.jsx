export default function BrainDumpScreen({ value, onChange, onNext }) {
  return (
    <div>
      <div className="screen-header">
        <h1>Good morning.</h1>
        <p>What's on your mind? Messy is fine.</p>
      </div>

      <textarea
        className="brain-dump-textarea"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Start typing... it doesn't need to make sense. Dump it all here."
        autoFocus
      />

      <div className="screen-footer">
        <button
          className="btn btn-primary"
          onClick={onNext}
          disabled={!value.trim()}
        >
          Next
        </button>
      </div>
    </div>
  )
}
