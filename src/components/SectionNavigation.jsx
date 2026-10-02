export function SectionNavigation({ sections, activeIndex, onSelect }) {
  return (
    <nav className="section-nav" aria-label="Story navigation">
      {sections.map((section, index) => (
        <button
          key={section.id}
          type="button"
          className={`dot-button ${index === activeIndex ? 'active' : ''}`}
          onClick={() => onSelect(index)}
          aria-label={`Go to ${section.label}`}
          title={section.label}
        >
          <span />
        </button>
      ))}
    </nav>
  )
}
