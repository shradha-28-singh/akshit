export function ProgressBar({ current, total }) {
  return (
    <div className="progress-wrap" aria-label="Story progress">
      <div className="progress-track">
        <div
          className="progress-fill"
          style={{ width: `${(current / total) * 100}%` }}
        />
      </div>
      <div className="progress-label">
        {current}/{total}
      </div>
    </div>
  )
}
