import { useEffect, useMemo, useState } from 'react'
import {
  User, AlignLeft, Briefcase, GraduationCap, Wrench, Lightbulb,
  BadgeCheck, Trophy, BookOpen, Plus, Upload, Download, X,
} from 'lucide-react'
import { DndContext, closestCenter } from '@dnd-kit/core'
import { SortableContext, arrayMove, verticalListSortingStrategy } from '@dnd-kit/sortable'
import VaultEntry from '../components/VaultEntry'
import Reveal from '../components/Reveal'
import { toast } from '../components/Toast'
import { get, post, put, del } from '../lib/api'
import { useAuth } from '../context/AuthContext'

const SECTIONS = [
  { id: 'contact', label: 'Contact Info', icon: User, recommended: 1, single: true,
    fields: [['title', 'Full name'], ['meta.email', 'Email'], ['meta.phone', 'Phone'], ['meta.linkedin', 'LinkedIn'], ['meta.github', 'GitHub'], ['meta.website', 'Website'], ['location', 'Location']] },
  { id: 'summary', label: 'Professional Summary', icon: AlignLeft, recommended: 1, single: true,
    fields: [['description', 'Summary', 'textarea']] },
  { id: 'experience', label: 'Work Experience', icon: Briefcase, recommended: 2,
    fields: [['title', 'Job title'], ['organization', 'Company'], ['location', 'Location'], ['start_date', 'Start (e.g. Jun 2022)'], ['end_date', 'End'], ['current', 'I currently work here', 'checkbox'], ['description', 'Description', 'textarea'], ['bullets', 'Bullet points (one per line)', 'bullets']] },
  { id: 'education', label: 'Education', icon: GraduationCap, recommended: 1,
    fields: [['title', 'Degree'], ['meta.field', 'Field of study'], ['organization', 'Institution'], ['location', 'Location'], ['start_date', 'Start'], ['end_date', 'End'], ['meta.gpa', 'GPA'], ['bullets', 'Highlights (one per line)', 'bullets']] },
  { id: 'skills', label: 'Skills', icon: Wrench, recommended: 4,
    fields: [['meta.group', 'Group (Technical / Soft Skills / Languages / Certifications)'], ['title', 'Skill']] },
  { id: 'projects', label: 'Projects', icon: Lightbulb, recommended: 1,
    fields: [['title', 'Project title'], ['meta.url', 'URL'], ['meta.tech', 'Tech stack'], ['start_date', 'Start'], ['end_date', 'End'], ['description', 'Description', 'textarea'], ['bullets', 'Bullet points (one per line)', 'bullets']] },
  { id: 'certifications', label: 'Certifications', icon: BadgeCheck, recommended: 0,
    fields: [['title', 'Certification'], ['organization', 'Issuer'], ['start_date', 'Date'], ['meta.credential_id', 'Credential ID']] },
  { id: 'awards', label: 'Awards & Honors', icon: Trophy, recommended: 0,
    fields: [['title', 'Award'], ['organization', 'Issuer'], ['start_date', 'Date'], ['description', 'Description', 'textarea']] },
  { id: 'publications', label: 'Publications', icon: BookOpen, recommended: 0,
    fields: [['title', 'Title'], ['organization', 'Venue'], ['start_date', 'Date'], ['meta.url', 'URL'], ['description', 'Description', 'textarea']] },
]

function getField(entry, path) {
  if (path.startsWith('meta.')) return entry.meta?.[path.slice(5)] ?? ''
  return entry[path] ?? (path === 'bullets' ? [] : path === 'current' ? false : '')
}

function setField(entry, path, value) {
  if (path.startsWith('meta.')) return { ...entry, meta: { ...(entry.meta || {}), [path.slice(5)]: value } }
  return { ...entry, [path]: value }
}

/* ---------------- entry modal ---------------- */

function EntryModal({ section, entry, onSave, onClose }) {
  const [draft, setDraft] = useState(entry || { section: section.id, meta: {}, bullets: [] })
  const [busy, setBusy] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true)
    try {
      await onSave(draft)
      onClose()
    } catch {
      toast('Couldn’t save — try again.', 'error')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4 backdrop-blur-sm" onClick={onClose}>
      <form onSubmit={submit} className="card max-h-[85vh] w-full max-w-lg overflow-y-auto p-7 shadow-lift animate-rise scroll-thin" onClick={(e) => e.stopPropagation()}>
        <div className="mb-5 flex items-center justify-between">
          <h3 className="font-display text-2xl text-ink">{entry?.id ? 'Edit' : 'Add'} — {section.label}</h3>
          <button type="button" onClick={onClose} className="btn-ghost !p-2"><X size={16} /></button>
        </div>
        <div className="space-y-4">
          {section.fields.map(([path, label, kind]) => (
            <div key={path}>
              {kind === 'checkbox' ? (
                <label className="flex items-center gap-2.5 text-sm text-ink">
                  <input
                    type="checkbox"
                    checked={!!getField(draft, path)}
                    onChange={(e) => setDraft((d) => setField(d, path, e.target.checked))}
                    className="h-4 w-4 accent-[var(--navy)]"
                  />
                  {label}
                </label>
              ) : kind === 'textarea' ? (
                <>
                  <label className="label">{label}</label>
                  <textarea rows={4} className="input resize-y" value={getField(draft, path)} onChange={(e) => setDraft((d) => setField(d, path, e.target.value))} />
                </>
              ) : kind === 'bullets' ? (
                <>
                  <label className="label">{label}</label>
                  <textarea
                    rows={4}
                    className="input resize-y font-mono text-xs"
                    value={(getField(draft, path) || []).join('\n')}
                    onChange={(e) => setDraft((d) => setField(d, path, e.target.value.split('\n').filter((l) => l.trim())))}
                    placeholder={'Led X to achieve Y\nShipped Z used by N people'}
                  />
                </>
              ) : (
                <>
                  <label className="label">{label}</label>
                  <input className="input" value={getField(draft, path)} onChange={(e) => setDraft((d) => setField(d, path, e.target.value))} />
                </>
              )}
            </div>
          ))}
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
          <button disabled={busy} className="btn-primary disabled:opacity-60">{busy ? 'Saving…' : 'Save entry'}</button>
        </div>
      </form>
    </div>
  )
}

/* ---------------- progress ring ---------------- */

function ProgressRing({ pct }) {
  const r = 26
  const c = 2 * Math.PI * r
  return (
    <svg width="64" height="64" viewBox="0 0 64 64" className="shrink-0">
      <circle cx="32" cy="32" r={r} fill="none" stroke="var(--rule)" strokeWidth="5" />
      <circle
        cx="32" cy="32" r={r} fill="none" stroke="var(--navy)" strokeWidth="5" strokeLinecap="round"
        strokeDasharray={c} strokeDashoffset={c * (1 - pct / 100)}
        transform="rotate(-90 32 32)" style={{ transition: 'stroke-dashoffset 1s var(--ease)' }}
      />
      <text x="32" y="36" textAnchor="middle" fontSize="13" fontFamily="JetBrains Mono, monospace" fill="var(--ink)">{pct}%</text>
    </svg>
  )
}

/* ---------------- page ---------------- */

export default function Vault() {
  const [entries, setEntries] = useState({})
  const [active, setActive] = useState('contact')
  const [modal, setModal] = useState(null) // { section, entry }
  const [uploading, setUploading] = useState(false)
  const { isPro } = useAuth()

  const load = async () => {
    try {
      const data = await get('/vault/entries')
      setEntries(data || {})
    } catch {
      toast('Couldn’t load your vault.', 'error')
    }
  }
  useEffect(() => { load() }, [])

  const section = SECTIONS.find((s) => s.id === active)
  const list = entries[active] || []

  const completeness = useMemo(() => {
    const total = SECTIONS.reduce((sum, s) => sum + Math.max(s.recommended, 0), 0)
    const filled = SECTIONS.reduce((sum, s) => sum + Math.min((entries[s.id] || []).length, Math.max(s.recommended, 0)), 0)
    return total ? Math.round((filled / total) * 100) : 0
  }, [entries])

  const save = async (draft) => {
    if (draft.id) {
      const updated = await put(`/vault/entries/${draft.id}`, draft)
      setEntries((prev) => ({ ...prev, [draft.section]: (prev[draft.section] || []).map((e) => (e.id === draft.id ? updated : e)) }))
    } else {
      const created = await post('/vault/entries', { ...draft, position: list.length })
      setEntries((prev) => ({ ...prev, [draft.section]: [...(prev[draft.section] || []), created] }))
    }
    toast('Saved to your vault.', 'success')
  }

  const remove = async (entry) => {
    await del(`/vault/entries/${entry.id}`)
    setEntries((prev) => ({ ...prev, [entry.section]: (prev[entry.section] || []).filter((e) => e.id !== entry.id) }))
    toast('Entry removed.')
  }

  const onDragEnd = async ({ active: a, over }) => {
    if (!over || a.id === over.id) return
    const oldIdx = list.findIndex((e) => e.id === a.id)
    const newIdx = list.findIndex((e) => e.id === over.id)
    const next = arrayMove(list, oldIdx, newIdx)
    setEntries((prev) => ({ ...prev, [active]: next }))
    try {
      await post('/vault/entries/reorder', { updates: next.map((e, i) => ({ id: e.id, position: i })) })
    } catch {
      toast('Couldn’t save the new order.', 'error')
    }
  }

  const uploadResume = async (file) => {
    if (!file) return
    setUploading(true)
    try {
      const base64 = await new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result.split(',')[1])
        reader.onerror = reject
        reader.readAsDataURL(file)
      })
      const { entries: suggested } = await post('/ai/parse-file', { name: file.name, type: file.type, content_base64: base64 })
      for (const s of suggested || []) await post('/vault/entries', s)
      await load()
      toast(`Imported ${suggested?.length || 0} entries from ${file.name}.`, 'success')
    } catch (err) {
      if (err.status !== 403) toast('Couldn’t parse that file — try another.', 'error')
    } finally {
      setUploading(false)
    }
  }

  const exportAll = async () => {
    try {
      const data = await get('/vault/export')
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob)
      a.download = 'pressed-vault.json'
      a.click()
    } catch {
      toast('Export failed — try again.', 'error')
    }
  }

  return (
    <main className="mx-auto max-w-6xl px-5 py-10">
      <Reveal className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-5">
          <ProgressRing pct={completeness} />
          <div>
            <h1 className="font-display text-4xl font-medium tracking-tight text-ink">The Vault</h1>
            <p className="mt-1 text-sm text-graphite">Everything you've done, structured once — the source your resumes draw from.</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={exportAll} className="btn-secondary !py-2.5"><Download size={15} /> Export all</button>
          <label className={`btn-primary !py-2.5 cursor-pointer ${uploading ? 'opacity-60' : ''}`}>
            <Upload size={15} /> {uploading ? 'Parsing…' : 'Import resume'}
            <input type="file" accept=".pdf,.docx" className="hidden" disabled={uploading} onChange={(e) => uploadResume(e.target.files?.[0])} />
          </label>
        </div>
      </Reveal>

      <div className="grid gap-8 md:grid-cols-[260px_1fr]">
        {/* sidebar */}
        <Reveal variant="left" className="space-y-1.5 self-start md:sticky md:top-24">
          {SECTIONS.map((s) => {
            const count = (entries[s.id] || []).length
            const pct = s.recommended ? Math.min(100, Math.round((count / s.recommended) * 100)) : count > 0 ? 100 : 0
            return (
              <button
                key={s.id}
                onClick={() => setActive(s.id)}
                className={`w-full rounded-card border p-3 text-left transition-all duration-300 ease-editorial ${
                  active === s.id ? 'border-navy/40 bg-cream shadow-card' : 'border-transparent hover:border-rule hover:bg-cream/60'
                }`}
              >
                <span className="flex items-center justify-between">
                  <span className="flex items-center gap-2.5 text-sm font-medium text-ink">
                    <s.icon size={15} className={active === s.id ? 'text-navy' : 'text-stone'} /> {s.label}
                  </span>
                  <span className="font-mono text-xs text-stone">{count}</span>
                </span>
                <span className="mt-2 block h-1 overflow-hidden rounded-full bg-rule">
                  <span className="block h-full rounded-full bg-navy transition-all duration-700 ease-editorial" style={{ width: `${pct}%` }} />
                </span>
              </button>
            )
          })}
        </Reveal>

        {/* section body */}
        <div>
          <div className="mb-5 flex items-center justify-between">
            <h2 className="font-display text-2xl text-ink">{section.label}</h2>
            <button onClick={() => setModal({ section, entry: null })} className="btn-primary !px-4 !py-2 text-xs">
              <Plus size={14} /> Add entry
            </button>
          </div>

          {list.length === 0 ? (
            <Reveal className="card flex flex-col items-center gap-3 border-dashed p-12 text-center">
              <section.icon size={24} className="text-stone" />
              <p className="text-sm text-graphite">Nothing here yet. Add your first {section.label.toLowerCase()} entry — future-you will thank you.</p>
              <button onClick={() => setModal({ section, entry: null })} className="btn-secondary !py-2 text-xs"><Plus size={13} /> Add entry</button>
            </Reveal>
          ) : (
            <DndContext collisionDetection={closestCenter} onDragEnd={onDragEnd}>
              <SortableContext items={list.map((e) => e.id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-3">
                  {list.map((entry) => (
                    <VaultEntry key={entry.id} entry={entry} onEdit={(e) => setModal({ section, entry: e })} onDelete={remove} />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}

          {!isPro && (
            <p className="mt-6 text-center text-xs text-stone">
              Free plan includes one AI resume import. <button className="text-navy underline-offset-2 hover:underline" onClick={() => window.dispatchEvent(new CustomEvent('pressed:pro-required'))}>Go Pro for unlimited.</button>
            </p>
          )}
        </div>
      </div>

      {modal && <EntryModal section={modal.section} entry={modal.entry} onSave={save} onClose={() => setModal(null)} />}
    </main>
  )
}
