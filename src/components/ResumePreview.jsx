import { useEffect, useRef, useState, useCallback } from 'react'
import * as pdfjsLib from 'pdfjs-dist'
import ResumeFieldOverlay from './ResumeFieldOverlay'

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).toString()

const SCALE = 1.45

// Renders the compiled PDF on canvases (PDF.js is the primary renderer — no iframe),
// then maps placeholder values → text-layer bounding boxes and drops invisible
// contentEditable overlays at the exact positions. WYSIWYG, zero LaTeX exposure.
export default function ResumePreview({ pdfData, placeholders, onEdit, compiling }) {
  const containerRef = useRef(null)
  const [pages, setPages] = useState([]) // [{ width, height, fields: [...] }]
  const renderToken = useRef(0)

  const buildFields = useCallback((textContent, viewport, placeholderMap) => {
    const fields = []
    const claimed = new Set()
    const entries = Object.entries(placeholderMap || {}).filter(([, v]) => typeof v === 'string' && v.trim().length > 1)
    // Longest values first so e.g. a full name wins over a shared substring.
    entries.sort((a, b) => b[1].length - a[1].length)

    for (const item of textContent.items) {
      const str = (item.str || '').trim()
      if (!str) continue
      for (const [key, value] of entries) {
        const v = value.trim()
        if (claimed.has(key)) continue
        if (str === v || (v.length > 6 && str.includes(v)) || (str.length > 6 && v.includes(str))) {
          const tx = pdfjsLib.Util.transform(viewport.transform, item.transform)
          const fontSize = Math.hypot(tx[2], tx[3])
          fields.push({
            key,
            value,
            left: tx[4],
            top: tx[5] - fontSize,
            width: item.width * viewport.scale,
            height: fontSize * 1.15,
            fontSize,
          })
          claimed.add(key)
          break
        }
      }
    }
    return fields
  }, [])

  useEffect(() => {
    if (!pdfData) return
    const token = ++renderToken.current
    let cancelled = false

    ;(async () => {
      try {
        const doc = await pdfjsLib.getDocument({ data: pdfData.slice() }).promise
        const rendered = []
        for (let i = 1; i <= doc.numPages; i++) {
          const page = await doc.getPage(i)
          const viewport = page.getViewport({ scale: SCALE })
          const canvas = document.createElement('canvas')
          canvas.width = viewport.width
          canvas.height = viewport.height
          await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise
          const textContent = await page.getTextContent()
          rendered.push({
            width: viewport.width,
            height: viewport.height,
            dataUrl: canvas.toDataURL(),
            fields: buildFields(textContent, viewport, placeholders),
          })
        }
        if (!cancelled && token === renderToken.current) setPages(rendered)
      } catch (err) {
        console.error('[pressed] PDF render failed:', err)
      }
    })()

    return () => { cancelled = true }
  }, [pdfData, placeholders, buildFields])

  return (
    <div ref={containerRef} className="relative flex flex-col items-center gap-6 py-6">
      {compiling && (
        <div className="absolute right-4 top-4 z-20 flex items-center gap-2 rounded-full border border-rule bg-cream/95 px-3.5 py-1.5 shadow-card">
          <span className="h-2 w-2 rounded-full bg-navy animate-soft-pulse" />
          <span className="text-xs text-graphite">Pressing…</span>
        </div>
      )}
      {pages.length === 0 && !compiling && (
        <div className="flex h-96 items-center justify-center text-sm text-stone">Your resume preview will appear here.</div>
      )}
      {pages.map((page, idx) => (
        <div
          key={idx}
          className="relative overflow-hidden rounded-lg border border-rule bg-white shadow-lift"
          style={{ width: page.width, height: page.height }}
        >
          <img src={page.dataUrl} width={page.width} height={page.height} alt={`Resume page ${idx + 1}`} draggable={false} />
          {page.fields.map((field) => (
            <ResumeFieldOverlay key={field.key} field={field} onEdit={onEdit} />
          ))}
        </div>
      ))}
    </div>
  )
}
