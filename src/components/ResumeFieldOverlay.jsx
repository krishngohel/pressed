import { useRef, useEffect } from 'react'

// A single contentEditable region positioned over a rendered PDF text run.
// Invisible until hovered (pale navy outline + pencil), editable on click.
// Edits update the placeholder map upstream — the user never sees LaTeX.
export default function ResumeFieldOverlay({ field, onEdit }) {
  const ref = useRef(null)
  const timer = useRef(null)

  useEffect(() => {
    if (ref.current && ref.current.textContent !== field.value) {
      ref.current.textContent = field.value
    }
  }, [field.value])

  const handleInput = () => {
    const value = ref.current?.textContent ?? ''
    clearTimeout(timer.current)
    timer.current = setTimeout(() => onEdit(field.key, value), 800) // debounce 800ms → recompile
  }

  useEffect(() => () => clearTimeout(timer.current), [])

  return (
    <div
      ref={ref}
      className="resume-field"
      contentEditable
      suppressContentEditableWarning
      spellCheck={false}
      data-placeholder-key={field.key}
      style={{
        left: `${field.left}px`,
        top: `${field.top}px`,
        minWidth: `${Math.max(field.width, 24)}px`,
        height: `${field.height}px`,
        fontSize: `${field.fontSize}px`,
        lineHeight: `${field.height}px`,
        fontFamily: 'Georgia, serif',
        whiteSpace: 'nowrap',
      }}
      onInput={handleInput}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          e.preventDefault()
          e.currentTarget.blur()
        }
      }}
    >
      {field.value}
    </div>
  )
}
