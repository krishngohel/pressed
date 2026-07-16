// SwiftLaTeX wrapper — in-browser WASM compilation. LaTeX is NEVER user-visible;
// every error is logged to console and surfaced as a friendly toast upstream.
//
// Setup: download PdfTeXEngine.js + swiftlatexpdftex.wasm from
// https://github.com/SwiftLaTeX/SwiftLaTeX/releases into /public/swiftlatex/.

let enginePromise = null

function loadScript(src) {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) return resolve()
    const s = document.createElement('script')
    s.src = src
    s.onload = resolve
    s.onerror = () => reject(new Error(`Failed to load ${src}`))
    document.head.appendChild(s)
  })
}

async function createEngine() {
  await loadScript('/swiftlatex/PdfTeXEngine.js')
  if (!window.PdfTeXEngine) throw new Error('SwiftLaTeX engine not found — see README setup.')
  const engine = new window.PdfTeXEngine()
  await engine.loadEngine()
  return engine
}

export function getEngine() {
  if (!enginePromise) enginePromise = createEngine().catch((err) => {
    enginePromise = null
    throw err
  })
  return enginePromise
}

export async function compileLatex(source) {
  const engine = await getEngine()
  engine.writeMemFSFile('main.tex', source)
  engine.setEngineMainFile('main.tex')
  const result = await engine.compileLaTeX()
  if (result.status !== 0 || !result.pdf) {
    console.error('[pressed] LaTeX compile failed:\n', result.log)
    const err = new Error('compile_failed')
    err.log = result.log
    throw err
  }
  return result.pdf // Uint8Array
}

/* ---------- placeholder plumbing ---------- */

const SPECIALS = {
  '\\': '\\textbackslash{}',
  '&': '\\&',
  '%': '\\%',
  $: '\\$',
  '#': '\\#',
  _: '\\_',
  '{': '\\{',
  '}': '\\}',
  '~': '\\textasciitilde{}',
  '^': '\\textasciicircum{}',
}

export function escapeLatex(text = '') {
  return String(text).replace(/[\\&%$#_{}~^]/g, (c) => SPECIALS[c])
}

// latex_source keeps {{{KEY}}} markers; placeholders holds the live values.
// Edits only mutate placeholders, then we re-fill + recompile.
export function fillTemplate(source, placeholders = {}) {
  return source.replace(/\{\{\{([A-Z0-9_]+)\}\}\}/g, (_, key) =>
    escapeLatex(placeholders[key] ?? '')
  )
}

export function pdfBlobUrl(pdfBytes) {
  const blob = new Blob([pdfBytes], { type: 'application/pdf' })
  return URL.createObjectURL(blob)
}
