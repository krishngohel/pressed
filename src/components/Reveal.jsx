import { useEffect, useRef } from 'react'

// Scroll-reveal wrapper. Usage:
//   <Reveal>...</Reveal>
//   <Reveal variant="left" delay={120} as="section" className="...">
// Variants: up (default) | left | right | scale | blur
export default function Reveal({ as: Tag = 'div', variant = 'up', delay = 0, threshold = 0.18, once = true, className = '', children, ...rest }) {
  const ref = useRef(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            el.classList.add('is-revealed')
            if (once) io.unobserve(el)
          } else if (!once) {
            el.classList.remove('is-revealed')
          }
        })
      },
      { threshold, rootMargin: '0px 0px -8% 0px' }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [threshold, once])

  return (
    <Tag
      ref={ref}
      data-reveal={variant === 'up' ? '' : variant}
      style={{ '--reveal-delay': `${delay}ms` }}
      className={className}
      {...rest}
    >
      {children}
    </Tag>
  )
}
