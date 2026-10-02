export function FloatingHearts({ count = 14 }) {
  const particles = Array.from({ length: count }, (_, index) => ({
    id: index,
    left: `${(index * 13) % 100}%`,
    top: `${(index * 17) % 88}%`,
    size: 12 + (index % 5) * 6,
    delay: `${(index % 8) * 1.4}s`,
    duration: `${7 + (index % 8)}s`,
    opacity: 0.25 + (index % 4) * 0.15,
    animationDuration: `${7 + (index % 8)}s`
  }))

  return (
    <div className="floating-hearts" aria-hidden="true">
      {particles.map((particle) => (
        <span
          key={particle.id}
          className="floating-heart"
          style={{
            left: particle.left,
            top: particle.top,
            width: `${particle.size}px`,
            height: `${particle.size}px`,
            opacity: particle.opacity,
            animationDelay: particle.delay,
            animationDuration: particle.duration
          }}
        >
          ♥
        </span>
      ))}
    </div>
  )
}
