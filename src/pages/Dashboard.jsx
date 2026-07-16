import { useEffect, useMemo, useState } from 'react'
import { DndContext, useDroppable, pointerWithin } from '@dnd-kit/core'
import { Plus, X, ExternalLink, Trash2 } from 'lucide-react'
import JobCard, { STATUS_META } from '../components/JobCard'
import Reveal from '../components/Reveal'
import { toast } from '../components/Toast'
import { get, post, put, del } from '../lib/api'

const COLUMNS = ['saved', 'applied', 'phone_screen', 'interview', 'offer', 'rejected', 'withdrawn']

function Column({ status, jobs, onCardClick }) {
  const { setNodeRef, isOver } = useDroppable({ id: status })
  const meta = STATUS_META[status]
  return (
    <div
      ref={setNodeRef}
      className={`flex w-[270px] shrink-0 flex-col rounded-card border bg-paper/40 transition-colors duration-300 ease-editorial ${
        isOver ? 'border-navy/50 bg-navy-s/30' : 'border-rule'
      }`}
    >
      <div className="flex items-center justify-between px-3.5 py-3">
        <span className="text-xs font-medium uppercase tracking-wider text-graphite">{meta.label}</span>
        <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-rule px-1.5 font-mono text-[11px] text-graphite">{jobs.length}</span>
      </div>
      <div className="flex flex-1 flex-col gap-2.5 px-2.5 pb-3">
        {jobs.map((job) => <JobCard key={job.id} job={job} onClick={onCardClick} />)}
        {jobs.length === 0 && <div className="rounded-card border border-dashed border-rule py-7 text-center text-xs text-stone">Drop here</div>}
      </div>
    </div>
  )
}

/* ---------------- detail panel ---------------- */

function DetailPanel({ job, onSave, onDelete, onClose }) {
  const [draft, setDraft] = useState(job)
  useEffect(() => setDraft(job), [job])

  const set = (k, v) => setDraft((d) => ({ ...d, [k]: v }))

  return (
    <>
      <div className="fixed inset-0 z-40 bg-ink/25 backdrop-blur-[2px]" onClick={onClose} />
      <aside className="fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col border-l border-rule bg-paper shadow-lift animate-rise" style={{ animationName: 'rise-in' }}>
        <div className="flex items-center justify-between border-b border-rule px-6 py-4">
          <span className={STATUS_META[draft.status]?.pill}>{STATUS_META[draft.status]?.label}</span>
          <div className="flex gap-1">
            <button onClick={() => { onDelete(draft); onClose() }} className="btn-ghost !p-2 hover:!bg-red-50 hover:text-red-700"><Trash2 size={15} /></button>
            <button onClick={onClose} className="btn-ghost !p-2"><X size={16} /></button>
          </div>
        </div>
        <div className="flex-1 space-y-4 overflow-y-auto px-6 py-5 scroll-thin">
          <div><label className="label">Company</label><input className="input" value={draft.company || ''} onChange={(e) => set('company', e.target.value)} /></div>
          <div><label className="label">Role</label><input className="input" value={draft.role || ''} onChange={(e) => set('role', e.target.value)} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Location</label><input className="input" value={draft.location || ''} onChange={(e) => set('location', e.target.value)} /></div>
            <div><label className="label">Status</label>
              <select className="input" value={draft.status} onChange={(e) => set('status', e.target.value)}>
                {COLUMNS.map((s) => <option key={s} value={s}>{STATUS_META[s].label}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Salary min</label><input type="number" className="input" value={draft.salary_min || ''} onChange={(e) => set('salary_min', e.target.value ? +e.target.value : null)} /></div>
            <div><label className="label">Salary max</label><input type="number" className="input" value={draft.salary_max || ''} onChange={(e) => set('salary_max', e.target.value ? +e.target.value : null)} /></div>
          </div>
          <div>
            <label className="label">Source URL</label>
            <div className="flex gap-2">
              <input className="input" value={draft.source_url || ''} onChange={(e) => set('source_url', e.target.value)} placeholder="https://…" />
              {draft.source_url && <a href={draft.source_url} target="_blank" rel="noreferrer" className="btn-secondary !px-3"><ExternalLink size={14} /></a>}
            </div>
          </div>
          <div><label className="label">Tags <span className="normal-case text-stone">(comma separated)</span></label>
            <input className="input" value={(draft.tags || []).join(', ')} onChange={(e) => set('tags', e.target.value.split(',').map((t) => t.trim()).filter(Boolean))} placeholder="remote, design systems, referral" />
          </div>
          <div><label className="label">Contacts <span className="normal-case text-stone">(Name &lt;email&gt;, one per line)</span></label>
            <textarea rows={2} className="input resize-y font-mono text-xs"
              value={(draft.contacts || []).map((c) => `${c.name} <${c.email}>`).join('\n')}
              onChange={(e) => set('contacts', e.target.value.split('\n').filter((l) => l.trim()).map((l) => {
                const m = l.match(/^(.*?)\s*<(.+?)>\s*$/)
                return m ? { name: m[1].trim(), email: m[2].trim() } : { name: l.trim(), email: '' }
              }))}
            />
          </div>
          <div><label className="label">Notes</label><textarea rows={6} className="input resize-y" value={draft.notes || ''} onChange={(e) => set('notes', e.target.value)} /></div>
        </div>
        <div className="border-t border-rule px-6 py-4">
          <button onClick={() => { onSave(draft); onClose() }} className="btn-primary w-full">Save changes</button>
        </div>
      </aside>
    </>
  )
}

/* ---------------- quick add ---------------- */

function QuickAdd({ onAdd, onClose }) {
  const [company, setCompany] = useState('')
  const [role, setRole] = useState('')
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4 backdrop-blur-sm" onClick={onClose}>
      <form
        className="card w-full max-w-sm p-6 shadow-lift animate-rise"
        onClick={(e) => e.stopPropagation()}
        onSubmit={(e) => { e.preventDefault(); onAdd({ company, role }); onClose() }}
      >
        <h3 className="mb-4 font-display text-xl text-ink">Add a job</h3>
        <label className="label">Company</label>
        <input autoFocus required className="input mb-3" value={company} onChange={(e) => setCompany(e.target.value)} />
        <label className="label">Role</label>
        <input required className="input mb-5" value={role} onChange={(e) => setRole(e.target.value)} />
        <button className="btn-primary w-full"><Plus size={15} /> Add to board</button>
      </form>
    </div>
  )
}

/* ---------------- page ---------------- */

export default function Dashboard() {
  const [jobs, setJobs] = useState([])
  const [selected, setSelected] = useState(null)
  const [showAdd, setShowAdd] = useState(false)

  useEffect(() => {
    get('/jobs').then((j) => setJobs(j || [])).catch(() => toast('Couldn’t load your board.', 'error'))
  }, [])

  const byStatus = useMemo(() => {
    const map = Object.fromEntries(COLUMNS.map((c) => [c, []]))
    for (const j of jobs) (map[j.status] || map.saved).push(j)
    for (const c of COLUMNS) map[c].sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
    return map
  }, [jobs])

  const stats = useMemo(() => {
    const applied = jobs.filter((j) => !['saved'].includes(j.status)).length
    const responded = jobs.filter((j) => ['phone_screen', 'interview', 'offer'].includes(j.status)).length
    const interviews = jobs.filter((j) => ['interview', 'offer'].includes(j.status)).length
    const offers = jobs.filter((j) => j.status === 'offer').length
    const pct = (n, d) => (d ? `${Math.round((n / d) * 100)}%` : '—')
    return [
      ['Total applied', applied],
      ['Response rate', pct(responded, applied)],
      ['Interview rate', pct(interviews, applied)],
      ['Offer rate', pct(offers, applied)],
    ]
  }, [jobs])

  const onDragEnd = async ({ active, over }) => {
    if (!over) return
    const job = jobs.find((j) => j.id === active.id)
    const newStatus = over.id
    if (!job || !COLUMNS.includes(newStatus) || job.status === newStatus) return
    const updated = { ...job, status: newStatus, applied_at: newStatus === 'applied' && !job.applied_at ? new Date().toISOString() : job.applied_at }
    setJobs((prev) => prev.map((j) => (j.id === job.id ? updated : j)))
    try {
      await put(`/jobs/${job.id}`, updated)
    } catch {
      setJobs((prev) => prev.map((j) => (j.id === job.id ? job : j)))
      toast('Couldn’t move that card — try again.', 'error')
    }
  }

  const addJob = async ({ company, role }) => {
    try {
      const created = await post('/jobs', { company, role, status: 'saved' })
      setJobs((prev) => [...prev, created])
      toast(`${company} added to Saved.`, 'success')
    } catch {
      toast('Couldn’t add that job.', 'error')
    }
  }

  const saveJob = async (draft) => {
    setJobs((prev) => prev.map((j) => (j.id === draft.id ? draft : j)))
    try { await put(`/jobs/${draft.id}`, draft); toast('Saved.', 'success') } catch { toast('Save failed.', 'error') }
  }

  const deleteJob = async (job) => {
    setJobs((prev) => prev.filter((j) => j.id !== job.id))
    try { await del(`/jobs/${job.id}`) } catch {}
  }

  return (
    <main className="mx-auto max-w-[1400px] px-5 py-10">
      <Reveal className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl font-medium tracking-tight text-ink">Tracker</h1>
          <p className="mt-1 text-sm text-graphite">Your pipeline, from first save to signed offer.</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="btn-primary"><Plus size={15} /> Add job</button>
      </Reveal>

      <Reveal delay={100} className="card mb-6 grid grid-cols-2 divide-rule sm:grid-cols-4 sm:divide-x">
        {stats.map(([label, value]) => (
          <div key={label} className="px-6 py-4">
            <p className="font-mono text-2xl font-semibold text-navy">{value}</p>
            <p className="mt-0.5 text-xs uppercase tracking-wider text-stone">{label}</p>
          </div>
        ))}
      </Reveal>

      <Reveal delay={180}>
        <DndContext collisionDetection={pointerWithin} onDragEnd={onDragEnd}>
          <div className="flex gap-4 overflow-x-auto pb-4 scroll-thin">
            {COLUMNS.map((status) => (
              <Column key={status} status={status} jobs={byStatus[status]} onCardClick={setSelected} />
            ))}
          </div>
        </DndContext>
      </Reveal>

      {showAdd && <QuickAdd onAdd={addJob} onClose={() => setShowAdd(false)} />}
      {selected && <DetailPanel job={selected} onSave={saveJob} onDelete={deleteJob} onClose={() => setSelected(null)} />}
    </main>
  )
}
