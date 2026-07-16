import { useCallback, useEffect, useRef, useState } from 'react'
import { Plus, Download, History, Sparkles, Trash2, X, ArrowLeft, Check } from 'lucide-react'
import ResumePreview from '../components/ResumePreview'
import Reveal from '../components/Reveal'
import { toast } from '../components/Toast'
import { get, post, put, del } from '../lib/api'
import { compileLatex, fillTemplate } from '../lib/latex'
import { useAuth } from '../context/AuthContext'

const TEMPLATES = [
  { id: 'classic', name: 'Classic', blurb: 'Timeless single-column. ATS-friendly small caps.' },
  { id: 'modern', name: 'Modern', blurb: 'Clean rules, generous whitespace, navy accents.' },
  { id: 'academic', name: 'Academic', blurb: 'Publications-first, CV-style sections.' },
  { id: 'minimal', name: 'Minimal', blurb: 'Just the essentials, beautifully set.' },
]

/* ---------------- new resume modal ---------------- */

function NewResumeModal({ onCreate, onClose }) {
  const [template, setTemplate] = useState('classic')
  const [jd, setJd] = useState('')
  const [name, setName] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async () => {
    setBusy(true)
    try {
      await onCreate({ template, job_description: jd.trim() || null, name: name.trim() || 'Untitled resume' })
      onClose()
    } catch (err) {
      if (err.status !== 403) toast('Generation hit a snag — try again.', 'error')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="card w-full max-w-xl p-7 shadow-lift animate-rise" onClick={(e) => e.stopPropagation()}>
        <div className="mb-5 flex items-center justify-between">
          <h3 className="font-display text-2xl text-ink">New resume</h3>
          <button onClick={onClose} className="btn-ghost !p-2"><X size={16} /></button>
        </div>
        <label className="label">Name</label>
        <input className="input mb-4" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Stripe — Product Designer" />
        <label className="label">Template</label>
        <div className="mb-4 grid grid-cols-2 gap-2.5">
          {TEMPLATES.map((t) => (
            <button
              key={t.id}
              onClick={() => setTemplate(t.id)}
              className={`rounded-card border p-3.5 text-left transition-all duration-300 ease-editorial hover:-translate-y-0.5 ${
                template === t.id ? 'border-navy bg-navy-s/40 shadow-card' : 'border-rule bg-cream'
              }`}
            >
              <p className={`text-sm font-medium ${template === t.id ? 'text-navy-p' : 'text-ink'}`}>{t.name}</p>
              <p className="mt-0.5 text-xs text-graphite">{t.blurb}</p>
            </button>
          ))}
        </div>
        <label className="label">Job description <span className="normal-case text-stone">(optional — used to tailor)</span></label>
        <textarea rows={5} className="input resize-y" value={jd} onChange={(e) => setJd(e.target.value)} placeholder="Paste the posting here and the AI will emphasize your most relevant work…" />
        <button disabled={busy} onClick={submit} className="btn-primary mt-5 w-full disabled:opacity-60">
          <Sparkles size={15} /> {busy ? 'Pressing your resume…' : 'Generate from my Vault'}
        </button>
      </div>
    </div>
  )
}

/* ---------------- tailor modal ---------------- */

function TailorModal({ resume, onApplied, onClose }) {
  const [jd, setJd] = useState('')
  const [busy, setBusy] = useState(false)
  const [diff, setDiff] = useState(null) // { changes: [{key, before, after}], placeholders }

  const run = async () => {
    setBusy(true)
    try {
      const result = await post('/ai/tailor', { resume_id: resume.id, job_description: jd })
      setDiff(result)
    } catch (err) {
      if (err.status !== 403) toast('Tailoring hit a snag — try again.', 'error')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="card max-h-[85vh] w-full max-w-2xl overflow-y-auto p-7 shadow-lift animate-rise scroll-thin" onClick={(e) => e.stopPropagation()}>
        <div className="mb-5 flex items-center justify-between">
          <h3 className="font-display text-2xl text-ink">Tailor for this role</h3>
          <button onClick={onClose} className="btn-ghost !p-2"><X size={16} /></button>
        </div>
        {!diff ? (
          <>
            <textarea rows={9} className="input resize-y" value={jd} onChange={(e) => setJd(e.target.value)} placeholder="Paste the full job description…" />
            <button disabled={busy || jd.trim().length < 40} onClick={run} className="btn-primary mt-4 w-full disabled:opacity-60">
              <Sparkles size={15} /> {busy ? 'Rewriting bullets…' : 'Preview tailored changes'}
            </button>
          </>
        ) : (
          <>
            <p className="mb-4 text-sm text-graphite">{diff.changes.length} bullet{diff.changes.length === 1 ? '' : 's'} rewritten to match the role:</p>
            <div className="space-y-3">
              {diff.changes.map((c) => (
                <div key={c.key} className="rounded-card border border-rule bg-paper/60 p-4">
                  <p className="text-xs text-stone line-through">{c.before}</p>
                  <p className="mt-1.5 flex items-start gap-2 text-sm text-ink">
                    <Check size={14} className="mt-0.5 shrink-0 text-moss" /> {c.after}
                  </p>
                </div>
              ))}
            </div>
            <div className="mt-5 flex gap-2">
              <button onClick={() => setDiff(null)} className="btn-secondary flex-1">Back</button>
              <button onClick={() => { onApplied(diff.placeholders); onClose() }} className="btn-primary flex-1"><Check size={15} /> Apply changes</button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

/* ---------------- page ---------------- */

export default function Resume() {
  const { isPro } = useAuth()
  const [resumes, setResumes] = useState([])
  const [current, setCurrent] = useState(null)
  const [pdfData, setPdfData] = useState(null)
  const [compiling, setCompiling] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showTailor, setShowTailor] = useState(false)
  const [versions, setVersions] = useState(null)
  const saveTimer = useRef(null)

  useEffect(() => {
    get('/resumes').then((r) => setResumes(r || [])).catch(() => {})
  }, [])

  useEffect(() => {
    if (!isPro) window.dispatchEvent(new CustomEvent('pressed:pro-required'))
  }, [isPro])

  const compile = useCallback(async (resume) => {
    setCompiling(true)
    try {
      const source = fillTemplate(resume.latex_source, resume.placeholders)
      const pdf = await compileLatex(source)
      setPdfData(pdf)
    } catch {
      toast('Something went wrong while updating your resume — try again.', 'error')
    } finally {
      setCompiling(false)
    }
  }, [])

  const open = async (resume) => {
    setCurrent(resume)
    setPdfData(null)
    compile(resume)
  }

  const create = async (payload) => {
    const resume = await post('/resumes/generate', payload)
    setResumes((prev) => [resume, ...prev])
    open(resume)
    toast('Your resume is pressed and ready.', 'success')
  }

  const persist = (resume) => {
    clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(async () => {
      try {
        await put(`/resumes/${resume.id}`, { placeholders: resume.placeholders, name: resume.name })
        await post(`/resumes/${resume.id}/version`).catch(() => {})
      } catch {}
    }, 1200)
  }

  // WYSIWYG edit → update placeholder → recompile (debounced upstream at 800ms)
  const onEdit = (key, value) => {
    setCurrent((prev) => {
      if (!prev || prev.placeholders[key] === value) return prev
      const next = { ...prev, placeholders: { ...prev.placeholders, [key]: value } }
      compile(next)
      persist(next)
      return next
    })
  }

  const applyTailored = (placeholders) => {
    setCurrent((prev) => {
      const next = { ...prev, placeholders: { ...prev.placeholders, ...placeholders }, tailored: true }
      compile(next)
      persist(next)
      return next
    })
    toast('Tailored bullets applied.', 'success')
  }

  const download = async () => {
    if (!current) return
    setCompiling(true)
    try {
      const pdf = await compileLatex(fillTemplate(current.latex_source, current.placeholders))
      const blob = new Blob([pdf], { type: 'application/pdf' })
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob)
      a.download = `${current.name.replace(/[^\w\- ]+/g, '')}.pdf`
      a.click()
    } catch {
      toast('Something went wrong — try again.', 'error')
    } finally {
      setCompiling(false)
    }
  }

  const loadVersions = async () => {
    try {
      const v = await get(`/resumes/${current.id}/versions`)
      setVersions(v || [])
    } catch {}
  }

  const restore = (version) => {
    setCurrent((prev) => {
      const next = { ...prev, latex_source: version.latex_source, placeholders: version.placeholders }
      compile(next)
      persist(next)
      return next
    })
    setVersions(null)
    toast('Version restored.', 'success')
  }

  const removeResume = async (resume) => {
    await del(`/resumes/${resume.id}`)
    setResumes((prev) => prev.filter((r) => r.id !== resume.id))
    if (current?.id === resume.id) { setCurrent(null); setPdfData(null) }
    toast('Resume deleted.')
  }

  /* ---------- list view ---------- */
  if (!current) {
    return (
      <main className="mx-auto max-w-6xl px-5 py-10">
        <Reveal className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-4xl font-medium tracking-tight text-ink">Resumes</h1>
            <p className="mt-1 text-sm text-graphite">Generated from your Vault. Click any line on the preview to edit — no code, ever.</p>
          </div>
          <button onClick={() => (isPro ? setShowNew(true) : window.dispatchEvent(new CustomEvent('pressed:pro-required')))} className="btn-primary">
            <Plus size={15} /> New resume
          </button>
        </Reveal>

        {resumes.length === 0 ? (
          <Reveal className="card flex flex-col items-center gap-4 border-dashed p-16 text-center">
            <Sparkles size={26} className="text-navy" />
            <p className="max-w-sm text-sm text-graphite">No resumes yet. Generate your first from the Vault — paste a job description and watch it tailor itself.</p>
            <button onClick={() => (isPro ? setShowNew(true) : window.dispatchEvent(new CustomEvent('pressed:pro-required')))} className="btn-primary"><Plus size={15} /> New resume</button>
          </Reveal>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {resumes.map((r, i) => (
              <Reveal key={r.id} delay={i * 80}>
                <button onClick={() => open(r)} className="card card-hover group w-full p-5 text-left">
                  <div className="flex items-start justify-between">
                    <div className="min-w-0">
                      <p className="truncate font-medium text-ink">{r.name}</p>
                      <p className="mt-0.5 text-xs text-stone">
                        {TEMPLATES.find((t) => t.id === r.template)?.name || r.template} · {new Date(r.updated_at || r.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    {r.tailored && <span className="pill-moss">Tailored</span>}
                  </div>
                  <span
                    role="button"
                    onClick={(e) => { e.stopPropagation(); removeResume(r) }}
                    className="mt-4 inline-flex items-center gap-1.5 text-xs text-stone opacity-0 transition-opacity duration-300 group-hover:opacity-100 hover:text-red-700"
                  >
                    <Trash2 size={12} /> Delete
                  </span>
                </button>
              </Reveal>
            ))}
          </div>
        )}

        {showNew && <NewResumeModal onCreate={create} onClose={() => setShowNew(false)} />}
      </main>
    )
  }

  /* ---------- editor view ---------- */
  return (
    <main className="mx-auto max-w-6xl px-5 py-8">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button onClick={() => { setCurrent(null); setPdfData(null) }} className="btn-ghost !p-2"><ArrowLeft size={16} /></button>
          <input
            className="rounded-lg border border-transparent bg-transparent px-2 py-1 font-display text-2xl text-ink outline-none transition-colors focus:border-rule focus:bg-cream"
            value={current.name}
            onChange={(e) => { const name = e.target.value; setCurrent((p) => ({ ...p, name })); persist({ ...current, name }) }}
          />
          {current.tailored && <span className="pill-moss">Tailored</span>}
        </div>
        <div className="flex gap-2">
          <button onClick={loadVersions} className="btn-secondary !py-2 text-xs"><History size={14} /> History</button>
          <button onClick={() => setShowTailor(true)} className="btn-secondary !py-2 text-xs !border-navy/40 !text-navy hover:!bg-navy-s/40">
            <Sparkles size={14} /> Tailor for this role
          </button>
          <button onClick={download} className="btn-primary !py-2 text-xs"><Download size={14} /> Download PDF</button>
        </div>
      </div>

      <div className="card overflow-x-auto bg-paper/60 scroll-thin">
        <ResumePreview pdfData={pdfData} placeholders={current.placeholders} onEdit={onEdit} compiling={compiling} />
      </div>
      <p className="mt-3 text-center text-xs text-stone">Hover any line and click to edit it in place. Changes re-typeset automatically.</p>

      {showTailor && <TailorModal resume={current} onApplied={applyTailored} onClose={() => setShowTailor(false)} />}

      {versions && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4 backdrop-blur-sm" onClick={() => setVersions(null)}>
          <div className="card w-full max-w-md p-6 shadow-lift animate-rise" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-display text-xl text-ink">Version history</h3>
              <button onClick={() => setVersions(null)} className="btn-ghost !p-2"><X size={15} /></button>
            </div>
            {versions.length === 0 ? (
              <p className="py-6 text-center text-sm text-stone">No saved versions yet.</p>
            ) : (
              <div className="max-h-80 space-y-2 overflow-y-auto scroll-thin">
                {versions.map((v) => (
                  <button key={v.id} onClick={() => restore(v)} className="flex w-full items-center justify-between rounded-card border border-rule bg-cream p-3.5 text-left transition-all duration-300 ease-editorial hover:border-navy/40 hover:shadow-card">
                    <span className="text-sm text-ink">{new Date(v.created_at).toLocaleString()}</span>
                    <span className="text-xs text-navy">Restore</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  )
}
