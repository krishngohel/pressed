import { useDraggable } from '@dnd-kit/core'
import { MapPin, Link2, FileText } from 'lucide-react'

export const STATUS_META = {
  saved:        { label: 'Saved',        pill: 'pill-neutral' },
  applied:      { label: 'Applied',      pill: 'pill-navy' },
  phone_screen: { label: 'Phone Screen', pill: 'pill-navy' },
  interview:    { label: 'Interview',    pill: 'pill-amber' },
  offer:        { label: 'Offer',        pill: 'pill-moss' },
  rejected:     { label: 'Rejected',     pill: 'pill-red' },
  withdrawn:    { label: 'Withdrawn',    pill: 'pill-neutral' },
}

const fmtSalary = (min, max) => {
  const f = (n) => (n >= 1000 ? `$${Math.round(n / 1000)}k` : `$${n}`)
  if (min && max) return `${f(min)}–${f(max)}`
  if (min) return `${f(min)}+`
  if (max) return `up to ${f(max)}`
  return null
}

export default function JobCard({ job, onClick }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: job.id, data: { job } })
  const meta = STATUS_META[job.status] || STATUS_META.saved
  const salary = fmtSalary(job.salary_min, job.salary_max)

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      onClick={() => !isDragging && onClick?.(job)}
      style={{ transform: transform ? `translate(${transform.x}px, ${transform.y}px)` : undefined, opacity: isDragging ? 0.55 : 1, zIndex: isDragging ? 30 : undefined }}
      className="card card-hover cursor-grab p-4 active:cursor-grabbing"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h4 className="truncate text-sm font-semibold text-ink">{job.company}</h4>
          <p className="truncate text-sm text-graphite">{job.role}</p>
        </div>
        <span className={meta.pill}>{meta.label}</span>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-stone">
        {job.location && <span className="flex items-center gap-1"><MapPin size={11} /> {job.location}</span>}
        {salary && <span className="font-mono">{salary}</span>}
        {job.resume_id && <span className="flex items-center gap-1 text-navy"><FileText size={11} /> resume linked</span>}
        {job.source_url && <span className="flex items-center gap-1"><Link2 size={11} /> source</span>}
      </div>
      {Array.isArray(job.tags) && job.tags.length > 0 && (
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {job.tags.slice(0, 4).map((t) => (
            <span key={t} className="rounded-full border border-rule px-2 py-0.5 text-[11px] text-graphite">{t}</span>
          ))}
        </div>
      )}
    </div>
  )
}
